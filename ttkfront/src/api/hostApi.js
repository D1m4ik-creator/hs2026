import { API_BASE, API_ORIGIN } from '../config'

export const api = async (path, options = {}) => {
  const token = localStorage.getItem('access')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw await res.json()
  if (res.status === 204) return null
  return res.json()
}

export const resolveMediaUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const stripped = path.replace(/^\/+/, '').replace(/^media\//, '')
  return `${API_ORIGIN}/media/${stripped}`
}

export const toId = (v) => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return v?.id ?? null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export const extractMediaUrl = (media) => {
  if (!media) return ''
  const raw = media.file ?? media.url ?? media.stream_url
    ?? media.file_url ?? media.audio_url ?? null
  return raw ? resolveMediaUrl(raw) : ''
}