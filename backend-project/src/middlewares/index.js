/**
 * Middlewares Index
 * Central export point for all middlewares
 */

const { cacheMiddleware, invalidateCache, invalidateCacheKey, clearCache, getCacheStats } = require('./cache');
const corsMiddleware = require('./cors');
const { notFoundHandler, errorHandler } = require('./errorHandler');
const requestLogger = require('./requestLogger');
const { authenticate, isAdmin, isAdminOrOwner } = require('./auth');

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateCacheKey,
  clearCache,
  getCacheStats,
  corsMiddleware,
  notFoundHandler,
  errorHandler,
  requestLogger,
  authenticate,
  isAdmin,
  isAdminOrOwner
};
