/**
 * Cache Strategies - Different caching patterns for orchestration
 * @module core/orchestration/cache-strategies
 * @version 1.0.0
 */

const CacheManager = require('./cache-manager');

/**
 * Task Result Cache - Caches task execution results
 */
class TaskResultCache extends CacheManager {
  constructor(options = {}) {
    super({
      maxSize: options.maxSize || 500,
      defaultTTL: options.defaultTTL || 3600000, // 1 hour
      ...options
    });
    this.name = 'TaskResultCache';
  }

  /**
   * Get cached task result
   */
  getTaskResult(taskId, contextHash) {
    const key = this.generateKey('task-result', taskId, contextHash);
    return this.get(key);
  }

  /**
   * Cache task result
   */
  cacheTaskResult(taskId, contextHash, result, ttl) {
    const key = this.generateKey('task-result', taskId, contextHash);
    this.set(key, result, ttl);
    return key;
  }

  /**
   * Invalidate task result
   */
  invalidateTaskResult(taskId, contextHash) {
    const key = this.generateKey('task-result', taskId, contextHash);
    return this.delete(key);
  }

  /**
   * Invalidate all results for a task
   */
  invalidateTaskAll(taskId) {
    const keysToDelete = this.keys().filter(k => k.startsWith(`task-result:["${taskId}"`));
    keysToDelete.forEach(k => this.delete(k));
    return keysToDelete.length;
  }
}

/**
 * Checkpoint Cache - Caches checkpoint data for fast retrieval
 */
class CheckpointCache extends CacheManager {
  constructor(options = {}) {
    super({
      maxSize: options.maxSize || 100,
      defaultTTL: options.defaultTTL || 86400000, // 24 hours
      ...options
    });
    this.name = 'CheckpointCache';
  }

  /**
   * Get cached checkpoint
   */
  getCheckpoint(executionId, stepNumber) {
    const key = this.generateKey('checkpoint', executionId, stepNumber);
    return this.get(key);
  }

  /**
   * Cache checkpoint
   */
  cacheCheckpoint(executionId, stepNumber, checkpoint, ttl) {
    const key = this.generateKey('checkpoint', executionId, stepNumber);
    this.set(key, checkpoint, ttl);
    return key;
  }

  /**
   * Invalidate checkpoint
   */
  invalidateCheckpoint(executionId, stepNumber) {
    const key = this.generateKey('checkpoint', executionId, stepNumber);
    return this.delete(key);
  }

  /**
   * Invalidate all checkpoints for execution
   */
  invalidateExecution(executionId) {
    const keysToDelete = this.keys().filter(k => k.startsWith(`checkpoint:["${executionId}"`));
    keysToDelete.forEach(k => this.delete(k));
    return keysToDelete.length;
  }
}

/**
 * Gate Validation Cache - Caches gate validation results
 */
class GateValidationCache extends CacheManager {
  constructor(options = {}) {
    super({
      maxSize: options.maxSize || 200,
      defaultTTL: options.defaultTTL || 300000, // 5 minutes
      ...options
    });
    this.name = 'GateValidationCache';
  }

  /**
   * Get cached gate validation
   */
  getValidation(branch, filesHash, qualityHash) {
    const key = this.generateKey('gate-validation', branch, filesHash, qualityHash);
    return this.get(key);
  }

  /**
   * Cache gate validation
   */
  cacheValidation(branch, filesHash, qualityHash, result, ttl) {
    const key = this.generateKey('gate-validation', branch, filesHash, qualityHash);
    this.set(key, result, ttl);
    return key;
  }

  /**
   * Invalidate all validations for a branch
   */
  invalidateBranch(branch) {
    const keysToDelete = this.keys().filter(k => k.startsWith(`gate-validation:["${branch}"`));
    keysToDelete.forEach(k => this.delete(k));
    return keysToDelete.length;
  }
}

/**
 * Composite Cache - Manages multiple caches
 */
class CompositeCache {
  constructor(options = {}) {
    this.taskResultCache = new TaskResultCache(options.taskResult || {});
    this.checkpointCache = new CheckpointCache(options.checkpoint || {});
    this.gateValidationCache = new GateValidationCache(options.gateValidation || {});
    this.stats = {};
  }

  /**
   * Get statistics from all caches
   */
  getAllStats() {
    return {
      taskResult: this.taskResultCache.getStats(),
      checkpoint: this.checkpointCache.getStats(),
      gateValidation: this.gateValidationCache.getStats(),
      totalHits:
        this.taskResultCache.stats.hits +
        this.checkpointCache.stats.hits +
        this.gateValidationCache.stats.hits,
      totalMisses:
        this.taskResultCache.stats.misses +
        this.checkpointCache.stats.misses +
        this.gateValidationCache.stats.misses
    };
  }

  /**
   * Clear all caches
   */
  clearAll() {
    return {
      taskResult: this.taskResultCache.clear(),
      checkpoint: this.checkpointCache.clear(),
      gateValidation: this.gateValidationCache.clear()
    };
  }

  /**
   * Warm all caches with initial data
   */
  warmAll(data) {
    const results = {};
    if (data.taskResults) {
      results.taskResult = this.taskResultCache.warm(data.taskResults);
    }
    if (data.checkpoints) {
      results.checkpoint = this.checkpointCache.warm(data.checkpoints);
    }
    if (data.gateValidations) {
      results.gateValidation = this.gateValidationCache.warm(data.gateValidations);
    }
    return results;
  }
}

module.exports = {
  CacheManager,
  TaskResultCache,
  CheckpointCache,
  GateValidationCache,
  CompositeCache
};
