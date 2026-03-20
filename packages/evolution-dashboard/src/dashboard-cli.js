'use strict';

/**
 * DashboardCLI — Display evolution dashboard with ASCII charts
 *
 * Displays:
 * - Health score trends
 * - Coverage improvements
 * - Debt level changes
 * - Actionable recommendations
 *
 * @class DashboardCLI
 * @version 1.0.0
 * @story 2.4 Phase 3
 */
class DashboardCLI {
  /**
   * Create dashboard CLI
   * @param {Object} metricsAggregator MetricsAggregator instance
   */
  constructor(metricsAggregator) {
    this.aggregator = metricsAggregator;
  }

  /**
   * Display full dashboard
   * @param {string} repoName Repository name
   * @returns {string} Formatted dashboard
   */
  displayDashboard(repoName) {
    try {
      const report = this.aggregator.getHealthReport(repoName);
      const chart = this._buildDashboard(report);
      console.log(chart);
      return chart;
    } catch (error) {
      throw new Error(`Failed to display dashboard: ${error.message}`);
    }
  }

  /**
   * Display health trend chart
   * @param {string} repoName Repository name
   * @param {number} days Days to display
   * @returns {string} Formatted chart
   */
  displayHealthChart(repoName, days = 30) {
    try {
      const trends = this.aggregator.getHealthTrends(repoName, days);
      const chart = this._buildHealthChart(trends);
      console.log(chart);
      return chart;
    } catch (error) {
      throw new Error(`Failed to display health chart: ${error.message}`);
    }
  }

  /**
   * Display coverage trend chart
   * @param {string} repoName Repository name
   * @param {number} days Days to display
   * @returns {string} Formatted chart
   */
  displayCoverageChart(repoName, days = 30) {
    try {
      const trends = this.aggregator.getCoverageTrends(repoName, days);
      const chart = this._buildCoverageChart(trends);
      console.log(chart);
      return chart;
    } catch (error) {
      throw new Error(`Failed to display coverage chart: ${error.message}`);
    }
  }

  /**
   * Display trend report
   * @param {string} repoName Repository name
   * @returns {string} Formatted report
   */
  displayTrendReport(repoName) {
    try {
      const comparison = this.aggregator.getComparativeAnalysis(repoName, 7, 7);
      const prediction = this.aggregator.predictHealthScore(repoName, 30);
      const report = this._buildTrendReport(comparison, prediction);
      console.log(report);
      return report;
    } catch (error) {
      throw new Error(`Failed to display trend report: ${error.message}`);
    }
  }

  /**
   * Build dashboard string
   * @private
   */
  _buildDashboard(report) {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║    Evolution Dashboard — Repository Health Overview        ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');

    // Overall status
    const statusEmoji = this._getStatusEmoji(report.overallStatus);
    lines.push(`Overall Status: ${statusEmoji} ${report.overallStatus.toUpperCase()}`);
    lines.push('');

    // Health score
    const healthScore = report.healthScore.current || 5;
    const healthBar = this._buildBar(healthScore, 10);
    lines.push(`Health Score: ${healthScore.toFixed(1)}/10 ${healthBar}`);
    lines.push(`  Direction: ${this._getDirectionArrow(report.healthScore.analysis.direction)} ${report.healthScore.analysis.direction}`);
    lines.push(`  Change: ${report.healthScore.changePercent > 0 ? '+' : ''}${report.healthScore.changePercent}%`);
    lines.push('');

    // Test coverage
    const coverage = report.testCoverage.current || 0;
    const coverageBar = this._buildBar(coverage / 10, 10);
    lines.push(`Test Coverage: ${Math.round(coverage)}% ${coverageBar}`);
    lines.push(`  Improvement: ${report.testCoverage.percentImprovement > 0 ? '+' : ''}${report.testCoverage.percentImprovement}%`);
    lines.push('');

    // Debt level
    const debtEmoji = this._getDebtEmoji(report.debtLevel.current);
    lines.push(`Technical Debt: ${debtEmoji} ${report.debtLevel.current.toUpperCase()}`);
    lines.push(`  Status: ${report.debtLevel.improved ? '✅ Improving' : '⚠️  Stable'}`);
    lines.push('');

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('📋 Recommendations:');
      report.recommendations.forEach((rec, idx) => {
        lines.push(`  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        lines.push(`     → ${rec.action}`);
      });
    }

    lines.push('');
    lines.push(`Updated: ${new Date(report.timestamp).toLocaleString()}`);

    return lines.join('\n');
  }

  /**
   * Build health chart
   * @private
   */
  _buildHealthChart(trends) {
    const lines = [];
    lines.push('Health Score Trend (30 days)');
    lines.push(this._renderLineChart(trends.trend, 10, 1));
    lines.push('');
    lines.push(`Direction: ${this._getDirectionArrow(trends.analysis.direction)} ${trends.analysis.direction}`);
    lines.push(`Velocity: ${trends.analysis.velocity} points per snapshot`);

    return lines.join('\n');
  }

  /**
   * Build coverage chart
   * @private
   */
  _buildCoverageChart(trends) {
    const lines = [];
    lines.push('Test Coverage Trend (30 days)');
    lines.push(this._renderLineChart(trends.trend, 100, 10));
    lines.push('');
    lines.push(`Current: ${Math.round(trends.current)}%`);
    lines.push(`Improvement: ${trends.percentImprovement > 0 ? '+' : ''}${trends.percentImprovement}%`);

    return lines.join('\n');
  }

  /**
   * Build trend report
   * @private
   */
  _buildTrendReport(comparison, prediction) {
    const lines = [];
    lines.push('📊 Trend Analysis & Prediction');
    lines.push('');

    lines.push(`Period Comparison (Last ${comparison.period2Days} vs ${comparison.period1Days} days):`);
    lines.push(`  Health Score: ${comparison.comparison.period2.avgHealthScore} → ${comparison.comparison.period2.avgHealthScore + comparison.comparison.improvement.healthScore}`);
    lines.push(`  Test Coverage: ${comparison.comparison.period2.avgTestCoverage}% → ${comparison.comparison.period2.avgTestCoverage + comparison.comparison.improvement.testCoverage}%`);
    lines.push(`  Trend: ${comparison.trendDirection === 'improving' ? '📈 Improving' : '📉 Declining'}`);
    lines.push('');

    if (prediction.prediction !== null) {
      lines.push(`30-Day Prediction:`);
      lines.push(`  Predicted Score: ${prediction.prediction}/10`);
      lines.push(`  Confidence: ${prediction.confidence}%`);
      lines.push(`  Direction: ${this._getDirectionArrow(prediction.trend)} ${prediction.trend}`);
    }

    return lines.join('\n');
  }

  /**
   * Render line chart
   * @private
   */
  _renderLineChart(trend, maxValue, step) {
    if (trend.length === 0) return 'No data available';

    const values = trend.map(t => t.value).filter(v => v !== null);
    if (values.length === 0) return 'No data available';

    const height = 8;
    const width = Math.min(values.length, 50);
    const grid = Array(height).fill(null).map(() => Array(width).fill(' '));

    // Normalize values
    const min = Math.min(...values);
    const max = Math.max(...values, maxValue);
    const normalized = values.map(v => ((v - min) / (max - min)) * (height - 1));

    // Plot points
    for (let i = 0; i < Math.min(width, normalized.length); i += 1) {
      const y = height - 1 - Math.round(normalized[i]);
      grid[y][i] = '●';
    }

    // Build output
    const lines = [];
    for (let y = 0; y < height; y += 1) {
      const label = (max - ((y / height) * (max - min))).toFixed(0).padStart(3);
      lines.push(`${label} │${grid[y].join('')}`);
    }
    lines.push('    └' + '─'.repeat(width));

    return lines.join('\n');
  }

  /**
   * Build progress bar
   * @private
   */
  _buildBar(value, max) {
    const filled = Math.round((value / max) * 20);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * Get status emoji
   * @private
   */
  _getStatusEmoji(status) {
    const emojis = {
      excellent: '✨',
      good: '✅',
      fair: '⚠️',
      critical: '🚨',
    };
    return emojis[status] || '❓';
  }

  /**
   * Get debt emoji
   * @private
   */
  _getDebtEmoji(level) {
    const emojis = {
      minimal: '✅',
      low: '🟢',
      moderate: '🟡',
      high: '🔴',
      critical: '🚨',
    };
    return emojis[level] || '❓';
  }

  /**
   * Get direction arrow
   * @private
   */
  _getDirectionArrow(direction) {
    const arrows = {
      improving: '📈',
      declining: '📉',
      stable: '→',
    };
    return arrows[direction] || '❓';
  }
}

module.exports = DashboardCLI;
