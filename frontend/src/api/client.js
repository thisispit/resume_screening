const BASE_URL = '/api/v1'

const TOKEN_KEY = 'rs_access_token'
const REFRESH_KEY = 'rs_refresh_token'
const USER_KEY = 'rs_user'

export function getTokens() {
  return {
    access: localStorage.getItem(TOKEN_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  }
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setAuth(data) {
  localStorage.setItem(TOKEN_KEY, data.access_token)
  localStorage.setItem(REFRESH_KEY, data.refresh_token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  return Boolean(getTokens().access)
}

async function request(path, { method = 'GET', body, token, isForm = false } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  const options = { method, headers }
  if (body) options.body = isForm ? body : JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') detail = data.detail
      else if (Array.isArray(data.detail)) {
        detail = data.detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
      }
    } catch {
      /* ignore */
    }
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export function withToken(token) {
  return async (path, opts = {}) => request(path, { ...opts, token })
}

export async function api(path, opts = {}) {
  return request(path, { ...opts })
}

export function getAuthHeaders() {
  const token = getTokens().access
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function authedApi(path, opts = {}) {
  const token = getTokens().access
  if (!token) {
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }
  return request(path, { ...opts, token })
}
