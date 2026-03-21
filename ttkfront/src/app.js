import { createRouter } from './router.js'
import { createAuthPage } from './pages/auth.js'
import { createHostPanelPage } from './pages/host-panel.js'
import { createListenerPage } from './pages/index.js'
import { createPromoPage } from './pages/promo.js'
import { createRegistrationPage } from './pages/registration.js'
import { createElement } from './utils/dom.js'
import { getAccessToken, getUser, hasHostAccess } from './services/storage.js'

export function resolveHomeFactory() {
  if (!getAccessToken()) {
    return createPromoPage
  }

  return hasHostAccess(getUser()) ? createHostPanelPage : createListenerPage
}

function createNotFoundPage({ router }) {
  return {
    mount(container) {
      const view = createElement(`
        <section class="page-shell simple-shell">
          <div class="simple-card">
            <p class="section-eyebrow">404</p>
            <h1>Страница не найдена</h1>
            <p>Вернёмся на главный экран вещания.</p>
            <button class="primary-btn" data-action="back-home">На главную</button>
          </div>
        </section>
      `)

      view.querySelector('[data-action="back-home"]')?.addEventListener('click', () => {
        router.navigate('/', { replace: true })
      })

      container.append(view)
    },
  }
}

export function createApp(root) {
  const routes = {
    '/': ({ router }) => resolveHomeFactory()({ router }),
    '/host': ({ router }) => createHostPanelPage({ router }),
    '/login': ({ router }) => createAuthPage({ router }),
    '/reg': ({ router }) => createRegistrationPage({ router }),
  }

  const router = createRouter({
    root,
    routes,
    notFound: ({ router: nextRouter }) => createNotFoundPage({ router: nextRouter }),
  })

  return {
    start() {
      router.start()
    },
    stop() {
      router.stop()
    },
  }
}
