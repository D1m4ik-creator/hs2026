const ICONS = {
  play: '<polygon points="5,3 19,12 5,21" fill="currentColor"></polygon>',
  pause: '<rect x="6" y="4" width="4" height="16" fill="currentColor"></rect><rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>',
  volume: '<polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" fill="none"></path>',
  shuffle: '<polyline points="16,3 21,3 21,8" stroke="currentColor" stroke-width="2" fill="none"></polyline><line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" stroke-width="2"></line><polyline points="21,16 21,21 16,21" stroke="currentColor" stroke-width="2" fill="none"></polyline><line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" stroke-width="2"></line>',
  loop: '<polyline points="17,1 21,5 17,9" stroke="currentColor" stroke-width="2" fill="none"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="currentColor" stroke-width="2" fill="none"></path><polyline points="7,23 3,19 7,15" stroke="currentColor" stroke-width="2" fill="none"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" stroke-width="2" fill="none"></path>',
  trash: '<polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" fill="none"></polyline><path d="M19,6l-1,14H6L5,6" stroke="currentColor" stroke-width="2" fill="none"></path><path d="M10,11v6M14,11v6" stroke="currentColor" stroke-width="2" fill="none"></path>',
  plus: '<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"></line><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"></line>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" fill="none"></path><polyline points="17,8 12,3 7,8" stroke="currentColor" stroke-width="2" fill="none"></polyline><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2"></line>',
  send: '<line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" stroke-width="2"></line><polygon points="22,2 15,22 11,13 2,9" fill="currentColor"></polygon>',
  check: '<polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2" fill="none"></polyline>',
  dblcheck: '<polyline points="17,6 9,17 5,13" stroke="currentColor" stroke-width="2" fill="none"></polyline><polyline points="22,6 14,17 11,14.5" stroke="currentColor" stroke-width="2" fill="none"></polyline>',
  music: '<path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" fill="none"></path><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" fill="none"></circle><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2" fill="none"></circle>',
  close: '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"></line><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"></line>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" fill="none"></path><polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" fill="none"></polyline><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2"></line>',
  radio: '<circle cx="12" cy="12" r="3" fill="currentColor"></circle><path d="M5 7a10 10 0 0 1 14 0M2 4a14 14 0 0 1 20 0M5 17a10 10 0 0 0 14 0M2 20a14 14 0 0 0 20 0" stroke="currentColor" stroke-width="2" fill="none"></path>',
}

export function renderIcon(name, size = 18, extraClass = '') {
  const className = ['icon', extraClass].filter(Boolean).join(' ')

  return `
    <svg
      class="${className}"
      width="${size}"
      height="${size}"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      ${ICONS[name] || ''}
    </svg>
  `
}
