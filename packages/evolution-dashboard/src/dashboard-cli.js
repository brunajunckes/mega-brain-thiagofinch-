'use strict';

/**
 * DashboardCLI -- Display evolution dashboard with ASCII formatting
 *
 * @class DashboardCLI
 * @version 2.0.0
 * @story 2.4 Phase 3
 */
class DashboardCLI {
  /**
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
    const report = this.aggregator.getHealthReport(repoName);
    const output = this._buildDashboard(report);
    console.log(output);
    return output;
  }

  /**
   * Display health trend chart
   * @param {string} repoName Repository name
   * @param {number} days Days to display
   * @returns {string} Formatted chart
   */
  displayHealthChart(repoName, days = 30) {
    const trends = this.aggregator.getHealthTrends(repoName, days);
    const output = this._buildHealthChart(trends);
    console.log(output);
    return output;
  }

  /**
   * Display trend report
   * @param {string} repoName Repository name
   * @returns {string} Formatted report
   */
  displayTrendReport(repoName) {
    const comparison = this.aggregator.getComparativeAnalysis(repoName, 7, 7);
    const prediction = this.aggregator.predictHealthScore(repoName, 30);
    const output = this._buildTrendReport(comparison, prediction);
    console.log(output);
    return output;
  }

  /**
   * Build dashboard string
   * @private
   */
  _buildDashboard(report) {
    const lines = [];

    lines.push('='.repeat(56));
    lines.push('    Evolution Dashboard -- Repository Health Overview');
    lines.push('='.repeat(56));
    lines.push('');

    // Overall status
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

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('Recommendations:');
      report.recommendations.forEach((rec, idx) => {
        lines.push(`  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        lines.push(`     -> ${rec.action}`);
      });
    }

    lines.push('');
    lines.push(`Updated: ${new Date(report.timestamp).toISOString()}`);

    return lines.join('\n');
  }

  /**
   * Build health chart
   * @private
   */
  _buildHealthChart(trends) {
    const lines = [];
    lines.push('Health Score Trend (30 days)');
    lines.push(this._renderLineChart(trends.trend, 10));
    lines.push('');
    if (trends.analysis) {
      lines.push(`Direction: ${trends.analysis.direction}`);
      lines.push(`Velocity: ${trends.analysis.velocity} points per snapshot`);
    }

    return lines.join('\n');
  }

  /**
   * Build trend report
   * @private
   */
  _buildTrendReport(comparison, prediction) {
    const lines = [];
    lines.push('Trend Analysis & Prediction');
    lines.push('');

    if (comparison.comparison) {
      lines.push(`Period Comparison (Last ${comparison.period2Days} vs ${comparison.period1Days} days):`);
      lines.push(`  Health Score Change: ${comparison.comparison.improvement.healthScore}`);
      lines.push(`  Test Coverage Change: ${comparison.comparison.improvement.testCoverage}%`);
      lines.push(`  Trend: ${comparison.trendDirection === 'improving' ? 'Improving' : 'Declining'}`);
      lines.push('');
    }

    if (prediction.prediction !== null) {
      lines.push('30-Day Prediction:');
      lines.push(`  Predicted Score: ${prediction.prediction}/10`);
      lines.push(`  Confidence: ${prediction.confidence}%`);
      lines.push(`  Direction: ${prediction.trend}`);
    }

    return lines.join('\n');
  }

  /**
   * Render line chart
   * @private
   */
  _renderLineChart(trend, maxValue) {
    if (!trend || trend.length === 0) {
      return 'No data available';
    }

    const values = trend.map((t) => t.value).filter((v) => v !== null);
    if (values.length === 0) {
      return 'No data available';
    }

    const height = 8;
    const width = Math.min(values.length, 50);
    const grid = Array(height).fill(null).map(() => Array(width).fill(' '));

    const min = Math.min(...values);
    const max = Math.max(...values, maxValue);
    const range = max - min || 1;
    const normalized = values.map((v) => ((v - min) / range) * (height - 1));

    for (let i = 0; i < Math.min(width, normalized.length); i += 1) {
      const y = height - 1 - Math.round(normalized[i]);
      grid[y][i] = '*';
    }

    const lines = [];
    for (let y = 0; y < height; y += 1) {
      const label = (max - (y / height) * range).toFixed(0).padStart(3);
      lines.push(`${label} |${grid[y].join('')}`);
    }
    lines.push('    +' + '-'.repeat(width));

    return lines.join('\n');
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
}

module.exports = DashboardCLI;
