import { useState, useRef, useEffect } from 'react'

const STATUS_COLORS = {
  new: '#555',
  in_progress: '#f59e0b',
  done: '#22c55e',
}

const STATUS_LABELS = {
  new: '•',
  in_progress: '▶',
  done: '✓',
}

/**
 * Chat component for listeners.
 *
 * Props:
 *   messages    — array of message objects
 *   sending     — bool
 *   onSend      — async (text: string) => bool
 *   isActive    — bool, whether broadcast is live
 *   currentUser — { login }
 */
export default function Chat({ messages, sending, onSend, isActive, currentUser }) {
  const [text, setText] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const ok = await onSend(text)
    if (ok) setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div style={{
      background: '#111',
      borderRadius: 20,
      border: '1px solid #1a1a1a',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: isActive ? '#E52813' : '#2a2a2a',
          animation: isActive ? 'dotPulse 1.4s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'Bebas Neue Cyrillic',
          fontSize: 15, letterSpacing: 2, color: '#bbb',
        }}>
          ЧАТ ЭФИРА
        </span>
        {messages.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 10, color: '#444',
            background: '#1a1a1a', padding: '2px 7px', borderRadius: 8,
          }}>
            {messages.length}
          </span>
        )}
      </div>

      {/* Messages list */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
        minHeight: 0,
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#2a2a2a', gap: 10, paddingTop: 32,
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" style={{ color: '#2a2a2a' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            <span style={{ fontSize: 12 }}>Напишите первым!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.author_login === currentUser?.login
            const status = msg.status || 'new'
            return (
              <div key={msg.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                animation: 'msgIn 0.2s ease forwards',
              }}>
                <div style={{
                  maxWidth: '86%',
                  background: isOwn ? 'rgba(229,40,19,0.1)' : '#191919',
                  border: `1px solid ${isOwn ? 'rgba(229,40,19,0.2)' : '#222'}`,
                  borderRadius: isOwn ? '14px 3px 14px 14px' : '3px 14px 14px 14px',
                  padding: '9px 13px',
                }}>
                  {!isOwn && (
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: '#E52813', marginBottom: 3, letterSpacing: 0.4,
                    }}>
                      {msg.author_login || 'Слушатель'}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: isOwn ? '#e8e8e8' : '#c0c0c0', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    gap: 5, marginTop: 4,
                  }}>
                    <span style={{ fontSize: 10, color: '#383838' }}>
                      {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && (
                      <span style={{
                        fontSize: 10,
                        color: STATUS_COLORS[status],
                        transition: 'color 0.3s',
                        title: status,
                      }}>
                        {STATUS_LABELS[status]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input row */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid #161616',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: '#181818', borderRadius: 14,
          border: '1px solid #222', padding: '6px 8px 6px 14px',
          transition: 'border-color 0.15s',
        }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isActive ? 'Написать в эфир...' : 'Эфир не идёт...'}
            disabled={!isActive}
            maxLength={500}
            style={{
              flex: 1, background: 'none', border: 'none,', color: '#e0e0e0',
              fontSize: 13, outline: 'none',
              opacity: isActive ? 1 : 0.35,
            }}
          />

          {/* Mic icon */}
          <button disabled={!isActive} style={{
            background: 'none', border: 'none', color: '#333',
            cursor: isActive ? 'pointer' : 'default', padding: '4px',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || !isActive}
            style={{
              width: 34, height: 34, borderRadius: 10, border: 'none',
              background: text.trim() && isActive ? '#E52813' : '#1e1e1e',
              color: text.trim() && isActive ? '#fff' : '#333',
              cursor: text.trim() && isActive ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" />
              <polygon points="22,2 15,22 11,13 2,9" fill="currentColor" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#2a2a2a', textAlign: 'right', marginTop: 4, paddingRight: 4 }}>
          Enter — отправить
        </div>
      </div>
    </div>
  )
}
