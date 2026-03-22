import { Icon } from './Icon'

export function PlaylistsTab({ playlists, onOpen, onCreateNew }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
          МОИ ПЛЕЙЛИСТЫ
        </h2>
        <button onClick={onCreateNew} style={{
          background: '#e53935', border: 'none', color: '#fff',
          borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
        }}>
          <Icon name="plus" size={16} /> Создать
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {playlists.map(pl => (
          <div key={pl.id} onClick={() => onOpen(pl)} style={{
            background: '#1a1a1a', borderRadius: 16, overflow: 'hidden',
            border: '1px solid #2a2a2a', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}>
            <div style={{
              height: 140,
              background: 'linear-gradient(135deg, #2a1a1a, #1a1a2a)',
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

        <div onClick={onCreateNew} style={{
          background: '#1a1a1a', borderRadius: 16, border: '2px dashed #2a2a2a',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 220, cursor: 'pointer', color: '#555', gap: 8,
        }}>
          <Icon name="plus" size={32} />
          <span style={{ fontSize: 13 }}>Новый плейлист</span>
        </div>
      </div>
    </div>
  )
}