import { useState, useEffect, useRef } from 'react'
import { API_ORIGIN } from '../../config'
import { Icon } from './Icon'
import { VinylPlayer } from './HostWidgets'
import { toId } from '../../api/hostApi'

// ── Player card ───────────────────────────────────────────
export function PlayerCard({ user, broadcast, currentTrackItem, toggleBroadcast, setVolume }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1e1e 0%, #2a1a1a 100%)',
      borderRadius: 16, padding: 28, border: '1px solid #2a2a2a',
    }}>
      {/* Host info */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
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

      {/* Vinyl */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <VinylPlayer isPlaying={broadcast.is_active} onToggle={toggleBroadcast} />
      </div>

      {/* Current track */}
      {currentTrackItem?.media?.name && (
        <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, color: '#ccc' }}>
          🎵 {currentTrackItem.media.name}
        </div>
      )}

      {/* Volume */}
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

      {/* Status badge */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <span style={{
          display: 'inline-block', padding: '4px 16px', borderRadius: 20,
          fontSize: 12, fontWeight: 600,
          background: broadcast.is_active ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.05)',
          color: broadcast.is_active ? '#e53935' : '#666',
          border: `1px solid ${broadcast.is_active ? '#e53935' : '#333'}`,
        }}>
          {broadcast.is_active ? '● В ЭФИРЕ' : '○ НЕ В ЭФИРЕ'}
        </span>
      </div>
    </div>
  )
}

const PAGE_SIZE = 5

function formatDur(secs) {
  if (!secs) return '—'
  return `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`
}

// ── Progress bar for current track ───────────────────────
function TrackProgress({ audioRef }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    // Poll every 500ms — more reliable than timeupdate across browsers
    const timer = setInterval(() => {
      const audio = audioRef?.current
      if (audio && audio.duration && !isNaN(audio.duration)) {
        setPct((audio.currentTime / audio.duration) * 100)
      }
    }, 500)
    return () => clearInterval(timer)
  }, [audioRef])

  const handleSeek = (e) => {
    const audio = audioRef?.current
    if (!audio || !audio.duration || isNaN(audio.duration)) return
    const rect = e.currentTarget.getBoundingClientRect()
    const newTime = ((e.clientX - rect.left) / rect.width) * audio.duration
    audio.currentTime = newTime
    setPct((newTime / audio.duration) * 100)
  }

  return (
    <div
      style={{ height: 4, background: '#2a2a2a', borderRadius: 2, margin: '6px 0 2px', overflow: 'hidden', cursor: 'pointer' }}
      onClick={handleSeek}
    >
      <div style={{ height: '100%', width: `${pct}%`, background: '#e53935', borderRadius: 2 }} />
    </div>
  )
}

// ── Single track row ──────────────────────────────────────
function TrackRow({ item, index, isCurrent, isPlaying, audioRef, onPlay, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div style={{ borderBottom: '1px solid #1e1e1e' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0',
        background: isCurrent ? 'rgba(229,57,53,0.05)' : 'transparent',
      }}>
        {/* Play/Pause */}
        <button className="btn" onClick={onPlay} style={{
          color: isCurrent && isPlaying ? '#e53935' : '#888',
          width: 28, flexShrink: 0,
        }}>
          <Icon name={isCurrent && isPlaying ? 'pause' : 'play'} size={14} />
        </button>

        {/* Track name */}
        <span style={{
          flex: 1, fontSize: 13,
          color: isCurrent ? '#fff' : '#bbb',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.media?.name || '—'}
        </span>

        {/* Duration */}
        <span style={{ fontSize: 12, color: '#555', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
          {formatDur(item.media?.duration)}
        </span>

        {/* Actions */}
        <button className="btn" title="Удалить" onClick={onDelete} style={{ color: '#555', flexShrink: 0 }}>
          <Icon name="trash" size={14} />
        </button>
        <button className="btn" title="Переместить выше" onClick={onMoveUp} style={{ color: '#555', flexShrink: 0 }}>
          <Icon name="prev" size={14} />
        </button>
        <button className="btn" title="Переместить ниже" onClick={onMoveDown} style={{ color: '#555', flexShrink: 0 }}>
          <Icon name="next" size={14} />
        </button>
      </div>

      {/* Progress bar under current track */}
      {isCurrent && <TrackProgress audioRef={audioRef} />}
    </div>
  )
}

// ── BroadcastStream main ──────────────────────────────────
export function BroadcastStream({
  broadcast, activePlaylist, playlists,
  setPlaylistForBroadcast, togglePlaylistOption, deleteFromPlaylist,
  onUploadClick, sendAction, audioRef, onSelectPlaylist,
}) {
  const [page, setPage] = useState(1)

  // Local selected playlist ID — independent from broadcast.current_playlist
  // so switching playlists in UI doesn't require a server round-trip
  const [localPlaylistId, setLocalPlaylistId] = useState(null)

  // On mount: auto-select first playlist if none active
  useEffect(() => {
    if (playlists.length === 0) return
    const serverPl = activePlaylist?.id ?? null
    const initId = serverPl ?? playlists[0].id
    setLocalPlaylistId(initId)
    const initPl = playlists.find(p => p.id === initId) ?? playlists[0]
    onSelectPlaylist?.(initPl)  // inform hook on mount
  }, [playlists.length]) // eslint-disable-line

  // Sync local selection when server reports a different active playlist
  useEffect(() => {
    if (activePlaylist?.id && activePlaylist.id !== localPlaylistId) {
      setLocalPlaylistId(activePlaylist.id)
    }
  }, [activePlaylist?.id]) // eslint-disable-line

  const selectedPlaylist = playlists.find(p => p.id === localPlaylistId) ?? playlists[0] ?? null

  const handleSelectPlaylist = (pl) => {
    setLocalPlaylistId(pl.id)
    setPlaylistForBroadcast(pl.id)  // sync to server
    onSelectPlaylist?.(pl)           // tell hook which playlist is active for auto-advance
    setPage(1)
  }

  const items = selectedPlaylist?.items ?? []
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const currentMediaUrl = broadcast.media_url ?? ''
  const isCurrentItem = (item) => {
    if (!currentMediaUrl || !item.media) return false
    const raw = item.media.file ?? item.media.url ?? item.media.stream_url ?? ''
    if (!raw) return false
    const urlFilename = currentMediaUrl.split('/').pop()
    const itemFilename = raw.split('/').pop()
    return urlFilename === itemFilename && urlFilename !== ''
  }

  useEffect(() => { setPage(1) }, [selectedPlaylist?.id])

  useEffect(() => {
    const idx = items.findIndex(it => isCurrentItem(it))
    if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1)
  }, [broadcast.media_url]) // eslint-disable-line

  const handlePlayItem = (item) => sendAction({ action: 'enqueue', playlist_item_id: item.id })
  const handlePlayNext = () => sendAction({ action: 'play_next' })

  if (playlists.length === 0) return (
    <div style={{ background: '#161616', borderRadius: 16, padding: '28px 32px', border: '1px solid #1e1e1e', marginBottom: 24, textAlign: 'center', color: '#555' }}>
      <div style={{ marginBottom: 12 }}><Icon name="music" size={32} /></div>
      <div style={{ fontSize: 13 }}>Нет плейлистов. Создайте плейлист на вкладке «Плейлисты».</div>
    </div>
  )

  return (
    <div style={{ background: '#161616', borderRadius: 16, padding: '28px 32px', border: '1px solid #1e1e1e', marginBottom: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#eee' }}>
          ПОТОК ЭФИРА
        </h2>
      </div>

      {/* Playlist tabs */}
      {playlists.length >= 1 && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20,
          overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none',
        }}>
          {playlists.map(pl => {
            const isActive = pl.id === localPlaylistId
            // Dot indicator if this playlist has the currently playing track
            const hasPlaying = pl.items?.some(it => isCurrentItem(it))
            return (
              <button key={pl.id} onClick={() => handleSelectPlaylist(pl)} style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${isActive ? '#e53935' : '#2a2a2a'}`,
                background: isActive ? 'rgba(229,57,53,0.12)' : '#1e1e1e',
                color: isActive ? '#e53935' : '#888',
                fontSize: 12, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {hasPlaying && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#e53935',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    flexShrink: 0,
                  }} />
                )}
                {pl.name}
                <span style={{ fontSize: 10, color: isActive ? 'rgba(229,57,53,0.7)' : '#555' }}>
                  {pl.items?.length ?? 0}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selectedPlaylist ? (
        <>
          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <button className="btn" title="Загрузить трек" onClick={onUploadClick} style={{ color: '#888' }}>
              <Icon name="upload" size={18} />
            </button>
            <button className="btn" title="Следующий трек" onClick={handlePlayNext} style={{ color: '#888' }}>
              <Icon name="loop" size={18} />
            </button>
            <button className="btn" title="Shuffle"
              onClick={() => togglePlaylistOption(selectedPlaylist.id, 'is_shuffle', !selectedPlaylist.is_shuffle)}
              style={{ color: selectedPlaylist.is_shuffle ? '#e53935' : '#555' }}
            >
              <Icon name="shuffle" size={18} />
            </button>
          </div>

          {/* Track list */}
          <div>
            {pageItems.map((item) => {
              const isCurrent = isCurrentItem(item)
              return (
                <TrackRow
                  key={item.id}
                  item={item}
                  isCurrent={isCurrent}
                  isPlaying={broadcast.is_active}
                  audioRef={audioRef}
                  onPlay={() => handlePlayItem(item)}
                  onDelete={() => deleteFromPlaylist(selectedPlaylist.id, item.id)}
                  onMoveUp={() => sendAction({ action: 'enqueue', playlist_item_id: item.id })}
                  onMoveDown={() => handlePlayNext()}
                />
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: 'none', cursor: 'pointer',
                    background: page === p ? '#e53935' : 'transparent',
                    color: page === p ? '#fff' : '#666',
                    fontSize: 13, fontWeight: page === p ? 700 : 400,
                    transition: 'all 0.15s',
                  }}>{p}</button>
                )
              })}
              {totalPages > 5 && <span style={{ color: '#444', fontSize: 13 }}>…</span>}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}