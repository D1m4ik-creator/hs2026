export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
export const API_BASE = `${API_ORIGIN}/api`
export const WS_ORIGIN = import.meta.env.VITE_WS_BASE_URL || API_ORIGIN.replace(/^http/, 'ws')
