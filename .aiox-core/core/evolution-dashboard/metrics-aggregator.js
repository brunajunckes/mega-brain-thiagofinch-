'use strict';

/**
 * Metrics Aggregator — Calculates trends and aggregations
 *
 * @class MetricsAggregator
 * @version 1.0.0
 * @story 2.4
 */
class MetricsAggregator {
  /**
   * Aggregate metrics from snapshots
   * @param {Array} snapshots Timeline snapshots
   * @returns {Object} Aggregated metrics
   */
  static aggregate(snapshots) {
    if (!snapshots || snapshots.length === 0) {
      return { status: 'no_data', metrics: {} };
    }

    const metrics = snapshots.map((s) => ({
      timestamp: s.timestamp,
      testCoverage: s.data?.metrics?.testCoverage || 0,
      codeQuality: s.data?.metrics?.codeQuality || 0,
      files: s.data?.summary?.totalFiles || 0,
      loc: s.data?.summary?.totalLoc || 0,
    }));

    return {
      status: 'ok',
      count: snapshots.length,
      period: {
        from: snapshots[snapshots.length - 1].timestamp,
        to: snapshots[0].timestamp,
      },
      metrics,
      summary: this._summarizeMetrics(metrics),
    };
  }

  /**
   * Summarize metrics
   * @private
   */
  static _summarizeMetrics(metrics) {
    if (metrics.length === 0) return {};

    const coverage = metrics.map((m) => m.testCoverage);
    const quality = metrics.map((m) => m.codeQuality);
    const files = metrics.map((m) => m.files);

    return {
      coverage: {
        current: coverage[0],
        min: Math.min(...coverage),
        max: Math.max(...coverage),
        avg: (coverage.reduce((a, b) => a + b, 0) / coverage.length).toFixed(1),
        trend: this._calculateTrend(coverage),
      },
      quality: {
        current: quality[0],
        min: Math.min(...quality),
        max: Math.max(...quality),
        avg: (quality.reduce((a, b) => a + b, 0) / quality.length).toFixed(1),
        trend: this._calculateTrend(quality),
      },
      files: {
        current: files[0],
        min: Math.min(...files),
        max: Math.max(...files),
        avg: Math.round(files.reduce((a, b) => a + b, 0) / files.length),
      },
    };
  }

  /**
   * Calculate trend direction
   * @private
   */
  static _calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const recent = values.slice(0, Math.ceil(values.length / 2));
    const older = values.slice(Math.ceil(values.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  }

  /**
   * Generate ASCII chart
   * @param {Array} values Data points
   * @param {Object} options Chart options
   * @returns {string} ASCII chart
   */
  static generateChart(values, options = {}) {
    const height = options.height || 6;
    const width = options.width || 40;
    const title = options.title || 'Chart';

    if (!values || values.length === 0) {
      return `${title}\n[No data]`;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    let chart = `${title}\n`;
    chart += `${max}│`;

    // Generate chart rows
    for (let row = height; row >= 0; row--) {
      if (row > 0 && row < height) {
        const threshold = min + (range / height) * row;
        chart += '│';
        for (let col = 0; col < width; col++) {
          const idx = Math.floor((col / width) * values.length);
          const val = values[idx];
          chart += val >= threshold ? '█' : ' ';
        }
        chart += '\n';
      }
    }

    chart += `${min}└${'─'.repeat(width)}\n`;
    return chart;
  }
}

module.exports = { MetricsAggregator };
