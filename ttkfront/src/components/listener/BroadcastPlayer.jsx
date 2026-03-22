import { API_ORIGIN } from '../../config'

const resolveUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

function VinylDisc({ isPlaying, onToggle }) {
  return (
    <div style={{ position: 'relative', width: 290, height: 290, flexShrink: 0 }}>
      {/* Disc */}
      <div style={{
        width: 290, height: 290, borderRadius: '50%',
        background: `radial-gradient(circle at 50% 50%,
          #1c1c1c 0%, #0f0f0f 15%,
          #1a1a1a 16%, #0a0a0a 17%,
          #151515 30%, #0d0d0d 31%,
          #1a1a1a 45%, #0a0a0a 46%,
          #151515 60%, #0d0d0d 61%,
          #111 75%, #080808 76%,
          #141414 100%)`,
        boxShadow: '0 20px 80px rgba(0,0,0,0.95)',
        animation: isPlaying ? 'vinylSpin 3s linear infinite' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Grooves */}
        {[42, 58, 74, 90, 108, 124].map(r => (
          <div key={r} style={{
            position: 'absolute',
            width: r * 2, height: r * 2, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.018)',
            pointerEvents: 'none',
          }} />
        ))}
        {/* Center */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'radial-gradient(circle, #252525 0%, #1a1a1a 50%, #111 100%)',
          border: '2px solid #303030',
          zIndex: 1, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0a0a0a', border: '1px solid #383838' }} />
        </div>
      </div>

      {/* White play/pause button */}
      <button onClick={onToggle} style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 86, height: 86, borderRadius: '50%',
        background: '#fff', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 10, transition: 'transform 0.12s',
      }}
        onMouseDown={e => e.currentTarget.style.transform = 'translate(-50%,-50%) scale(0.94)'}
        onMouseUp={e => e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1)'}
      >
        {isPlaying
          ? <svg width={28} height={28} viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="#111"/><rect x="14" y="4" width="4" height="16" fill="#111"/></svg>
          : <svg width={28} height={28} viewBox="0 0 24 24" style={{ marginLeft: 4 }}><polygon points="5,3 19,12 5,21" fill="#111"/></svg>
        }
      </button>
    </div>
  )
}

export default function BroadcastPlayer({ broadcast, onVolume, onToggle }) {
  const host = broadcast?.host || {}

  return (
    <div style={{
      position: 'relative', borderRadius: 8, overflow: 'hidden',
      background: 'linear-gradient(140deg, #4a1208 0%, #2a0a06 25%, #180808 55%, #0d0d0d 100%)',
      minHeight: 350,
      display: 'flex', alignItems: 'center',
      padding: '32px 44px',
      gap: 0,
    }}>
      {/* Red radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 65% 40%, rgba(160,35,15,0.2) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Left: host info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, zIndex: 2, minWidth: 160 }}>
        {/* Avatar */}
        <div style={{
          width: 84, height: 84, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          border: '3px solid rgba(255,255,255,0.15)',
          background: '#1a1a1a', marginBottom: 14,
        }}>
          {host.avatar
            ? <img src={resolveUrl(host.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🎙</div>
          }
        </div>

        <div style={{ fontFamily: 'Bebas Neue Cyrillic', fontSize: 16, letterSpacing: 3, color: '#fff', marginBottom: 4 }}>
          ВЕДУЩИЙ
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#E52813', letterSpacing: 0.4, marginBottom: 2 }}>
          @{host.login || '—'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
          {host.full_name || ''}
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={15} height={15} viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <div style={{ position: 'relative', width: 108, height: 3 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${(broadcast?.volume ?? 1) * 100}%`,
              background: 'rgba(255,255,255,0.85)', borderRadius: 2,
            }} />
            <input type="range" min="0" max="1" step="0.01"
              value={broadcast?.volume ?? 1}
              onChange={e => onVolume?.(parseFloat(e.target.value))}
              style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', margin: 0, height: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Right: vinyl */}
      <div style={{ marginLeft: 'auto', zIndex: 2 }}>
        <VinylDisc isPlaying={!!broadcast?.is_active} onToggle={onToggle} />
      </div>
    </div>
  )
}