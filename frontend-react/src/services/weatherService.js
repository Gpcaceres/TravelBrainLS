import api from './api'
import { API_CONFIG } from '../config'

export const weatherService = {
  // Get all weather searches (force fresh data)
  getAllWeatherSearches: async () => {
    // Add timestamp to bypass cache
    const timestamp = new Date().getTime()
    const response = await api.get(`${API_CONFIG.ENDPOINTS.WEATHERS}?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    return response.data
  },

  // Get weather by ID
  getWeatherById: async (id) => {
    const response = await api.get(API_CONFIG.ENDPOINTS.WEATHER_BY_ID(id))
    return response.data
  },

  // Create new weather search
  createWeatherSearch: async (weatherData) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.WEATHER_SEARCH, weatherData)
    return response.data
  },

  // Update weather
  updateWeather: async (id, weatherData) => {
    const response = await api.put(API_CONFIG.ENDPOINTS.WEATHER_BY_ID(id), weatherData)
    return response.data
  },

  // Delete weather
  deleteWeather: async (id) => {
    const response = await api.delete(API_CONFIG.ENDPOINTS.WEATHER_BY_ID(id))
    return response.data
  }
}
