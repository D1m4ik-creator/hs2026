import logoImg from '../assets/logo.png'
import { loginUser } from '../services/auth.js'
import { getUser, hasHostAccess, isAuthenticated } from '../services/storage.js'
import { createElement, qs } from '../utils/dom.js'

export function renderAuthPage() {
  return `
    <section class="auth-page">
      <div class="auth-backdrop"></div>
      <div class="shell-container auth-layout">
        <a class="brand-link" data-link="/" href="/">
          <img class="brand-logo" src="${logoImg}" alt="ТТК Вещает">
        </a>

        <div class="auth-panel">
          <div class="auth-topline">
            <div>
              <p class="section-eyebrow">Эфир уже ждёт</p>
              <h1>Авторизация</h1>
            </div>
            <a class="link-muted" data-link="/reg" href="/reg">Создать аккаунт</a>
          </div>

          <p class="auth-copy">Войдите, чтобы управлять вещанием или подключиться к прямому эфиру.</p>
          <p class="form-error" data-role="auth-error"></p>

          <form class="stack-form" data-form="auth">
            <label class="field">
              <span>Логин</span>
              <input name="login" type="text" placeholder="user" autocomplete="username" required>
            </label>

            <label class="field">
              <span>Пароль</span>
              <input name="password" type="password" placeholder="********" autocomplete="current-password" required>
            </label>

            <button class="primary-btn auth-submit" type="submit">Войти</button>
          </form>

          <p class="auth-footer">
            Нет аккаунта?
            <a data-link="/reg" href="/reg">Регистрация</a>
          </p>
        </div>
      </div>
    </section>
  `
}

export function createAuthPage({ router }) {
  let root

  const handleSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    const errorNode = qs(root, '[data-role="auth-error"]')
    const submitButton = form.querySelector('button[type="submit"]')
    const formData = new FormData(form)

    errorNode.textContent = ''
    submitButton.disabled = true
    submitButton.textContent = 'Входим...'

    try {
      const session = await loginUser({
        login: String(formData.get('login') || '').trim(),
        password: String(formData.get('password') || ''),
      })

      router.navigate(hasHostAccess(session.user) ? '/host' : '/', { replace: true })
    } catch (error) {
      console.error(error)
      errorNode.textContent = error.message || 'Не удалось выполнить вход.'
    } finally {
      submitButton.disabled = false
      submitButton.textContent = 'Войти'
    }
  }

  return {
    mount(container) {
      if (isAuthenticated()) {
        router.navigate(hasHostAccess(getUser()) ? '/host' : '/', { replace: true })
        return
      }

      root = createElement(renderAuthPage())
      root.querySelector('[data-form="auth"]')?.addEventListener('submit', handleSubmit)
      container.append(root)
    },
    destroy() {
      root?.querySelector('[data-form="auth"]')?.removeEventListener('submit', handleSubmit)
    },
  }
}
