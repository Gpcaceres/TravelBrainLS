import api from './api'
import { API_CONFIG } from '../config'

export const favoriteRouteService = {
  // Get all favorite routes
  getAllFavoriteRoutes: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.FAVORITE_ROUTES)
    return response.data
  },

  // Get favorite route by ID
  getFavoriteRouteById: async (id) => {
    const response = await api.get(API_CONFIG.ENDPOINTS.FAVORITE_ROUTE_BY_ID(id))
    return response.data
  },

  // Get favorite routes by user ID
  getFavoriteRoutesByUserId: async (userId) => {
    const response = await api.get(API_CONFIG.ENDPOINTS.FAVORITE_ROUTES)
    return response.data.filter(route => route.userId === userId)
  },

  // Create new favorite route
  createFavoriteRoute: async (routeData) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.FAVORITE_ROUTES, routeData)
    return response.data
  },

  // Update favorite route
  updateFavoriteRoute: async (id, routeData) => {
    const response = await api.put(API_CONFIG.ENDPOINTS.FAVORITE_ROUTE_BY_ID(id), routeData)
    return response.data
  },

  // Delete favorite route
  deleteFavoriteRoute: async (id) => {
    const response = await api.delete(API_CONFIG.ENDPOINTS.FAVORITE_ROUTE_BY_ID(id))
    return response.data
  }
}
