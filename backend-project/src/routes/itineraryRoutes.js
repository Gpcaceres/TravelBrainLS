const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');
const { authenticate } = require('../middlewares/auth');

/**
 * Itinerary Routes
 * Todas las rutas requieren autenticación
 */

// Generate new itinerary
router.post('/generate', authenticate, itineraryController.generateItinerary);

// Get all itineraries for current user
router.get('/', authenticate, itineraryController.getUserItineraries);

// Get itinerary by trip ID
router.get('/trip/:tripId', authenticate, itineraryController.getItineraryByTripId);

// Get itinerary by ID
router.get('/:id', authenticate, itineraryController.getItineraryById);

// Delete itinerary
router.delete('/:id', authenticate, itineraryController.deleteItinerary);

module.exports = router;
