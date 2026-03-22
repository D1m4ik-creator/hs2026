import { useEffect, useRef, useCallback } from 'react'
import { WS_ORIGIN, API_BASE } from '../config'

const WS_URL = `${WS_ORIGIN}/ws/broadcast/`
const POLL_INTERVAL = 2000

// Normalise REST or WS payload → unified shape
function normalise(data) {
  const mediaUrl = data.stream_url ?? data.media_url ?? null
  const isActive = data.is_active ?? false
  return {
    type: 'broadcast_update',
    is_active: isActive,
    media_url: mediaUrl,
    offset: data.offset ?? 0,
    volume: data.volume ?? null,
    host: data.host_login ?? data.host ?? null,
    current_track: data.current_track ?? data.current_queue_item_id ?? null,
    queue_len: data.queue_len ?? 0,
  }
}

export function useBroadcastWS({ onUpdate, enabled = true }) {
  const wsRef            = useRef(null)
  const shouldReconnect  = useRef(true)
  const reconnectTimer   = useRef(null)
  const pollTimer        = useRef(null)
  const retryCount       = useRef(0)
  const lastKey          = useRef(null)
  const onUpdateRef      = useRef(onUpdate)

  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  const emit = useCallback((raw) => {
    const payload = normalise(raw)
    const key = `${payload.is_active}|${payload.media_url}`
    if (lastKey.current === key) return   // skip duplicate state
    lastKey.current = key
    onUpdateRef.current?.(payload)
  }, [])

  const fetchState = useCallback(async (signal) => {
    try {
      const token = localStorage.getItem('access') || localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/listener/broadcast/`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      if (!res.ok) return
      emit(await res.json())
    } catch (e) {
      if (e?.name !== 'AbortError') console.warn('broadcast poll', e)
    }
  }, [emit])

  // ── Polling fallback ──────────────────────────────────────
  const startPolling = useCallback(() => {
    let ctrl = null
    pollTimer.current = setInterval(() => {
      ctrl?.abort()
      ctrl = new AbortController()
      void fetchState(ctrl.signal)
    }, POLL_INTERVAL)
    return () => { clearInterval(pollTimer.current); ctrl?.abort() }
  }, [fetchState])

  // ── WebSocket ─────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!enabled) return
    if (wsRef.current?.readyState <= WebSocket.OPEN) return

    const token = localStorage.getItem('access') || localStorage.getItem('token')
    const ws = new WebSocket(
      `${WS_URL}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    )

    ws.onopen    = () => { retryCount.current = 0; void fetchState() }
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'broadcast_update') emit(data)
      } catch (_) {}
    }
    ws.onclose   = () => {
      wsRef.current = null
      if (!shouldReconnect.current) return
      const delay = Math.min(500 * 2 ** retryCount.current, 4000)
      retryCount.current++
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = setTimeout(connect, delay)
    }
    ws.onerror   = () => ws.close()
    wsRef.current = ws
  }, [enabled, fetchState, emit])

  useEffect(() => {
    if (!enabled) return
    shouldReconnect.current = true
    retryCount.current = 0
    connect()
    const stop = startPolling()
    return () => {
      shouldReconnect.current = false
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      stop()
    }
  }, [connect, startPolling, enabled])

  const sendAction = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { sendAction }
}