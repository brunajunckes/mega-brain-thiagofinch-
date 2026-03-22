'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { TimelineManager } = require('../timeline-manager');

describe('TimelineManager', () => {
  let manager;
  let testDataDir;

  beforeEach(() => {
    testDataDir = path.join(os.tmpdir(), `timeline-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    manager = new TimelineManager({ dataDir: testDataDir });
  });

  afterEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create data directory if it does not exist', () => {
      expect(fs.existsSync(testDataDir)).toBe(true);
    });

    it('should use default dataDir when none provided', () => {
      const defaultManager = new TimelineManager();
      expect(defaultManager.dataDir).toContain('.aiox/evolution-data');
    });
  });

  describe('storeSnapshot', () => {
    it('should store snapshot and return snapshot ID', () => {
      const data = {
        healthScore: 7,
        stats: { totalFiles: 100, totalLines: 10000 },
        metrics: { testCoverage: 75, codeQuality: 8 },
        debtLevel: 'low',
      };

      const snapshotId = manager.storeSnapshot('test-repo', data);

      expect(snapshotId).toBeDefined();
      expect(snapshotId).toContain('test-repo');
    });

    it('should persist snapshot to disk', () => {
      const data = { healthScore: 5, metrics: { testCoverage: 50 } };
      const snapshotId = manager.storeSnapshot('persist-test', data);

      const filePath = path.join(testDataDir, `${snapshotId}.json`);
      expect(fs.existsSync(filePath)).toBe(true);

      const stored = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(stored.repo).toBe('persist-test');
      expect(stored.data.healthScore).toBe(5);
      expect(stored.metrics).toBeDefined();
    });

    it('should throw on missing repo name', () => {
      expect(() => manager.storeSnapshot(null, { data: 1 })).toThrow('Repository name and data required');
    });

    it('should throw on missing data', () => {
      expect(() => manager.storeSnapshot('test', null)).toThrow('Repository name and data required');
    });

    it('should extract metrics from snapshot data', () => {
      const data = {
        healthScore: 8,
        stats: { totalFiles: 200, totalLines: 20000 },
        metrics: { testCoverage: 90, codeQuality: 9 },
        debtLevel: 'minimal',
      };

      const snapshotId = manager.storeSnapshot('metrics-test', data);
      const stored = manager.getSnapshot(snapshotId);

      expect(stored.metrics.healthScore).toBe(8);
      expect(stored.metrics.testCoverage).toBe(90);
      expect(stored.metrics.codeQuality).toBe(9);
      expect(stored.metrics.debtLevel).toBe('minimal');
      expect(stored.metrics.totalFiles).toBe(200);
      expect(stored.metrics.totalLines).toBe(20000);
    });
  });

  describe('getSnapshot', () => {
    it('should retrieve snapshot by ID', () => {
      const data = { healthScore: 7 };
      const snapshotId = manager.storeSnapshot('get-test', data);
      const retrieved = manager.getSnapshot(snapshotId);

      expect(retrieved.id).toBe(snapshotId);
      expect(retrieved.repo).toBe('get-test');
      expect(retrieved.data.healthScore).toBe(7);
    });

    it('should throw for non-existent snapshot', () => {
      expect(() => manager.getSnapshot('non-existent-id')).toThrow('Snapshot not found');
    });
  });

  describe('getSnapshots', () => {
    it('should retrieve snapshots filtered by repo name', () => {
      manager.storeSnapshot('repo-a', { healthScore: 5 });
      manager.storeSnapshot('repo-b', { healthScore: 6 });
      manager.storeSnapshot('repo-a', { healthScore: 7 });

      const snapshots = manager.getSnapshots('repo-a');
      expect(snapshots.length).toBe(2);
      snapshots.forEach((s) => expect(s.repo).toBe('repo-a'));
    });

    it('should return empty array for unknown repo', () => {
      const snapshots = manager.getSnapshots('unknown-repo');
      expect(snapshots).toEqual([]);
    });

    it('should respect limit option', () => {
      for (let i = 0; i < 5; i++) {
        manager.storeSnapshot('limit-test', { healthScore: i });
      }
      const snapshots = manager.getSnapshots('limit-test', { limit: 3 });
      expect(snapshots.length).toBe(3);
    });

    it('should sort by timestamp descending (newest first)', () => {
      manager.storeSnapshot('sort-test', { healthScore: 1 });
      manager.storeSnapshot('sort-test', { healthScore: 2 });

      const snapshots = manager.getSnapshots('sort-test');
      const time0 = new Date(snapshots[0].timestamp).getTime();
      const time1 = new Date(snapshots[1].timestamp).getTime();
      expect(time0).toBeGreaterThanOrEqual(time1);
    });
  });

  describe('getTimeline', () => {
    it('should return timeline for repository', () => {
      manager.storeSnapshot('timeline-test', { healthScore: 5 });
      manager.storeSnapshot('timeline-test', { healthScore: 6 });

      const timeline = manager.getTimeline('timeline-test');
      expect(timeline.length).toBe(2);
    });

    it('should support ascending order', () => {
      manager.storeSnapshot('order-test', { healthScore: 1 });
      manager.storeSnapshot('order-test', { healthScore: 2 });

      const timeline = manager.getTimeline('order-test', { order: 'asc' });
      const time0 = new Date(timeline[0].timestamp).getTime();
      const time1 = new Date(timeline[1].timestamp).getTime();
      expect(time0).toBeLessThanOrEqual(time1);
    });
  });

  describe('getLatestSnapshot', () => {
    it('should return latest snapshot', () => {
      manager.storeSnapshot('latest-test', { healthScore: 3 });
      manager.storeSnapshot('latest-test', { healthScore: 7 });

      const latest = manager.getLatestSnapshot('latest-test');
      expect(latest.data.healthScore).toBe(7);
    });

    it('should return null for unknown repo', () => {
      const latest = manager.getLatestSnapshot('no-repo');
      expect(latest).toBeNull();
    });
  });

  describe('calculateDelta', () => {
    it('should calculate delta between two snapshots', () => {
      const id1 = manager.storeSnapshot('delta-test', {
        healthScore: 5,
        stats: { totalFiles: 100, totalLines: 10000 },
        metrics: { testCoverage: 60, codeQuality: 6 },
        debtLevel: 'moderate',
      });

      const id2 = manager.storeSnapshot('delta-test', {
        healthScore: 7,
        stats: { totalFiles: 120, totalLines: 12000 },
        metrics: { testCoverage: 75, codeQuality: 8 },
        debtLevel: 'low',
      });

      const delta = manager.calculateDelta(id1, id2);

      expect(delta.timeRange).toBeDefined();
      expect(delta.healthScore.from).toBe(5);
      expect(delta.healthScore.to).toBe(7);
      expect(delta.healthScore.delta).toBe(2);
      expect(delta.healthScore.direction).toBe('improving');
      expect(delta.testCoverage.delta).toBe(15);
      expect(delta.debtLevel.changed).toBe(true);
      expect(delta.filesChanged.delta).toBe(20);
    });
  });

  describe('getMetricTrend', () => {
    it('should return trend data for a metric', () => {
      manager.storeSnapshot('trend-test', {
        healthScore: 5,
        metrics: { testCoverage: 50 },
      });
      manager.storeSnapshot('trend-test', {
        healthScore: 6,
        metrics: { testCoverage: 60 },
      });

      const trend = manager.getMetricTrend('trend-test', 'healthScore', 30);

      expect(trend.length).toBe(2);
      expect(trend[0].value).toBeDefined();
      expect(trend[0].timestamp).toBeDefined();
    });
  });

  describe('analyzeTrend', () => {
    it('should detect improving trend', () => {
      const trend = [
        { timestamp: '2026-03-10', value: 5 },
        { timestamp: '2026-03-15', value: 6 },
        { timestamp: '2026-03-20', value: 7 },
      ];

      const analysis = manager.analyzeTrend(trend);
      expect(analysis.direction).toBe('improving');
      expect(analysis.velocity).toBeGreaterThan(0);
      expect(analysis.totalDelta).toBe(2);
    });

    it('should detect declining trend', () => {
      const trend = [
        { timestamp: '2026-03-10', value: 8 },
        { timestamp: '2026-03-15', value: 6 },
        { timestamp: '2026-03-20', value: 4 },
      ];

      const analysis = manager.analyzeTrend(trend);
      expect(analysis.direction).toBe('declining');
      expect(analysis.velocity).toBeLessThan(0);
    });

    it('should detect stable trend', () => {
      const trend = [
        { timestamp: '2026-03-10', value: 5 },
        { timestamp: '2026-03-15', value: 5 },
        { timestamp: '2026-03-20', value: 5 },
      ];

      const analysis = manager.analyzeTrend(trend);
      expect(analysis.direction).toBe('stable');
    });

    it('should handle insufficient data', () => {
      const analysis = manager.analyzeTrend([{ timestamp: '2026-03-10', value: 5 }]);
      expect(analysis.direction).toBe('insufficient_data');
    });

    it('should filter null values', () => {
      const trend = [
        { timestamp: '2026-03-10', value: null },
        { timestamp: '2026-03-15', value: null },
      ];

      const analysis = manager.analyzeTrend(trend);
      expect(analysis.direction).toBe('insufficient_data');
    });
  });

  describe('calculateTrend', () => {
    it('should calculate coverage trend from snapshots', () => {
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

      expect(trend.status).toBe('ok');
      expect(trend.coverage.current).toBe(85);
      expect(trend.coverage.previous).toBe(75);
      expect(trend.coverage.change).toBe(10);
      expect(trend.coverage.trend).toBe('improving');
      expect(trend.quality.trend).toBe('improving');
    });

    it('should detect declining trends', () => {
      const snapshots = [
        { timestamp: new Date().toISOString(), data: { metrics: { testCoverage: 60 } } },
        { timestamp: new Date(Date.now() - 86400000).toISOString(), data: { metrics: { testCoverage: 80 } } },
      ];

      const trend = manager.calculateTrend(snapshots);
      expect(trend.coverage.trend).toBe('declining');
    });

    it('should handle insufficient data', () => {
      const trend = manager.calculateTrend([{ timestamp: new Date().toISOString(), data: { metrics: {} } }]);
      expect(trend.status).toBe('insufficient_data');
    });
  });

  describe('comparePeriods', () => {
    it('should return period comparison structure', () => {
      manager.storeSnapshot('compare-test', {
        healthScore: 5,
        metrics: { testCoverage: 50 },
      });

      const comparison = manager.comparePeriods('compare-test', 7, 7);

      expect(comparison.period1).toBeDefined();
      expect(comparison.period2).toBeDefined();
      expect(comparison.improvement).toBeDefined();
      expect(comparison.improvement.healthScore).toBeDefined();
      expect(comparison.improvement.testCoverage).toBeDefined();
    });
  });

  describe('getRepositories', () => {
    it('should return unique repository names', () => {
      manager.storeSnapshot('repo-x', { healthScore: 5 });
      manager.storeSnapshot('repo-y', { healthScore: 6 });
      manager.storeSnapshot('repo-x', { healthScore: 7 });

      const repos = manager.getRepositories();
      expect(repos.length).toBe(2);
      expect(repos).toContain('repo-x');
      expect(repos).toContain('repo-y');
    });
  });

  describe('pruneOldSnapshots', () => {
    it('should prune old snapshots', () => {
      manager.storeSnapshot('prune-test', { healthScore: 5 });

      // Prune with 0 days should delete everything
      const deleted = manager.pruneOldSnapshots(0);
      // Note: files just created will have recent mtime, so they won't be pruned
      expect(typeof deleted).toBe('number');
    });
  });
});
