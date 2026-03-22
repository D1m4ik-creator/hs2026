import { useEffect, useRef } from 'react'
import { API_ORIGIN } from '../../config'

const resolveUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

// ── Vinyl disc ────────────────────────────────────────────
function VinylDisc({ isPlaying }) {
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: -20, borderRadius: '50%',
        background: isPlaying
          ? 'radial-gradient(circle, rgba(229,40,19,0.18) 0%, transparent 70%)'
          : 'transparent',
        transition: 'background 1.2s ease',
        pointerEvents: 'none',
      }} />

      {/* Disc body */}
      <div style={{
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, #252525 0%, #111 45%, #080808 100%)',
        boxShadow: isPlaying
          ? '0 0 48px rgba(229,40,19,0.25), 0 12px 48px rgba(0,0,0,0.9)'
          : '0 8px 32px rgba(0,0,0,0.7)',
        animation: isPlaying ? 'vinylSpin 3.2s linear infinite' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #2a2a2a',
        position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 0.8s ease',
      }}>
        {/* Grooves */}
        {[50, 65, 80, 95].map(r => (
          <div key={r} style={{
            position: 'absolute',
            width: r * 2, height: r * 2, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.03)',
            pointerEvents: 'none',
          }} />
        ))}

        {/* Center label */}
        <div style={{
          width: 62, height: 62, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1c1c1c, #262626)',
          border: '2px solid #383838',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1, flexShrink: 0,
        }}>
          <div style={{
            width: 13, height: 13, borderRadius: '50%',
            background: isPlaying ? '#E52813' : '#2a2a2a',
            boxShadow: isPlaying ? '0 0 12px rgba(229,40,19,0.9)' : 'none',
            transition: 'all 0.5s ease',
          }} />
        </div>
      </div>

      {/* Tonearm */}
      <div style={{
        position: 'absolute', top: 8, right: -6,
        width: 2, height: 84,
        background: 'linear-gradient(to bottom, #777, #3a3a3a)',
        transformOrigin: 'top center',
        transform: `rotate(${isPlaying ? 28 : 10}deg)`,
        borderRadius: 2,
        transition: 'transform 1s ease',
      }}>
        <div style={{
          position: 'absolute', bottom: -4, left: -2,
          width: 6, height: 6, borderRadius: '50%',
          background: isPlaying ? '#E52813' : '#444',
          boxShadow: isPlaying ? '0 0 8px rgba(229,40,19,0.9)' : 'none',
          transition: 'all 0.5s ease',
        }} />
      </div>
    </div>
  )
}

// ── Sound wave ────────────────────────────────────────────
function SoundWave({ active }) {
  const heights = [0.35, 0.65, 1, 0.55, 0.85, 0.45, 0.75, 0.5, 0.8, 0.4]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: '#E52813',
          height: active ? `${h * 100}%` : '15%',
          animation: active ? `wave ${0.55 + i * 0.07}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.055}s`,
          transition: 'height 0.6s ease',
          opacity: active ? 1 : 0.25,
        }} />
      ))}
    </div>
  )
}

/**
 * BroadcastPlayer
 *
 * Props:
 *   broadcast  — { is_active, media_url, offset, host, volume }
 *   audioRef   — ref to <audio> element (managed by parent)
 *   onVolume   — (value: number) => void
 */
export default function BroadcastPlayer({ broadcast, audioRef, onVolume }) {
  const host = broadcast?.host || {}

  return (
    <div style={{
      background: 'linear-gradient(160deg, #1c1414 0%, #141414 60%, #101010 100%)',
      borderRadius: 20, border: '1px solid #1e1e1e',
      padding: '28px 28px 24px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Host row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#1e1e1e', overflow: 'hidden',
            border: `2px solid ${broadcast?.is_active ? '#E52813' : '#2a2a2a'}`,
            transition: 'border-color 0.5s',
          }}>
            {host.avatar
              ? <img src={resolveUrl(host.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎙</div>
            }
          </div>
          {broadcast?.is_active && (
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: '50%',
              background: '#E52813', border: '2px solid #1c1414',
              animation: 'dotPulse 1.4s ease-in-out infinite',
            }} />
          )}
        </div>

        <div>
          <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
            ВЕДУЩИЙ
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#eee' }}>
            {host.full_name || 'Ведущий'}
          </div>
          <div style={{ fontSize: 12, color: '#E52813' }}>@{host.login || '—'}</div>
          {broadcast?.current_track_name && (
            <div style={{
              fontSize: 11, color: '#555', marginTop: 3,
              maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {broadcast.current_track_name}
            </div>
          )}
        </div>
      </div>

      {/* Vinyl */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <VinylDisc isPlaying={!!broadcast?.is_active} />
      </div>

      {/* Track name + wave */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {broadcast?.is_active ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <SoundWave active />
            <div style={{
              fontFamily: 'Bebas Neue Cyrillic', fontSize: 13,
              letterSpacing: 2, color: '#666',
            }}>
              ПРЯМОЙ ЭФИР
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: 'Bebas Neue Cyrillic', fontSize: 13, letterSpacing: 2, color: '#333' }}>
            ЭФИР НЕ ИДЁТ
          </div>
        )}
      </div>

      {/* Volume */}
      <VolumeSlider value={broadcast?.volume ?? 1} onChange={onVolume} />
    </div>
  )
}

function VolumeSlider({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={14} height={14} viewBox="0 0 24 24" style={{ flexShrink: 0, color: '#555' }}>
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>

      <div style={{ flex: 1, position: 'relative', height: 3, cursor: 'pointer' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#1e1e1e', borderRadius: 2 }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${value * 100}%`,
          background: 'linear-gradient(to right, #b01e10, #E52813)',
          borderRadius: 2,
        }} />
        <input type="range" min="0" max="1" step="0.01" value={value}
          onChange={e => onChange?.(parseFloat(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%',
            opacity: 0, cursor: 'pointer', margin: 0, height: '100%',
          }}
        />
      </div>

      <span style={{ fontSize: 10, color: '#444', minWidth: 28, textAlign: 'right' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}
