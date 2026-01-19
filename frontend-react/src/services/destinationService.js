import api from './api'
import { API_CONFIG } from '../config'

export const destinationService = {
  // Get all destinations
  getAllDestinations: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.DESTINATIONS)
    return response.data
  },

  // Get destination by ID
  getDestinationById: async (id) => {
    const response = await api.get(API_CONFIG.ENDPOINTS.DESTINATION_BY_ID(id))
    return response.data
  },

  // Create new destination
  createDestination: async (destinationData) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.DESTINATIONS, destinationData)
    return response.data
  },

  // Update destination
  updateDestination: async (id, destinationData) => {
    const response = await api.put(API_CONFIG.ENDPOINTS.DESTINATION_BY_ID(id), destinationData)
    return response.data
  },

  // Delete destination
  deleteDestination: async (id) => {
    const response = await api.delete(API_CONFIG.ENDPOINTS.DESTINATION_BY_ID(id))
    return response.data
  }
}
