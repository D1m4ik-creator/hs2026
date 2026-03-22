import { useState, useRef } from 'react'
import { Icon } from './Icon'

export function PlaylistModal({
  mode, playlist, mediaLibrary,
  onClose, onCreate, onDeleteItem,
  onToggleOption, onAddItem, onDelete, onFileUpload,
}) {
  const [name, setName]     = useState(playlist?.name || '')
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

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
        {/* Header */}
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
          {/* Name input */}
          <div style={{ marginBottom: 20 }}>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Введите название..."
              style={{
                width: '100%', background: '#222', border: '1px solid #333',
                borderRadius: 10, padding: '10px 16px', color: '#f0f0f0',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Options (edit only) */}
          {mode === 'edit' && playlist && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[['is_shuffle', 'shuffle', 'Shuffle'], ['is_loop', 'loop', 'Повтор']].map(([field, icon, label]) => (
                <button key={field}
                  onClick={() => onToggleOption(playlist.id, field, !playlist[field])}
                  style={{
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

          {/* Existing tracks (edit) */}
          {mode === 'edit' && playlist?.items?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Треки
              </div>
              {playlist.items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, background: '#222', marginBottom: 4,
                }}>
                  <span style={{ fontSize: 12, color: '#555', width: 20, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ color: '#e53935' }}><Icon name="music" size={14} /></span>
                  <span style={{ flex: 1, fontSize: 13 }}>{item.media?.name}</span>
                  <button onClick={() => onDeleteItem(playlist.id, item.id)}
                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Media library picker */}
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
              }}>
                Медиатека пуста — загрузите треки
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                {mediaLibrary.map(m => {
                  const inPlaylist = mode === 'edit' && playlist?.items?.some(i => i.media?.id === m.id)
                  const isSelected = selected.includes(m.id)
                  return (
                    <div key={m.id} onClick={() => {
                      if (inPlaylist) return
                      if (mode === 'edit') onAddItem(playlist.id, m.id)
                      else toggleSelect(m.id)
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8,
                      cursor: inPlaylist ? 'default' : 'pointer',
                      background: isSelected ? 'rgba(229,57,53,0.1)' : '#222',
                      border: `1px solid ${isSelected ? '#e53935' : 'transparent'}`,
                      opacity: inPlaylist ? 0.4 : 1,
                    }}>
                      <span style={{ color: isSelected ? '#e53935' : '#555' }}>
                        <Icon name="music" size={14} />
                      </span>
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

        {/* Footer (create mode) */}
        {mode === 'create' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, background: '#222', border: '1px solid #333',
              color: '#888', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 14,
            }}>Отмена</button>
            <button onClick={handleCreate} disabled={saving || !name.trim()} style={{
              flex: 2,
              background: name.trim() ? '#e53935' : '#333',
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