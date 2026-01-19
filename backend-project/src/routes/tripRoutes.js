const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

/**
 * Trip Routes
 */

// GET /trips - Get all trips
router.get('/trips', tripController.getAllTrips);

// GET /trips/:id - Get trip by ID
router.get('/trips/:id', tripController.getTripById);

// POST /trips - Create new trip
router.post('/trips', tripController.createTrip);

// PUT /trips/:id - Update trip by ID
router.put('/trips/:id', tripController.updateTrip);

// DELETE /trips/:id - Delete trip by ID
router.delete('/trips/:id', tripController.deleteTrip);

module.exports = router;
