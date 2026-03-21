import { apiRequest } from './api.js'
import { clearSession, setSession } from './storage.js'

export async function loginUser({ login, password }) {
  const session = await apiRequest('/login/', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ login, password }),
  })

  setSession(session)
  return session
}

export async function registerUser({ login, fullName, password, passwordConfirm, avatar }) {
  const body = new FormData()
  body.append('login', login.trim())
  body.append('full_name', fullName.trim())
  body.append('password', password)
  body.append('password_confirm', passwordConfirm)

  if (avatar instanceof File) {
    body.append('avatar', avatar)
  }

  return apiRequest('/register/', {
    auth: false,
    method: 'POST',
    body,
  })
}

export async function fetchCurrentUser() {
  return apiRequest('/me/')
}

export function logoutUser() {
  clearSession()
}
