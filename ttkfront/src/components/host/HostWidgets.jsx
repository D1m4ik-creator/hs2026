import { Icon } from './Icon'

// ── Message status indicator ──────────────────────────────
export const MsgStatus = ({ status }) => {
  if (status === 'new')
    return <span style={{ color: '#888', fontSize: 12 }}><Icon name="check" size={14} /></span>
  if (status === 'in_progress')
    return <span style={{ color: '#e53935', fontSize: 12 }}><Icon name="dblcheck" size={14} /></span>
  return <span style={{ color: '#43a047', fontSize: 12 }}><Icon name="dblcheck" size={14} /></span>
}

// ── Vinyl disc player ─────────────────────────────────────
export const VinylPlayer = ({ isPlaying, onToggle }) => (
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
        background: '#1a1a1a', border: '2px solid #444',
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

// ── Autoplay blocked banner ───────────────────────────────
export const AutoplayBanner = ({ onResume }) => (
  <div style={{
    marginBottom: 16,
    background: 'rgba(229,57,53,0.12)',
    border: '1px solid #e53935',
    borderRadius: 10,
    padding: '14px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={18} height={18} viewBox="0 0 24 24" style={{ color: '#e53935', flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
      </svg>
      <span style={{ fontSize: 13, color: '#ddd' }}>
        Браузер заблокировал автовоспроизведение после обновления страницы
      </span>
    </div>
    <button onClick={onResume} style={{
      background: '#e53935', border: 'none', color: '#fff',
      borderRadius: 7, padding: '8px 20px', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <svg width={14} height={14} viewBox="0 0 24 24">
        <polygon points="5,3 19,12 5,21" fill="currentColor"/>
      </svg>
      Возобновить эфир
    </button>
  </div>
)