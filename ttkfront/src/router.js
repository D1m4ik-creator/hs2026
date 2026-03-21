import { normalizePath } from './utils/format.js'

export function createRouter({ root, routes, notFound }) {
  let currentPage = null

  const render = () => {
    const currentPath = normalizePath(window.location.pathname)
    const pageFactory = routes[currentPath] ?? notFound

    currentPage?.destroy?.()
    currentPage = pageFactory({ router })
    root.innerHTML = ''
    currentPage.mount(root)

    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  const handleDocumentClick = (event) => {
    const link = event.target.closest('[data-link]')

    if (!link) {
      return
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    const href = link.getAttribute('data-link')

    if (!href) {
      return
    }

    event.preventDefault()
    navigate(href)
  }

  const navigate = (path, options = {}) => {
    const nextPath = normalizePath(path)
    const currentPath = normalizePath(window.location.pathname)

    if (nextPath === currentPath && !options.force) {
      return
    }

    const historyMethod = options.replace ? 'replaceState' : 'pushState'
    window.history[historyMethod]({}, '', nextPath)
    render()
  }

  const router = {
    start() {
      document.addEventListener('click', handleDocumentClick)
      window.addEventListener('popstate', render)
      render()
    },
    stop() {
      document.removeEventListener('click', handleDocumentClick)
      window.removeEventListener('popstate', render)
      currentPage?.destroy?.()
      currentPage = null
    },
    navigate,
    refresh() {
      render()
    },
  }

  return router
}
