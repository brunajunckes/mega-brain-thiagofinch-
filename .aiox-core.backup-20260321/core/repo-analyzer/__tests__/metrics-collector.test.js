'use strict';

const fs = require('fs-extra');
const path = require('path');
const { MetricsCollector } = require('../metrics-collector');

describe('MetricsCollector', () => {
  let testDir;
  let collector;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-metrics');
    await fs.ensureDir(testDir);
    collector = new MetricsCollector({ rootPath: testDir });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create collector with custom root path', () => {
      expect(collector.rootPath).toBe(testDir);
    });

    it('should initialize empty metrics', () => {
      expect(collector.metrics.avgFunctionLength).toBe(0);
      expect(collector.metrics.testCoverage).toBe(0);
    });
  });

  describe('function length measurement', () => {
    it('should measure average function length', async () => {
      const jsCode = `
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  const result = a * b;
  return result;
}`;
      await fs.writeFile(path.join(testDir, 'math.js'), jsCode);

      const result = await collector.collect();

      expect(result.metrics.avgFunctionLength).toBeGreaterThan(0);
    });
  });

  describe('complexity estimation', () => {
    it('should estimate low complexity', async () => {
      const jsCode = `
function simple() {
  return 42;
}`;
      await fs.writeFile(path.join(testDir, 'simple.js'), jsCode);

      const result = await collector.collect();

      expect(result.metrics.complexityScore).toBe('low');
    });

    it('should estimate high complexity', async () => {
      const jsCode = `
function complex() {
  if (x) {
    if (y) {
      for (let i = 0; i < 10; i++) {
        if (i > 5) {
          switch (i) {
            case 6: break;
            case 7: break;
          }
        }
      }
    }
  }
}`;
      await fs.writeFile(path.join(testDir, 'complex.js'), jsCode);

      const result = await collector.collect();

      expect(['high', 'medium']).toContain(result.metrics.complexityScore);
    });
  });

  describe('test coverage detection', () => {
    it('should detect test files', async () => {
      await fs.writeFile(path.join(testDir, 'app.js'), 'code');
      await fs.writeFile(path.join(testDir, 'app.test.js'), 'test');

      const result = await collector.collect();

      expect(result.metrics.testCoverage).toBeGreaterThan(0);
    });

    it('should handle multiple test files', async () => {
      await fs.writeFile(path.join(testDir, 'user.js'), 'code');
      await fs.writeFile(path.join(testDir, 'user.test.js'), 'test');
      await fs.writeFile(path.join(testDir, 'auth.js'), 'code');
      await fs.writeFile(path.join(testDir, 'auth.test.js'), 'test');

      const result = await collector.collect();

      expect(result.metrics.testCoverage).toBeGreaterThan(0);
    });
  });

  describe('documentation ratio', () => {
    it('should measure documentation', async () => {
      const jsCode = `
// This is a comment
function doSomething() {
  // Another comment
  return true;
}`;
      await fs.writeFile(path.join(testDir, 'documented.js'), jsCode);

      const result = await collector.collect();

      expect(result.metrics.documentationRatio).toBeGreaterThan(0);
    });
  });

  describe('code quality scoring', () => {
    it('should generate quality score', async () => {
      const jsCode = 'function test() { return 1; }';
      await fs.writeFile(path.join(testDir, 'test.js'), jsCode);

      const result = await collector.collect();

      expect(result.summary.codeQuality).toBeGreaterThanOrEqual(1);
      expect(result.summary.codeQuality).toBeLessThanOrEqual(10);
    });

    it('should generate recommendations', async () => {
      const jsCode = 'function test() { return 1; }';
      await fs.writeFile(path.join(testDir, 'test.js'), jsCode);

      const result = await collector.collect();

      expect(Array.isArray(result.summary.recommendations)).toBe(true);
    });
  });

  describe('dead code estimation', () => {
    it('should detect empty functions', async () => {
      const jsCode = 'function empty() {}';
      await fs.writeFile(path.join(testDir, 'dead.js'), jsCode);

      const result = await collector.collect();

      expect(['none', 'low', 'medium', 'high']).toContain(result.metrics.deadCodeEstimate);
    });
  });

  describe('report generation', () => {
    it('should generate metrics report', async () => {
      const jsCode = 'function test() { return 1; }';
      await fs.writeFile(path.join(testDir, 'test.js'), jsCode);

      const result = await collector.collect();

      expect(result.timestamp).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle empty repository', async () => {
      const result = await collector.collect();

      expect(result.metrics).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('getter methods', () => {
    it('getMetrics should return collected metrics', async () => {
      await fs.writeFile(path.join(testDir, 'test.js'), 'code');
      await collector.collect();

      const metrics = collector.getMetrics();

      expect(metrics.avgFunctionLength).toBeDefined();
      expect(metrics.complexityScore).toBeDefined();
      expect(metrics.testCoverage).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle collection on non-existent path', async () => {
      const collector2 = new MetricsCollector({ rootPath: '/nonexistent/path' });
      // Should not throw, just return empty metrics
      const result = await collector2.collect();
      expect(result).toBeDefined();
    });
  });
});
