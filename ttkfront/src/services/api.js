import { API_BASE } from '../config.js'
import { getAccessToken } from './storage.js'

async function buildApiError(response) {
  let payload

  try {
    payload = await response.json()
  } catch {
    payload = { detail: response.statusText || 'Ошибка запроса' }
  }

  const message =
    typeof payload?.detail === 'string'
      ? payload.detail
      : typeof payload === 'string'
        ? payload
        : Object.values(payload || {})
            .flat()
            .join(' ') || `Ошибка запроса: ${response.status}`

  const error = new Error(message)
  error.status = response.status
  error.payload = payload
  return error
}

export async function apiRequest(path, options = {}) {
  const { auth = true, headers = {}, body, method = 'GET' } = options
  const requestHeaders = { ...headers }

  if (!(body instanceof FormData) && body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getAccessToken()

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body,
  })

  if (!response.ok) {
    throw await buildApiError(response)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}
