import logoImg from '../assets/logo.png'
import photoPlaceholder from '../assets/photo-registration.png'
import { registerUser } from '../services/auth.js'
import { createElement, qs } from '../utils/dom.js'

export function renderRegistrationPage() {
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
              <p class="section-eyebrow">Присоединяйтесь к трансляции</p>
              <h1>Регистрация</h1>
            </div>
            <a class="link-muted" data-link="/login" href="/login">Уже есть аккаунт?</a>
          </div>

          <p class="auth-copy">Создайте профиль слушателя или ведущего. Аватар можно загрузить сразу.</p>
          <p class="form-error" data-role="registration-error"></p>
          <p class="form-success" data-role="registration-success"></p>

          <form class="stack-form" data-form="registration">
            <div class="avatar-field">
              <button class="avatar-uploader" type="button" data-action="pick-avatar">
                <img src="${photoPlaceholder}" alt="" data-role="avatar-preview-icon">
                <span data-role="avatar-file-label">Выбрать фото</span>
              </button>
              <input class="visually-hidden" data-role="avatar-input" type="file" accept="image/*">
            </div>

            <label class="field">
              <span>ФИО</span>
              <input name="fullName" type="text" placeholder="Иванов Иван Иванович" required>
            </label>

            <label class="field">
              <span>Логин</span>
              <input name="login" type="text" placeholder="user" required>
            </label>

            <label class="field">
              <span>Пароль</span>
              <input name="password" type="password" placeholder="********" required>
            </label>

            <label class="field">
              <span>Подтверждение пароля</span>
              <input name="passwordConfirm" type="password" placeholder="********" required>
            </label>

            <button class="primary-btn auth-submit" type="submit">Зарегистрироваться</button>
          </form>

          <p class="auth-footer">
            Уже есть аккаунт?
            <a data-link="/login" href="/login">Войти</a>
          </p>
        </div>
      </div>
    </section>
  `
}

export function createRegistrationPage({ router }) {
  let root
  let avatarFile = null

  const handlePickAvatar = () => {
    qs(root, '[data-role="avatar-input"]')?.click()
  }

  const handleAvatarChange = (event) => {
    const [file] = event.target.files || []
    avatarFile = file || null

    const label = qs(root, '[data-role="avatar-file-label"]')
    label.textContent = file ? file.name : 'Выбрать фото'
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const errorNode = qs(root, '[data-role="registration-error"]')
    const successNode = qs(root, '[data-role="registration-success"]')
    const submitButton = event.currentTarget.querySelector('button[type="submit"]')
    const formData = new FormData(event.currentTarget)

    errorNode.textContent = ''
    successNode.textContent = ''
    submitButton.disabled = true
    submitButton.textContent = 'Создаём...'

    try {
      await registerUser({
        login: String(formData.get('login') || ''),
        fullName: String(formData.get('fullName') || ''),
        password: String(formData.get('password') || ''),
        passwordConfirm: String(formData.get('passwordConfirm') || ''),
        avatar: avatarFile,
      })

      successNode.textContent = 'Профиль создан. Переходим к авторизации...'
      window.setTimeout(() => {
        router.navigate('/login', { replace: true })
      }, 900)
    } catch (error) {
      console.error(error)
      errorNode.textContent = error.message || 'Не удалось зарегистрироваться.'
    } finally {
      submitButton.disabled = false
      submitButton.textContent = 'Зарегистрироваться'
    }
  }

  return {
    mount(container) {
      root = createElement(renderRegistrationPage())
      qs(root, '[data-action="pick-avatar"]')?.addEventListener('click', handlePickAvatar)
      qs(root, '[data-role="avatar-input"]')?.addEventListener('change', handleAvatarChange)
      qs(root, '[data-form="registration"]')?.addEventListener('submit', handleSubmit)
      container.append(root)
    },
    destroy() {
      qs(root, '[data-action="pick-avatar"]')?.removeEventListener('click', handlePickAvatar)
      qs(root, '[data-role="avatar-input"]')?.removeEventListener('change', handleAvatarChange)
      qs(root, '[data-form="registration"]')?.removeEventListener('submit', handleSubmit)
    },
  }
}
