import {
  fetchListenerBroadcast,
  fetchListenerMessages,
  fetchListenerPlaylist,
  fetchListenerPlaylists,
  sendListenerMessage,
} from '../services/listener.js'
import { fetchCurrentUser, logoutUser } from '../services/auth.js'
import { getUser, hasHostAccess, isAuthenticated } from '../services/storage.js'
import { createElement, escapeHtml } from '../utils/dom.js'
import { formatClock, formatDuration, getInitials, joinMediaUrl } from '../utils/format.js'
import { renderIcon } from '../utils/icons.js'

function renderHostIdentity(host) {
  if (!host) {
    return `
      <div class="listener-host-card empty-state">
        Эфир пока не запущен
      </div>
    `
  }

  const avatar = host.avatar
    ? `<img class="user-avatar user-avatar--lg" src="${escapeHtml(joinMediaUrl(host.avatar))}" alt="">`
    : `<span class="user-avatar user-avatar--lg">${escapeHtml(getInitials(host.full_name || host.login))}</span>`

  return `
    <div class="listener-host-card">
      ${avatar}
      <div>
        <p class="listener-host-name">${escapeHtml(host.full_name || 'Ведущий')}</p>
        <p class="listener-host-login">@${escapeHtml(host.login || 'host')}</p>
      </div>
    </div>
  `
}

function renderListenerMessages(state) {
  if (!state.messages.length) {
    return '<div class="empty-state">Ваши сообщения появятся здесь после отправки.</div>'
  }

  return `
    <div class="listener-message-list">
      ${state.messages
        .map((message) => {
          const statusLabel =
            message.status === 'done'
              ? 'обработано'
              : message.status === 'in_progress'
                ? 'в работе'
                : 'отправлено'

          return `
            <article class="listener-message-card">
              <div class="listener-message-meta">
                <span>${formatClock(message.created_at)}</span>
                <span>${escapeHtml(statusLabel)}</span>
              </div>
              <p>${escapeHtml(message.text)}</p>
            </article>
          `
        })
        .join('')}
    </div>
  `
}

function renderSelectedPlaylist(state) {
  if (!state.selectedPlaylist) {
    return '<div class="empty-state">Выберите плейлист, чтобы посмотреть его треки.</div>'
  }

  const playlist = state.selectedPlaylist
  return `
    <div class="listener-playlist-details">
      <div class="panel-title-row">
        <div>
          <h3>${escapeHtml(playlist.name)}</h3>
          <p>${playlist.items?.length || 0} треков</p>
        </div>
        <div class="tag-row">
          ${playlist.is_shuffle ? '<span class="tag">shuffle</span>' : ''}
          ${playlist.is_loop ? '<span class="tag">loop</span>' : ''}
        </div>
      </div>
      <div class="track-list">
        ${(playlist.items || [])
          .map(
            (item, index) => `
              <div class="track-row">
                <span class="track-index">${index + 1}</span>
                <span class="track-title">${escapeHtml(item.media?.name || 'Без названия')}</span>
                <span class="track-meta">${formatDuration(item.media?.duration)}</span>
              </div>
            `,
          )
          .join('')}
      </div>
    </div>
  `
}

export function renderListenerDashboard(state) {
  const host = state.broadcast?.host_login
  const isActive = Boolean(state.broadcast?.is_active)
  const streamUrl = state.broadcast?.stream_url ? joinMediaUrl(state.broadcast.stream_url) : ''

  return `
    <section class="listener-dashboard">
      <header class="host-header listener-header">
        <div class="brand-mark">ТТК<span>@</span>ВЕЩАЕТ</div>
        <div class="host-user">
          <div class="host-user-meta">
            <strong>${escapeHtml(state.user.full_name || 'Слушатель')}</strong>
            <span>@${escapeHtml(state.user.login || 'listener')}</span>
          </div>
          <button class="ghost-icon-btn" type="button" data-action="logout">${renderIcon('logout', 18)}</button>
        </div>
      </header>

      <div class="shell-container listener-shell">
        ${state.error ? `<div class="page-banner page-banner--error">${escapeHtml(state.error)}</div>` : ''}
        <div class="host-top-grid listener-top-grid">
          <section class="panel panel-gradient" data-block="listener-broadcast">
            <div class="panel-title-row">
              <div>
                <p class="section-eyebrow">Сейчас в эфире</p>
                <h2>${escapeHtml(state.broadcast?.current_track || 'Тишина в студии')}</h2>
              </div>
              <span class="status-chip ${isActive ? 'is-live' : 'is-idle'}">
                ${isActive ? '● В эфире' : '○ Ожидание'}
              </span>
            </div>

            ${renderHostIdentity(host)}

            <div class="listener-track-summary">
              <div>
                <p class="listener-stat-label">Громкость эфира</p>
                <strong>${Math.round((state.broadcast?.volume ?? 1) * 100)}%</strong>
              </div>
              <div>
                <p class="listener-stat-label">Статус</p>
                <strong>${isActive ? 'Идёт трансляция' : 'Офлайн'}</strong>
              </div>
            </div>

            ${
              streamUrl
                ? `<audio class="audio-frame" controls src="${escapeHtml(streamUrl)}"></audio>`
                : '<div class="empty-state">Когда ведущий запустит эфир, здесь появится поток для прослушивания.</div>'
            }
          </section>

          <section class="panel" data-block="listener-messages">
            <div class="panel-title-row">
              <div>
                <p class="section-eyebrow">Сообщения</p>
                <h2>Написать в эфир</h2>
              </div>
            </div>

            <form class="listener-message-form" data-form="listener-message">
              <label class="field">
                <span>Ваше сообщение</span>
                <textarea
                  name="message"
                  rows="4"
                  placeholder="Например: передайте привет..."
                >${escapeHtml(state.messageDraft)}</textarea>
              </label>
              <button class="primary-btn" type="submit" ${state.isSending ? 'disabled' : ''}>
                ${renderIcon('send', 14)}
                ${state.isSending ? 'Отправляем...' : 'Отправить'}
              </button>
            </form>

            ${renderListenerMessages(state)}
          </section>
        </div>

        <section class="panel listener-playlists" data-block="listener-playlists">
          <div class="panel-title-row">
            <div>
              <p class="section-eyebrow">Публичные подборки</p>
              <h2>Плейлисты эфира</h2>
            </div>
          </div>

          <div class="playlist-chip-row">
            ${state.playlists
              .map(
                (playlist) => `
                  <button
                    class="playlist-chip ${state.selectedPlaylist?.id === playlist.id ? 'is-active' : ''}"
                    type="button"
                    data-action="select-listener-playlist"
                    data-playlist-id="${playlist.id}"
                  >
                    ${escapeHtml(playlist.name)}
                  </button>
                `,
              )
              .join('')}
          </div>

          ${renderSelectedPlaylist(state)}
        </section>
      </div>
    </section>
  `
}

export function createListenerPage({ router }) {
  const state = {
    user: getUser(),
    broadcast: null,
    playlists: [],
    selectedPlaylist: null,
    messages: [],
    messageDraft: '',
    isSending: false,
    error: '',
  }

  let root

  const setState = (patch) => {
    Object.assign(state, patch)
    render()
  }

  const loadDashboard = async () => {
    try {
      const [user, broadcast, playlists, messages] = await Promise.all([
        fetchCurrentUser(),
        fetchListenerBroadcast(),
        fetchListenerPlaylists(),
        fetchListenerMessages(),
      ])

      const selectedPlaylist = playlists[0] ? await fetchListenerPlaylist(playlists[0].id) : null

      setState({
        user,
        broadcast,
        playlists,
        selectedPlaylist,
        messages,
        error: '',
      })
    } catch (error) {
      console.error(error)
      setState({
        error: error.message || 'Не удалось загрузить данные слушателя.',
      })
    }
  }

  const render = () => {
    if (!root) {
      return
    }

    root.innerHTML = renderListenerDashboard(state)
  }

  const handleClick = async (event) => {
    const actionNode = event.target.closest('[data-action]')

    if (!actionNode) {
      return
    }

    const action = actionNode.dataset.action

    if (action === 'logout') {
      logoutUser()
      router.navigate('/login', { replace: true })
      return
    }

    if (action === 'select-listener-playlist') {
      const playlistId = Number(actionNode.dataset.playlistId)

      try {
        const selectedPlaylist = await fetchListenerPlaylist(playlistId)
        setState({ selectedPlaylist, error: '' })
      } catch (error) {
        console.error(error)
        setState({ error: error.message || 'Не удалось открыть плейлист.' })
      }
    }
  }

  const handleSubmit = async (event) => {
    if (!event.target.matches('[data-form="listener-message"]')) {
      return
    }

    event.preventDefault()
    const message = state.messageDraft.trim()

    if (!message) {
      return
    }

    setState({ isSending: true })

    try {
      const created = await sendListenerMessage(message)
      setState({
        isSending: false,
        messageDraft: '',
        messages: [...state.messages, created],
        error: '',
      })
    } catch (error) {
      console.error(error)
      setState({
        isSending: false,
        error: error.message || 'Не удалось отправить сообщение.',
      })
    }
  }

  const handleInput = (event) => {
    if (event.target.matches('textarea[name="message"]')) {
      state.messageDraft = event.target.value
    }
  }

  return {
    mount(container) {
      if (!isAuthenticated()) {
        router.navigate('/login', { replace: true })
        return
      }

      if (hasHostAccess(getUser())) {
        router.navigate('/host', { replace: true })
        return
      }

      root = createElement('<div class="listener-root"></div>')
      root.addEventListener('click', handleClick)
      root.addEventListener('submit', handleSubmit)
      root.addEventListener('input', handleInput)
      container.append(root)
      render()
      void loadDashboard()
    },
    destroy() {
      root?.removeEventListener('click', handleClick)
      root?.removeEventListener('submit', handleSubmit)
      root?.removeEventListener('input', handleInput)
    },
  }
}
