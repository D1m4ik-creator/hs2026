function normalizeHttpOrigin(value, fallback) {
  const rawValue = String(value || fallback).trim().replace(/\/+$/, '')
  return rawValue.replace(/\/(api|media)$/i, '')
}

function normalizeWsOrigin(value, httpOrigin) {
  const rawValue = String(value || httpOrigin.replace(/^http/i, 'ws')).trim().replace(/\/+$/, '')
  return rawValue.replace(/\/ws$/i, '')
}

export const API_ORIGIN = normalizeHttpOrigin(
  import.meta.env.VITE_API_BASE_URL,
  'http://127.0.0.1:8000',
)

export const API_BASE = `${API_ORIGIN}/api`

export const WS_ORIGIN = normalizeWsOrigin(
  import.meta.env.VITE_WS_BASE_URL,
  API_ORIGIN,
)
