'use strict';

const { TimelineManager } = require('../evolution-dashboard');

/**
 * Portfolio Manager — Aggregates health across repositories
 *
 * @class PortfolioManager
 * @version 1.0.0
 * @story 3.1
 */
class PortfolioManager {
  constructor(options = {}) {
    this.timelineManager = new TimelineManager(options);
  }

  /**
   * Get portfolio metrics
   * @param {Object} options Options
   * @returns {Promise<Object>} Portfolio metrics
   */
  async getPortfolioMetrics(options = {}) {
    try {
      const repos = await this.timelineManager.getRepositories();

      if (repos.length === 0) {
        return { status: 'no_data', repositories: [] };
      }

      const repoMetrics = [];

      for (const repoName of repos) {
        const snapshots = await this.timelineManager.getSnapshots(repoName, {
          limit: 1,
        });

        if (snapshots.length > 0) {
          const snapshot = snapshots[0];
          const data = snapshot.data;

          repoMetrics.push({
            repository: repoName,
            timestamp: snapshot.timestamp,
            testCoverage: data.metrics?.testCoverage || 0,
            codeQuality: data.metrics?.codeQuality || 0,
            files: data.summary?.totalFiles || 0,
            loc: data.summary?.totalLoc || 0,
            languages: Object.keys(data.languages || {}).length,
            dependencies: (data.dependencies?.production || []).length,
            architecture: data.architecture?.pattern?.name || 'unknown',
            healthScore: this._calculateHealthScore(data),
          });
        }
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        repositories: repoMetrics.sort((a, b) => a.healthScore - b.healthScore),
        portfolio: this._calculatePortfolioMetrics(repoMetrics),
      };
    } catch (error) {
      throw new Error(`Portfolio metrics failed: ${error.message}`);
    }
  }

  /**
   * Calculate health score for repository
   * @private
   */
  _calculateHealthScore(data) {
    const metrics = data.metrics || {};
    const arch = data.architecture || {};

    const coverage = (metrics.testCoverage || 0) / 10; // 0-10
    const quality = metrics.codeQuality || 0; // 0-10
    const archScore = (arch.pattern?.score || 0.5) * 10; // 0-10

    return Math.round((coverage + quality + archScore) / 3 * 10) / 10;
  }

  /**
   * Calculate portfolio-level metrics
   * @private
   */
  _calculatePortfolioMetrics(repos) {
    if (repos.length === 0) {
      return {};
    }

    const healthScores = repos.map((r) => r.healthScore);
    const coverages = repos.map((r) => r.testCoverage);
    const qualities = repos.map((r) => r.codeQuality);

    return {
      totalRepositories: repos.length,
      averageHealth: (healthScores.reduce((a, b) => a + b, 0) / repos.length).toFixed(1),
      averageCoverage: (coverages.reduce((a, b) => a + b, 0) / repos.length).toFixed(1),
      averageQuality: (qualities.reduce((a, b) => a + b, 0) / repos.length).toFixed(1),
      healthyRepos: repos.filter((r) => r.healthScore >= 7).length,
      atRiskRepos: repos.filter((r) => r.healthScore < 5).length,
      totalLoc: repos.reduce((sum, r) => sum + r.loc, 0),
      totalFiles: repos.reduce((sum, r) => sum + r.files, 0),
    };
  }
}

module.exports = { PortfolioManager };
