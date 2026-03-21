import {
  addPlaylistItem,
  createMessagesSocketUrl,
  createPlaylist,
  deleteMediaItem,
  deletePlaylist,
  fetchBroadcast,
  fetchMediaLibrary,
  fetchPlaylists,
  fetchHostMessages,
  removePlaylistItem,
  updateBroadcast,
  updateHostMessageStatus,
  updatePlaylist,
  uploadMediaFile,
} from '../services/host.js'
import { logoutUser } from '../services/auth.js'
import { getUser, hasHostAccess, isAuthenticated } from '../services/storage.js'
import { createElement, escapeHtml } from '../utils/dom.js'
import {
  formatClock,
  formatDuration,
  formatFileSize,
  getInitials,
  joinMediaUrl,
} from '../utils/format.js'
import { renderIcon } from '../utils/icons.js'

function getActivePlaylist(state) {
  return state.playlists.find((playlist) => playlist.id === Number(state.broadcast.current_playlist)) || null
}

function getCurrentTrackItem(state) {
  const activePlaylist = getActivePlaylist(state)
  return activePlaylist?.items?.find((item) => item.id === Number(state.broadcast.current_item)) || null
}

function getModalPlaylist(state) {
  if (!state.playlistModal || state.playlistModal.mode !== 'edit') {
    return null
  }

  return state.playlists.find((playlist) => playlist.id === Number(state.playlistModal.playlistId)) || null
}

function renderUserAvatar(user, className = '') {
  const classes = `user-avatar ${className}`.trim()

  if (user.avatar) {
    return `<img class="${classes}" src="${escapeHtml(joinMediaUrl(user.avatar))}" alt="">`
  }

  return `<span class="${classes}">${escapeHtml(getInitials(user.full_name || user.login))}</span>`
}

function renderMessageStatus(status) {
  if (status === 'done') {
    return `<span class="message-status is-done">${renderIcon('dblcheck', 14)}</span>`
  }

  if (status === 'in_progress') {
    return `<span class="message-status is-progress">${renderIcon('dblcheck', 14)}</span>`
  }

  return `<span class="message-status is-new">${renderIcon('check', 14)}</span>`
}

export function renderHostHeader(state) {
  return `
    <header class="host-header" data-block="host-header">
      <div class="brand-mark">ТТК<span>@</span>ВЕЩАЕТ</div>

      <nav class="host-nav">
        <button class="nav-pill ${state.tab === 'broadcast' ? 'is-active' : ''}" type="button" data-tab="broadcast">
          Мой эфир
        </button>
        <button class="nav-pill ${state.tab === 'playlists' ? 'is-active' : ''}" type="button" data-tab="playlists">
          Плейлисты
        </button>
      </nav>

      <div class="host-user">
        ${renderUserAvatar(state.user)}
        <div class="host-user-meta">
          <strong>${escapeHtml(state.user.full_name || 'Ведущий')}</strong>
          <span>@${escapeHtml(state.user.login || 'host')}</span>
        </div>
        <button class="ghost-icon-btn" type="button" data-action="logout">
          ${renderIcon('logout', 18)}
        </button>
      </div>
    </header>
  `
}

export function renderBroadcastSection(state) {
  const currentTrack = getCurrentTrackItem(state)

  return `
    <section class="panel panel-gradient" data-block="broadcast-panel">
      <div class="host-card-head">
        ${renderUserAvatar(state.user, 'user-avatar--xl')}
        <div>
          <p class="section-eyebrow">Ведущий</p>
          <h2>${escapeHtml(state.user.full_name || 'Без имени')}</h2>
          <p class="host-login">@${escapeHtml(state.user.login || 'host')}</p>
        </div>
      </div>

      <div class="vinyl-stage">
        <div class="vinyl ${state.broadcast.is_active ? 'is-spinning' : ''}">
          <div class="vinyl-core"></div>
          <button class="vinyl-toggle" type="button" data-action="toggle-broadcast">
            ${renderIcon(state.broadcast.is_active ? 'pause' : 'play', 20)}
          </button>
        </div>
      </div>

      <div class="listener-track-summary">
        <div>
          <p class="listener-stat-label">Текущий трек</p>
          <strong>${escapeHtml(currentTrack?.media?.name || 'Трек появится после запуска')}</strong>
        </div>
        <span class="status-chip ${state.broadcast.is_active ? 'is-live' : 'is-idle'}">
          ${state.broadcast.is_active ? '● В эфире' : '○ Не в эфире'}
        </span>
      </div>

      <label class="range-row">
        <span>${renderIcon('volume', 16)}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value="${state.broadcast.volume ?? 1}"
          data-action="set-volume"
        >
        <strong>${Math.round((state.broadcast.volume ?? 1) * 100)}%</strong>
      </label>
    </section>
  `
}

export function renderChatSection(state) {
  const messages = [...state.messages].reverse()

  return `
    <section class="panel" data-block="chat-panel">
      <div class="panel-title-row">
        <div>
          <p class="section-eyebrow">Чат эфира</p>
          <h2>Сообщения слушателей</h2>
        </div>
      </div>

      <div class="message-list">
        ${
          messages.length
            ? messages
                .map((message) => {
                  const statusAction =
                    message.status === 'new'
                      ? `
                        <button class="inline-action" type="button" data-action="change-status" data-message-id="${message.id}" data-next-status="in_progress">
                          В работу
                        </button>
                      `
                      : message.status === 'in_progress'
                        ? `
                          <button class="inline-action is-success" type="button" data-action="change-status" data-message-id="${message.id}" data-next-status="done">
                            Завершить
                          </button>
                        `
                        : ''

                  return `
                    <article class="message-card is-${message.status}">
                      <div class="message-head">
                        <strong>${escapeHtml(message.author_login || 'Слушатель')}</strong>
                        <span>${formatClock(message.created_at)}</span>
                      </div>
                      <p>${escapeHtml(message.text).replace(/\n/g, '<br>')}</p>
                      <div class="message-actions">
                        ${statusAction}
                        ${renderMessageStatus(message.status)}
                      </div>
                    </article>
                  `
                })
                .join('')
            : '<div class="empty-state">Сообщений пока нет. Новые сообщения появятся здесь автоматически.</div>'
        }
      </div>
    </section>
  `
}

export function renderStreamSection(state) {
  const activePlaylist = getActivePlaylist(state)

  if (!activePlaylist) {
    return `
      <section class="panel" data-block="stream-panel">
        <div class="panel-title-row">
          <div>
            <p class="section-eyebrow">Поток эфира</p>
            <h2>Выберите плейлист</h2>
          </div>
          <button class="ghost-icon-btn" type="button" data-action="trigger-upload" data-target-input="host-upload">
            ${renderIcon('upload', 18)}
          </button>
        </div>

        <div class="empty-state">
          <p>Плейлист пока не выбран. Выберите одну из доступных подборок ниже.</p>
          <div class="playlist-chip-row">
            ${state.playlists
              .map(
                (playlist) => `
                  <button
                    class="playlist-chip"
                    type="button"
                    data-action="set-broadcast-playlist"
                    data-playlist-id="${playlist.id}"
                  >
                    ${escapeHtml(playlist.name)}
                  </button>
                `,
              )
              .join('')}
          </div>
        </div>
      </section>
    `
  }

  const currentTrack = getCurrentTrackItem(state)

  return `
    <section class="panel" data-block="stream-panel">
      <div class="panel-title-row">
        <div>
          <p class="section-eyebrow">Поток эфира</p>
          <h2>${escapeHtml(activePlaylist.name)}</h2>
        </div>
        <div class="panel-toolbar">
          <button
            class="ghost-icon-btn ${activePlaylist.is_shuffle ? 'is-accent' : ''}"
            type="button"
            data-action="toggle-playlist-field"
            data-playlist-id="${activePlaylist.id}"
            data-field="is_shuffle"
            data-next-value="${String(!activePlaylist.is_shuffle)}"
          >
            ${renderIcon('shuffle', 16)}
          </button>
          <button
            class="ghost-icon-btn ${activePlaylist.is_loop ? 'is-accent' : ''}"
            type="button"
            data-action="toggle-playlist-field"
            data-playlist-id="${activePlaylist.id}"
            data-field="is_loop"
            data-next-value="${String(!activePlaylist.is_loop)}"
          >
            ${renderIcon('loop', 16)}
          </button>
          <button class="ghost-icon-btn" type="button" data-action="trigger-upload" data-target-input="host-upload">
            ${renderIcon('upload', 18)}
          </button>
        </div>
      </div>

      <div class="track-list">
        ${(activePlaylist.items || [])
          .map(
            (item, index) => `
              <div class="track-row ${currentTrack?.id === item.id ? 'is-current' : ''}">
                <span class="track-index">${index + 1}</span>
                <span class="track-icon">
                  ${renderIcon(currentTrack?.id === item.id && state.broadcast.is_active ? 'pause' : 'play', 14)}
                </span>
                <span class="track-title">${escapeHtml(item.media?.name || 'Без названия')}</span>
                <span class="track-meta">${formatDuration(item.media?.duration)}</span>
                <button
                  class="ghost-icon-btn"
                  type="button"
                  data-action="remove-playlist-item"
                  data-playlist-id="${activePlaylist.id}"
                  data-item-id="${item.id}"
                >
                  ${renderIcon('trash', 14)}
                </button>
              </div>
            `,
          )
          .join('')}
      </div>
    </section>
  `
}

export function renderLibrarySection(state) {
  return `
    <section class="panel" data-block="library-panel">
      <div class="panel-title-row">
        <div>
          <p class="section-eyebrow">Медиатека</p>
          <h2>Ваши аудиофайлы</h2>
        </div>
        <button class="ghost-icon-btn" type="button" data-action="trigger-upload" data-target-input="host-upload">
          ${renderIcon('plus', 18)}
        </button>
      </div>

      ${
        state.mediaLibrary.length
          ? `
            <div class="library-list">
              ${state.mediaLibrary
                .map(
                  (media) => `
                    <div class="media-row">
                      <span class="track-icon">${renderIcon('music', 16)}</span>
                      <span class="track-title">${escapeHtml(media.name)}</span>
                      <span class="track-meta">${formatFileSize(media.size)}</span>
                      <button class="ghost-icon-btn" type="button" data-action="delete-media" data-media-id="${media.id}">
                        ${renderIcon('trash', 14)}
                      </button>
                    </div>
                  `,
                )
                .join('')}
            </div>
          `
          : `
            <div class="empty-state" data-action="trigger-upload" data-target-input="host-upload">
              <div>${renderIcon('upload', 28)}</div>
              <p>Нажмите, чтобы загрузить первый трек в библиотеку.</p>
            </div>
          `
      }
    </section>
  `
}

export function renderPlaylistsSection(state) {
  return `
    <section class="panel" data-block="playlists-panel">
      <div class="panel-title-row">
        <div>
          <p class="section-eyebrow">Плейлисты</p>
          <h2>Мои подборки</h2>
        </div>
        <button class="primary-btn" type="button" data-action="open-create-playlist">
          ${renderIcon('plus', 16)}
          Создать
        </button>
      </div>

      <div class="playlist-grid">
        ${state.playlists
          .map(
            (playlist) => `
              <article class="playlist-card" data-action="open-playlist-modal" data-playlist-id="${playlist.id}">
                <div class="playlist-cover">${renderIcon('music', 42)}</div>
                <div class="playlist-body">
                  <h3>${escapeHtml(playlist.name)}</h3>
                  <p>${playlist.items?.length || 0} треков</p>
                  <div class="tag-row">
                    ${playlist.is_shuffle ? '<span class="tag">shuffle</span>' : ''}
                    ${playlist.is_loop ? '<span class="tag">loop</span>' : ''}
                  </div>
                </div>
              </article>
            `,
          )
          .join('')}

        <button class="playlist-card playlist-card--ghost" type="button" data-action="open-create-playlist">
          ${renderIcon('plus', 24)}
          <span>Новый плейлист</span>
        </button>
      </div>
    </section>
  `
}

export function renderPlaylistModal(state) {
  if (!state.playlistModal) {
    return ''
  }

  const isCreate = state.playlistModal.mode === 'create'
  const playlist = getModalPlaylist(state)
  const selectedIds = state.modalDraft.selectedIds

  return `
    <div class="modal-backdrop" data-role="modal-overlay">
      <div class="modal-card" data-block="playlist-modal">
        <div class="modal-header">
          <div>
            <p class="section-eyebrow">${isCreate ? 'Новый плейлист' : 'Редактор плейлиста'}</p>
            <h2>${isCreate ? 'Создать подборку' : escapeHtml(playlist?.name || 'Плейлист')}</h2>
          </div>
          <button class="ghost-icon-btn" type="button" data-action="close-modal">
            ${renderIcon('close', 18)}
          </button>
        </div>

        <div class="modal-body">
          <label class="field">
            <span>Название</span>
            <input
              type="text"
              value="${escapeHtml(state.modalDraft.name)}"
              data-modal-field="name"
              placeholder="Введите название..."
            >
          </label>

          ${
            !isCreate && playlist
              ? `
                <div class="panel-toolbar modal-toolbar">
                  <button
                    class="ghost-icon-btn ${playlist.is_shuffle ? 'is-accent' : ''}"
                    type="button"
                    data-action="toggle-playlist-field"
                    data-playlist-id="${playlist.id}"
                    data-field="is_shuffle"
                    data-next-value="${String(!playlist.is_shuffle)}"
                  >
                    ${renderIcon('shuffle', 16)}
                  </button>
                  <button
                    class="ghost-icon-btn ${playlist.is_loop ? 'is-accent' : ''}"
                    type="button"
                    data-action="toggle-playlist-field"
                    data-playlist-id="${playlist.id}"
                    data-field="is_loop"
                    data-next-value="${String(!playlist.is_loop)}"
                  >
                    ${renderIcon('loop', 16)}
                  </button>
                  <button class="danger-btn" type="button" data-action="delete-playlist" data-playlist-id="${playlist.id}">
                    Удалить плейлист
                  </button>
                </div>

                <div class="modal-section">
                  <p class="section-eyebrow">Треки внутри</p>
                  <div class="track-list">
                    ${
                      playlist.items?.length
                        ? playlist.items
                            .map(
                              (item, index) => `
                                <div class="track-row">
                                  <span class="track-index">${index + 1}</span>
                                  <span class="track-icon">${renderIcon('music', 14)}</span>
                                  <span class="track-title">${escapeHtml(item.media?.name || 'Без названия')}</span>
                                  <button
                                    class="ghost-icon-btn"
                                    type="button"
                                    data-action="remove-playlist-item"
                                    data-playlist-id="${playlist.id}"
                                    data-item-id="${item.id}"
                                  >
                                    ${renderIcon('trash', 14)}
                                  </button>
                                </div>
                              `,
                            )
                            .join('')
                        : '<div class="empty-state">Треков пока нет.</div>'
                    }
                  </div>
                </div>
              `
              : ''
          }

          <div class="modal-section">
            <div class="panel-title-row">
              <div>
                <p class="section-eyebrow">${isCreate ? 'Выберите треки' : 'Добавить из библиотеки'}</p>
                <h3>Медиатека</h3>
              </div>
              <button class="ghost-icon-btn" type="button" data-action="trigger-upload" data-target-input="modal-upload">
                ${renderIcon('upload', 16)}
              </button>
            </div>

            ${
              state.mediaLibrary.length
                ? `
                  <div class="library-list modal-library-list">
                    ${state.mediaLibrary
                      .map((media) => {
                        const alreadyInside = playlist?.items?.some((item) => item.media?.id === media.id)
                        const isSelected = selectedIds.includes(media.id)
                        const action = isCreate ? 'toggle-media-selection' : 'append-media-to-playlist'
                        const disabled = !isCreate && alreadyInside

                        return `
                          <button
                            class="media-row modal-media-row ${isSelected ? 'is-selected' : ''}"
                            type="button"
                            data-action="${disabled ? '' : action}"
                            data-playlist-id="${playlist?.id || ''}"
                            data-media-id="${media.id}"
                            ${disabled ? 'disabled' : ''}
                          >
                            <span class="track-icon">${renderIcon(isSelected ? 'check' : 'music', 14)}</span>
                            <span class="track-title">${escapeHtml(media.name)}</span>
                            <span class="track-meta">${alreadyInside ? 'уже добавлен' : formatFileSize(media.size)}</span>
                          </button>
                        `
                      })
                      .join('')}
                  </div>
                `
                : '<div class="empty-state">Медиатека пуста. Загрузите аудио и вернитесь к созданию плейлиста.</div>'
            }
          </div>
        </div>

        ${
          isCreate
            ? `
              <div class="modal-footer">
                <button class="secondary-btn" type="button" data-action="close-modal">Отмена</button>
                <button
                  class="primary-btn"
                  type="button"
                  data-action="create-playlist"
                  ${state.modalDraft.saving || !state.modalDraft.name.trim() ? 'disabled' : ''}
                >
                  ${state.modalDraft.saving ? 'Создание...' : `Создать${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
                </button>
              </div>
            `
            : ''
        }
      </div>
    </div>
  `
}

function renderHostPanelPage(state) {
  return `
    <section class="host-panel">
      <input class="visually-hidden" type="file" accept=".mp3,.wav,.ogg" data-input="host-upload">
      ${renderHostHeader(state)}

      <div class="shell-container host-shell">
        ${state.error ? `<div class="page-banner page-banner--error">${escapeHtml(state.error)}</div>` : ''}

        ${
          state.tab === 'broadcast'
            ? `
              <div class="host-top-grid">
                ${renderBroadcastSection(state)}
                ${renderChatSection(state)}
              </div>
              ${renderStreamSection(state)}
              ${renderLibrarySection(state)}
            `
            : renderPlaylistsSection(state)
        }
      </div>

      ${
        state.playlistModal
          ? `
            <input class="visually-hidden" type="file" accept=".mp3,.wav,.ogg" data-input="modal-upload">
            ${renderPlaylistModal(state)}
          `
          : ''
      }
    </section>
  `
}

export function createHostPanelPage({ router }) {
  const state = {
    user: getUser(),
    tab: 'broadcast',
    broadcast: {
      is_active: false,
      volume: 1,
      current_playlist: null,
      current_item: null,
    },
    messages: [],
    playlists: [],
    mediaLibrary: [],
    playlistModal: null,
    modalDraft: {
      name: '',
      selectedIds: [],
      saving: false,
    },
    error: '',
  }

  const refs = {
    active: false,
    root: null,
    audio: null,
    socket: null,
    reconnectTimer: null,
  }

  const setState = (patch) => {
    Object.assign(state, patch)
    render()
  }

  const openModal = (mode, playlistId = null) => {
    const playlist = state.playlists.find((item) => item.id === playlistId)

    setState({
      playlistModal: { mode, playlistId },
      modalDraft: {
        name: playlist?.name || '',
        selectedIds: [],
        saving: false,
      },
    })
  }

  const closeModal = () => {
    setState({
      playlistModal: null,
      modalDraft: {
        name: '',
        selectedIds: [],
        saving: false,
      },
    })
  }

  const render = () => {
    if (!refs.root) {
      return
    }

    refs.root.innerHTML = renderHostPanelPage(state)
    syncAudio()
  }

  const setError = (error, fallback) => {
    console.error(error)
    setState({
      error: error?.message || fallback,
    })
  }

  const loadInitialState = async () => {
    try {
      const [broadcast, messages, playlists, mediaLibrary] = await Promise.all([
        fetchBroadcast(),
        fetchHostMessages(),
        fetchPlaylists(),
        fetchMediaLibrary(),
      ])

      setState({
        broadcast,
        messages,
        playlists,
        mediaLibrary,
        error: '',
      })
    } catch (error) {
      setError(error, 'Не удалось загрузить данные ведущего.')
    }
  }

  const syncAudio = () => {
    if (!refs.audio) {
      return
    }

    const currentItem = getCurrentTrackItem(state)
    const fileUrl = currentItem?.media?.file ? joinMediaUrl(currentItem.media.file) : ''

    refs.audio.volume = state.broadcast.volume ?? 1

    if (state.broadcast.is_active && fileUrl) {
      if (refs.audio.src !== fileUrl) {
        refs.audio.src = fileUrl
      }

      refs.audio.play().catch((error) => {
        console.error(error)
      })
      return
    }

    refs.audio.pause()
    refs.audio.src = ''
  }

  const refreshPlaylists = async () => {
    const playlists = await fetchPlaylists()
    setState({ playlists, error: '' })
  }

  const handleMediaUpload = async (file) => {
    if (!file) {
      return
    }

    try {
      const media = await uploadMediaFile(file)
      setState({
        mediaLibrary: [media, ...state.mediaLibrary],
        error: '',
      })
    } catch (error) {
      setError(error, 'Не удалось загрузить трек.')
    }
  }

  const connectSocket = () => {
    if (!isAuthenticated()) {
      return
    }

    try {
      refs.socket = new WebSocket(createMessagesSocketUrl())
    } catch (error) {
      console.error(error)
      return
    }

    refs.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type !== 'new_message' || !data.message) {
          return
        }

        const messages = [data.message, ...state.messages].filter(
          (message, index, list) => list.findIndex((item) => item.id === message.id) === index,
        )

        setState({ messages })
      } catch (error) {
        console.error(error)
      }
    }

    refs.socket.onclose = () => {
      if (refs.active) {
        refs.reconnectTimer = window.setTimeout(connectSocket, 3000)
      }
    }
  }

  const handleClick = async (event) => {
    if (event.target.dataset.role === 'modal-overlay') {
      closeModal()
      return
    }

    const tabNode = event.target.closest('[data-tab]')

    if (tabNode) {
      setState({ tab: tabNode.dataset.tab })
      return
    }

    const actionNode = event.target.closest('[data-action]')

    if (!actionNode) {
      return
    }

    const { action } = actionNode.dataset

    try {
      if (action === 'logout') {
        logoutUser()
        router.navigate('/login', { replace: true })
        return
      }

      if (action === 'toggle-broadcast') {
        const broadcast = await updateBroadcast({ is_active: !state.broadcast.is_active })
        setState({ broadcast, error: '' })
        return
      }

      if (action === 'change-status') {
        const messageId = Number(actionNode.dataset.messageId)
        const nextStatus = actionNode.dataset.nextStatus
        const updated = await updateHostMessageStatus(messageId, nextStatus)
        setState({
          messages: state.messages.map((message) => (message.id === messageId ? updated : message)),
          error: '',
        })
        return
      }

      if (action === 'trigger-upload') {
        refs.root?.querySelector(`[data-input="${actionNode.dataset.targetInput}"]`)?.click()
        return
      }

      if (action === 'set-broadcast-playlist') {
        const playlistId = Number(actionNode.dataset.playlistId)
        const broadcast = await updateBroadcast({ current_playlist: playlistId })
        setState({ broadcast, error: '' })
        return
      }

      if (action === 'toggle-playlist-field') {
        const playlistId = Number(actionNode.dataset.playlistId)
        const field = actionNode.dataset.field
        const nextValue = actionNode.dataset.nextValue === 'true'
        await updatePlaylist(playlistId, { [field]: nextValue })
        await refreshPlaylists()
        return
      }

      if (action === 'remove-playlist-item') {
        const playlistId = Number(actionNode.dataset.playlistId)
        const itemId = Number(actionNode.dataset.itemId)
        await removePlaylistItem(playlistId, itemId)
        await refreshPlaylists()
        return
      }

      if (action === 'delete-media') {
        const mediaId = Number(actionNode.dataset.mediaId)
        await deleteMediaItem(mediaId)
        setState({
          mediaLibrary: state.mediaLibrary.filter((media) => media.id !== mediaId),
          error: '',
        })
        return
      }

      if (action === 'open-create-playlist') {
        openModal('create')
        return
      }

      if (action === 'open-playlist-modal') {
        openModal('edit', Number(actionNode.dataset.playlistId))
        return
      }

      if (action === 'close-modal') {
        closeModal()
        return
      }

      if (action === 'toggle-media-selection') {
        const mediaId = Number(actionNode.dataset.mediaId)
        const selectedIds = state.modalDraft.selectedIds.includes(mediaId)
          ? state.modalDraft.selectedIds.filter((item) => item !== mediaId)
          : [...state.modalDraft.selectedIds, mediaId]

        setState({
          modalDraft: {
            ...state.modalDraft,
            selectedIds,
          },
        })
        return
      }

      if (action === 'append-media-to-playlist') {
        const playlistId = Number(actionNode.dataset.playlistId)
        const mediaId = Number(actionNode.dataset.mediaId)
        await addPlaylistItem(playlistId, mediaId)
        await refreshPlaylists()
        return
      }

      if (action === 'create-playlist') {
        const name = state.modalDraft.name.trim()

        if (!name) {
          setState({ error: 'Введите название плейлиста.' })
          return
        }

        setState({
          modalDraft: {
            ...state.modalDraft,
            saving: true,
          },
        })

        const playlist = await createPlaylist(name)

        for (const mediaId of state.modalDraft.selectedIds) {
          await addPlaylistItem(playlist.id, mediaId)
        }

        await refreshPlaylists()
        closeModal()
        return
      }

      if (action === 'delete-playlist') {
        const playlistId = Number(actionNode.dataset.playlistId)
        await deletePlaylist(playlistId)
        await refreshPlaylists()
        closeModal()
      }
    } catch (error) {
      setError(error, 'Операция завершилась с ошибкой.')
    }
  }

  const handleChange = async (event) => {
    const target = event.target

    if (target.matches('[data-input="host-upload"], [data-input="modal-upload"]')) {
      await handleMediaUpload(target.files?.[0])
      target.value = ''
      return
    }

    if (target.matches('[data-action="set-volume"]')) {
      const volume = Number(target.value)
      setState({
        broadcast: {
          ...state.broadcast,
          volume,
        },
      })

      try {
        await updateBroadcast({ volume })
      } catch (error) {
        setError(error, 'Не удалось изменить громкость.')
      }
    }
  }

  const handleInput = (event) => {
    const target = event.target

    if (target.matches('[data-modal-field="name"]')) {
      state.modalDraft.name = target.value
      return
    }

    if (target.matches('[data-action="set-volume"]')) {
      const volume = Number(target.value)
      state.broadcast.volume = volume
      render()
    }
  }

  return {
    mount(container) {
      if (!isAuthenticated()) {
        router.navigate('/login', { replace: true })
        return
      }

      if (!hasHostAccess(state.user)) {
        router.navigate('/', { replace: true })
        return
      }

      const shell = createElement('<div class="host-root"></div>')
      const audio = document.createElement('audio')
      audio.style.display = 'none'

      refs.root = shell
      refs.audio = audio
      refs.active = true

      shell.addEventListener('click', handleClick)
      shell.addEventListener('change', handleChange)
      shell.addEventListener('input', handleInput)
      container.append(shell, audio)

      render()
      void loadInitialState()
      connectSocket()
    },
    destroy() {
      refs.active = false
      refs.root?.removeEventListener('click', handleClick)
      refs.root?.removeEventListener('change', handleChange)
      refs.root?.removeEventListener('input', handleInput)
      refs.socket?.close()
      window.clearTimeout(refs.reconnectTimer)
      refs.root = null
      refs.audio = null
      refs.socket = null
    },
  }
}
