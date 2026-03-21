import { API_ORIGIN } from '../config.js'

export function normalizePath(path) {
  const prepared = String(path || '/').replace(/\/+$/, '')
  const withSlash = prepared.startsWith('/') ? prepared : `/${prepared}`
  return withSlash || '/'
}

export function formatDuration(seconds) {
  const totalSeconds = Number(seconds)

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '—'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const restSeconds = Math.round(totalSeconds % 60)
  return `${minutes}:${String(restSeconds).padStart(2, '0')}`
}

export function formatClock(value) {
  if (!value) {
    return '—:—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—:—'
  }

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes) {
  const size = Number(bytes)

  if (!Number.isFinite(size) || size <= 0) {
    return ''
  }

  return `${(size / 1024 / 1024).toFixed(1)} МБ`
}

export function joinMediaUrl(path) {
  if (!path) {
    return ''
  }

  if (/^(https?:|wss?:)/.test(path)) {
    return path
  }

  const baseOrigin = API_ORIGIN.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (baseOrigin.endsWith('/media') && normalizedPath.startsWith('/media/')) {
    return `${baseOrigin}${normalizedPath.slice('/media'.length)}`
  }

  if (baseOrigin.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${baseOrigin}${normalizedPath.slice('/api'.length)}`
  }

  return `${baseOrigin}${normalizedPath}`
}

export function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'ТВ'
}
