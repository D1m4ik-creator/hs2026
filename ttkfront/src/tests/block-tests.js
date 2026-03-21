import {
  renderBroadcastSection,
  renderChatSection,
  renderHostHeader,
  renderLibrarySection,
  renderPlaylistModal,
  renderPlaylistsSection,
  renderStreamSection,
} from '../pages/host-panel.js'
import { renderAuthPage } from '../pages/auth.js'
import { renderListenerDashboard } from '../pages/index.js'
import { renderPromoPage } from '../pages/promo.js'
import { renderRegistrationPage } from '../pages/registration.js'
import { createElement } from '../utils/dom.js'
import { formatDuration, joinMediaUrl, normalizePath } from '../utils/format.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function withNode(markup) {
  return createElement(`<div>${markup}</div>`)
}

function createHostFixture() {
  return {
    user: {
      login: 'hostuser',
      full_name: 'Иванов Иван',
      avatar: null,
      roles: ['host'],
    },
    tab: 'broadcast',
    broadcast: {
      is_active: true,
      volume: 0.75,
      current_playlist: 1,
      current_item: 11,
    },
    messages: [
      {
        id: 1,
        author_login: 'listener',
        text: 'Передайте привет!',
        status: 'new',
        created_at: '2026-03-22T09:00:00Z',
      },
    ],
    playlists: [
      {
        id: 1,
        name: 'Утренний эфир',
        is_shuffle: true,
        is_loop: false,
        items: [
          {
            id: 11,
            media: {
              id: 101,
              name: 'Jingle',
              file: '/media/jingle.mp3',
              duration: 125,
            },
          },
        ],
      },
    ],
    mediaLibrary: [
      {
        id: 101,
        name: 'Jingle',
        size: 1024 * 1024,
      },
    ],
    playlistModal: {
      mode: 'create',
      playlistId: null,
    },
    modalDraft: {
      name: 'Новинки',
      selectedIds: [101],
      saving: false,
    },
    error: '',
  }
}

export function runBlockTests() {
  const hostState = createHostFixture()

  const tests = [
    {
      name: 'normalizePath normalizes slashes',
      run() {
        assert(normalizePath('/host/') === '/host', 'normalizePath should trim trailing slash')
      },
    },
    {
      name: 'formatDuration formats track duration',
      run() {
        assert(formatDuration(125) === '2:05', 'formatDuration should convert seconds to mm:ss')
      },
    },
    {
      name: 'joinMediaUrl keeps absolute path',
      run() {
        assert(joinMediaUrl('http://localhost/file.mp3') === 'http://localhost/file.mp3', 'joinMediaUrl should keep absolute urls')
      },
    },
    {
      name: 'joinMediaUrl does not duplicate media segment',
      run() {
        const result = joinMediaUrl('/media/jingle.mp3')
        assert(!result.includes('/media/media/'), 'joinMediaUrl should not duplicate /media segment')
      },
    },
    {
      name: 'promo page renders registration CTA',
      run() {
        const node = withNode(renderPromoPage())
        assert(node.querySelector('[data-link="/reg"]'), 'Promo page should have registration button')
      },
    },
    {
      name: 'auth page renders submit form',
      run() {
        const node = withNode(renderAuthPage())
        assert(node.querySelector('[data-form="auth"]'), 'Auth page should render auth form')
      },
    },
    {
      name: 'registration page renders avatar input',
      run() {
        const node = withNode(renderRegistrationPage())
        assert(node.querySelector('[data-role="avatar-input"]'), 'Registration page should render avatar input')
      },
    },
    {
      name: 'listener dashboard renders playlist selector',
      run() {
        const node = withNode(
          renderListenerDashboard({
            user: hostState.user,
            broadcast: {
              is_active: true,
              current_track: 'Jingle',
              volume: 0.8,
              host_login: {
                login: 'hostuser',
                full_name: 'Иванов Иван',
                avatar: null,
              },
              stream_url: '/media/jingle.mp3',
            },
            playlists: [{ id: 1, name: 'Утренний эфир' }],
            selectedPlaylist: hostState.playlists[0],
            messages: [],
            messageDraft: '',
            isSending: false,
            error: '',
          }),
        )

        assert(node.querySelector('[data-action="select-listener-playlist"]'), 'Listener dashboard should render playlist chips')
      },
    },
    {
      name: 'host header renders tabs',
      run() {
        const node = withNode(renderHostHeader(hostState))
        assert(node.querySelector('[data-tab="broadcast"]'), 'Host header should render broadcast tab')
      },
    },
    {
      name: 'broadcast panel renders volume slider',
      run() {
        const node = withNode(renderBroadcastSection(hostState))
        assert(node.querySelector('[data-action="set-volume"]'), 'Broadcast panel should render volume slider')
      },
    },
    {
      name: 'chat panel renders message action',
      run() {
        const node = withNode(renderChatSection(hostState))
        assert(node.querySelector('[data-action="change-status"]'), 'Chat panel should render status button')
      },
    },
    {
      name: 'stream panel renders current playlist tracks',
      run() {
        const node = withNode(renderStreamSection(hostState))
        assert(node.querySelector('.track-row'), 'Stream panel should render track rows')
      },
    },
    {
      name: 'library panel renders media entries',
      run() {
        const node = withNode(renderLibrarySection(hostState))
        assert(node.querySelector('[data-action="delete-media"]'), 'Library panel should render delete button')
      },
    },
    {
      name: 'playlists panel renders create button',
      run() {
        const node = withNode(renderPlaylistsSection(hostState))
        assert(node.querySelector('[data-action="open-create-playlist"]'), 'Playlists panel should render create button')
      },
    },
    {
      name: 'playlist modal renders create action',
      run() {
        const node = withNode(renderPlaylistModal(hostState))
        assert(node.querySelector('[data-action="create-playlist"]'), 'Playlist modal should render create button')
      },
    },
  ]

  let passed = 0

  for (const test of tests) {
    try {
      test.run()
      passed += 1
    } catch (error) {
      console.error(`[block-test] ${test.name}`, error)
    }
  }

  console.info(`[block-test] ${passed}/${tests.length} checks passed`)
}
