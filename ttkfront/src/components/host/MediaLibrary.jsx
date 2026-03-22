import { Icon } from './Icon'

export function MediaLibrary({ mediaLibrary, onUploadClick, onDelete }) {
  return (
    <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, border: '1px solid #2a2a2a' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
        МЕДИАТЕКА
      </h2>
      {mediaLibrary.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a', borderRadius: 12, padding: '32px',
          textAlign: 'center', cursor: 'pointer', color: '#555',
        }} onClick={onUploadClick}>
          <Icon name="upload" size={32} />
          <div style={{ marginTop: 8, fontSize: 13 }}>Нажмите чтобы загрузить аудио</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>MP3, WAV, OGG — до 50 МБ</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {mediaLibrary.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 12px', borderRadius: 8, background: '#222',
            }}>
              <span style={{ color: '#e53935' }}><Icon name="music" size={16} /></span>
              <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
              <span style={{ fontSize: 11, color: '#555' }}>
                {m.size ? `${(m.size / 1024 / 1024).toFixed(1)} МБ` : ''}
              </span>
              <button className="btn" style={{ color: '#555' }} onClick={() => onDelete(m.id)}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}