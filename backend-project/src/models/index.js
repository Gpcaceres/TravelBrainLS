/**
 * Models Index
 * Central export point for all models
 */

const User = require('./User');
const Destination = require('./Destination');
const Trip = require('./Trip');
const FavoriteRoute = require('./FavoriteRoute');
const Weather = require('./Weather');

module.exports = {
  User,
  Destination,
  Trip,
  FavoriteRoute,
  Weather
};
