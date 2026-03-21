const STORAGE_KEYS = {
  access: 'access',
  refresh: 'refresh',
  legacyAccess: 'token',
  user: 'user',
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.access) || localStorage.getItem(STORAGE_KEYS.legacyAccess) || ''
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || '{}')
  } catch {
    return {}
  }
}

export function setSession({ access, refresh, user }) {
  if (access) {
    localStorage.setItem(STORAGE_KEYS.access, access)
    localStorage.setItem(STORAGE_KEYS.legacyAccess, access)
  }

  if (refresh) {
    localStorage.setItem(STORAGE_KEYS.refresh, refresh)
  }

  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.access)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  localStorage.removeItem(STORAGE_KEYS.legacyAccess)
  localStorage.removeItem(STORAGE_KEYS.user)
}

export function hasHostAccess(user = getUser()) {
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.includes('host') || roles.includes('admin')
}
