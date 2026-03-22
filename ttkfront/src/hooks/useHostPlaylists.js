import { useState, useCallback } from 'react'
import { api } from '../api/hostApi'

export function useHostPlaylists() {
  const [playlists, setPlaylists]       = useState([])
  const [mediaLibrary, setMediaLibrary] = useState([])

  const loadPlaylists = useCallback(async () => {
    try { setPlaylists(await api('/playlists/')) }
    catch (e) { console.error('Failed to load playlists', e) }
  }, [])

  const loadMedia = useCallback(async () => {
    try { setMediaLibrary(await api('/media/')) }
    catch (e) { console.error('Failed to load media', e) }
  }, [])

  // ── Media ─────────────────────────────────────────────
  const handleFileUpload = async (file) => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^.]+$/, ''))
    fd.append('media_type', 'audio')
    try {
      const media = await api('/media/upload/', { method: 'POST', body: fd })
      setMediaLibrary(prev => [media, ...prev])
    } catch (e) { alert('Ошибка загрузки: ' + JSON.stringify(e)) }
  }

  const deleteMedia = async (id) => {
    try {
      await api(`/media/${id}/delete/`, { method: 'DELETE' })
      setMediaLibrary(prev => prev.filter(m => m.id !== id))
    } catch (e) { console.error(e) }
  }

  // ── Playlists ─────────────────────────────────────────
  const createPlaylist = async (name, _coverFile, mediaIds) => {
    try {
      const pl = await api('/playlists/', {
        method: 'POST',
        body: JSON.stringify({ name, is_loop: false, is_shuffle: false }),
      })
      for (const id of mediaIds) {
        await api(`/playlists/${pl.id}/items/`, {
          method: 'POST',
          body: JSON.stringify({ media_id: id }),
        })
      }
      await loadPlaylists()
      return true
    } catch (e) {
      alert('Ошибка: ' + JSON.stringify(e))
      return false
    }
  }

  const deleteFromPlaylist = async (playlistId, itemId) => {
    try {
      await api(`/playlists/${playlistId}/items/${itemId}/`, { method: 'DELETE' })
      await loadPlaylists()
    } catch (e) { console.error(e) }
  }

  const togglePlaylistOption = async (playlistId, field, value) => {
    try {
      await api(`/playlists/${playlistId}/`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: value }),
      })
      await loadPlaylists()
    } catch (e) { console.error(e) }
  }

  const deletePlaylist = async (id) => {
    try {
      await api(`/playlists/${id}/`, { method: 'DELETE' })
      await loadPlaylists()
    } catch (e) { console.error(e) }
  }

  const addItemToPlaylist = async (plId, mediaId) => {
    await api(`/playlists/${plId}/items/`, {
      method: 'POST',
      body: JSON.stringify({ media_id: mediaId }),
    })
    await loadPlaylists()
    return api(`/playlists/${plId}/`)
  }

  return {
    playlists, mediaLibrary,
    loadPlaylists, loadMedia,
    handleFileUpload, deleteMedia,
    createPlaylist, deleteFromPlaylist,
    togglePlaylistOption, deletePlaylist, addItemToPlaylist,
  }
}