import { STORAGE_KEYS } from '../config'

export const useAuth = () => {
  const isAuthenticated = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    return !!token
  }

  const getUser = () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    return userStr ? JSON.parse(userStr) : null
  }

  const saveAuth = (token, user) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    window.location.href = '/'
  }

  return {
    isAuthenticated,
    getUser,
    saveAuth,
    logout
  }
}
