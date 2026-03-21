/**
 * Cache Manager Tests
 */

const CacheManager = require('../cache-manager');
const {
  TaskResultCache,
  CheckpointCache,
  GateValidationCache,
  CompositeCache
} = require('../cache-strategies');

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 100, defaultTTL: 5000 });
  });

  describe('Basic Operations', () => {
    it('should set and get value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should check key existence', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete key', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('TTL Management', () => {
    it('should expire key after TTL', (done) => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');

      setTimeout(() => {
        expect(cache.get('key1')).toBeNull();
        done();
      }, 150);
    });

    it('should use default TTL', (done) => {
      cache.set('key1', 'value1'); // Use default 5000ms
      expect(cache.get('key1')).toBe('value1');

      setTimeout(() => {
        expect(cache.get('key1')).toBe('value1');
      }, 100);

      done();
    });
  });

  describe('LRU Eviction', () => {
    it('should evict LRU item when cache is full', () => {
      const smallCache = new CacheManager({ maxSize: 3 });
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // Access key1 to update LRU order
      smallCache.get('key1');

      // Add new key, should evict key2 (least recently used)
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1');
      expect(smallCache.get('key2')).toBeNull(); // Evicted
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.get('key4')).toBe('value4');
    });

    it('should track evictions', () => {
      const smallCache = new CacheManager({ maxSize: 1 });
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2'); // Evicts key1

      expect(smallCache.getStats().evictions).toBe(1);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBe(0.5);
    });

    it('should calculate utilization ratio', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.utilizationRatio).toBe(2 / 100);
    });
  });

  describe('Cache Operations', () => {
    it('should clear cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const cleared = cache.clear();
      expect(cleared).toBe(2);
      expect(cache.size()).toBe(0);
    });

    it('should warm cache', () => {
      const data = { key1: 'value1', key2: 'value2' };
      const count = cache.warm(data);

      expect(count).toBe(2);
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });

    it('should return cache keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const keys = cache.keys();
      expect(keys.length).toBe(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('Cache Metadata', () => {
    it('should get cache metadata', () => {
      cache.set('key1', 'value1', 1000);
      const metadata = cache.getMetadata('key1');

      expect(metadata).toBeDefined();
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.expiresAt).toBeDefined();
      expect(metadata.ttl).toBe(1000);
    });
  });

  describe('Events', () => {
    it('should emit cache-hit event', (done) => {
      cache.set('key1', 'value1');
      cache.on('cache-hit', ({ key }) => {
        expect(key).toBe('key1');
        done();
      });
      cache.get('key1');
    });

    it('should emit cache-miss event', (done) => {
      cache.on('cache-miss', ({ key }) => {
        expect(key).toBe('non-existent');
        done();
      });
      cache.get('non-existent');
    });
  });
});

describe('TaskResultCache', () => {
  let cache;

  beforeEach(() => {
    cache = new TaskResultCache();
  });

  it('should cache task results', () => {
    const result = { output: 'success' };
    cache.cacheTaskResult('task-1', 'hash123', result);

    const cached = cache.getTaskResult('task-1', 'hash123');
    expect(cached).toEqual(result);
  });

  it('should invalidate task result', () => {
    cache.cacheTaskResult('task-1', 'hash123', { output: 'success' });
    cache.invalidateTaskResult('task-1', 'hash123');

    expect(cache.getTaskResult('task-1', 'hash123')).toBeNull();
  });
});

describe('CheckpointCache', () => {
  let cache;

  beforeEach(() => {
    cache = new CheckpointCache();
  });

  it('should cache checkpoints', () => {
    const checkpoint = { step: 1, data: 'checkpoint-data' };
    cache.cacheCheckpoint('exec-1', 0, checkpoint);

    const cached = cache.getCheckpoint('exec-1', 0);
    expect(cached).toEqual(checkpoint);
  });

  it('should invalidate all checkpoints for execution', () => {
    cache.cacheCheckpoint('exec-1', 0, { step: 0 });
    cache.cacheCheckpoint('exec-1', 1, { step: 1 });
    cache.cacheCheckpoint('exec-2', 0, { step: 0 });

    const invalidated = cache.invalidateExecution('exec-1');
    expect(invalidated).toBe(2);
    expect(cache.getCheckpoint('exec-1', 0)).toBeNull();
    expect(cache.getCheckpoint('exec-2', 0)).toBeDefined();
  });
});

describe('CompositeCache', () => {
  let cache;

  beforeEach(() => {
    cache = new CompositeCache();
  });

  it('should manage multiple caches', () => {
    cache.taskResultCache.cacheTaskResult('task-1', 'hash', { result: 'ok' });
    cache.checkpointCache.cacheCheckpoint('exec-1', 0, { step: 0 });

    expect(cache.taskResultCache.getTaskResult('task-1', 'hash')).toBeDefined();
    expect(cache.checkpointCache.getCheckpoint('exec-1', 0)).toBeDefined();
  });

  it('should get all statistics', () => {
    cache.taskResultCache.set('key1', 'value1');
    cache.taskResultCache.get('key1'); // Hit

    const stats = cache.getAllStats();
    expect(stats.totalHits).toBeGreaterThan(0);
  });

  it('should clear all caches', () => {
    cache.taskResultCache.set('key1', 'value1');
    cache.checkpointCache.set('key2', 'value2');

    const cleared = cache.clearAll();
    expect(cleared.taskResult).toBe(1);
    expect(cleared.checkpoint).toBe(1);
  });

  it('should warm all caches', () => {
    const data = {
      taskResults: { key1: 'value1' },
      checkpoints: { key2: 'value2' }
    };

    cache.warmAll(data);
    expect(cache.taskResultCache.get('key1')).toBe('value1');
    expect(cache.checkpointCache.get('key2')).toBe('value2');
  });
});
