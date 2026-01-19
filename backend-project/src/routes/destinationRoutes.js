const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

/**
 * Destination Routes
 */

// GET /destinations - Get all destinations
router.get('/destinations', destinationController.getAllDestinations);

// GET /destinations/:id - Get destination by ID
router.get('/destinations/:id', destinationController.getDestinationById);

// POST /destinations - Create new destination
router.post('/destinations', destinationController.createDestination);

// PUT /destinations/:id - Update destination by ID
router.put('/destinations/:id', destinationController.updateDestination);

// DELETE /destinations/:id - Delete destination by ID
router.delete('/destinations/:id', destinationController.deleteDestination);

module.exports = router;
