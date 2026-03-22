'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { TimelineManager } = require('../timeline-manager');
const { MetricsAggregator } = require('../metrics-aggregator');

describe('MetricsAggregator', () => {
  let manager;
  let aggregator;
  let testDataDir;

  beforeEach(() => {
    testDataDir = path.join(os.tmpdir(), `metrics-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    manager = new TimelineManager({ dataDir: testDataDir });
    aggregator = new MetricsAggregator(manager);
  });

  afterEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('getHealthTrends', () => {
    it('should return health trends for repository', () => {
      manager.storeSnapshot('health-test', {
        healthScore: 5,
        stats: { totalFiles: 50 },
        metrics: { testCoverage: 50, codeQuality: 5 },
        debtLevel: 'moderate',
      });
      manager.storeSnapshot('health-test', {
        healthScore: 6,
        stats: { totalFiles: 60 },
        metrics: { testCoverage: 60, codeQuality: 6 },
        debtLevel: 'low',
      });

      const trends = aggregator.getHealthTrends('health-test', 30);

      expect(trends.metric).toBe('healthScore');
      expect(trends.trend).toBeDefined();
      expect(trends.analysis).toBeDefined();
      expect(trends.current).toBeDefined();
    });
  });

  describe('getCoverageTrends', () => {
    it('should return coverage trends', () => {
      manager.storeSnapshot('cov-test', {
        healthScore: 5,
        metrics: { testCoverage: 50, codeQuality: 5 },
      });
      manager.storeSnapshot('cov-test', {
        healthScore: 6,
        metrics: { testCoverage: 70, codeQuality: 6 },
      });

      const trends = aggregator.getCoverageTrends('cov-test', 30);

      expect(trends.metric).toBe('testCoverage');
      expect(trends.current).toBeDefined();
    });
  });

  describe('getDebtTrends', () => {
    it('should return debt trends', () => {
      manager.storeSnapshot('debt-test', {
        healthScore: 5,
        metrics: { testCoverage: 50 },
        debtLevel: 'high',
      });
      manager.storeSnapshot('debt-test', {
        healthScore: 6,
        metrics: { testCoverage: 60 },
        debtLevel: 'moderate',
      });

      const trends = aggregator.getDebtTrends('debt-test', 30);

      expect(trends.metric).toBe('debtLevel');
      expect(trends.current).toBeDefined();
      expect(trends.dataPoints).toBeGreaterThan(0);
    });

    it('should track transitions', () => {
      manager.storeSnapshot('trans-test', {
        healthScore: 5,
        debtLevel: 'high',
        metrics: { testCoverage: 40 },
      });
      manager.storeSnapshot('trans-test', {
        healthScore: 6,
        debtLevel: 'moderate',
        metrics: { testCoverage: 50 },
      });
      manager.storeSnapshot('trans-test', {
        healthScore: 7,
        debtLevel: 'low',
        metrics: { testCoverage: 60 },
      });

      const trends = aggregator.getDebtTrends('trans-test', 30);
      expect(Object.keys(trends.transitions).length).toBeGreaterThan(0);
    });
  });

  describe('getHealthReport', () => {
    it('should generate full health report', () => {
      manager.storeSnapshot('report-test', {
        healthScore: 7,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 80, codeQuality: 8 },
        debtLevel: 'low',
      });

      const report = aggregator.getHealthReport('report-test');

      expect(report.repository).toBe('report-test');
      expect(report.timestamp).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(report.healthScore).toBeDefined();
      expect(report.testCoverage).toBeDefined();
      expect(report.debtLevel).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should return excellent status for high scores', () => {
      manager.storeSnapshot('excellent-test', {
        healthScore: 9,
        metrics: { testCoverage: 90, codeQuality: 9 },
        debtLevel: 'minimal',
      });
      // Need at least 2 snapshots for improving trend
      manager.storeSnapshot('excellent-test', {
        healthScore: 9,
        metrics: { testCoverage: 90, codeQuality: 9 },
        debtLevel: 'minimal',
      });

      const report = aggregator.getHealthReport('excellent-test');
      expect(report.overallStatus).toBe('excellent');
    });

    it('should generate recommendations for low coverage', () => {
      manager.storeSnapshot('low-cov', {
        healthScore: 5,
        metrics: { testCoverage: 30, codeQuality: 5 },
        debtLevel: 'moderate',
      });
      manager.storeSnapshot('low-cov', {
        healthScore: 5,
        metrics: { testCoverage: 30, codeQuality: 5 },
        debtLevel: 'moderate',
      });

      const report = aggregator.getHealthReport('low-cov');
      const coverageRec = report.recommendations.find((r) => r.title === 'Improve test coverage');
      expect(coverageRec).toBeDefined();
      expect(coverageRec.priority).toBe('high');
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should return comparative analysis', () => {
      manager.storeSnapshot('compare-test', {
        healthScore: 5,
        metrics: { testCoverage: 50 },
      });

      const analysis = aggregator.getComparativeAnalysis('compare-test', 7, 7);

      expect(analysis.period1Days).toBe(7);
      expect(analysis.period2Days).toBe(7);
      expect(analysis.comparison).toBeDefined();
      expect(analysis.trendDirection).toBeDefined();
    });
  });

  describe('predictHealthScore', () => {
    it('should return prediction with sufficient data', () => {
      for (let i = 0; i < 5; i++) {
        manager.storeSnapshot('predict-test', {
          healthScore: 5 + i * 0.5,
          metrics: { testCoverage: 50 + i * 5 },
        });
      }

      const prediction = aggregator.predictHealthScore('predict-test', 30);

      expect(prediction).toHaveProperty('prediction');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('trend');
      expect(prediction.prediction).not.toBeNull();
    });

    it('should return insufficient data for too few snapshots', () => {
      manager.storeSnapshot('few-test', { healthScore: 5 });

      const prediction = aggregator.predictHealthScore('few-test', 30);
      expect(prediction.prediction).toBeNull();
      expect(prediction.reason).toBe('insufficient_data');
    });
  });

  describe('getSummary', () => {
    it('should return summary for repository', () => {
      manager.storeSnapshot('summary-test', {
        healthScore: 7,
        stats: { totalFiles: 100 },
        metrics: { testCoverage: 75, codeQuality: 7 },
        debtLevel: 'low',
      });

      const summary = aggregator.getSummary('summary-test');

      expect(summary.repository).toBe('summary-test');
      expect(summary.snapshotsCount).toBeGreaterThan(0);
      expect(summary.currentMetrics).toBeDefined();
      expect(summary.currentMetrics.healthScore).toBe(7);
    });

    it('should return error for empty repo', () => {
      const summary = aggregator.getSummary('empty-test');
      expect(summary.error).toBe('No data available');
    });
  });

  describe('generateTrendReport', () => {
    it('should generate formatted trend report string', () => {
      manager.storeSnapshot('report-fmt', {
        healthScore: 6,
        stats: { totalFiles: 80 },
        metrics: { testCoverage: 60, codeQuality: 6 },
        debtLevel: 'moderate',
      });
      manager.storeSnapshot('report-fmt', {
        healthScore: 7,
        stats: { totalFiles: 90 },
        metrics: { testCoverage: 70, codeQuality: 7 },
        debtLevel: 'low',
      });

      const report = aggregator.generateTrendReport('report-fmt');

      expect(typeof report).toBe('string');
      expect(report).toContain('Repository Evolution Dashboard');
      expect(report).toContain('report-fmt');
      expect(report).toContain('Health Score');
      expect(report).toContain('Test Coverage');
      expect(report).toContain('Technical Debt');
    });
  });

  describe('exportReport', () => {
    it('should export report as JSON-serializable object', () => {
      manager.storeSnapshot('export-test', {
        healthScore: 7,
        metrics: { testCoverage: 75, codeQuality: 7 },
        debtLevel: 'low',
      });

      const exported = aggregator.exportReport('export-test');

      expect(exported.report).toBeDefined();
      expect(exported.prediction).toBeDefined();
      expect(exported.summary).toBeDefined();
      expect(exported.generatedAt).toBeDefined();

      // Verify it's JSON-serializable
      const json = JSON.stringify(exported);
      expect(typeof json).toBe('string');
    });
  });

  describe('static aggregate', () => {
    it('should aggregate metrics from snapshots', () => {
      const snapshots = [
        {
          timestamp: new Date().toISOString(),
          data: { metrics: { testCoverage: 85, codeQuality: 9 }, summary: { totalFiles: 120, totalLoc: 60000 } },
        },
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          data: { metrics: { testCoverage: 75, codeQuality: 8 }, summary: { totalFiles: 100, totalLoc: 50000 } },
        },
      ];

      const result = MetricsAggregator.aggregate(snapshots);

      expect(result.status).toBe('ok');
      expect(result.count).toBe(2);
      expect(result.metrics.length).toBe(2);
      expect(result.summary).toBeDefined();
      expect(result.summary.coverage.current).toBe(85);
    });

    it('should handle no data', () => {
      const result = MetricsAggregator.aggregate([]);
      expect(result.status).toBe('no_data');
    });

    it('should calculate coverage trend as improving', () => {
      const snapshots = [
        { timestamp: new Date().toISOString(), data: { metrics: { testCoverage: 85 } } },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), data: { metrics: { testCoverage: 80 } } },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), data: { metrics: { testCoverage: 70 } } },
      ];

      const result = MetricsAggregator.aggregate(snapshots);
      expect(result.summary.coverage.trend).toBe('improving');
    });

    it('should calculate coverage trend as declining', () => {
      const snapshots = [
        { timestamp: new Date().toISOString(), data: { metrics: { testCoverage: 60 } } },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), data: { metrics: { testCoverage: 70 } } },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), data: { metrics: { testCoverage: 85 } } },
      ];

      const result = MetricsAggregator.aggregate(snapshots);
      expect(result.summary.coverage.trend).toBe('declining');
    });

    it('should also read metrics from snapshot.metrics (not just data.metrics)', () => {
      const snapshots = [
        {
          timestamp: new Date().toISOString(),
          metrics: { testCoverage: 80, codeQuality: 8, totalFiles: 100, totalLines: 5000 },
        },
      ];

      const result = MetricsAggregator.aggregate(snapshots);
      expect(result.metrics[0].testCoverage).toBe(80);
    });
  });

  describe('static generateChart', () => {
    it('should generate ASCII chart', () => {
      const values = [10, 20, 30, 40, 50];
      const chart = MetricsAggregator.generateChart(values, { title: 'Test Chart' });

      expect(chart).toContain('Test Chart');
      expect(chart).toContain('|');
    });

    it('should handle empty values', () => {
      const chart = MetricsAggregator.generateChart([], { title: 'Empty' });
      expect(chart).toContain('No data');
    });

    it('should handle single value', () => {
      const chart = MetricsAggregator.generateChart([5], { title: 'Single' });
      expect(typeof chart).toBe('string');
      expect(chart.length).toBeGreaterThan(0);
    });
  });
});
