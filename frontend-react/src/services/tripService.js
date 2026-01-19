import api from './api'
import { API_CONFIG } from '../config'

export const tripService = {
  // Get all trips
  getAllTrips: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.TRIPS)
    return response.data
  },

  // Get trip by ID
  getTripById: async (id) => {
    const response = await api.get(API_CONFIG.ENDPOINTS.TRIP_BY_ID(id))
    return response.data
  },

  // Get trips by user ID
  getTripsByUserId: async (userId) => {
    const response = await api.get(API_CONFIG.ENDPOINTS.TRIPS)
    return response.data.filter(trip => trip.userId === userId)
  },

  // Create new trip
  createTrip: async (tripData) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.TRIPS, tripData)
    return response.data
  },

  // Update trip
  updateTrip: async (id, tripData) => {
    const response = await api.put(API_CONFIG.ENDPOINTS.TRIP_BY_ID(id), tripData)
    return response.data
  },

  // Delete trip
  deleteTrip: async (id) => {
    const response = await api.delete(API_CONFIG.ENDPOINTS.TRIP_BY_ID(id))
    return response.data
  }
}
