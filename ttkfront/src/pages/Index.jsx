import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, API_ORIGIN } from '../config'
import { useBroadcastWS } from '../hooks/useBroadcastWS'
import { useListenerMessages } from '../hooks/useListenerMessages'
import BroadcastPlayer from '../components/listener/BroadcastPlayer'
import Chat from '../components/listener/Chat'
import PlaylistsSection from '../components/listener/PlaylistsSection'

const resolveUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

async function apiFetch(path) {
  const token = localStorage.getItem('access') || localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export default function Index() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('access') || localStorage.getItem('token')

  const [broadcast, setBroadcast] = useState({
    is_active: false, media_url: null, offset: 0, volume: 1, host: null,
  })
  const [activeTab, setActiveTab] = useState('broadcast') // 'broadcast' | 'playlists'

  const audioRef = useRef(null)
  const broadcastRef = useRef(broadcast)
  broadcastRef.current = broadcast

  const broadcastSectionRef = useRef(null)
  const playlistsSectionRef = useRef(null)

  // ── Auth guard ────────────────────────────────────────
  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  // ── Load initial broadcast state ──────────────────────
  const loadBroadcast = useCallback(async () => {
    try {
      const data = await apiFetch('/listener/broadcast/')
      setBroadcast(prev => ({
        ...prev,
        ...data,
        volume: prev.volume, // keep local volume
      }))
    } catch (e) {
      console.error('Failed to load broadcast state', e)
    }
  }, [])

  useEffect(() => {
    void loadBroadcast()
    const timer = setInterval(loadBroadcast, 15000)
    return () => clearInterval(timer)
  }, [loadBroadcast])

  // ── WebSocket: broadcast_update ───────────────────────
  const handleBroadcastUpdate = useCallback((data) => {
    // data: { type, media_url, offset, is_active, queue_len, current_queue_item_id }
    setBroadcast(prev => ({
      ...prev,
      is_active: data.is_active,
      media_url: data.media_url,
      offset: data.offset ?? 0,
    }))
  }, [])

  const { sendAction } = useBroadcastWS({
    onUpdate: handleBroadcastUpdate,
    enabled: !!token,
  })

  // ── Audio sync ────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (broadcast.is_active && broadcast.media_url) {
      const url = resolveUrl(broadcast.media_url)
      if (audio.src !== url) {
        audio.src = url
        audio.load()
      }
      audio.volume = broadcast.volume ?? 1

      // Sync offset for new listeners
      if (broadcast.offset > 0 && Math.abs(audio.currentTime - broadcast.offset) > 2) {
        audio.currentTime = broadcast.offset
      }

      audio.play().catch(e => console.error('play error', e))

      // Notify server when track ends
      const handleEnded = () => sendAction({ action: 'track_ended' })
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    } else {
      audio.pause()
      if (!broadcast.is_active) audio.src = ''
    }
  }, [broadcast.is_active, broadcast.media_url, broadcast.offset, broadcast.volume, sendAction])

  // ── Messages ──────────────────────────────────────────
  const { messages, sending, sendMessage } = useListenerMessages()

  // ── Volume (local only) ───────────────────────────────
  const handleVolume = (v) => {
    setBroadcast(prev => ({ ...prev, volume: v }))
    if (audioRef.current) audioRef.current.volume = v
  }

  // ── Tab scroll ────────────────────────────────────────
  const scrollToTab = (tab) => {
    setActiveTab(tab)
    const ref = tab === 'broadcast' ? broadcastSectionRef : playlistsSectionRef
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const logout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f0f0f0',
      fontFamily: "'Inter', sans-serif",
    }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* ── Global styles ─────────────────────────────── */}
      <style>{`
        @import url(https://db.onlinewebfonts.com/c/38764ac6ef7cce3558484bb7e60b9af3?family=Bebas+Neue+Cyrillic);
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes vinylSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wave {
          from { transform: scaleY(1); }
          to   { transform: scaleY(0.25); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E52813; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #c41f10; }

        input { border: none; }
        input::placeholder { color: #3a3a3a; }
        input:focus { outline: none; }

        input[type=range] {
          -webkit-appearance: none;
          appearance: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #E52813;
          cursor: pointer;
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 58,
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #141414',
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: 24,
      }}>
        {/* Logo */}
        <span style={{ fontFamily: 'Bebas Neue Cyrillic', fontSize: 20, letterSpacing: 2, flexShrink: 0 }}>
          ТТК<span style={{ color: '#E52813' }}>●</span>ВЕЩАЕТ
        </span>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'broadcast', label: 'ЭФИР' },
            { id: 'playlists', label: 'ПЛЕЙЛИСТЫ' },
          ].map(tab => (
            <button key={tab.id} onClick={() => scrollToTab(tab.id)} style={{
              background: activeTab === tab.id ? '#E52813' : 'none',
              border: 'none',
              color: activeTab === tab.id ? '#fff' : '#666',
              padding: '5px 16px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Bebas Neue Cyrillic', fontSize: 13, letterSpacing: 1.5,
              transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#ccc' }}>{user.full_name}</div>
            <div style={{ fontSize: 10, color: '#444' }}>@{user.login}</div>
          </div>

          {user.avatar
            ? <img
                src={resolveUrl(user.avatar)}
                alt=""
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #E52813' }}
              />
            : <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#181818', border: '1.5px solid #2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>🎧</div>
          }

          <button onClick={logout} style={{
            background: 'none', border: '1px solid #1e1e1e', color: '#444',
            borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
            fontSize: 11, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E52813'; e.currentTarget.style.borderColor = '#E52813' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = '#1e1e1e' }}
          >
            Выйти
          </button>
        </div>
      </header>

      {/* ── Page body ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* ─── ЭФИР section ──────────────────────────────── */}
        <section ref={broadcastSectionRef} style={{ paddingTop: 40 }}>
          <h2 style={{
            fontFamily: 'Bebas Neue Cyrillic',
            fontSize: 36, letterSpacing: 5,
            color: '#ddd', textAlign: 'center',
            marginBottom: 28,
          }}>
            ЭФИР
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr',
            gap: 20,
            alignItems: 'stretch',
          }}>
            {/* Player */}
            <BroadcastPlayer
              broadcast={broadcast}
              audioRef={audioRef}
              onVolume={handleVolume}
            />

            {/* Chat */}
            <div style={{ minHeight: 460 }}>
              <Chat
                messages={messages}
                sending={sending}
                onSend={sendMessage}
                isActive={broadcast.is_active}
                currentUser={user}
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div style={{
          height: 1, background: 'linear-gradient(to right, transparent, #1e1e1e, transparent)',
          margin: '48px 0',
        }} />

        {/* ─── ПЛЕЙЛИСТЫ section ──────────────────────────── */}
        <section ref={playlistsSectionRef}>
          <PlaylistsSection />
        </section>

        {/* Footer */}
        <footer style={{
          marginTop: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #141414', paddingTop: 20,
        }}>
          <span style={{ fontFamily: 'Bebas Neue Cyrillic', fontSize: 16, letterSpacing: 2, color: '#2a2a2a' }}>
            ТТК<span style={{ color: '#E52813' }}>●</span>ВЕЩАЕТ
          </span>
          <span style={{ fontSize: 10, color: '#2a2a2a' }}>FULL STACK 2025</span>
        </footer>
      </div>
    </div>
  )
}
