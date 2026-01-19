const express = require('express');
const router = express.Router();
const favoriteRouteController = require('../controllers/favoriteRouteController');

/**
 * Favorite Route Routes
 */

// GET /favorite-routes - Get all favorite routes
router.get('/favorite-routes', favoriteRouteController.getAllFavoriteRoutes);

// GET /favorite-routes/:id - Get favorite route by ID
router.get('/favorite-routes/:id', favoriteRouteController.getFavoriteRouteById);

// POST /favorite-routes - Create new favorite route
router.post('/favorite-routes', favoriteRouteController.createFavoriteRoute);

// PUT /favorite-routes/:id - Update favorite route by ID
router.put('/favorite-routes/:id', favoriteRouteController.updateFavoriteRoute);

// DELETE /favorite-routes/:id - Delete favorite route by ID
router.delete('/favorite-routes/:id', favoriteRouteController.deleteFavoriteRoute);

module.exports = router;
