/**
 * Cache Manager - LRU cache with TTL invalidation
 * @module core/orchestration/cache-manager
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * CacheManager - In-memory cache with LRU eviction and TTL
 */
class CacheManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour
    this.cache = new Map();
    this.accessOrder = []; // For LRU tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(namespace, ...args) {
    return `${namespace}:${JSON.stringify(args)}`;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU();
    }

    // Set up TTL expiration
    let timeout = null;
    if (ttl > 0) {
      timeout = setTimeout(() => {
        this.cache.delete(key);
        const idx = this.accessOrder.indexOf(key);
        if (idx !== -1) {
          this.accessOrder.splice(idx, 1);
        }
        this.stats.expirations++;
        this.emit('cache-expired', { key });
      }, ttl);
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      timeout,
      ttl
    });

    // Update LRU order
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }
    this.accessOrder.push(key);

    this.emit('cache-set', { key, ttl });
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.emit('cache-miss', { key });
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      const idx = this.accessOrder.indexOf(key);
      if (idx !== -1) {
        this.accessOrder.splice(idx, 1);
      }
      this.stats.expirations++;
      this.emit('cache-expired', { key });
      return null;
    }

    // Update LRU order
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }
    this.accessOrder.push(key);

    this.stats.hits++;
    this.emit('cache-hit', { key });

    return entry.value;
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const entry = this.cache.get(key);
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry && entry.timeout) {
      clearTimeout(entry.timeout);
    }

    const result = this.cache.delete(key);
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }

    if (result) {
      this.emit('cache-deleted', { key });
    }

    return result;
  }

  /**
   * Evict least recently used item
   */
  _evictLRU() {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder.shift();
    const entry = this.cache.get(lruKey);

    if (entry && entry.timeout) {
      clearTimeout(entry.timeout);
    }

    this.cache.delete(lruKey);
    this.stats.evictions++;

    this.emit('cache-evicted', { key: lruKey, reason: 'LRU' });
  }

  /**
   * Clear entire cache
   */
  clear() {
    for (const [, entry] of this.cache.entries()) {
      if (entry.timeout) {
        clearTimeout(entry.timeout);
      }
    }

    const cleared = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];

    this.emit('cache-cleared', { clearedCount: cleared });

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRatio = total > 0 ? this.stats.hits / total : 0;

    return {
      ...this.stats,
      currentSize: this.cache.size,
      maxSize: this.maxSize,
      hitRatio,
      utilizationRatio: this.cache.size / this.maxSize
    };
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get all cached keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Warm cache with initial data
   */
  warm(data, ttl = this.defaultTTL) {
    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value, ttl);
      count++;
    }
    this.emit('cache-warmed', { count });
    return count;
  }

  /**
   * Get cache entry metadata
   */
  getMetadata(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    return {
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      ttl: entry.ttl,
      age: Date.now() - entry.createdAt
    };
  }
}

module.exports = CacheManager;
