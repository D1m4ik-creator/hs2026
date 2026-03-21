import { apiRequest } from './api.js'

export function fetchListenerBroadcast() {
  return apiRequest('/listener/broadcast/')
}

export function fetchListenerPlaylists() {
  return apiRequest('/listener/playlists/')
}

export function fetchListenerPlaylist(id) {
  return apiRequest(`/listener/playlists/${id}/`)
}

export function fetchListenerMessages() {
  return apiRequest('/listener/messages/')
}

export function sendListenerMessage(text) {
  return apiRequest('/listener/messages/send/', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}
