import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE, API_ORIGIN, WS_ORIGIN } from '../config'
import Header from './Header'

const API = API_BASE
const WS_URL = `${WS_ORIGIN}/ws/messages`

const api = async (path, options = {}) => {
  const token = localStorage.getItem('access')
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw await res.json()
  if (res.status === 204) return null
  return res.json()
}

const resolveMediaUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

// ─── Иконки ───────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    play: <polygon points="5,3 19,12 5,21" fill="currentColor" />,
    pause: <><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></>,
    volume: <><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    shuffle: <><polyline points="16,3 21,3 21,8" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/><polyline points="21,16 21,21 16,21" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/></>,
    loop: <><polyline points="17,1 21,5 17,9" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="7,23 3,19 7,15" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    trash: <><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M19,6l-1,14H6L5,6" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10,11v6M14,11v6" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2"/></>,
    mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/><polygon points="22,2 15,22 11,13 2,9" fill="currentColor"/></>,
    check: <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" fill="none"/>,
    dblcheck: <><polyline points="17,6 9,17 5,13" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="22,6 14,17 11,14.5" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    music: <><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/></>,
    next: <><polygon points="5,4 15,12 5,20" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></>,
    prev: <><polygon points="19,20 9,12 19,4" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {icons[name]}
    </svg>
  )
}

// ─── Статус сообщения ─────────────────────────────────────
const MsgStatus = ({ status }) => {
  if (status === 'new') return <span style={{ color: '#888', fontSize: 12 }}><Icon name="check" size={14} /></span>
  if (status === 'in_progress') return <span style={{ color: '#e53935', fontSize: 12 }}><Icon name="dblcheck" size={14} /></span>
  return <span style={{ color: '#43a047', fontSize: 12 }}><Icon name="dblcheck" size={14} /></span>
}

// ─── Плеер-диск ───────────────────────────────────────────
const VinylPlayer = ({ isPlaying, onToggle }) => (
  <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
    <div style={{
      width: 160, height: 160, borderRadius: '50%',
      background: 'radial-gradient(circle at 30% 30%, #2a2a2a, #111)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: isPlaying ? 'spin 4s linear infinite' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid #333',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        background: '#1a1a1a',
        border: '2px solid #444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e53935' }} />
      </div>
    </div>
    <button onClick={onToggle} style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 48, height: 48, borderRadius: '50%',
      background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      transition: 'transform 0.1s',
    }}>
      <Icon name={isPlaying ? 'pause' : 'play'} size={20} />
    </button>
  </div>
)

export default function HostPanel() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [tab, setTab] = useState('broadcast') // broadcast | playlists
  const [broadcast, setBroadcast] = useState({ is_active: false, volume: 1, current_playlist: null, current_item: null })
  const [messages, setMessages] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [mediaLibrary, setMediaLibrary] = useState([])
  const [playlistModal, setPlaylistModal] = useState(null) // null | {mode:'create'} | {mode:'edit', playlist}
  const wsRef = useRef(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const audioRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const shouldReconnectRef = useRef(true)

  // ── Загрузка данных ──────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadBroadcast = useCallback(async () => {
    try {
      setBroadcast(await api('/broadcast/'))
    } catch (error) {
      console.error('Failed to load broadcast', error)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await api('/messages/'))
    } catch (error) {
      console.error('Failed to load messages', error)
    }
  }, [])

  const loadPlaylists = useCallback(async () => {
    try {
      setPlaylists(await api('/playlists/'))
    } catch (error) {
      console.error('Failed to load playlists', error)
    }
  }, [])

  const loadMedia = useCallback(async () => {
    try {
      setMediaLibrary(await api('/media/'))
    } catch (error) {
      console.error('Failed to load media library', error)
    }
  }, [])

  const connectWS = useCallback(function connectWS() {
    const token = localStorage.getItem('access')
    const baseWsUrl = WS_URL.replace(/\/+$/, '')
    const ws = new WebSocket(`${baseWsUrl}/?token=${encodeURIComponent(token || '')}`)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'new_message') {
        setMessages(prev => [data.message, ...prev])
      }
    }
    ws.onclose = () => {
      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(connectWS, 3000)
      }
    }
    wsRef.current = ws
  }, [])

  useEffect(() => {
    shouldReconnectRef.current = true
    void loadBroadcast()
    void loadMessages()
    void loadPlaylists()
    void loadMedia()
    connectWS()

    return () => {
      shouldReconnectRef.current = false
      clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
    }
  }, [connectWS, loadBroadcast, loadMessages, loadPlaylists, loadMedia])

  // ── Эфир ────────────────────────────────────────────────
  const toggleBroadcast = async () => {
    try {
      const updated = await api('/broadcast/', {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !broadcast.is_active }),
      })
      setBroadcast(updated)
    } catch (e) { console.error(e) }
  }

  const setVolume = async (v) => {
    setBroadcast(b => ({ ...b, volume: v }))
    if (audioRef.current) audioRef.current.volume = v
    try {
      await api('/broadcast/', { method: 'PATCH', body: JSON.stringify({ volume: v }) })
    } catch (error) {
      console.error('Failed to update volume', error)
    }
  }

  const setPlaylistForBroadcast = async (playlistId) => {
    try {
      const updated = await api('/broadcast/', {
        method: 'PATCH',
        body: JSON.stringify({ current_playlist: playlistId }),
      })
      setBroadcast(updated)
    } catch (error) {
      console.error('Failed to update broadcast playlist', error)
    }
  }

  // ── Сообщения ────────────────────────────────────────────
  const changeStatus = async (id, newStatus) => {
    try {
      const updated = await api(`/messages/${id}/status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setMessages(prev => prev.map(m => m.id === id ? updated : m))
    } catch (error) {
      console.error('Failed to update message status', error)
    }
  }

  // ── Загрузка файла ───────────────────────────────────────
  const handleFileUpload = async (file) => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^.]+$/, ''))
    fd.append('media_type', 'audio')
    try {
      const media = await api('/media/upload/', { method: 'POST', body: fd })
      setMediaLibrary(prev => [media, ...prev])
    } catch (e) { alert('Ошибка загрузки: ' + JSON.stringify(e)) }
  }

  // ── Плейлисты ────────────────────────────────────────────
  const createPlaylist = async (name, _coverFile, mediaIds) => {
    try {
      const pl = await api('/playlists/', {
        method: 'POST',
        body: JSON.stringify({ name, is_loop: false, is_shuffle: false }),
      })
      for (const id of mediaIds) {
        await api(`/playlists/${pl.id}/items/`, {
          method: 'POST',
          body: JSON.stringify({ media_id: id }),
        })
      }
      await loadPlaylists()
      setPlaylistModal(null)
    } catch (e) { alert('Ошибка: ' + JSON.stringify(e)) }
  }

  const deleteFromPlaylist = async (playlistId, itemId) => {
    try {
      await api(`/playlists/${playlistId}/items/${itemId}/`, { method: 'DELETE' })
      await loadPlaylists()
    } catch (error) {
      console.error('Failed to delete item from playlist', error)
    }
  }

  const togglePlaylistOption = async (playlistId, field, value) => {
    try {
      await api(`/playlists/${playlistId}/`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: value }),
      })
      await loadPlaylists()
    } catch (error) {
      console.error('Failed to update playlist option', error)
    }
  }

  const deleteMedia = async (id) => {
    try {
      await api(`/media/${id}/delete/`, { method: 'DELETE' })
      setMediaLibrary(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Failed to delete media', error)
    }
  }

  const logout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const activePlaylist = playlists.find(
    p => p.id === Number(broadcast.current_playlist)
  )
  const currentTrackItem = activePlaylist?.items?.find(
    (item) => item.id === Number(broadcast.current_item)
  )

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    const fileUrl = resolveMediaUrl(currentTrackItem?.media?.file)

    audio.volume = broadcast.volume ?? 1

    if (broadcast.is_active && fileUrl) {
      if (audio.src !== fileUrl) {
        audio.src = fileUrl
      }

      audio.play().catch((error) => console.error('play error:', error))
      return
    }

    audio.pause()
    audio.src = ''
  }, [broadcast.is_active, broadcast.volume, currentTrackItem])

  return (
    <>
      <Header role='host'></Header>
    </>
  )
}
