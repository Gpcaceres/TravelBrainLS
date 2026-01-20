import api from './api';
import { API_CONFIG } from '../config';

/**
 * Generate a new itinerary for a trip
 * @param {Object} data - Itinerary generation data
 * @returns {Promise} Generated itinerary
 */
export const generateItinerary = async (data) => {
  try {
    const response = await api.post('/api/itineraries/generate', data);
    return response.data;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get itinerary by ID
 * @param {string} id - Itinerary ID
 * @returns {Promise} Itinerary data
 */
export const getItineraryById = async (id) => {
  try {
    const response = await api.get(`/api/itineraries/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting itinerary:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get itinerary by trip ID
 * @param {string} tripId - Trip ID
 * @returns {Promise} Itinerary data
 */
export const getItineraryByTripId = async (tripId) => {
  try {
    const response = await api.get(`/api/itineraries/trip/${tripId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting itinerary by trip:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all itineraries for current user
 * @returns {Promise} List of itineraries
 */
export const getUserItineraries = async () => {
  try {
    const response = await api.get('/api/itineraries');
    return response.data;
  } catch (error) {
    console.error('Error getting user itineraries:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete itinerary
 * @param {string} id - Itinerary ID
 * @returns {Promise} Delete confirmation
 */
export const deleteItinerary = async (id) => {
  try {
    const response = await api.delete(`/api/itineraries/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    throw error.response?.data || error;
  }
};

/**
 * Generate PDF for itinerary (client-side)
 * @param {object} itinerary - Itinerary data
 * @param {object} trip - Trip data
 */
export const generateItineraryPDF = (itinerary, trip) => {
  // This will be handled by html2pdf or jsPDF in the component
  // This function serves as a placeholder for the PDF generation logic
  console.log('Generating PDF for itinerary:', itinerary._id);
};

export default {
  generateItinerary,
  getItineraryById,
  getItineraryByTripId,
  getUserItineraries,
  deleteItinerary,
  generateItineraryPDF
};
