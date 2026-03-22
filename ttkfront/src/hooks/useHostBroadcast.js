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
    try { setBroadcast(await api('/broadcast/')) }
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
        setBroadcast(prev => ({
          ...prev,
          is_active:       data.is_active,
          media_url:       data.media_url ?? prev.media_url,
          ...(data.current_playlist_id != null
            ? { current_playlist: data.current_playlist_id } : {}),
          ...(data.current_queue_item_id != null
            ? { current_item: data.current_queue_item_id } : {}),
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

  // ── REST-based next track ────────────────────────────
  // Fetch fresh playlist from server on every track end —
  // guarantees correct order even if playlist was edited during broadcast
  const fetchNextTrack = async () => {
    const playlist = localSelectedPlaylistRef.current
    if (!playlist?.id) return null

    try {
      const fresh = await api(`/playlists/${playlist.id}/`)
      const items = fresh.items ?? []
      if (items.length === 0) return null

      const mediaUrl = broadcastRef.current?.media_url ?? ''
      const currentFilename = mediaUrl.split('/').pop()

      // Find current track by filename match
      const currentIdx = currentFilename
        ? items.findIndex(it => {
            const raw = it.media?.file ?? it.media?.url ?? it.media?.stream_url ?? ''
            return raw.split('/').pop() === currentFilename
          })
        : -1

      console.log('[auto-advance] playlist:', fresh.name, '| current idx:', currentIdx, '/', items.length - 1)

      if (currentIdx < 0) {
        // Current track not in playlist — start from first
        return items[0]
      }

      const nextIdx = (currentIdx + 1) % items.length
      console.log('[auto-advance] next:', items[nextIdx]?.media?.name)
      return items[nextIdx]
    } catch (e) {
      console.error('[auto-advance] failed to fetch playlist:', e)
      return null
    }
  }

  // ── Audio playback ────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const fileUrl = extractMediaUrl(currentTrackItem?.media)
    audio.volume = broadcast.volume ?? 1

    if (broadcast.is_active && fileUrl) {
      if (audio.src !== fileUrl) {
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

      // ── Auto-advance when track ends ──────────────────
      const handleEnded = () => {
        // Use REST to get fresh playlist order — no stale index issues
        fetchNextTrack().then(nextItem => {
          console.log('[auto-advance] track ended → next:', nextItem?.media?.name ?? 'none (stopping)')
          if (nextItem) {
            sendActionRef.current?.({ action: 'enqueue', playlist_item_id: nextItem.id })
            setTimeout(() => sendActionRef.current?.({ action: 'track_ended' }), 150)
          } else {
            sendActionRef.current?.({ action: 'track_ended' })
          }
        })
      }

      audio.addEventListener('ended', handleEnded)
      return () => {
        audio.removeEventListener('canplay', tryPlay)
        audio.removeEventListener('ended', handleEnded)
      }
    }

    audio.pause()
    audio.src = ''
    setAutoplayBlocked(false)
  }, [broadcast.is_active, broadcast.volume, broadcast.current_playlist, currentTrackItem])

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
    const ws    = wsBroadcastRef.current
    const state = ws?.readyState
    if (state === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
      console.log('[ws] sent:', payload)
    } else {
      console.warn('[ws] sendAction skipped — state:', state, 'payload:', payload)
    }
  }, [])

  // Keep sendAction ref fresh
  sendActionRef.current = sendAction

  // ── Expose ref so BroadcastSection can tell us which playlist is selected ──
  const setLocalSelectedPlaylist = useCallback((playlist) => {
    if (localSelectedPlaylistRef.current?.id !== playlist?.id) {
    }
    localSelectedPlaylistRef.current = playlist
  }, [])

  return {
    broadcast, activePlaylist, currentTrackItem,
    audioRef, autoplayBlocked,
    init: loadBroadcast,
    toggleBroadcast, setVolume, setPlaylistForBroadcast,
    resumeAudio, sendAction, setLocalSelectedPlaylist,
  }
}