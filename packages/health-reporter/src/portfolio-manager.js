'use strict';

/**
 * PortfolioManager — Aggregate health metrics across repositories
 *
 * @class PortfolioManager
 * @version 1.0.0
 * @story 3.1 Phase 1
 */
class PortfolioManager {
  constructor(options = {}) {
    this.repositories = [];
  }

  /**
   * Add repository to portfolio
   * @param {string} name Repository name
   * @param {Object} metrics Repository metrics
   */
  addRepository(name, metrics) {
    this.repositories.push({
      name,
      healthScore: metrics.healthScore || 5,
      testCoverage: metrics.testCoverage || 0,
      codeQuality: metrics.codeQuality || 5,
      debtLevel: metrics.debtLevel || 'moderate',
      totalFiles: metrics.totalFiles || 0,
      totalLines: metrics.totalLines || 0,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get portfolio summary
   * @returns {Object} Portfolio metrics
   */
  getPortfolioSummary() {
    if (this.repositories.length === 0) {
      return { error: 'No repositories in portfolio' };
    }

    const health = this.repositories.map(r => r.healthScore);
    const coverage = this.repositories.map(r => r.testCoverage);

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const min = (arr) => Math.min(...arr);
    const max = (arr) => Math.max(...arr);

    return {
      totalRepositories: this.repositories.length,
      averageHealthScore: Math.round(avg(health) * 100) / 100,
      minHealthScore: min(health),
      maxHealthScore: max(health),
      averageTestCoverage: Math.round(avg(coverage)),
      debtDistribution: this._getDebtDistribution(),
      atRisk: this.repositories.filter(r => r.healthScore < 5).length,
    };
  }

  /**
   * Get repositories ranked by health
   * @param {number} limit Maximum results
   * @returns {Array} Sorted repositories
   */
  getRankedByHealth(limit = 100) {
    return this.repositories
      .slice()
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, limit)
      .map((repo, idx) => ({
        ...repo,
        rank: idx + 1,
      }));
  }

  /**
   * Get repositories ranked by debt
   * @param {number} limit Maximum results
   * @returns {Array} Sorted repositories
   */
  getRankedByDebt(limit = 100) {
    const debtScore = { critical: 1, high: 2, moderate: 3, low: 4, minimal: 5 };
    return this.repositories
      .slice()
      .sort((a, b) => (debtScore[a.debtLevel] || 0) - (debtScore[b.debtLevel] || 0))
      .slice(0, limit)
      .map((repo, idx) => ({
        ...repo,
        rank: idx + 1,
      }));
  }

  /**
   * Filter repositories by criteria
   * @param {Object} criteria Filter criteria
   * @returns {Array} Filtered repositories
   */
  filterRepositories(criteria) {
    return this.repositories.filter((repo) => {
      if (criteria.minHealth && repo.healthScore < criteria.minHealth) return false;
      if (criteria.maxHealth && repo.healthScore > criteria.maxHealth) return false;
      if (criteria.debtLevel && repo.debtLevel !== criteria.debtLevel) return false;
      if (criteria.minCoverage && repo.testCoverage < criteria.minCoverage) return false;
      return true;
    });
  }

  /**
   * Get at-risk repositories
   * @returns {Array} Critical and high-debt repos
   */
  getAtRiskRepositories() {
    return this.repositories
      .filter(r => r.healthScore < 6 || ['critical', 'high'].includes(r.debtLevel))
      .sort((a, b) => a.healthScore - b.healthScore);
  }

  /**
   * Get portfolio statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const repos = this.repositories;
    const health = repos.map(r => r.healthScore);
    const coverage = repos.map(r => r.testCoverage);

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const stdDev = (arr) => {
      const mean = avg(arr);
      const squareDiffs = arr.map(v => Math.pow(v - mean, 2));
      return Math.sqrt(avg(squareDiffs));
    };

    return {
      count: repos.length,
      healthScore: {
        avg: Math.round(avg(health) * 100) / 100,
        min: Math.min(...health),
        max: Math.max(...health),
        stdDev: Math.round(stdDev(health) * 100) / 100,
      },
      testCoverage: {
        avg: Math.round(avg(coverage)),
        min: Math.min(...coverage),
        max: Math.max(...coverage),
      },
      totalFiles: repos.reduce((sum, r) => sum + r.totalFiles, 0),
      totalLines: repos.reduce((sum, r) => sum + r.totalLines, 0),
    };
  }

  /**
   * Get debt distribution
   * @private
   */
  _getDebtDistribution() {
    const dist = { critical: 0, high: 0, moderate: 0, low: 0, minimal: 0 };
    this.repositories.forEach((r) => {
      dist[r.debtLevel] = (dist[r.debtLevel] || 0) + 1;
    });
    return dist;
  }
}

module.exports = PortfolioManager;
