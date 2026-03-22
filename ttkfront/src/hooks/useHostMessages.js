import { useState, useRef, useCallback, useEffect } from 'react'
import { WS_ORIGIN } from '../config'
import { api } from '../api/hostApi'

const WS_MESSAGES_URL = `${WS_ORIGIN}/ws/messages`

export function useHostMessages() {
  const [messages, setMessages] = useState([])
  const wsRef             = useRef(null)
  const reconnectTimer    = useRef(null)
  const shouldReconnect   = useRef(true)

  const loadMessages = useCallback(async () => {
    try { setMessages(await api('/messages/')) }
    catch (e) { console.error('Failed to load messages', e) }
  }, [])

  const connectWS = useCallback(function connectWS() {
    const token = localStorage.getItem('access')
    const url = `${WS_MESSAGES_URL.replace(/\/+$/, '')}/?token=${encodeURIComponent(token || '')}`
    const ws = new WebSocket(url)
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message') {
          setMessages(prev => [data.message, ...prev])
        }
      } catch (_) {}
    }
    ws.onclose = () => {
      if (shouldReconnect.current) {
        reconnectTimer.current = setTimeout(connectWS, 3000)
      }
    }
    wsRef.current = ws
  }, [])

  useEffect(() => {
    shouldReconnect.current = true
    connectWS()
    return () => {
      shouldReconnect.current = false
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connectWS])

  const changeStatus = async (id, newStatus) => {
    try {
      const updated = await api(`/messages/${id}/status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setMessages(prev => prev.map(m => m.id === id ? updated : m))
    } catch (e) { console.error(e) }
  }

  return { messages, loadMessages, changeStatus }
}