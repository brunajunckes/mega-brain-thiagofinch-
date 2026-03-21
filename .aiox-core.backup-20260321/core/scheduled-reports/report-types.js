'use strict';

const { randomUUID } = require('crypto');

/**
 * Report Types — Generate different report types from portfolio data
 *
 * @class ReportTypes
 * @version 1.0.0
 * @story 3.6
 */
class ReportTypes {
  /**
   * Generate portfolio health report
   * @param {Array} repos - Repository data
   * @param {Object} options - Report options
   * @returns {Object} Portfolio report
   */
  static generatePortfolioReport(repos, options = {}) {
    if (!Array.isArray(repos) || repos.length === 0) {
      return {
        id: `report_${randomUUID()}`,
        type: 'portfolio',
        timestamp: new Date().toISOString(),
        status: 'empty',
        message: 'No repositories available',
      };
    }

    // Calculate aggregate metrics
    const totalRepos = repos.length;
    const avgHealthScore =
      repos.reduce((sum, r) => sum + (r.healthScore || 0), 0) / totalRepos;
    const avgCoverage =
      repos.reduce((sum, r) => sum + (r.testCoverage || 0), 0) / totalRepos;
    const totalLines = repos.reduce((sum, r) => sum + (r.loc || 0), 0);
    const totalDeps = repos.reduce((sum, r) => sum + (r.dependencies || 0), 0);

    // Categorize health
    const healthy = repos.filter((r) => (r.healthScore || 0) >= 7).length;
    const atRisk = repos.filter(
      (r) => (r.healthScore || 0) >= 5 && (r.healthScore || 0) < 7
    ).length;
    const critical = repos.filter((r) => (r.healthScore || 0) < 5).length;

    return {
      id: `report_${randomUUID()}`,
      type: 'portfolio',
      timestamp: new Date().toISOString(),
      status: 'ok',
      summary: {
        totalRepositories: totalRepos,
        healthyCount: healthy,
        atRiskCount: atRisk,
        criticalCount: critical,
      },
      metrics: {
        averageHealthScore: Math.round(avgHealthScore * 100) / 100,
        averageTestCoverage: Math.round(avgCoverage * 100) / 100,
        totalLinesOfCode: totalLines,
        totalDependencies: totalDeps,
      },
      topHealthy: repos
        .filter((r) => r.healthScore)
        .sort((a, b) => b.healthScore - a.healthScore)
        .slice(0, 5)
        .map((r) => ({
          repository: r.repository,
          healthScore: r.healthScore,
          coverage: r.testCoverage,
        })),
      topAtRisk: repos
        .filter((r) => r.healthScore && r.healthScore < 7)
        .sort((a, b) => a.healthScore - b.healthScore)
        .slice(0, 5)
        .map((r) => ({
          repository: r.repository,
          healthScore: r.healthScore,
          coverage: r.testCoverage,
        })),
    };
  }

  /**
   * Generate trends report
   * @param {Array} history - Historical data points
   * @param {Object} options - Report options
   * @returns {Object} Trends report
   */
  static generateTrendsReport(history, options = {}) {
    if (!Array.isArray(history) || history.length === 0) {
      return {
        id: `report_${randomUUID()}`,
        type: 'trends',
        timestamp: new Date().toISOString(),
        status: 'empty',
        message: 'No historical data available',
      };
    }

    // Calculate trends
    const first = history[0];
    const last = history[history.length - 1];

    const healthTrend = {
      start: first.avgHealthScore || 0,
      end: last.avgHealthScore || 0,
      change: (last.avgHealthScore || 0) - (first.avgHealthScore || 0),
      direction: (last.avgHealthScore || 0) >= (first.avgHealthScore || 0) ? 'up' : 'down',
    };

    const coverageTrend = {
      start: first.avgCoverage || 0,
      end: last.avgCoverage || 0,
      change: (last.avgCoverage || 0) - (first.avgCoverage || 0),
      direction:
        (last.avgCoverage || 0) >= (first.avgCoverage || 0) ? 'up' : 'down',
    };

    return {
      id: `report_${randomUUID()}`,
      type: 'trends',
      timestamp: new Date().toISOString(),
      status: 'ok',
      period: {
        start: first.timestamp,
        end: last.timestamp,
        dataPoints: history.length,
      },
      trends: {
        healthScore: healthTrend,
        testCoverage: coverageTrend,
      },
      analysis: {
        healthImproving: healthTrend.direction === 'up',
        coverageImproving: coverageTrend.direction === 'up',
        momentum: healthTrend.change + coverageTrend.change,
      },
    };
  }

  /**
   * Generate insights summary report
   * @param {Array} insights - Recent insights
   * @param {Object} options - Report options
   * @returns {Object} Insights report
   */
  static generateInsightsReport(insights, options = {}) {
    if (!Array.isArray(insights) || insights.length === 0) {
      return {
        id: `report_${randomUUID()}`,
        type: 'insights',
        timestamp: new Date().toISOString(),
        status: 'empty',
        message: 'No insights available',
      };
    }

    // Group by type
    const byType = {};
    for (const insight of insights) {
      if (!byType[insight.type]) {
        byType[insight.type] = [];
      }
      byType[insight.type].push(insight);
    }

    // Sort by priority
    for (const type in byType) {
      byType[type].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    return {
      id: `report_${randomUUID()}`,
      type: 'insights',
      timestamp: new Date().toISOString(),
      status: 'ok',
      summary: {
        totalInsights: insights.length,
        byType: Object.keys(byType).reduce((acc, type) => {
          acc[type] = byType[type].length;
          return acc;
        }, {}),
      },
      topInsights: insights
        .filter((i) => i.priority)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 10)
        .map((i) => ({
          type: i.type,
          title: i.title,
          priority: i.priority,
          repository: i.repository,
        })),
      byType: Object.keys(byType).reduce((acc, type) => {
        acc[type] = byType[type]
          .slice(0, 5)
          .map((i) => ({
            title: i.title,
            priority: i.priority,
            repository: i.repository,
          }));
        return acc;
      }, {}),
    };
  }

  /**
   * Generate compliance report
   * @param {Array} repos - Repository data
   * @param {Array} rules - Compliance rules
   * @param {Object} options - Report options
   * @returns {Object} Compliance report
   */
  static generateComplianceReport(repos, rules = [], options = {}) {
    if (!Array.isArray(repos) || repos.length === 0) {
      return {
        id: `report_${randomUUID()}`,
        type: 'compliance',
        timestamp: new Date().toISOString(),
        status: 'empty',
        message: 'No repositories available',
      };
    }

    const results = [];
    for (const repo of repos) {
      const repoResults = {
        repository: repo.repository,
        passed: 0,
        failed: 0,
        violations: [],
      };

      for (const rule of rules) {
        if (this._checkRule(repo, rule)) {
          repoResults.passed++;
        } else {
          repoResults.failed++;
          repoResults.violations.push(rule.name);
        }
      }

      results.push(repoResults);
    }

    const totalChecks = results.length * rules.length;
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const compliantRepos = results.filter((r) => r.failed === 0).length;

    return {
      id: `report_${randomUUID()}`,
      type: 'compliance',
      timestamp: new Date().toISOString(),
      status: 'ok',
      summary: {
        totalRepositories: results.length,
        totalRules: rules.length,
        compliantRepos: compliantRepos,
        passedChecks: totalPassed,
        totalChecks: totalChecks,
        complianceRate:
          Math.round((totalPassed / totalChecks) * 10000) / 100 + '%',
      },
      violations: results
        .filter((r) => r.failed > 0)
        .sort((a, b) => b.failed - a.failed),
      detailed: results,
    };
  }

  /**
   * Check if repo passes a compliance rule
   * @private
   */
  static _checkRule(repo, rule) {
    if (!rule.check || typeof rule.check !== 'function') {
      return true;
    }
    try {
      return rule.check(repo);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get valid report types
   * @returns {Array} List of valid report types
   */
  static getValidTypes() {
    return ['portfolio', 'trends', 'insights', 'compliance', 'custom'];
  }
}

module.exports = { ReportTypes };
