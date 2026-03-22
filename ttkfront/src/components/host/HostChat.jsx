import { useRef, useEffect } from 'react'
import { MsgStatus } from './HostWidgets'

export function HostChat({ messages, changeStatus }) {
  const chatEndRef = useRef(null)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{
      background: '#1a1a1a', borderRadius: 16,
      border: '1px solid #2a2a2a',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #2a2a2a',
        fontSize: 13, fontWeight: 600, letterSpacing: 1, color: '#ccc',
      }}>
        ЧАТ ЭФИРА
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        maxHeight: 320,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 40 }}>
            Сообщений пока нет
          </div>
        )}
        {[...messages].reverse().map(msg => (
          <div key={msg.id} style={{
            background: '#222', borderRadius: 10, padding: '8px 12px',
            borderLeft: `3px solid ${
              msg.status === 'new' ? '#e53935'
              : msg.status === 'in_progress' ? '#fb8c00'
              : '#43a047'
            }`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#e53935' }}>
                {msg.author_login || 'Слушатель'}
              </span>
              <span style={{ fontSize: 11, color: '#555' }}>
                {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#ddd', marginBottom: 8 }}>{msg.text}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {msg.status === 'new' && (
                <button onClick={() => changeStatus(msg.id, 'in_progress')} style={{
                  background: 'rgba(251,140,0,0.15)', border: '1px solid #fb8c00',
                  color: '#fb8c00', borderRadius: 6, padding: '2px 10px',
                  fontSize: 11, cursor: 'pointer',
                }}>В работу</button>
              )}
              {msg.status === 'in_progress' && (
                <button onClick={() => changeStatus(msg.id, 'done')} style={{
                  background: 'rgba(67,160,71,0.15)', border: '1px solid #43a047',
                  color: '#43a047', borderRadius: 6, padding: '2px 10px',
                  fontSize: 11, cursor: 'pointer',
                }}>Завершить</button>
              )}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <MsgStatus status={msg.status} />
              </span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  )
}