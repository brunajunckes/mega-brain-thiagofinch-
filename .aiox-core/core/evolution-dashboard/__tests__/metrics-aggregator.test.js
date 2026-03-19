'use strict';

const { MetricsAggregator } = require('../metrics-aggregator');

describe('MetricsAggregator', () => {
  describe('aggregation', () => {
    it('should aggregate metrics from snapshots', () => {
      const snapshots = [
        {
          timestamp: new Date().toISOString(),
          data: { metrics: { testCoverage: 85, codeQuality: 9 }, summary: { totalFiles: 120, totalLoc: 60000 } },
        },
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          data: { metrics: { testCoverage: 75, codeQuality: 8 }, summary: { totalFiles: 100, totalLoc: 50000 } },
        },
      ];

      const result = MetricsAggregator.aggregate(snapshots);

      expect(result.status).toBe('ok');
      expect(result.count).toBe(2);
      expect(result.metrics.length).toBe(2);
      expect(result.summary).toBeDefined();
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

    it('should handle no data', () => {
      const result = MetricsAggregator.aggregate([]);

      expect(result.status).toBe('no_data');
    });
  });

  describe('chart generation', () => {
    it('should generate ASCII chart', () => {
      const values = [10, 20, 30, 40, 50];
      const chart = MetricsAggregator.generateChart(values, { title: 'Test' });

      expect(chart).toContain('Test');
      expect(chart).toContain('│');
    });

    it('should handle empty values', () => {
      const chart = MetricsAggregator.generateChart([], { title: 'Empty' });

      expect(chart).toContain('No data');
    });
  });
});
