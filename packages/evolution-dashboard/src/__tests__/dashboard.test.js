'use strict';

const TimelineManager = require('../timeline-manager');
const MetricsAggregator = require('../metrics-aggregator');
const DashboardCLI = require('../dashboard-cli');

describe('Evolution Dashboard', () => {
  let timelineManager;
  let aggregator;
  let cli;

  beforeEach(() => {
    timelineManager = new TimelineManager({ storageDir: '/tmp/evolution-dashboard-test' });
    aggregator = new MetricsAggregator(timelineManager);
    cli = new DashboardCLI(aggregator);
  });

  describe('TimelineManager', () => {
    test('should store and retrieve snapshots', () => {
      const mockSnapshot = {
        healthScore: 7.5,
        stats: { totalFiles: 100, totalLines: 10000 },
        metrics: { testCoverage: 75, codeQuality: 8 },
        debtLevel: 'low',
      };

      const snapshotId = timelineManager.storeSnapshot('test-repo', mockSnapshot);
      expect(snapshotId).toBeDefined();

      const retrieved = timelineManager.getSnapshot(snapshotId);
      expect(retrieved.repo).toBe('test-repo');
      expect(retrieved.data.healthScore).toBe(7.5);
    });

    test('should calculate delta between snapshots', () => {
      const snap1 = {
        healthScore: 6,
        stats: { totalFiles: 100, totalLines: 10000 },
        metrics: { testCoverage: 60, codeQuality: 6 },
        debtLevel: 'moderate',
      };

      const snap2 = {
        healthScore: 7,
        stats: { totalFiles: 110, totalLines: 11000 },
        metrics: { testCoverage: 70, codeQuality: 7 },
        debtLevel: 'low',
      };

      const id1 = timelineManager.storeSnapshot('delta-test', snap1);
      const id2 = timelineManager.storeSnapshot('delta-test', snap2);

      const delta = timelineManager.calculateDelta(id1, id2);
      expect(delta).toBeDefined();
      expect(delta.timeRange).toBeDefined();
      expect(delta.healthScore).toBeDefined();
    });

    test('should retrieve timeline for repository', () => {
      const snapshot = {
        healthScore: 5,
        stats: { totalFiles: 50, totalLines: 5000 },
        metrics: { testCoverage: 50, codeQuality: 5 },
        debtLevel: 'moderate',
      };

      timelineManager.storeSnapshot('timeline-test', snapshot);
      timelineManager.storeSnapshot('timeline-test', snapshot);

      const timeline = timelineManager.getTimeline('timeline-test', { limit: 10 });
      expect(timeline.length).toBeGreaterThanOrEqual(1);
    });

    test('should analyze trends', () => {
      const trend = [
        { timestamp: '2026-03-10', value: 5 },
        { timestamp: '2026-03-15', value: 6 },
        { timestamp: '2026-03-20', value: 7 },
      ];

      const analysis = timelineManager.analyzeTrend(trend);
      expect(analysis.direction).toBe('improving');
      expect(analysis.velocity).toBeGreaterThan(0);
    });
  });

  describe('MetricsAggregator', () => {
    test('should aggregate health trends', () => {
      const snap1 = {
        healthScore: 5,
        stats: { totalFiles: 50 },
        metrics: { testCoverage: 50, codeQuality: 5 },
        debtLevel: 'moderate',
      };

      const snap2 = {
        healthScore: 6,
        stats: { totalFiles: 60 },
        metrics: { testCoverage: 60, codeQuality: 6 },
        debtLevel: 'low',
      };

      timelineManager.storeSnapshot('health-test', snap1);
      timelineManager.storeSnapshot('health-test', snap2);

      const trends = aggregator.getHealthTrends('health-test', 30);
      expect(trends.metric).toBe('healthScore');
      expect(trends.trend).toBeDefined();
      expect(trends.analysis).toBeDefined();
    });

    test('should get health report', () => {
      const snapshot = {
        healthScore: 7,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 80, codeQuality: 8 },
        debtLevel: 'low',
      };

      timelineManager.storeSnapshot('report-test', snapshot);
      const report = aggregator.getHealthReport('report-test');

      expect(report.repository).toBe('report-test');
      expect(report.overallStatus).toBeDefined();
      expect(report.healthScore).toBeDefined();
    });

    test('should predict health score', () => {
      const snapshot = {
        healthScore: 6,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 70, codeQuality: 6 },
        debtLevel: 'moderate',
      };

      for (let i = 0; i < 5; i += 1) {
        timelineManager.storeSnapshot('predict-test', snapshot);
      }

      const prediction = aggregator.predictHealthScore('predict-test', 30);
      expect(prediction).toHaveProperty('prediction');
      expect(prediction).toHaveProperty('confidence');
    });

    test('should get summary', () => {
      const snapshot = {
        healthScore: 7,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 75, codeQuality: 7 },
        debtLevel: 'low',
      };

      timelineManager.storeSnapshot('summary-test', snapshot);
      const summary = aggregator.getSummary('summary-test');

      expect(summary.repository).toBe('summary-test');
      expect(summary.snapshotsCount).toBeGreaterThan(0);
    });
  });

  describe('DashboardCLI', () => {
    test('should display dashboard without error', () => {
      const snapshot = {
        healthScore: 7,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 80, codeQuality: 8 },
        debtLevel: 'low',
      };

      timelineManager.storeSnapshot('cli-test', snapshot);

      const output = cli.displayDashboard('cli-test');
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
      expect(output).toContain('Evolution Dashboard');
    });

    test('should display health chart', () => {
      const snapshot = {
        healthScore: 6,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 70, codeQuality: 6 },
        debtLevel: 'moderate',
      };

      timelineManager.storeSnapshot('chart-test', snapshot);
      const output = cli.displayHealthChart('chart-test');

      expect(typeof output).toBe('string');
      expect(output).toContain('Health Score Trend');
    });

    test('should display trend report', () => {
      const snapshot = {
        healthScore: 6,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 70, codeQuality: 6 },
        debtLevel: 'moderate',
      };

      timelineManager.storeSnapshot('trend-test', snapshot);
      const output = cli.displayTrendReport('trend-test');

      expect(typeof output).toBe('string');
      expect(output).toContain('Trend Analysis');
    });
  });
});
