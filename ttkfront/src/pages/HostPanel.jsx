import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE, API_ORIGIN, WS_ORIGIN } from '../config'

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
    <div style={{ minHeight: '100vh', background: '#111', color: '#f0f0f0', fontFamily: "'Segoe UI', sans-serif" }}>
      <audio ref={audioRef} style={{ display: 'none' }} />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.7; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #e53935; border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 3px; background: #333; border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #e53935; cursor: pointer; }
        .btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s; }
        .btn:hover { opacity: 0.75; }
        .tag { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
      `}</style>

      {/* ── Шапка ─────────────────────────────────────────── */}
      <header style={{
        background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>
            ТТК<span style={{ color: '#e53935' }}>@</span>ВЕЩАЕТ
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 4 }}>
          {[{ id: 'broadcast', label: 'МОЙ ЭФИР' }, { id: 'playlists', label: 'ПЛЕЙЛИСТЫ' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? '#e53935' : 'none',
              border: 'none', color: tab === t.id ? '#fff' : '#aaa',
              padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user.avatar && <img src={`${API_ORIGIN}${user.avatar}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.full_name}</div>
            <div style={{ fontSize: 11, color: '#888' }}>@{user.login}</div>
          </div>
          <button onClick={logout} className="btn" style={{ color: '#888', marginLeft: 4 }}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>

        {/* ── Вкладка МОЙ ЭФИР ─────────────────────────────── */}
        {tab === 'broadcast' && (
          <>
            {/* Верхний блок — плеер + чат */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

              {/* Плеер */}
              <div style={{
                background: 'linear-gradient(135deg, #1e1e1e 0%, #2a1a1a 100%)',
                borderRadius: 16, padding: 28,
                border: '1px solid #2a2a2a',
              }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
                  {/* Аватар ведущего */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: '#2a2a2a', overflow: 'hidden',
                      border: '2px solid #e53935',
                    }}>
                      {user.avatar
                        ? <img src={`${API_ORIGIN}${user.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#555' }}>🎙</div>
                      }
                    </div>
                    {broadcast.is_active && (
                      <span style={{
                        position: 'absolute', bottom: 2, right: 2,
                        width: 12, height: 12, borderRadius: '50%',
                        background: '#e53935', border: '2px solid #1e1e1e',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>ВЕДУЩИЙ</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{user.full_name || 'Ведущий'}</div>
                    <div style={{ fontSize: 12, color: '#e53935' }}>@{user.login}</div>
                  </div>
                </div>

                {/* Виниловый диск */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                  <VinylPlayer
                    isPlaying={broadcast.is_active}
                    onToggle={toggleBroadcast}
                  />
                </div>

                {/* Текущий трек */}
                {currentTrackItem?.media?.name && (
                  <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, color: '#ccc' }}>
                    🎵 {currentTrackItem.media.name}
                  </div>
                )}

                {/* Громкость */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="volume" size={16} />
                  <input
                    type="range" min="0" max="1" step="0.01"
                    value={broadcast.volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                  />
                  <span style={{ fontSize: 12, color: '#888', minWidth: 32 }}>
                    {Math.round(broadcast.volume * 100)}%
                  </span>
                </div>

                {/* Статус эфира */}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: broadcast.is_active ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.05)',
                    color: broadcast.is_active ? '#e53935' : '#666',
                    border: `1px solid ${broadcast.is_active ? '#e53935' : '#333'}`,
                  }}>
                    {broadcast.is_active ? '● В ЭФИРЕ' : '○ НЕ В ЭФИРЕ'}
                  </span>
                </div>
              </div>

              {/* Чат */}
              <div style={{
                background: '#1a1a1a', borderRadius: 16,
                border: '1px solid #2a2a2a',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 20px', borderBottom: '1px solid #2a2a2a',
                  fontSize: 13, fontWeight: 600, letterSpacing: 1,
                  color: '#ccc',
                }}>ЧАТ ЭФИРА</div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', maxHeight: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 40 }}>
                      Сообщений пока нет
                    </div>
                  )}
                  {[...messages].reverse().map(msg => (
                    <div key={msg.id} style={{
                      background: '#222', borderRadius: 10, padding: '8px 12px',
                      borderLeft: `3px solid ${msg.status === 'new' ? '#e53935' : msg.status === 'in_progress' ? '#fb8c00' : '#43a047'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#e53935' }}>
                          {msg.author_login || 'Слушатель'}
                        </span>
                        <span style={{ fontSize: 11, color: '#555' }}>
                          {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#ddd', marginBottom: 8 }}>{msg.text}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {msg.status === 'new' && (
                          <button onClick={() => changeStatus(msg.id, 'in_progress')} style={{
                            background: 'rgba(251,140,0,0.15)', border: '1px solid #fb8c00',
                            color: '#fb8c00', borderRadius: 6, padding: '2px 10px',
                            fontSize: 11, cursor: 'pointer',
                          }}>В работу</button>
                        )}
                        {msg.status === 'in_progress' && (
                          <button onClick={() => changeStatus(msg.id, 'done')} style={{
                            background: 'rgba(67,160,71,0.15)', border: '1px solid #43a047',
                            color: '#43a047', borderRadius: 6, padding: '2px 10px',
                            fontSize: 11, cursor: 'pointer',
                          }}>Завершить</button>
                        )}
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                          <MsgStatus status={msg.status} />
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>

            {/* Поток эфира — выбор плейлиста */}
            <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, border: '1px solid #2a2a2a', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                  ПОТОК ЭФИРА
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn"
                    style={{ color: '#888', padding: '4px 8px' }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Загрузить трек"
                  >
                    <Icon name="upload" size={18} />
                  </button>
                  <input
                    ref={fileInputRef} type="file"
                    accept=".mp3,.wav,.ogg" style={{ display: 'none' }}
                    onChange={e => handleFileUpload(e.target.files[0])}
                  />
                </div>
              </div>

              {/* Активный плейлист */}
              {activePlaylist ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: '#888' }}>Активный плейлист:</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e53935' }}>{activePlaylist.name}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button
                        className="btn"
                        style={{ color: activePlaylist.is_shuffle ? '#e53935' : '#555' }}
                        onClick={() => togglePlaylistOption(activePlaylist.id, 'is_shuffle', !activePlaylist.is_shuffle)}
                        title="Shuffle"
                      >
                        <Icon name="shuffle" size={16} />
                      </button>
                      <button
                        className="btn"
                        style={{ color: activePlaylist.is_loop ? '#e53935' : '#555' }}
                        onClick={() => togglePlaylistOption(activePlaylist.id, 'is_loop', !activePlaylist.is_loop)}
                        title="Повтор"
                      >
                        <Icon name="loop" size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {activePlaylist.items?.map((item, i) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', borderRadius: 8,
                        background: broadcast.current_item === item.id ? 'rgba(229,57,53,0.1)' : 'transparent',
                        border: `1px solid ${broadcast.current_item === item.id ? '#e53935' : 'transparent'}`,
                      }}>
                        <span style={{ fontSize: 12, color: '#555', width: 20, textAlign: 'right' }}>{i + 1}</span>
                        {broadcast.is_active && broadcast.current_item === item.id
                          ? <span style={{ color: '#e53935' }}><Icon name="pause" size={14} /></span>
                          : <span style={{ color: '#555' }}><Icon name="play" size={14} /></span>
                        }
                        <span style={{ flex: 1, fontSize: 13 }}>{item.media?.name}</span>
                        <span style={{ fontSize: 12, color: '#555' }}>
                          {item.media?.duration ? `${Math.floor(item.media.duration / 60)}:${String(Math.round(item.media.duration % 60)).padStart(2, '0')}` : '—'}
                        </span>
                        <button className="btn" style={{ color: '#555' }} onClick={() => deleteFromPlaylist(activePlaylist.id, item.id)}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#555' }}>
                  <div style={{ marginBottom: 12 }}><Icon name="music" size={32} /></div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>Плейлист не выбран</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {playlists.map(pl => (
                      <button key={pl.id} onClick={() => setPlaylistForBroadcast(pl.id)} style={{
                        background: 'rgba(229,57,53,0.1)', border: '1px solid #e53935',
                        color: '#e53935', borderRadius: 8, padding: '6px 16px',
                        fontSize: 13, cursor: 'pointer',
                      }}>{pl.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Медиатека */}
            <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, border: '1px solid #2a2a2a' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                МЕДИАТЕКА
              </h2>
              {mediaLibrary.length === 0 ? (
                <div style={{
                  border: '2px dashed #2a2a2a', borderRadius: 12, padding: '32px',
                  textAlign: 'center', cursor: 'pointer', color: '#555',
                }} onClick={() => fileInputRef.current?.click()}>
                  <Icon name="upload" size={32} />
                  <div style={{ marginTop: 8, fontSize: 13 }}>Нажмите чтобы загрузить аудио</div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>MP3, WAV, OGG — до 50 МБ</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {mediaLibrary.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '8px 12px', borderRadius: 8,
                      background: '#222',
                    }}>
                      <span style={{ color: '#e53935' }}><Icon name="music" size={16} /></span>
                      <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
                      <span style={{ fontSize: 11, color: '#555' }}>
                        {m.size ? `${(m.size / 1024 / 1024).toFixed(1)} МБ` : ''}
                      </span>
                      <button className="btn" style={{ color: '#555' }} onClick={() => deleteMedia(m.id)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Вкладка ПЛЕЙЛИСТЫ ─────────────────────────────── */}
        {tab === 'playlists' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                МОИ ПЛЕЙЛИСТЫ
              </h2>
              <button onClick={() => setPlaylistModal({ mode: 'create' })} style={{
                background: '#e53935', border: 'none', color: '#fff',
                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
              }}>
                <Icon name="plus" size={16} /> Создать
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {playlists.map(pl => (
                <div key={pl.id} style={{
                  background: '#1a1a1a', borderRadius: 16, overflow: 'hidden',
                  border: '1px solid #2a2a2a', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }} onClick={() => setPlaylistModal({ mode: 'edit', playlist: pl })}>
                  <div style={{
                    height: 140, background: 'linear-gradient(135deg, #2a1a1a, #1a1a2a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333',
                  }}>
                    <Icon name="music" size={48} />
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{pl.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{pl.items?.length || 0} треков</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {pl.is_shuffle && <span className="tag" style={{ background: 'rgba(229,57,53,0.1)', color: '#e53935' }}>shuffle</span>}
                      {pl.is_loop && <span className="tag" style={{ background: 'rgba(229,57,53,0.1)', color: '#e53935' }}>loop</span>}
                    </div>
                  </div>
                </div>
              ))}

              {/* Кнопка добавить */}
              <div onClick={() => setPlaylistModal({ mode: 'create' })} style={{
                background: '#1a1a1a', borderRadius: 16, border: '2px dashed #2a2a2a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 220, cursor: 'pointer', color: '#555', gap: 8, transition: 'border-color 0.15s',
              }}>
                <Icon name="plus" size={32} />
                <span style={{ fontSize: 13 }}>Новый плейлист</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Модальное окно плейлиста ─────────────────────────── */}
      {playlistModal && (
        <PlaylistModal
          mode={playlistModal.mode}
          playlist={playlistModal.playlist}
          mediaLibrary={mediaLibrary}
          onClose={() => setPlaylistModal(null)}
          onCreate={createPlaylist}
          onDeleteItem={(plId, itemId) => { deleteFromPlaylist(plId, itemId) }}
          onToggleOption={togglePlaylistOption}
          onAddItem={async (plId, mediaId) => {
            await api(`/playlists/${plId}/items/`, { method: 'POST', body: JSON.stringify({ media_id: mediaId }) })
            await loadPlaylists()
            // обновим модалку
            const updated = await api(`/playlists/${plId}/`)
            setPlaylistModal({ mode: 'edit', playlist: updated })
          }}
          onDelete={async (plId) => {
            await api(`/playlists/${plId}/`, { method: 'DELETE' })
            await loadPlaylists()
            setPlaylistModal(null)
          }}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  )
}

// ── Модальное окно создания/редактирования плейлиста ──────
function PlaylistModal({ mode, playlist, mediaLibrary, onClose, onCreate, onDeleteItem, onToggleOption, onAddItem, onDelete, onFileUpload }) {
  const [name, setName] = useState(playlist?.name || '')
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onCreate(name, null, selected)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1a1a1a', borderRadius: 20, width: '100%', maxWidth: 600,
        border: '1px solid #2a2a2a', overflow: 'hidden',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Шапка */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #2a2a2a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
            {mode === 'create' ? 'СОЗДАТЬ ПЛЕЙЛИСТ' : 'МОЙ ПЛЕЙЛИСТ'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          {/* Название */}
          <div style={{ marginBottom: 20 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Введите название..."
              style={{
                width: '100%', background: '#222', border: '1px solid #333',
                borderRadius: 10, padding: '10px 16px', color: '#f0f0f0',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Опции (только edit) */}
          {mode === 'edit' && playlist && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[['is_shuffle', 'shuffle', 'Shuffle'], ['is_loop', 'loop', 'Повтор']].map(([field, icon, label]) => (
                <button key={field} onClick={() => onToggleOption(playlist.id, field, !playlist[field])} style={{
                  background: playlist[field] ? 'rgba(229,57,53,0.15)' : '#222',
                  border: `1px solid ${playlist[field] ? '#e53935' : '#333'}`,
                  color: playlist[field] ? '#e53935' : '#888',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                }}>
                  <Icon name={icon} size={14} />{label}
                </button>
              ))}
              <button onClick={() => onDelete(playlist.id)} style={{
                marginLeft: 'auto', background: 'rgba(229,57,53,0.1)',
                border: '1px solid #e53935', color: '#e53935',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
              }}>
                <Icon name="trash" size={14} /> Удалить плейлист
              </button>
            </div>
          )}

          {/* Треки плейлиста (edit) */}
          {mode === 'edit' && playlist?.items?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Треки</div>
              {playlist.items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, background: '#222', marginBottom: 4,
                }}>
                  <span style={{ fontSize: 12, color: '#555', width: 20, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ color: '#e53935' }}><Icon name="music" size={14} /></span>
                  <span style={{ flex: 1, fontSize: 13 }}>{item.media?.name}</span>
                  <button onClick={() => onDeleteItem(playlist.id, item.id)} style={{
                    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                  }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Медиатека для выбора */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
                {mode === 'edit' ? 'Добавить из медиатеки' : 'Выберите треки'}
              </div>
              <button onClick={() => fileRef.current?.click()} style={{
                background: 'none', border: '1px solid #333', color: '#888',
                borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="upload" size={12} /> Загрузить
              </button>
              <input ref={fileRef} type="file" accept=".mp3,.wav,.ogg" style={{ display: 'none' }}
                onChange={e => onFileUpload(e.target.files[0])} />
            </div>

            {mediaLibrary.length === 0 ? (
              <div style={{
                border: '2px dashed #2a2a2a', borderRadius: 10, padding: 24,
                textAlign: 'center', color: '#555', fontSize: 13,
              }}>Медиатека пуста — загрузите треки</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                {mediaLibrary.map(m => {
                  const inPlaylist = mode === 'edit' && playlist?.items?.some(i => i.media?.id === m.id)
                  const isSelected = selected.includes(m.id)
                  return (
                    <div key={m.id} onClick={() => {
                      if (inPlaylist) return
                      if (mode === 'edit') { onAddItem(playlist.id, m.id) }
                      else toggleSelect(m.id)
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, cursor: inPlaylist ? 'default' : 'pointer',
                      background: isSelected ? 'rgba(229,57,53,0.1)' : '#222',
                      border: `1px solid ${isSelected ? '#e53935' : 'transparent'}`,
                      opacity: inPlaylist ? 0.4 : 1,
                    }}>
                      <span style={{ color: isSelected ? '#e53935' : '#555' }}><Icon name="music" size={14} /></span>
                      <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
                      {inPlaylist && <span style={{ fontSize: 11, color: '#555' }}>уже добавлен</span>}
                      {isSelected && <span style={{ color: '#e53935' }}><Icon name="check" size={14} /></span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Кнопки */}
        {mode === 'create' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, background: '#222', border: '1px solid #333',
              color: '#888', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 14,
            }}>Отмена</button>
            <button onClick={handleCreate} disabled={saving || !name.trim()} style={{
              flex: 2, background: name.trim() ? '#e53935' : '#333',
              border: 'none', color: '#fff', borderRadius: 10, padding: '10px',
              cursor: name.trim() ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600,
            }}>
              {saving ? 'Создание...' : `Создать${selected.length ? ` (${selected.length} треков)` : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}