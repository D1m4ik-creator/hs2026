import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE, API_ORIGIN } from '../../config'

async function apiFetch(path) {
  const token = localStorage.getItem('access') || localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

const resolveUrl = (path) => {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

function formatDuration(secs) {
  if (!secs) return '3:22'
  return `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`
}

// ── Playlist card ─────────────────────────────────────────
function PlaylistCard({ playlist, selected, onClick }) {
  const coverUrl = resolveUrl(playlist.cover)
  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: 210, cursor: 'pointer',
    }}>
      {/* Cover */}
      <div style={{
        height: 210, background: '#1a1a1a',
        position: 'relative', overflow: 'hidden',
        outline: selected ? '2px solid #E52813' : '2px solid transparent',
        transition: 'outline 0.15s',
      }}>
        {coverUrl
          ? <img src={coverUrl} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1c1010, #101018)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={44} height={44} viewBox="0 0 24 24" style={{ color: '#2a2a2a' }}>
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
          )
        }
        {selected && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(229,40,19,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(229,40,19,0.88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" fill="white"/>
              </svg>
            </div>
          </div>
        )}
      </div>
      {/* Text below */}
      <div style={{ paddingTop: 10 }}>
        <div style={{
          fontFamily: 'Bebas Neue Cyrillic',
          fontSize: 14, letterSpacing: 1, color: '#ddd',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {playlist.name}
        </div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
          @{playlist.author_login || '—'}
        </div>
      </div>
    </div>
  )
}

// ── Playlist detail — matches screenshot exactly ──────────
function PlaylistDetail({ playlist }) {
  const coverUrl = resolveUrl(playlist.cover)
  const items = playlist.items || []

  return (
    <div style={{ marginTop: 56, animation: 'fadeIn 0.25s ease forwards' }}>
      {/* Title */}
      <h3 style={{
        fontFamily: 'Bebas Neue Cyrillic',
        fontSize: 34, letterSpacing: 4, color: '#ddd',
        marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        ПЛЕЙЛИСТ, КОТОРЫЙ ВЫ ВЫБРАЛИ
        <span style={{ fontSize: 28 }}>🎵</span>
      </h3>

      <div style={{ background: '#181818', borderRadius: 8, overflow: 'hidden' }}>
        {/* Top row: cover + controls + current track */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderBottom: '1px solid #222',
        }}>
          {/* Album cover */}
          <div style={{
            width: 180, height: 180, flexShrink: 0, background: '#111',
          }}>
            {coverUrl
              ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={40} height={40} viewBox="0 0 24 24" style={{ color: '#2a2a2a' }}>
                    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
            }
          </div>

          {/* Controls + track info */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
            {/* Icons row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
              {/* Volume */}
              <svg width={18} height={18} viewBox="0 0 24 24" style={{ color: '#aaa', cursor: 'pointer' }}>
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              {/* Prev */}
              <svg width={18} height={18} viewBox="0 0 24 24" style={{ color: '#aaa', cursor: 'pointer' }}>
                <polygon points="19,20 9,12 19,4" fill="currentColor"/>
                <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {/* Next */}
              <svg width={18} height={18} viewBox="0 0 24 24" style={{ color: '#aaa', cursor: 'pointer' }}>
                <polygon points="5,4 15,12 5,20" fill="currentColor"/>
                <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {/* Loop */}
              <svg width={18} height={18} viewBox="0 0 24 24" style={{ color: playlist.is_loop ? '#E52813' : '#444', cursor: 'pointer' }}>
                <polyline points="17,1 21,5 17,9" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="currentColor" strokeWidth="2" fill="none"/>
                <polyline points="7,23 3,19 7,15" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              {/* Shuffle */}
              <svg width={18} height={18} viewBox="0 0 24 24" style={{ color: playlist.is_shuffle ? '#E52813' : '#444', cursor: 'pointer' }}>
                <polyline points="16,3 21,3 21,8" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                <polyline points="21,16 21,21 16,21" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>

            {/* Current / first track with progress bar */}
            {items[0] && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                }}>
                  {/* Pause icon for active track */}
                  <svg width={13} height={13} viewBox="0 0 24 24" style={{ color: '#aaa', flexShrink: 0 }}>
                    <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                    <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                  </svg>
                  <span style={{ flex: 1, fontSize: 13, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {items[0].media?.name || items[0].name || '—'}
                  </span>
                  <span style={{ fontSize: 12, color: '#555', flexShrink: 0 }}>
                    {formatDuration(items[0].media?.duration)}
                  </span>
                </div>
                {/* Red progress bar */}
                <div style={{
                  height: 3, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: '38%',
                    background: 'linear-gradient(to right, #c41e10, #E52813)',
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Track list */}
        <div>
          {items.map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '11px 28px',
              borderBottom: idx < items.length - 1 ? '1px solid #1e1e1e' : 'none',
              transition: 'background 0.1s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" style={{ color: '#555', flexShrink: 0 }}>
                <polygon points="5,3 19,12 5,21" fill="currentColor"/>
              </svg>
              <span style={{ flex: 1, fontSize: 13, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.media?.name || item.name || '—'}
              </span>
              <span style={{ fontSize: 12, color: '#444', flexShrink: 0 }}>
                {formatDuration(item.media?.duration)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function PlaylistsSection() {
  const [playlists, setPlaylists] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const railRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/listener/playlists/')
      setPlaylists(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { void load() }, [load])

  const selectPlaylist = async (pl) => {
    if (selectedId === pl.id) { setSelectedId(null); setSelectedPlaylist(null); return }
    setSelectedId(pl.id); setSelectedPlaylist(null); setLoadingDetail(true)
    try { setSelectedPlaylist(await apiFetch(`/listener/playlists/${pl.id}/`)) }
    catch (e) { console.error(e) }
    finally { setLoadingDetail(false) }
  }

  const scroll = (dir) => railRef.current?.scrollBy({ left: dir * 680, behavior: 'smooth' })

  return (
    <section>
      {/* Header with arrows */}
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center', marginBottom: 36,
      }}>
        <button onClick={() => scroll(-1)} style={{
          background: 'none', border: 'none', color: '#666',
          cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center',
          transition: 'color 0.15s', fontSize: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          <svg width={28} height={28} viewBox="0 0 24 24">
            <line x1="20" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2.5"/>
            <polyline points="10,6 4,12 10,18" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          </svg>
        </button>

        <h2 style={{
          fontFamily: 'Bebas Neue Cyrillic',
          fontSize: 44, letterSpacing: 6,
          color: '#ddd', textAlign: 'center', margin: 0,
        }}>
          ПЛЕЙЛИСТЫ
        </h2>

        <button onClick={() => scroll(1)} style={{
          background: 'none', border: 'none', color: '#666',
          cursor: 'pointer', padding: 0, justifySelf: 'end',
          display: 'flex', alignItems: 'center',
          transition: 'color 0.15s', fontSize: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          <svg width={28} height={28} viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5"/>
            <polyline points="14,6 20,12 14,18" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          </svg>
        </button>
      </div>

      {/* Carousel */}
      <div ref={railRef} style={{
        display: 'flex', gap: 24,
        overflowX: 'auto', scrollBehavior: 'smooth',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        paddingBottom: 4,
      }}>
        {playlists.map(pl => (
          <PlaylistCard
            key={pl.id} playlist={pl}
            selected={selectedId === pl.id}
            onClick={() => selectPlaylist(pl)}
          />
        ))}
      </div>

      {loadingDetail && (
        <div style={{ marginTop: 24, textAlign: 'center', color: '#333', fontSize: 12 }}>
          Загрузка...
        </div>
      )}
      {selectedPlaylist && !loadingDetail && <PlaylistDetail playlist={selectedPlaylist} />}
    </section>
  )
}