import { useEffect, useRef, useCallback } from 'react'
import { WS_ORIGIN } from '../config'

const WS_URL = `${WS_ORIGIN}/ws/broadcast/`

/**
 * Connects to ws/broadcast/, dispatches broadcast_update events,
 * exposes sendAction() for host controls.
 *
 * onUpdate(data) — called on every broadcast_update from server:
 *   { type, media_url, offset, is_active, queue_len, current_queue_item_id }
 */
export function useBroadcastWS({ onUpdate, enabled = true }) {
  const wsRef = useRef(null)
  const shouldReconnectRef = useRef(true)
  const reconnectTimerRef = useRef(null)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  const connect = useCallback(() => {
    if (!enabled) return
    const token = localStorage.getItem('access') || localStorage.getItem('token')
    const url = `${WS_URL}${token ? `?token=${encodeURIComponent(token)}` : ''}`

    const ws = new WebSocket(url)

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'broadcast_update') {
          onUpdateRef.current?.(data)
        }
      } catch (_) { /* noop */ }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (shouldReconnectRef.current) {
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }
    }

    ws.onerror = () => ws.close()

    wsRef.current = ws
  }, [enabled])

  useEffect(() => {
    shouldReconnectRef.current = true
    connect()
    return () => {
      shouldReconnectRef.current = false
      clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendAction = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { sendAction }
}
