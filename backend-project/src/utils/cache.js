const NodeCache = require('node-cache');

// Create cache instance with default configuration
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Don't clone objects for better performance
});

// Monitoring logs
cache.on('set', (key, value) => {
  console.log(`📦 Cache SET: ${key}`);
});

cache.on('del', (key, value) => {
  console.log(`🗑️  Cache DEL: ${key}`);
});

cache.on('expired', (key, value) => {
  console.log(`⏰ Cache EXPIRED: ${key}`);
});

/**
 * Invalidate cache by key pattern
 * @param {string} pattern - Pattern to search (e.g., '/users')
 */
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
    console.log(`🔄 Cache invalidated: ${keysToDelete.length} keys removed for pattern '${pattern}'`);
  }
};

/**
 * Invalidate a specific cache key
 * @param {string} key - Exact key to remove
 */
const invalidateCacheKey = (key) => {
  const deleted = cache.del(key);
  if (deleted) {
    console.log(`🔄 Cache key invalidated: ${key}`);
  }
};

/**
 * Clear all cache
 */
const clearCache = () => {
  cache.flushAll();
  console.log(`🧹 Cache completely cleared`);
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cache,
  invalidateCache,
  invalidateCacheKey,
  clearCache,
  getCacheStats
};
