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

module.exports = {
  authRoutes,
  userRoutes,
  destinationRoutes,
  tripRoutes,
  favoriteRouteRoutes,
  weatherRoutes
};
