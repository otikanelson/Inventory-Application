const NodeCache = require('node-cache');

// Initialize cache with configuration
const predictionCache = new NodeCache({
  stdTTL: 60,           // 60 seconds default TTL
  checkperiod: 10,      // Check for expired keys every 10 seconds
  useClones: false,     // Don't clone objects (better performance)
  deleteOnExpire: true  // Auto-delete expired keys
});

// Cache key generators
const CACHE_KEYS = {
  quickInsights: 'quick:insights',
  productPrediction: (id) => `product:${id}:prediction`,
  categoryInsights: (cat) => `category:${cat}:insights`,
  dashboardData: 'dashboard:data',
  batchPredictions: (ids) => `batch:${ids.sort().join(',')}`,
  allPredictions: 'all:predictions'
};

/**
 * Get cached data
 * @param {String} key - Cache key
 * @returns {*} Cached data or undefined
 */
const get = (key) => {
  try {
    const value = predictionCache.get(key);
    if (value !== undefined) {
      console.log(`Cache HIT: ${key}`);
    } else {
      console.log(`Cache MISS: ${key}`);
    }
    return value;
  } catch (error) {
    console.error(`Cache get error for ${key}:`, error);
    return undefined;
  }
};

/**
 * Set cached data
 * @param {String} key - Cache key
 * @param {*} value - Data to cache
 * @param {Number} ttl - Time to live in seconds (optional)
 * @returns {Boolean} Success status
 */
const set = (key, value, ttl) => {
  try {
    const success = predictionCache.set(key, value, ttl);
    if (success) {
      console.log(`Cache SET: ${key} (TTL: ${ttl || 'default'}s)`);
    }
    return success;
  } catch (error) {
    console.error(`Cache set error for ${key}:`, error);
    return false;
  }
};

/**
 * Delete cached data
 * @param {String} key - Cache key
 * @returns {Number} Number of deleted entries
 */
const del = (key) => {
  try {
    const deleted = predictionCache.del(key);
    if (deleted > 0) {
      console.log(`Cache DEL: ${key}`);
    }
    return deleted;
  } catch (error) {
    console.error(`Cache delete error for ${key}:`, error);
    return 0;
  }
};

/**
 * Delete multiple keys
 * @param {Array} keys - Array of cache keys
 * @returns {Number} Number of deleted entries
 */
const delMultiple = (keys) => {
  try {
    const deleted = predictionCache.del(keys);
    console.log(`Cache DEL multiple: ${deleted} keys deleted`);
    return deleted;
  } catch (error) {
    console.error('Cache delete multiple error:', error);
    return 0;
  }
};

/**
 * Invalidate prediction cache for a product
 * @param {String} productId - Product ID
 * @param {String} category - Product category
 */
const invalidatePredictionCache = (productId, category) => {
  const keysToDelete = [
    CACHE_KEYS.productPrediction(productId),
    CACHE_KEYS.quickInsights,
    CACHE_KEYS.dashboardData,
    CACHE_KEYS.allPredictions
  ];
  
  if (category) {
    keysToDelete.push(CACHE_KEYS.categoryInsights(category));
  }
  
  delMultiple(keysToDelete);
  console.log(`Invalidated cache for product ${productId}`);
};

/**
 * Invalidate all prediction caches
 */
const invalidateAllPredictions = () => {
  predictionCache.flushAll();
  console.log('All prediction caches invalidated');
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
const getStats = () => {
  return predictionCache.getStats();
};

/**
 * Get all cache keys
 * @returns {Array} Array of cache keys
 */
const getKeys = () => {
  return predictionCache.keys();
};

/**
 * Check if key exists in cache
 * @param {String} key - Cache key
 * @returns {Boolean} True if key exists
 */
const has = (key) => {
  return predictionCache.has(key);
};

/**
 * Get or set pattern (fetch from cache or compute and cache)
 * @param {String} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {Number} ttl - Time to live in seconds (optional)
 * @returns {Promise<*>} Cached or fetched data
 */
const getOrSet = async (key, fetchFn, ttl) => {
  try {
    // Try to get from cache
    const cached = get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Not in cache, fetch data
    console.log(`Fetching data for cache key: ${key}`);
    const data = await fetchFn();
    
    // Store in cache
    if (data !== undefined && data !== null) {
      set(key, data, ttl);
    }
    
    return data;
  } catch (error) {
    console.error(`getOrSet error for ${key}:`, error);
    throw error;
  }
};

/**
 * Warm up cache with frequently accessed data
 * @param {Function} warmupFn - Function to fetch warmup data
 */
const warmup = async (warmupFn) => {
  try {
    console.log('Starting cache warmup...');
    await warmupFn();
    console.log('Cache warmup completed');
  } catch (error) {
    console.error('Cache warmup error:', error);
  }
};

// Export cache service
module.exports = {
  // Core operations
  get,
  set,
  del,
  delMultiple,
  has,
  getOrSet,
  
  // Cache management
  invalidatePredictionCache,
  invalidateAllPredictions,
  warmup,
  
  // Utilities
  getStats,
  getKeys,
  
  // Cache key generators
  CACHE_KEYS
};
