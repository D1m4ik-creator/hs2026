import { WS_ORIGIN } from '../config.js'
import { apiRequest } from './api.js'
import { getAccessToken } from './storage.js'

export function fetchBroadcast() {
  return apiRequest('/broadcast/')
}

export function updateBroadcast(payload) {
  return apiRequest('/broadcast/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function fetchHostMessages() {
  return apiRequest('/messages/')
}

export function updateHostMessageStatus(id, status) {
  return apiRequest(`/messages/${id}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function fetchPlaylists() {
  return apiRequest('/playlists/')
}

export function fetchPlaylist(id) {
  return apiRequest(`/playlists/${id}/`)
}

export function createPlaylist(name) {
  return apiRequest('/playlists/', {
    method: 'POST',
    body: JSON.stringify({
      name,
      is_loop: false,
      is_shuffle: false,
    }),
  })
}

export function updatePlaylist(id, payload) {
  return apiRequest(`/playlists/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePlaylist(id) {
  return apiRequest(`/playlists/${id}/`, { method: 'DELETE' })
}

export function addPlaylistItem(playlistId, mediaId) {
  return apiRequest(`/playlists/${playlistId}/items/`, {
    method: 'POST',
    body: JSON.stringify({ media_id: mediaId }),
  })
}

export function removePlaylistItem(playlistId, itemId) {
  return apiRequest(`/playlists/${playlistId}/items/${itemId}/`, {
    method: 'DELETE',
  })
}

export function fetchMediaLibrary() {
  return apiRequest('/media/')
}

export function uploadMediaFile(file) {
  const body = new FormData()
  body.append('file', file)
  body.append('name', file.name.replace(/\.[^.]+$/, ''))
  body.append('media_type', 'audio')

  return apiRequest('/media/upload/', {
    method: 'POST',
    body,
  })
}

export function deleteMediaItem(id) {
  return apiRequest(`/media/${id}/delete/`, { method: 'DELETE' })
}

export function createMessagesSocketUrl() {
  const token = getAccessToken()
  const baseUrl = `${WS_ORIGIN.replace(/\/+$/, '')}/ws/messages/`
  return `${baseUrl}?token=${encodeURIComponent(token)}`
}
