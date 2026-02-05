const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticate } = require('../middlewares/auth');
const { cacheMiddleware } = require('../middlewares/cache');

/**
 * Trip Routes
 * Todas las rutas requieren autenticación
 */

// GET /trips - Get all trips
router.get('/trips', authenticate, cacheMiddleware(300), tripController.getAllTrips);

// GET /trips/:id - Get trip by ID
router.get('/trips/:id', authenticate, cacheMiddleware(300), tripController.getTripById);

// POST /trips - Create new trip
router.post('/trips', authenticate, tripController.createTrip);

// PUT /trips/:id - Update trip by ID
router.put('/trips/:id', authenticate, tripController.updateTrip);

// DELETE /trips/:id - Delete trip by ID
router.delete('/trips/:id', authenticate, tripController.deleteTrip);

module.exports = router;
