const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { authenticate } = require('../middlewares/auth');
const { cacheMiddleware } = require('../middlewares/cache');

/**
 * Destination Routes
 * Todas las rutas requieren autenticación
 */

// GET /destinations - Get all destinations
router.get('/destinations', authenticate, cacheMiddleware(300), destinationController.getAllDestinations);

// GET /destinations/:id - Get destination by ID
router.get('/destinations/:id', authenticate, cacheMiddleware(300), destinationController.getDestinationById);

// POST /destinations - Create new destination
router.post('/destinations', authenticate, destinationController.createDestination);

// PUT /destinations/:id - Update destination by ID
router.put('/destinations/:id', authenticate, destinationController.updateDestination);

// DELETE /destinations/:id - Delete destination by ID
router.delete('/destinations/:id', authenticate, destinationController.deleteDestination);

module.exports = router;
