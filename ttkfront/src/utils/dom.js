const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function createElement(markup) {
  const template = document.createElement('template')
  template.innerHTML = markup.trim()
  return template.content.firstElementChild
}

export function createFragment(markup) {
  const template = document.createElement('template')
  template.innerHTML = markup.trim()
  return template.content
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (match) => HTML_ESCAPES[match])
}

export function qs(scope, selector) {
  return scope.querySelector(selector)
}

export function qsa(scope, selector) {
  return [...scope.querySelectorAll(selector)]
}
