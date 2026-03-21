import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE, WS_ORIGIN } from '../config'

const WS_MESSAGES_URL = `${WS_ORIGIN}/ws/messages/`

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('access') || localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw await res.json().catch(() => ({ detail: res.statusText }))
  if (res.status === 204) return null
  return res.json()
}

/**
 * Manages listener messages:
 * - loads history via GET /api/listener/messages/
 * - sends via POST /api/listener/messages/send/
 * - receives status updates via ws/messages/
 */
export function useListenerMessages() {
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)

  const wsRef = useRef(null)
  const shouldReconnectRef = useRef(true)
  const reconnectTimerRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/listener/messages/')
      setMessages(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load messages', e)
    }
  }, [])

  const connectWS = useCallback(function connectWS() {
    const token = localStorage.getItem('access') || localStorage.getItem('token')
    const url = `${WS_MESSAGES_URL}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    const ws = new WebSocket(url)

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        // Status update for own message
        if (data.type === 'message_status_update') {
          setMessages(prev =>
            prev.map(m => m.id === data.message_id ? { ...m, status: data.status } : m)
          )
        }
        // New message echo
        if (data.type === 'new_message' && data.message?.id) {
          setMessages(prev =>
            prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message]
          )
        }
      } catch (_) { /* noop */ }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (shouldReconnectRef.current) {
        reconnectTimerRef.current = setTimeout(connectWS, 3000)
      }
    }

    ws.onerror = () => ws.close()
    wsRef.current = ws
  }, [])

  useEffect(() => {
    shouldReconnectRef.current = true
    void load()
    connectWS()
    return () => {
      shouldReconnectRef.current = false
      clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [load, connectWS])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || sending) return false
    setSending(true)
    try {
      const msg = await apiFetch('/listener/messages/send/', {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() }),
      })
      if (msg?.id) setMessages(prev =>
        prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
      )
      return true
    } catch (e) {
      console.error('Failed to send message', e)
      return false
    } finally {
      setSending(false)
    }
  }, [sending])

  return { messages, sending, sendMessage }
}