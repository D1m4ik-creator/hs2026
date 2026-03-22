import { useState, useRef, useEffect } from 'react'

function CheckIcon({ status }) {
  const color = status === 'done' ? '#4fc3f7' : 'rgba(255,255,255,0.4)'
  if (status === 'done') {
    return (
      <svg width={13} height={13} viewBox="0 0 24 24">
        <polyline points="17,6 9,17 5,13" stroke={color} strokeWidth="2.5" fill="none"/>
        <polyline points="22,6 14,17 11,14.5" stroke={color} strokeWidth="2.5" fill="none"/>
      </svg>
    )
  }
  return (
    <svg width={13} height={13} viewBox="0 0 24 24">
      <polyline points="20,6 9,17 4,12" stroke={color} strokeWidth="2.5" fill="none"/>
    </svg>
  )
}

export default function Chat({ messages, sending, onSend, isActive, currentUser }) {
  const [text, setText] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending || !isActive) return
    const ok = await onSend(text)
    if (ok) setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
  }

  return (
    <div style={{
      background: '#1c1c1c',
      borderRadius: 8,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 22px 12px',
        borderBottom: '1px solid #2a2a2a',
      }}>
        <span style={{
          fontFamily: 'Bebas Neue Cyrillic',
          fontSize: 18, letterSpacing: 3, color: '#ddd',
        }}>
          ЧАТ ЭФИРА
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 16px 8px',
        display: 'flex', flexDirection: 'column',
        gap: 8, minHeight: 0,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#383838', fontSize: 13, paddingTop: 40, textAlign: 'center',
          }}>
            Сообщений пока нет
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.author_login === currentUser?.login
          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <div style={{
                maxWidth: '82%',
                background: '#2e2e2e',
                borderRadius: '10px 10px 2px 10px',
                padding: '9px 13px 7px',
              }}>
                {!isOwn && (
                  <div style={{ fontSize: 11, color: '#E52813', fontWeight: 700, marginBottom: 3 }}>
                    {msg.author_login}
                  </div>
                )}
                <div style={{ fontSize: 14, color: '#e8e8e8', lineHeight: 1.45 }}>
                  {msg.text}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  gap: 4, marginTop: 4,
                }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isOwn && <CheckIcon status={msg.status} />}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderTop: '1px solid #252525',
        background: '#222',
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          disabled={!isActive}
          maxLength={500}
          style={{
            flex: 1, background: 'none', border: 'none',
            padding: '14px 16px',
            color: '#e0e0e0', fontSize: 13, outline: 'none',
            opacity: isActive ? 1 : 0.4,
          }}
        />
        {/* Mic */}
        <button disabled={!isActive} style={{
          background: 'none', border: 'none',
          padding: '0 12px',
          color: isActive ? 'rgba(255,255,255,0.35)' : '#2a2a2a',
          cursor: isActive ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center',
          transition: 'color 0.15s',
        }}>
          <svg width={17} height={17} viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || !isActive}
          style={{
            background: 'none', border: 'none',
            padding: '0 16px 0 8px',
            color: text.trim() && isActive ? '#E52813' : '#2a2a2a',
            cursor: text.trim() && isActive ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/>
            <polygon points="22,2 15,22 11,13 2,9" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  )
}