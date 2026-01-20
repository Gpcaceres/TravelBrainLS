const express = require('express');
const router = express.Router();
const favoriteRouteController = require('../controllers/favoriteRouteController');
const { authenticate } = require('../middlewares/auth');

/**
 * Favorite Route Routes
 * Todas las rutas requieren autenticación
 */

// GET /favorite-routes - Get all favorite routes
router.get('/favorite-routes', authenticate, favoriteRouteController.getAllFavoriteRoutes);

// GET /favorite-routes/:id - Get favorite route by ID
router.get('/favorite-routes/:id', authenticate, favoriteRouteController.getFavoriteRouteById);

// POST /favorite-routes - Create new favorite route
router.post('/favorite-routes', authenticate, favoriteRouteController.createFavoriteRoute);

// PUT /favorite-routes/:id - Update favorite route by ID
router.put('/favorite-routes/:id', authenticate, favoriteRouteController.updateFavoriteRoute);

// DELETE /favorite-routes/:id - Delete favorite route by ID
router.delete('/favorite-routes/:id', authenticate, favoriteRouteController.deleteFavoriteRoute);

module.exports = router;
