'use strict';

/**
 * MetricsAggregator — Aggregate and analyze metrics over time
 *
 * Provides:
 * - Health score trends
 * - Debt level tracking
 * - Coverage improvements
 * - Trend analysis and predictions
 *
 * @class MetricsAggregator
 * @version 1.0.0
 * @story 2.4 Phase 2
 */
class MetricsAggregator {
  /**
   * Create metrics aggregator
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
    try {
      const trend = this.timeline.getMetricTrend(repoName, 'healthScore', days);
      const analysis = this.timeline.analyzeTrend(trend);

      return {
        metric: 'healthScore',
        trend: trend,
        analysis: analysis,
        current: trend.length > 0 ? trend[trend.length - 1].value : null,
        previous: trend.length > 1 ? trend[trend.length - 2].value : null,
        changePercent: trend.length > 1
          ? Math.round(((trend[trend.length - 1].value - trend[0].value) / trend[0].value) * 100)
          : 0,
      };
    } catch (error) {
      throw new Error(`Failed to get health trends: ${error.message}`);
    }
  }

  /**
   * Aggregate coverage trends
   * @param {string} repoName Repository name
   * @param {number} days Number of days to analyze
   * @returns {Object} Coverage trend analysis
   */
  getCoverageTrends(repoName, days = 30) {
    try {
      const trend = this.timeline.getMetricTrend(repoName, 'testCoverage', days);
      const analysis = this.timeline.analyzeTrend(trend);

      return {
        metric: 'testCoverage',
        trend: trend,
        analysis: analysis,
        current: trend.length > 0 ? trend[trend.length - 1].value : null,
        previous: trend.length > 1 ? trend[trend.length - 2].value : null,
        percentImprovement: trend.length > 1
          ? Math.round(trend[trend.length - 1].value - trend[0].value)
          : 0,
      };
    } catch (error) {
      throw new Error(`Failed to get coverage trends: ${error.message}`);
    }
  }

  /**
   * Aggregate debt level changes
   * @param {string} repoName Repository name
   * @param {number} days Number of days to analyze
   * @returns {Object} Debt level analysis
   */
  getDebtTrends(repoName, days = 30) {
    try {
      const debtTrend = this.timeline.getMetricTrend(repoName, 'debtLevel', days);
      const timeline = this.timeline.getTimeline(repoName, { limit: 1000, order: 'asc' });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const relevant = timeline.filter(snap => new Date(snap.timestamp) >= cutoffDate);

      // Count transitions
      const transitions = {};
      for (let i = 1; i < relevant.length; i += 1) {
        const from = relevant[i - 1].metrics.debtLevel;
        const to = relevant[i].metrics.debtLevel;
        if (from !== to) {
          transitions[`${from}→${to}`] = (transitions[`${from}→${to}`] || 0) + 1;
        }
      }

      return {
        metric: 'debtLevel',
        current: relevant.length > 0 ? relevant[relevant.length - 1].metrics.debtLevel : 'unknown',
        previous: relevant.length > 1 ? relevant[relevant.length - 2].metrics.debtLevel : 'unknown',
        transitions: transitions,
        improved: this._isDebtImproved(
          relevant.length > 1 ? relevant[0].metrics.debtLevel : null,
          relevant.length > 0 ? relevant[relevant.length - 1].metrics.debtLevel : null,
        ),
        dataPoints: relevant.length,
      };
    } catch (error) {
      throw new Error(`Failed to get debt trends: ${error.message}`);
    }
  }

  /**
   * Get overall repository health report
   * @param {string} repoName Repository name
   * @returns {Object} Health report
   */
  getHealthReport(repoName) {
    try {
      const healthTrends = this.getHealthTrends(repoName, 30);
      const coverageTrends = this.getCoverageTrends(repoName, 30);
      const debtTrends = this.getDebtTrends(repoName, 30);

      const overallStatus = this._calculateOverallStatus(
        healthTrends,
        coverageTrends,
        debtTrends,
      );

      return {
        repository: repoName,
        timestamp: new Date().toISOString(),
        overallStatus: overallStatus,
        healthScore: healthTrends,
        testCoverage: coverageTrends,
        debtLevel: debtTrends,
        recommendations: this._generateRecommendations(healthTrends, coverageTrends, debtTrends),
      };
    } catch (error) {
      throw new Error(`Failed to generate health report: ${error.message}`);
    }
  }

  /**
   * Get comparative analysis between snapshots
   * @param {string} repoName Repository name
   * @param {number} period1 Days in period 1
   * @param {number} period2 Days in period 2
   * @returns {Object} Comparative analysis
   */
  getComparativeAnalysis(repoName, period1 = 7, period2 = 7) {
    try {
      const comparison = this.timeline.comparePeriods(repoName, period1, period2);

      return {
        period1Days: period1,
        period2Days: period2,
        comparison: comparison,
        trendDirection: comparison.improvement.healthScore > 0 ? 'improving' : 'declining',
        velocityImprovement: Math.round(comparison.improvement.healthScore * 100) / 100,
      };
    } catch (error) {
      throw new Error(`Failed to get comparative analysis: ${error.message}`);
    }
  }

  /**
   * Predict future health score
   * @param {string} repoName Repository name
   * @param {number} daysAhead Days to predict ahead
   * @returns {Object} Prediction
   */
  predictHealthScore(repoName, daysAhead = 30) {
    try {
      const trend = this.timeline.getMetricTrend(repoName, 'healthScore', 60);
      if (trend.length < 3) {
        return { prediction: null, confidence: 0, reason: 'insufficient_data' };
      }

      const values = trend.map(t => t.value).filter(v => v !== null);

      // Simple linear regression
      const n = values.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = values.reduce((acc, val, i) => acc + (i * val), 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Predict
      const predictedValue = Math.min(10, Math.max(1, intercept + slope * (n + daysAhead)));

      // Calculate R-squared for confidence
      const yMean = sumY / n;
      const ssRes = values.reduce((acc, val, i) => {
        const yPred = intercept + slope * i;
        return acc + Math.pow(val - yPred, 2);
      }, 0);
      const ssTot = values.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
      const rSquared = 1 - (ssRes / ssTot);

      return {
        prediction: Math.round(predictedValue * 100) / 100,
        confidence: Math.round(Math.abs(rSquared) * 100),
        trend: slope > 0 ? 'improving' : 'declining',
        daysAhead: daysAhead,
        currentValue: values[values.length - 1],
      };
    } catch (error) {
      throw new Error(`Failed to predict health score: ${error.message}`);
    }
  }

  /**
   * Get metrics summary
   * @param {string} repoName Repository name
   * @returns {Object} Summary
   */
  getSummary(repoName) {
    try {
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
    } catch (error) {
      throw new Error(`Failed to get summary: ${error.message}`);
    }
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

    if (healthScore >= 8 && coverage >= 80) return 'excellent';
    if (healthScore >= 6 && coverage >= 60 && debtImproved) return 'good';
    if (healthScore >= 5 && coverage >= 40) return 'fair';
    return 'critical';
  }

  /**
   * Generate recommendations based on metrics
   * @private
   */
  _generateRecommendations(healthTrends, coverageTrends, debtTrends) {
    const recommendations = [];

    if (coverageTrends.current < 60) {
      recommendations.push({
        priority: 'high',
        title: 'Improve test coverage',
        current: Math.round(coverageTrends.current),
        target: 80,
        action: 'Add unit and integration tests',
      });
    }

    if (healthTrends.analysis.direction === 'declining') {
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
}

module.exports = MetricsAggregator;
