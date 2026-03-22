import { useState, useRef, useEffect } from 'react'
import { API_ORIGIN } from '../config'
import { useHostBroadcast } from '../hooks/useHostBroadcast'
import { useHostMessages } from '../hooks/useHostMessages'
import { useHostPlaylists } from '../hooks/useHostPlaylists'
import { Icon } from '../components/host/Icon'
import { AutoplayBanner } from '../components/host/HostWidgets'
import { PlayerCard, BroadcastStream } from '../components/host/BroadcastSection'
import { HostChat } from '../components/host/HostChat'
import { MediaLibrary } from '../components/host/MediaLibrary'
import { PlaylistsTab } from '../components/host/PlaylistsTab'
import { PlaylistModal } from '../components/host/PlaylistModal'

export default function HostPanel() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [tab, setTab]               = useState('broadcast')
  const [playlistModal, setPlaylistModal] = useState(null)
  const fileInputRef = useRef(null)

  // ── Hooks ─────────────────────────────────────────────
  const {
    playlists, mediaLibrary,
    loadPlaylists, loadMedia,
    handleFileUpload, deleteMedia,
    createPlaylist, deleteFromPlaylist,
    togglePlaylistOption, deletePlaylist, addItemToPlaylist,
  } = useHostPlaylists()

  const {
    broadcast, activePlaylist, currentTrackItem,
    audioRef, autoplayBlocked,
    init: initBroadcast,
    toggleBroadcast, setVolume, setPlaylistForBroadcast, resumeAudio, sendAction, setLocalSelectedPlaylist,
  } = useHostBroadcast(playlists)

  const { messages, loadMessages, changeStatus } = useHostMessages()

  // ── Init: playlists first, then broadcast (avoid race) ──
  useEffect(() => {
    const init = async () => {
      await loadPlaylists()
      await initBroadcast()
      void loadMessages()
      void loadMedia()
    }
    void init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = () => { localStorage.clear(); window.location.href = '/login' }

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#f0f0f0', fontFamily: "'Segoe UI', sans-serif" }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.7; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #e53935; border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 3px; background: #333; border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #e53935; cursor: pointer; }
        .btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s; }
        .btn:hover { opacity: 0.75; }
        .tag { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
      `}</style>

      {/* ── Header ──────────────────────────────────────── */}
      <header style={{
        background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>
          ТТК<span style={{ color: '#e53935' }}>@</span>ВЕЩАЕТ
        </span>

        <nav style={{ display: 'flex', gap: 4 }}>
          {[{ id: 'broadcast', label: 'МОЙ ЭФИР' }, { id: 'playlists', label: 'ПЛЕЙЛИСТЫ' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? '#e53935' : 'none',
              border: 'none', color: tab === t.id ? '#fff' : '#aaa',
              padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, letterSpacing: 0.5, transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user.avatar && (
            <img src={`${API_ORIGIN}${user.avatar}`} alt=""
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.full_name}</div>
            <div style={{ fontSize: 11, color: '#888' }}>@{user.login}</div>
          </div>
          <button onClick={logout} className="btn" style={{ color: '#888', marginLeft: 4 }}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {tab === 'broadcast' && (
          <>
            {autoplayBlocked && broadcast.is_active && (
              <AutoplayBanner onResume={resumeAudio} />
            )}

            {/* Player + Chat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              <PlayerCard
                user={user}
                broadcast={broadcast}
                currentTrackItem={currentTrackItem}
                toggleBroadcast={toggleBroadcast}
                setVolume={setVolume}
              />
              <HostChat messages={messages} changeStatus={changeStatus} />
            </div>

            {/* Stream / playlist selector */}
            <BroadcastStream
              broadcast={broadcast}
              activePlaylist={activePlaylist}
              playlists={playlists}
              setPlaylistForBroadcast={setPlaylistForBroadcast}
              togglePlaylistOption={togglePlaylistOption}
              deleteFromPlaylist={deleteFromPlaylist}
              onUploadClick={() => fileInputRef.current?.click()}
              sendAction={sendAction}
              audioRef={audioRef}
              onSelectPlaylist={setLocalSelectedPlaylist}
            />

            {/* Hidden file input for uploads */}
            <input ref={fileInputRef} type="file" accept=".mp3,.wav,.ogg"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0]
                if (file) handleFileUpload(file, fileInputRef)
              }}
            />

            {/* Media library */}
            <MediaLibrary
              mediaLibrary={mediaLibrary}
              onUploadClick={() => fileInputRef.current?.click()}
              onDelete={deleteMedia}
            />
          </>
        )}

        {tab === 'playlists' && (
          <PlaylistsTab
            playlists={playlists}
            onOpen={pl => setPlaylistModal({ mode: 'edit', playlist: pl })}
            onCreateNew={() => setPlaylistModal({ mode: 'create' })}
          />
        )}
      </div>

      {/* ── Playlist modal ───────────────────────────────── */}
      {playlistModal && (
        <PlaylistModal
          mode={playlistModal.mode}
          playlist={playlistModal.playlist}
          mediaLibrary={mediaLibrary}
          onClose={() => setPlaylistModal(null)}
          onCreate={async (name, cover, mediaIds) => {
            await createPlaylist(name, cover, mediaIds)
            setPlaylistModal(null)
          }}
          onDeleteItem={deleteFromPlaylist}
          onToggleOption={async (plId, field, value) => {
            await togglePlaylistOption(plId, field, value)
            // Refresh modal with updated playlist
            const updated = playlists.find(p => p.id === plId)
            if (updated) setPlaylistModal(prev => ({ ...prev, playlist: { ...updated, [field]: value } }))
          }}
          onAddItem={async (plId, mediaId) => {
            const updated = await addItemToPlaylist(plId, mediaId)
            setPlaylistModal(prev => ({ ...prev, playlist: updated }))
          }}
          onDelete={async (plId) => {
            await deletePlaylist(plId)
            setPlaylistModal(null)
          }}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  )
}