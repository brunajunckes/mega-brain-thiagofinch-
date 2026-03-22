'use strict';

/**
 * Metrics Aggregator -- Calculates trends, aggregations, and predictions
 *
 * Provides:
 * - Health score trends
 * - Debt level tracking
 * - Coverage improvements
 * - Trend analysis and predictions
 * - Comparative analysis
 * - ASCII chart generation
 *
 * @class MetricsAggregator
 * @version 2.0.0
 * @story 2.4
 */
class MetricsAggregator {
  /**
   * @param {Object} timelineManager TimelineManager instance
   */
  constructor(timelineManager) {
    this.timeline = timelineManager;
  }

  /**
   * Aggregate health trends for a repository
   * @param {string} repoName Repository name
   * @param {number} days Number of days to analyze
   * @returns {Object} Health trend analysis
   */
  getHealthTrends(repoName, days = 30) {
    const trend = this.timeline.getMetricTrend(repoName, 'healthScore', days);
    const analysis = this.timeline.analyzeTrend(trend);

    return {
      metric: 'healthScore',
      trend,
      analysis,
      current: trend.length > 0 ? trend[trend.length - 1].value : null,
      previous: trend.length > 1 ? trend[trend.length - 2].value : null,
      changePercent: trend.length > 1 && trend[0].value !== 0
        ? Math.round(((trend[trend.length - 1].value - trend[0].value) / trend[0].value) * 100)
        : 0,
    };
  }

  /**
   * Aggregate coverage trends
   * @param {string} repoName Repository name
   * @param {number} days Number of days to analyze
   * @returns {Object} Coverage trend analysis
   */
  getCoverageTrends(repoName, days = 30) {
    const trend = this.timeline.getMetricTrend(repoName, 'testCoverage', days);
    const analysis = this.timeline.analyzeTrend(trend);

    return {
      metric: 'testCoverage',
      trend,
      analysis,
      current: trend.length > 0 ? trend[trend.length - 1].value : null,
      previous: trend.length > 1 ? trend[trend.length - 2].value : null,
      percentImprovement: trend.length > 1
        ? Math.round(trend[trend.length - 1].value - trend[0].value)
        : 0,
    };
  }

  /**
   * Aggregate debt level changes
   * @param {string} repoName Repository name
   * @param {number} days Number of days to analyze
   * @returns {Object} Debt level analysis
   */
  getDebtTrends(repoName, days = 30) {
    const timeline = this.timeline.getTimeline(repoName, { limit: 1000, order: 'asc' });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevant = timeline.filter((snap) => new Date(snap.timestamp) >= cutoffDate);

    const transitions = {};
    for (let i = 1; i < relevant.length; i += 1) {
      const from = relevant[i - 1].metrics.debtLevel;
      const to = relevant[i].metrics.debtLevel;
      if (from !== to) {
        const key = `${from}->${to}`;
        transitions[key] = (transitions[key] || 0) + 1;
      }
    }

    return {
      metric: 'debtLevel',
      current: relevant.length > 0 ? relevant[relevant.length - 1].metrics.debtLevel : 'unknown',
      previous: relevant.length > 1 ? relevant[relevant.length - 2].metrics.debtLevel : 'unknown',
      transitions,
      improved: this._isDebtImproved(
        relevant.length > 1 ? relevant[0].metrics.debtLevel : null,
        relevant.length > 0 ? relevant[relevant.length - 1].metrics.debtLevel : null
      ),
      dataPoints: relevant.length,
    };
  }

  /**
   * Get overall repository health report
   * @param {string} repoName Repository name
   * @returns {Object} Health report
   */
  getHealthReport(repoName) {
    const healthTrends = this.getHealthTrends(repoName, 30);
    const coverageTrends = this.getCoverageTrends(repoName, 30);
    const debtTrends = this.getDebtTrends(repoName, 30);

    const overallStatus = this._calculateOverallStatus(
      healthTrends,
      coverageTrends,
      debtTrends
    );

    return {
      repository: repoName,
      timestamp: new Date().toISOString(),
      overallStatus,
      healthScore: healthTrends,
      testCoverage: coverageTrends,
      debtLevel: debtTrends,
      recommendations: this._generateRecommendations(healthTrends, coverageTrends, debtTrends),
    };
  }

  /**
   * Get comparative analysis between periods
   * @param {string} repoName Repository name
   * @param {number} period1 Days in period 1
   * @param {number} period2 Days in period 2
   * @returns {Object} Comparative analysis
   */
  getComparativeAnalysis(repoName, period1 = 7, period2 = 7) {
    const comparison = this.timeline.comparePeriods(repoName, period1, period2);

    return {
      period1Days: period1,
      period2Days: period2,
      comparison,
      trendDirection: comparison.improvement.healthScore > 0 ? 'improving' : 'declining',
      velocityImprovement: Math.round(comparison.improvement.healthScore * 100) / 100,
    };
  }

  /**
   * Predict future health score using linear regression
   * @param {string} repoName Repository name
   * @param {number} daysAhead Days to predict ahead
   * @returns {Object} Prediction
   */
  predictHealthScore(repoName, daysAhead = 30) {
    const trend = this.timeline.getMetricTrend(repoName, 'healthScore', 60);
    if (trend.length < 3) {
      return { prediction: null, confidence: 0, reason: 'insufficient_data' };
    }

    const values = trend.map((t) => t.value).filter((v) => v !== null);
    if (values.length < 3) {
      return { prediction: null, confidence: 0, reason: 'insufficient_data' };
    }

    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((acc, val, i) => acc + i * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
      return { prediction: values[values.length - 1], confidence: 50, trend: 'stable', daysAhead };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const predictedValue = Math.min(10, Math.max(1, intercept + slope * (n + daysAhead)));

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = values.reduce((acc, val, i) => {
      const yPred = intercept + slope * i;
      return acc + Math.pow(val - yPred, 2);
    }, 0);
    const ssTot = values.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return {
      prediction: Math.round(predictedValue * 100) / 100,
      confidence: Math.max(0, Math.min(100, Math.round(Math.abs(rSquared) * 100))),
      trend: slope > 0 ? 'improving' : 'declining',
      daysAhead,
      currentValue: values[values.length - 1],
    };
  }

  /**
   * Get metrics summary for repository
   * @param {string} repoName Repository name
   * @returns {Object} Summary
   */
  getSummary(repoName) {
    const timeline = this.timeline.getTimeline(repoName, { limit: 100 });
    if (timeline.length === 0) {
      return { error: 'No data available' };
    }

    const latest = timeline[0];
    const oldest = timeline[timeline.length - 1];

    return {
      repository: repoName,
      snapshotsCount: timeline.length,
      timeSpan: {
        oldest: oldest.timestamp,
        latest: latest.timestamp,
      },
      currentMetrics: {
        healthScore: latest.metrics.healthScore,
        testCoverage: latest.metrics.testCoverage,
        codeQuality: latest.metrics.codeQuality,
        debtLevel: latest.metrics.debtLevel,
      },
      changes: {
        healthScore: latest.metrics.healthScore - oldest.metrics.healthScore,
        testCoverage: latest.metrics.testCoverage - oldest.metrics.testCoverage,
      },
    };
  }

  /**
   * Aggregate metrics from raw snapshots (static, for simple use)
   * @param {Array} snapshots Timeline snapshots
   * @returns {Object} Aggregated metrics
   */
  static aggregate(snapshots) {
    if (!snapshots || snapshots.length === 0) {
      return { status: 'no_data', metrics: {} };
    }

    const metrics = snapshots.map((s) => ({
      timestamp: s.timestamp,
      testCoverage: s.data?.metrics?.testCoverage || s.metrics?.testCoverage || 0,
      codeQuality: s.data?.metrics?.codeQuality || s.metrics?.codeQuality || 0,
      files: s.data?.summary?.totalFiles || s.metrics?.totalFiles || 0,
      loc: s.data?.summary?.totalLoc || s.metrics?.totalLines || 0,
    }));

    return {
      status: 'ok',
      count: snapshots.length,
      period: {
        from: snapshots[snapshots.length - 1].timestamp,
        to: snapshots[0].timestamp,
      },
      metrics,
      summary: MetricsAggregator._summarizeMetrics(metrics),
    };
  }

  /**
   * Generate ASCII chart from values
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

    const lines = [`${title}`];

    for (let row = height; row >= 0; row--) {
      const threshold = min + (range / height) * row;
      const label = threshold.toFixed(0).padStart(4);
      let line = `${label}|`;
      for (let col = 0; col < width; col++) {
        const idx = Math.floor((col / width) * values.length);
        const val = values[idx];
        line += val >= threshold ? '#' : ' ';
      }
      lines.push(line);
    }

    lines.push(`    +${'─'.repeat(width)}`);
    return lines.join('\n');
  }

  /**
   * Generate trend report as formatted string
   * @param {string} repoName Repository name
   * @returns {string} Formatted trend report
   */
  generateTrendReport(repoName) {
    const report = this.getHealthReport(repoName);
    const prediction = this.predictHealthScore(repoName, 30);
    const lines = [];

    lines.push('='.repeat(56));
    lines.push('       Repository Evolution Dashboard');
    lines.push('='.repeat(56));
    lines.push('');

    // Overall status
    lines.push(`Repository: ${report.repository}`);
    lines.push(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    lines.push('');

    // Health score
    const healthScore = report.healthScore.current || 5;
    const healthBar = this._buildBar(healthScore, 10);
    lines.push(`Health Score: ${healthScore}/10 ${healthBar}`);
    if (report.healthScore.analysis) {
      lines.push(`  Direction: ${report.healthScore.analysis.direction}`);
    }
    lines.push(`  Change: ${report.healthScore.changePercent > 0 ? '+' : ''}${report.healthScore.changePercent}%`);
    lines.push('');

    // Test coverage
    const coverage = report.testCoverage.current || 0;
    const coverageBar = this._buildBar(coverage / 10, 10);
    lines.push(`Test Coverage: ${Math.round(coverage)}% ${coverageBar}`);
    lines.push(`  Improvement: ${report.testCoverage.percentImprovement > 0 ? '+' : ''}${report.testCoverage.percentImprovement}%`);
    lines.push('');

    // Debt level
    lines.push(`Technical Debt: ${report.debtLevel.current.toUpperCase()}`);
    lines.push(`  Status: ${report.debtLevel.improved ? 'Improving' : 'Stable'}`);
    lines.push('');

    // Prediction
    if (prediction.prediction !== null) {
      lines.push('30-Day Prediction:');
      lines.push(`  Predicted Score: ${prediction.prediction}/10`);
      lines.push(`  Confidence: ${prediction.confidence}%`);
      lines.push(`  Direction: ${prediction.trend}`);
      lines.push('');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('Recommendations:');
      report.recommendations.forEach((rec, idx) => {
        lines.push(`  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        lines.push(`     -> ${rec.action}`);
      });
      lines.push('');
    }

    lines.push(`Updated: ${new Date(report.timestamp).toISOString()}`);

    return lines.join('\n');
  }

  /**
   * Export trend report as JSON
   * @param {string} repoName Repository name
   * @returns {Object} Report data
   */
  exportReport(repoName) {
    return {
      report: this.getHealthReport(repoName),
      prediction: this.predictHealthScore(repoName, 30),
      summary: this.getSummary(repoName),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Build progress bar
   * @private
   */
  _buildBar(value, max) {
    const filled = Math.round((value / max) * 20);
    const empty = 20 - filled;
    return `[${'#'.repeat(Math.max(0, filled))}${'.'.repeat(Math.max(0, empty))}]`;
  }

  /**
   * Check if debt improved
   * @private
   */
  _isDebtImproved(from, to) {
    const levels = { minimal: 5, low: 4, moderate: 3, high: 2, critical: 1 };
    return (levels[to] || 0) > (levels[from] || 0);
  }

  /**
   * Calculate overall status
   * @private
   */
  _calculateOverallStatus(healthTrends, coverageTrends, debtTrends) {
    const healthScore = healthTrends.current || 5;
    const coverage = coverageTrends.current || 0;
    const debtImproved = debtTrends.improved;

    if (healthScore >= 8 && coverage >= 80) {
      return 'excellent';
    }
    if (healthScore >= 6 && coverage >= 60 && debtImproved) {
      return 'good';
    }
    if (healthScore >= 5 && coverage >= 40) {
      return 'fair';
    }
    return 'critical';
  }

  /**
   * Generate recommendations based on metrics
   * @private
   */
  _generateRecommendations(healthTrends, coverageTrends, debtTrends) {
    const recommendations = [];

    if (coverageTrends.current !== null && coverageTrends.current < 60) {
      recommendations.push({
        priority: 'high',
        title: 'Improve test coverage',
        current: Math.round(coverageTrends.current),
        target: 80,
        action: 'Add unit and integration tests',
      });
    }

    if (healthTrends.analysis && healthTrends.analysis.direction === 'declining') {
      recommendations.push({
        priority: 'high',
        title: 'Address declining health',
        trend: 'declining',
        action: 'Review recent changes and technical debt',
      });
    }

    if (!debtTrends.improved && debtTrends.dataPoints > 3) {
      recommendations.push({
        priority: 'medium',
        title: 'Stabilize debt levels',
        current: debtTrends.current,
        action: 'Follow recommendations from Decision Engine',
      });
    }

    return recommendations;
  }

  /**
   * Summarize metrics (static helper)
   * @private
   */
  static _summarizeMetrics(metrics) {
    if (metrics.length === 0) {
      return {};
    }

    const coverage = metrics.map((m) => m.testCoverage);
    const quality = metrics.map((m) => m.codeQuality);
    const files = metrics.map((m) => m.files);

    return {
      coverage: {
        current: coverage[0],
        min: Math.min(...coverage),
        max: Math.max(...coverage),
        avg: (coverage.reduce((a, b) => a + b, 0) / coverage.length).toFixed(1),
        trend: MetricsAggregator._calculateTrendDirection(coverage),
      },
      quality: {
        current: quality[0],
        min: Math.min(...quality),
        max: Math.max(...quality),
        avg: (quality.reduce((a, b) => a + b, 0) / quality.length).toFixed(1),
        trend: MetricsAggregator._calculateTrendDirection(quality),
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
   * Calculate trend direction from values
   * @private
   */
  static _calculateTrendDirection(values) {
    if (values.length < 2) {
      return 'stable';
    }

    const recent = values.slice(0, Math.ceil(values.length / 2));
    const older = values.slice(Math.ceil(values.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (recentAvg > olderAvg + 0.5) {
      return 'improving';
    }
    if (recentAvg < olderAvg - 0.5) {
      return 'declining';
    }
    return 'stable';
  }
}

module.exports = { MetricsAggregator };
