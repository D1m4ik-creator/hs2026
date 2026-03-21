import logoImg from '../assets/logo.png'
import { createElement } from '../utils/dom.js'

export function renderPromoPage() {
  return `
    <section class="promo-page">
      <div class="promo-overlay"></div>
      <div class="shell-container promo-shell">
        <div class="promo-card">
          <img class="promo-logo" src="${logoImg}" alt="ТТК Вещает">
          <p class="promo-copy">
            Платформа для живых эфиров, где можно слушать трансляции,
            следить за плейлистами и участвовать в общении в реальном времени.
          </p>
          <div class="promo-actions">
            <a class="primary-btn promo-btn" data-link="/reg" href="/reg">Начать слушать</a>
            <a class="secondary-btn promo-btn" data-link="/login" href="/login">Войти</a>
          </div>
        </div>
      </div>
    </section>
  `
}

export function createPromoPage() {
  return {
    mount(container) {
      container.append(createElement(renderPromoPage()))
    },
  }
}
