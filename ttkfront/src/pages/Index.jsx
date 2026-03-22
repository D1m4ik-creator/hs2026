import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, API_ORIGIN } from '../config'
import { useBroadcastWS } from '../hooks/useBroadcastWS'
import { useListenerMessages } from '../hooks/useListenerMessages'
import BroadcastPlayer from '../components/listener/BroadcastPlayer'
import Chat from '../components/listener/Chat'
import PlaylistsSection from '../components/listener/PlaylistsSection'
import logo from '../assets/logo.png'

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
    is_active: false, media_url: null, offset: 0, volume: 1, host: null, current_track: null,
  })
  const [activeTab, setActiveTab] = useState('broadcast')

  const audioRef = useRef(null)
  const broadcastSectionRef = useRef(null)
  const playlistsSectionRef = useRef(null)

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  // ── Load initial broadcast state ──────────────────────
  const loadBroadcast = useCallback(async () => {
    try {
      const data = await apiFetch('/listener/broadcast/')
      setBroadcast(prev => ({
        ...prev,
        is_active: data.is_active,
        media_url: data.stream_url ?? data.media_url ?? prev.media_url,
        host: data.host_login ?? data.host ?? prev.host,
        current_track: data.current_track ?? prev.current_track,
        offset: data.offset ?? 0,
        // Only take server volume on first load (prev.volume === 1 = untouched default)
        volume: prev.volume === 1 ? (data.volume ?? 1) : prev.volume,
      }))
    } catch (e) { console.error('Failed to load broadcast', e) }
  }, [])

  // Initial load only — WS handles subsequent updates via onopen fetch
  useEffect(() => { void loadBroadcast() }, [loadBroadcast])

  // ── WebSocket broadcast updates ───────────────────────
  const handleBroadcastUpdate = useCallback((data) => {
    setBroadcast(prev => ({
      ...prev,
      is_active: data.is_active,
      media_url: data.media_url ?? prev.media_url,  // normalise() maps stream_url→media_url
      offset: data.offset ?? 0,
      host: data.host ?? prev.host,
      current_track: data.current_track ?? prev.current_track,
      volume: data.volume ?? prev.volume,
    }))
  }, [])

  const { sendAction } = useBroadcastWS({ onUpdate: handleBroadcastUpdate, enabled: !!token })

  // ── Audio playback sync ───────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Play if: server says active OR there's a stream_url and a current track
    const shouldPlay = broadcast.is_active && broadcast.media_url

    if (shouldPlay) {
      const url = resolveUrl(broadcast.media_url)
      if (audio.src !== url) { audio.src = url; audio.load() }
      audio.volume = broadcast.volume ?? 1
      if (broadcast.offset > 0 && Math.abs(audio.currentTime - broadcast.offset) > 2) {
        audio.currentTime = broadcast.offset
      }
      audio.play().catch(e => console.warn('autoplay blocked', e))

      const onEnded = () => sendAction({ action: 'track_ended' })
      audio.addEventListener('ended', onEnded)
      return () => audio.removeEventListener('ended', onEnded)
    } else {
      audio.pause()
      if (!broadcast.is_active) audio.src = ''
    }
  }, [broadcast.is_active, broadcast.media_url, broadcast.offset, broadcast.volume, sendAction])

  // ── Toggle by listener (local only — no server control) ──
  const handleToggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) { audio.play().catch(() => {}) }
    else { audio.pause() }
  }

  // ── Messages ──────────────────────────────────────────
  const { messages, sending, sendMessage } = useListenerMessages()

  // ── Volume ────────────────────────────────────────────
  const handleVolume = (v) => {
    setBroadcast(prev => ({ ...prev, volume: v }))
    if (audioRef.current) audioRef.current.volume = v
  }

  // ── Tab navigation ────────────────────────────────────
  const goToTab = (tab) => {
    setActiveTab(tab)
    const ref = tab === 'broadcast' ? broadcastSectionRef : playlistsSectionRef
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const logout = () => { localStorage.clear(); window.location.href = '/' }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      color: '#f0f0f0',
      fontFamily: "'Inter', sans-serif",
    }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      <style>{`
        @import url(https://db.onlinewebfonts.com/c/38764ac6ef7cce3558484bb7e60b9af3?family=Bebas+Neue+Cyrillic);
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes vinylSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wave { from { transform: scaleY(1); } to { transform: scaleY(0.2); } }
        @keyframes dotPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(1.4); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes msgIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        input::placeholder { color: #444; }
        input:focus { outline: none; }
        button { font-family: inherit; }

        input[type=range] { -webkit-appearance: none; appearance: none; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px; height: 10px; border-radius: 50%;
          background: rgba(255,255,255,0.8); cursor: pointer;
        }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 60,
        background: '#0d0d0d',
        borderBottom: '1px solid #181818',
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
      }}>
        {/* Logo */}
        <img src={logo} alt="ТТК ВЕЩАЕТ" style={{ height: 28, marginRight: 48 }} />

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 32, flex: 1 }}>
          {[{ id: 'broadcast', label: 'ЭФИР' }, { id: 'playlists', label: 'ПЛЕЙЛИСТЫ' }].map(tab => (
            <button key={tab.id} onClick={() => goToTab(tab.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Bebas Neue Cyrillic',
              fontSize: 15, letterSpacing: 2,
              color: activeTab === tab.id ? '#fff' : '#555',
              borderBottom: activeTab === tab.id ? '2px solid #E52813' : '2px solid transparent',
              paddingBottom: 2,
              transition: 'color 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user.avatar
            ? <img src={resolveUrl(user.avatar)} alt="" style={{
                width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
                border: '2px solid #2a2a2a',
              }} />
            : <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#222', border: '2px solid #2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>🎧</div>
          }
          <button onClick={logout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#888',
            fontFamily: 'Bebas Neue Cyrillic', letterSpacing: 1,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#888'}
          >
            {(user.full_name || user.login || '').toUpperCase()} (ВЫЙТИ)
          </button>
        </div>
      </header>

      {/* ── PAGE BODY ────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px 80px' }}>

        {/* ── ЭФИР ─────────────────────────────────────── */}
        <section ref={broadcastSectionRef} style={{ paddingTop: 40 }}>
          <h2 style={{
            fontFamily: 'Bebas Neue Cyrillic',
            fontSize: 40, letterSpacing: 6,
            color: '#ddd', textAlign: 'center',
            marginBottom: 28,
          }}>
            ЭФИР
          </h2>

          {/* Player + Chat grid — matches screenshot proportions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: 16,
            alignItems: 'stretch',
          }}>
            <BroadcastPlayer
              broadcast={broadcast}
              onVolume={handleVolume}
              onToggle={handleToggle}
            />
            <div style={{ minHeight: 360 }}>
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

        {/* ── ПЛЕЙЛИСТЫ ────────────────────────────────── */}
        <section ref={playlistsSectionRef} style={{ marginTop: 72 }}>
          <PlaylistsSection />
        </section>

        {/* ── FOOTER ──────────────────────────────────── */}
        <footer style={{
          marginTop: 64, paddingTop: 20,
          borderTop: '1px solid #181818',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <img src={logo} alt="ТТК ВЕЩАЕТ" style={{ height: 22, opacity: 0.3 }} />
          <span style={{ fontSize: 11, color: '#2a2a2a', letterSpacing: 1 }}>FULL STACK 2025</span>
        </footer>
      </div>
    </div>
  )
}