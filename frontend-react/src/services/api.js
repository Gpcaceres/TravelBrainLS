import axios from 'axios'
import { API_CONFIG, STORAGE_KEYS } from '../config'

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  console.log('[API Interceptor] Request to:', config.url)
  console.log('[API Interceptor] Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('[API Interceptor] Authorization header set')
  } else {
    console.warn('[API Interceptor] ⚠️ NO TOKEN FOUND in localStorage!')
  }
  return config
})

export default api
