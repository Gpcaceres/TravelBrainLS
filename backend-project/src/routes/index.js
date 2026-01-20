/**
 * Routes Index
 * Central export point for all routes
 */

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const destinationRoutes = require('./destinationRoutes');
const tripRoutes = require('./tripRoutes');
const favoriteRouteRoutes = require('./favoriteRouteRoutes');
const weatherRoutes = require('./weatherRoutes');
const biometricRoutes = require('./biometricRoutes');
const itineraryRoutes = require('./itineraryRoutes');

module.exports = {
  authRoutes,
  userRoutes,
  destinationRoutes,
  tripRoutes,
  favoriteRouteRoutes,
  weatherRoutes,
  biometricRoutes,
  itineraryRoutes
};
