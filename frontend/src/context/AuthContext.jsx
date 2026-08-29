import { createContext, useContext, useState, useCallback } from 'react'
import { api, setAuth, clearAuth, getStoredUser, isAuthenticated } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [authenticated, setAuthenticated] = useState(isAuthenticated)

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login-json', {
      method: 'POST',
      body: { email, password },
    })
    setAuth(data)
    setUser(data.user)
    setAuthenticated(true)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: payload,
    })
    return data
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    setAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, authenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
