'use strict';

const fs = require('fs');
const path = require('path');
const { TimelineManager } = require('../timeline-manager');

describe('TimelineManager', () => {
  let manager;
  const testDataDir = path.join(__dirname, '.test-data');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  beforeEach(() => {
    manager = new TimelineManager({ dataDir: testDataDir });
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      files.forEach((f) => {
        fs.unlinkSync(path.join(testDataDir, f));
      });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDataDir)) {
      fs.rmdirSync(testDataDir);
    }
  });

  describe('snapshot storage', () => {
    it('should store snapshot successfully', async () => {
      const data = {
        repository: { name: 'test-repo' },
        metrics: { testCoverage: 75 },
        summary: { totalFiles: 100 },
      };

      const snapshotId = await manager.storeSnapshot('test-repo', data);

      expect(snapshotId).toBeDefined();
      expect(snapshotId).toContain('test-repo');
    });

    it('should retrieve stored snapshots', async () => {
      const data = {
        repository: { name: 'test-repo' },
        metrics: { testCoverage: 75 },
        summary: { totalFiles: 100 },
      };

      await manager.storeSnapshot('test-repo', data);
      const snapshots = await manager.getSnapshots('test-repo');

      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0].repository).toBe('test-repo');
    });

    it('should get latest snapshot', async () => {
      const data1 = {
        repository: { name: 'test-repo' },
        metrics: { testCoverage: 70 },
      };
      const data2 = {
        repository: { name: 'test-repo' },
        metrics: { testCoverage: 80 },
      };

      await manager.storeSnapshot('test-repo', data1);
      await new Promise((r) => setTimeout(r, 10));
      await manager.storeSnapshot('test-repo', data2);

      const latest = await manager.getLatestSnapshot('test-repo');

      expect(latest.data.metrics.testCoverage).toBe(80);
    });
  });

  describe('trend calculation', () => {
    it('should calculate coverage trend', async () => {
      const snapshots = [
        {
          timestamp: new Date().toISOString(),
          data: { metrics: { testCoverage: 85, codeQuality: 9 }, summary: { totalFiles: 120 } },
        },
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          data: { metrics: { testCoverage: 75, codeQuality: 8 }, summary: { totalFiles: 100 } },
        },
      ];

      const trend = manager.calculateTrend(snapshots);

      expect(trend.coverage.current).toBe(85);
      expect(trend.coverage.previous).toBe(75);
      expect(trend.coverage.change).toBe(10);
      expect(trend.coverage.trend).toBe('improving');
    });

    it('should detect declining trends', async () => {
      const snapshots = [
        {
          timestamp: new Date().toISOString(),
          data: { metrics: { testCoverage: 60 } },
        },
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          data: { metrics: { testCoverage: 80 } },
        },
      ];

      const trend = manager.calculateTrend(snapshots);

      expect(trend.coverage.trend).toBe('declining');
      expect(trend.coverage.change).toBe(-20);
    });

    it('should handle insufficient data', () => {
      const snapshots = [
        {
          timestamp: new Date().toISOString(),
          data: { metrics: { testCoverage: 75 } },
        },
      ];

      const trend = manager.calculateTrend(snapshots);

      expect(trend.status).toBe('insufficient_data');
    });
  });

  describe('repository management', () => {
    it('should get all repositories', async () => {
      await manager.storeSnapshot('repo-1', { metrics: {} });
      await manager.storeSnapshot('repo-2', { metrics: {} });

      const repos = await manager.getRepositories();

      expect(repos.length).toBe(2);
      expect(repos).toContain('repo-1');
      expect(repos).toContain('repo-2');
    });
  });

  describe('error handling', () => {
    it('should throw on missing data', async () => {
      await expect(manager.storeSnapshot('test', null)).rejects.toThrow();
    });

    it('should handle missing repository gracefully', async () => {
      const snapshots = await manager.getSnapshots('non-existent-repo');
      expect(snapshots).toEqual([]);
    });
  });
});
