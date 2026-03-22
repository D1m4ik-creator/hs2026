import { useState, useEffect, useRef, useCallback } from 'react'
import { WS_ORIGIN } from '../config'
import { api, toId, extractMediaUrl } from '../api/hostApi'

const WS_BROADCAST_URL = `${WS_ORIGIN}/ws/broadcast/`

export function useHostBroadcast(playlists) {
  const [broadcast, setBroadcast] = useState({
    is_active: false, volume: 1, current_playlist: null, current_item: null,
  })
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  const audioRef               = useRef(null)
  const wsBroadcastRef         = useRef(null)
  const reconnectBroadcastRef  = useRef(null)
  const shouldReconnectRef     = useRef(true)

  // Always-fresh refs — avoid stale closures in event handlers
  const currentTrackItemRef    = useRef(null)
  const broadcastRef           = useRef(broadcast)
  const playlistsRef           = useRef(playlists)
  const sendActionRef          = useRef(null)
  // Ref to the playlist the host has selected locally in BroadcastSection UI
  const localSelectedPlaylistRef = useRef(null)

  // ── Derived ───────────────────────────────────────────
  const activePlaylist = playlists.find(
    p => p.id === toId(broadcast.current_playlist)
  )
  const currentTrackItem = activePlaylist?.items?.find(
    item => item.id === toId(broadcast.current_item)
  )

  // Keep refs in sync on every render
  currentTrackItemRef.current = currentTrackItem ?? null
  broadcastRef.current        = broadcast
  playlistsRef.current        = playlists

  // ── Load broadcast state ──────────────────────────────
  const loadBroadcast = useCallback(async () => {
    try {
      const data = await api('/broadcast/')
      // Normalise: REST returns stream_url, WS returns media_url — unify as media_url
      setBroadcast(prev => ({
        ...prev,
        ...data,
        media_url: data.media_url ?? data.stream_url ?? prev.media_url ?? null,
      }))
    }
    catch (e) { console.error('Failed to load broadcast', e) }
  }, [])

  // ── Broadcast WebSocket ───────────────────────────────
  const connectBroadcastWS = useCallback(function connectBroadcastWS() {
    const token = localStorage.getItem('access')
    const ws = new WebSocket(
      `${WS_BROADCAST_URL}?token=${encodeURIComponent(token || '')}`
    )

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type !== 'broadcast_update') return
        
        const newItemId = data.current_item ?? data.current_track ?? data.current_queue_item_id;
        const newPlaylistId = data.current_playlist_id ?? data.current_playlist;

        setBroadcast(prev => ({
          ...prev,
          is_active:       data.is_active,
          media_url:       data.media_url ?? prev.media_url,
          ...(newPlaylistId != null ? { current_playlist: newPlaylistId } : {}),
          ...(newItemId != null ? { current_item: newItemId } : {}),
        }))
      } catch (_) {}
    }

    ws.onclose = () => {
      wsBroadcastRef.current = null
      if (shouldReconnectRef.current) {
        reconnectBroadcastRef.current = setTimeout(connectBroadcastWS, 3000)
      }
    }
    ws.onerror = () => ws.close()
    wsBroadcastRef.current = ws
  }, [])

  useEffect(() => {
    shouldReconnectRef.current = true
    connectBroadcastWS()
    return () => {
      shouldReconnectRef.current = false
      clearTimeout(reconnectBroadcastRef.current)
      wsBroadcastRef.current?.close()
    }
  }, [connectBroadcastWS])

  // ── Index tracking ───────────────────────────────────
  // Store index of last enqueued item — updated every time we enqueue
  // This is reliable: we always know what we just sent to the server
  const lastEnqueuedIndexRef = useRef(-1)
  const lastEnqueuedPlaylistIdRef = useRef(null)

  const fetchNextTrack = async () => {
    const playlist = localSelectedPlaylistRef.current
      ?? playlistsRef.current?.[0]
      ?? null

    if (!playlist?.id) {
      console.warn('[auto-advance] no playlist selected')
      return null
    }

    try {
      const fresh = await api(`/playlists/${playlist.id}/`)
      const items = fresh.items ?? []
      if (items.length === 0) return null

      // If playlist switched, reset index
      if (lastEnqueuedPlaylistIdRef.current !== playlist.id) {
        lastEnqueuedIndexRef.current = -1
        lastEnqueuedPlaylistIdRef.current = playlist.id
      }

      const currentIdx = lastEnqueuedIndexRef.current
      const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % items.length
      const nextItem = items[nextIdx]

      console.log('[auto-advance] playlist:', fresh.name,
        '| currentIdx:', currentIdx, '→ nextIdx:', nextIdx,
        '| next track:', nextItem?.media?.name)

      // Update index immediately so next call returns correct position
      lastEnqueuedIndexRef.current = nextIdx

      return nextItem
    } catch (e) {
      console.error('[auto-advance] failed to fetch playlist:', e)
      return null
    }
  }

  // ── Audio playback ────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Добавляем фолбэк: если трек не найден локально, используем URL от сервера
    const fileUrl = extractMediaUrl(currentTrackItem?.media) || broadcast.media_url
    audio.volume = broadcast.volume ?? 1

if (broadcast.is_active && fileUrl) {
      // 1. Фикс перезаписи: сравниваем нестрого, чтобы не сбивать играющий трек
      if (!audio.src.includes(fileUrl) && audio.src !== fileUrl) {
        audio.src = fileUrl
      }

      const tryPlay = () => {
        audio.play().catch(err => {
          if (err.name === 'NotAllowedError') {
            setAutoplayBlocked(true)
          } else if (err.name !== 'AbortError') {
            console.error('[broadcast] play error:', err.name, err.message)
          }
        })
      }

      if (audio.readyState >= 2) {
        tryPlay()
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true })
        audio.load()
      }

      // 2. Фикс гонки: сначала завершаем старый трек, потом ставим новый
        const handleEnded = () => {
        // Находим следующий трек в текущем плейлисте
        fetchNextTrack().then(nextItem => {
          if (!nextItem) {
            console.log('[auto-advance] No more tracks in playlist.');
            // Если треков больше нет, просто уведомляем бэк, что всё закончилось
            sendActionRef.current?.({ action: 'track_ended' });
            return;
          }

          console.log('[auto-advance] Switch to next track:', nextItem.media?.name);
          
          // Отправляем ОДНУ команду. Бэк сам сделает статус DONE старому треку
          // и PLAYING новому. Это исключит гонку состояний.
          sendActionRef.current?.({ 
            action: 'enqueue', 
            playlist_item_id: nextItem.id 
          });
        });
      };

      audio.addEventListener('ended', handleEnded)
      return () => {
        audio.removeEventListener('canplay', tryPlay)
        audio.removeEventListener('ended', handleEnded)
      }
    }

    audio.pause()
    audio.src = ''
    setAutoplayBlocked(false)

  // ВАЖНО: Добавлено broadcast.media_url в массив зависимостей
  }, [broadcast.is_active, broadcast.volume, broadcast.current_playlist, currentTrackItem, broadcast.media_url])

  // ── Actions ───────────────────────────────────────────
  const toggleBroadcast = async () => {
    try {
      setBroadcast(await api('/broadcast/', {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !broadcast.is_active }),
      }))
    } catch (e) { console.error(e) }
  }

  const setVolume = async (v) => {
    setBroadcast(b => ({ ...b, volume: v }))
    if (audioRef.current) audioRef.current.volume = v
    try {
      await api('/broadcast/', { method: 'PATCH', body: JSON.stringify({ volume: v }) })
    } catch (e) { console.error(e) }
  }

  const setPlaylistForBroadcast = async (playlistId) => {
    try {
      setBroadcast(await api('/broadcast/', {
        method: 'PATCH',
        body: JSON.stringify({ current_playlist: playlistId }),
      }))
    } catch (e) { console.error(e) }
  }

  const resumeAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const fileUrl = extractMediaUrl(currentTrackItemRef.current?.media)
    if (!fileUrl) { console.warn('[broadcast] resumeAudio: no URL'); return }
    if (audio.src !== fileUrl) { audio.src = fileUrl }

    const doPlay = () => {
      audio.play()
        .then(() => setAutoplayBlocked(false))
        .catch(e => console.error('[broadcast] resume error:', e.name))
    }
    if (audio.readyState >= 2) { doPlay() }
    else { audio.addEventListener('canplay', doPlay, { once: true }); audio.load() }
  }, [])

  const sendAction = useCallback((payload) => {
      const ws = wsBroadcastRef.current;
      // Проверяем именно ws.readyState
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        console.log('[ws] sent:', payload);
      } else {
        console.warn('[ws] sendAction skipped — WS not ready. State:', ws?.readyState);
      }
    }, []);

  // Keep sendAction ref fresh
  sendActionRef.current = sendAction

  // ── Expose ref so BroadcastSection can tell us which playlist is selected ──
  const setLocalSelectedPlaylist = useCallback((playlist) => {
    if (localSelectedPlaylistRef.current?.id !== playlist?.id) {
      lastEnqueuedIndexRef.current = -1
      lastEnqueuedPlaylistIdRef.current = playlist?.id ?? null
    }
    localSelectedPlaylistRef.current = playlist
  }, [])

  // Called when host manually clicks a track row — keeps auto-advance in sync
  const setEnqueuedIndex = useCallback((playlist, itemIndex) => {
    lastEnqueuedIndexRef.current = itemIndex
    lastEnqueuedPlaylistIdRef.current = playlist?.id ?? null
  }, [])

  return {
    broadcast, activePlaylist, currentTrackItem,
    audioRef, autoplayBlocked,
    init: loadBroadcast,
    toggleBroadcast, setVolume, setPlaylistForBroadcast,
    resumeAudio, sendAction, setLocalSelectedPlaylist, setEnqueuedIndex,
  }
}