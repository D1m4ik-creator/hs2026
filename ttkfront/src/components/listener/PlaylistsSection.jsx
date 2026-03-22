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
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = String(Math.round(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

// ── Playlist card ─────────────────────────────────────────
function PlaylistCard({ playlist, selected, onClick }) {
  const coverUrl = resolveUrl(playlist.cover)
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${selected ? '#E52813' : '#1e1e1e'}`,
        background: '#141414',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: selected ? 'translateY(-2px)' : 'none',
        boxShadow: selected ? '0 8px 24px rgba(229,40,19,0.2)' : 'none',
        flexShrink: 0,
        width: 160,
      }}
    >
      {/* Cover */}
      <div style={{
        height: 140, position: 'relative', overflow: 'hidden',
        background: '#1a1a1a',
      }}>
        {coverUrl
          ? <img src={coverUrl} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1c1010, #101018)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={36} height={36} viewBox="0 0 24 24" style={{ color: '#2a2a2a' }}>
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          )
        }
        {selected && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(229,40,19,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(229,40,19,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" fill="white" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontWeight: 600, fontSize: 12, color: '#ddd',
          marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {playlist.name}
        </div>
        <div style={{ fontSize: 10, color: '#555' }}>
          @{playlist.author_login || '—'}
        </div>
        <div style={{ fontSize: 10, color: '#444', marginTop: 3 }}>
          {playlist.items_count ?? playlist.items?.length ?? 0} треков
        </div>
      </div>
    </div>
  )
}

// ── Playlist detail ───────────────────────────────────────
function PlaylistDetail({ playlist }) {
  if (!playlist?.items?.length) return null

  return (
    <div style={{
      marginTop: 32,
      animation: 'fadeIn 0.3s ease forwards',
    }}>
      <h3 style={{
        fontFamily: 'Bebas Neue Cyrillic',
        fontSize: 22, letterSpacing: 3,
        color: '#ddd', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        ПЛЕЙЛИСТ, КОТОРЫЙ ВЫ ВЫБРАЛИ
        <svg width={20} height={20} viewBox="0 0 24 24" style={{ color: '#E52813' }}>
          <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </h3>

      <div style={{
        background: '#111', borderRadius: 16, border: '1px solid #1a1a1a',
        overflow: 'hidden',
      }}>
        {/* Playlist header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 20px', borderBottom: '1px solid #1a1a1a',
          background: '#141414',
        }}>
          {/* Mini cover */}
          <div style={{
            width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
            background: '#1e1e1e', flexShrink: 0,
          }}>
            {resolveUrl(playlist.cover)
              ? <img src={resolveUrl(playlist.cover)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" style={{ color: '#333' }}>
                    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
            }
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#eee' }}>{playlist.name}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>@{playlist.author_login}</div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {playlist.is_shuffle && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10,
                background: 'rgba(229,40,19,0.1)', color: '#E52813',
                border: '1px solid rgba(229,40,19,0.2)',
              }}>shuffle</span>
            )}
            {playlist.is_loop && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10,
                background: 'rgba(229,40,19,0.1)', color: '#E52813',
                border: '1px solid rgba(229,40,19,0.2)',
              }}>loop</span>
            )}
          </div>
        </div>

        {/* Tracks */}
        <div style={{ padding: '8px 0' }}>
          {playlist.items.map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 20px',
              borderBottom: idx < playlist.items.length - 1 ? '1px solid #161616' : 'none',
              transition: 'background 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#161616'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 11, color: '#333', width: 18, textAlign: 'right', flexShrink: 0 }}>
                {idx + 1}
              </span>
              <svg width={12} height={12} viewBox="0 0 24 24" style={{ color: '#E52813', flexShrink: 0 }}>
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <span style={{
                flex: 1, fontSize: 13, color: '#ccc',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.media?.name || item.name || '—'}
              </span>
              <span style={{ fontSize: 11, color: '#444', flexShrink: 0 }}>
                {formatDuration(item.media?.duration)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
/**
 * PlaylistsSection
 *
 * Loads GET /api/listener/playlists/
 * On card click: GET /api/listener/playlists/{id}/ and shows detail
 */
export default function PlaylistsSection() {
  const [playlists, setPlaylists] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [scrollPos, setScrollPos] = useState(0)
  const railRef = useRef(null)

  const CARD_WIDTH = 172 // 160px + 12px gap

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/listener/playlists/')
      setPlaylists(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load playlists', e)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const selectPlaylist = async (pl) => {
    if (selectedId === pl.id) {
      setSelectedId(null)
      setSelectedPlaylist(null)
      return
    }
    setSelectedId(pl.id)
    setSelectedPlaylist(null)
    setLoadingDetail(true)
    try {
      const detail = await apiFetch(`/listener/playlists/${pl.id}/`)
      setSelectedPlaylist(detail)
    } catch (e) {
      console.error('Failed to load playlist detail', e)
    } finally {
      setLoadingDetail(false)
    }
  }

  const scroll = (dir) => {
    const newPos = scrollPos + dir * CARD_WIDTH * 3
    const maxScroll = Math.max(0, playlists.length * CARD_WIDTH - (railRef.current?.clientWidth || 600))
    const clamped = Math.max(0, Math.min(newPos, maxScroll))
    setScrollPos(clamped)
    if (railRef.current) {
      railRef.current.scrollTo({ left: clamped, behavior: 'smooth' })
    }
  }

  if (playlists.length === 0) return null

  return (
    <section>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <button onClick={() => scroll(-1)} style={{
          background: 'none', border: '1px solid #1e1e1e', color: '#555',
          borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E52813'; e.currentTarget.style.color = '#E52813' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24">
            <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>

        <h2 style={{
          fontFamily: 'Bebas Neue Cyrillic',
          fontSize: 32, letterSpacing: 4, color: '#ddd',
          margin: 0,
        }}>
          ПЛЕЙЛИСТЫ
        </h2>

        <button onClick={() => scroll(1)} style={{
          background: 'none', border: '1px solid #1e1e1e', color: '#555',
          borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E52813'; e.currentTarget.style.color = '#E52813' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24">
            <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>

      {/* Carousel */}
      <div
        ref={railRef}
        style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', scrollBehavior: 'smooth',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {playlists.map(pl => (
          <PlaylistCard
            key={pl.id}
            playlist={pl}
            selected={selectedId === pl.id}
            onClick={() => selectPlaylist(pl)}
          />
        ))}
      </div>

      {/* Detail */}
      {loadingDetail && (
        <div style={{ marginTop: 24, textAlign: 'center', color: '#333', fontSize: 12 }}>
          Загрузка...
        </div>
      )}
      {selectedPlaylist && !loadingDetail && (
        <PlaylistDetail playlist={selectedPlaylist} />
      )}
    </section>
  )
}
