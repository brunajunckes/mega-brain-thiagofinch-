'use strict';

/**
 * RiskAssessor — Identify at-risk repositories and track debt accumulation
 *
 * @class RiskAssessor
 * @version 1.0.0
 * @story 3.1 Phase 2
 */
class RiskAssessor {
  constructor(portfolioManager) {
    this.portfolio = portfolioManager;
  }

  /**
   * Assess overall portfolio risk
   * @returns {Object} Risk assessment
   */
  assessPortfolioRisk() {
    const repos = this.portfolio.repositories;
    const atRisk = this.portfolio.getAtRiskRepositories();

    const riskLevels = {
      critical: repos.filter(r => r.healthScore < 3).length,
      high: repos.filter(r => r.healthScore >= 3 && r.healthScore < 5).length,
      medium: repos.filter(r => r.healthScore >= 5 && r.healthScore < 7).length,
      low: repos.filter(r => r.healthScore >= 7).length,
    };

    const portfolioRisk = this._calculatePortfolioRisk(riskLevels);

    return {
      overallRisk: portfolioRisk,
      riskDistribution: riskLevels,
      atRiskCount: atRisk.length,
      atRiskPercentage: Math.round((atRisk.length / repos.length) * 100),
      criticalRepositories: repos.filter(r => r.healthScore < 3),
      recommendations: this._generateRiskRecommendations(atRisk),
    };
  }

  /**
   * Detect regressions (potential health declines)
   * @param {Array} previousMetrics Previous snapshot
   * @returns {Object} Detected regressions
   */
  detectRegressions(previousMetrics) {
    const regressions = [];

    this.portfolio.repositories.forEach((current) => {
      const previous = previousMetrics.find(p => p.name === current.name);
      if (!previous) return;

      const healthDelta = current.healthScore - (previous.healthScore || 0);
      const coverageDelta = current.testCoverage - (previous.testCoverage || 0);

      if (healthDelta < -0.5) {
        regressions.push({
          repository: current.name,
          type: 'health_decline',
          severity: Math.abs(healthDelta) > 2 ? 'critical' : 'high',
          from: previous.healthScore,
          to: current.healthScore,
          delta: healthDelta,
        });
      }

      if (coverageDelta < -5) {
        regressions.push({
          repository: current.name,
          type: 'coverage_decline',
          severity: 'medium',
          from: previous.testCoverage,
          to: current.testCoverage,
          delta: coverageDelta,
        });
      }

      if (current.debtLevel !== previous.debtLevel) {
        const worsened = this._isDebtWorsened(previous.debtLevel, current.debtLevel);
        if (worsened) {
          regressions.push({
            repository: current.name,
            type: 'debt_increase',
            severity: 'high',
            from: previous.debtLevel,
            to: current.debtLevel,
          });
        }
      }
    });

    return {
      detected: regressions.length,
      regressions: regressions,
      critical: regressions.filter(r => r.severity === 'critical').length,
      high: regressions.filter(r => r.severity === 'high').length,
    };
  }

  /**
   * Get risk matrix (repos vs risk factors)
   * @returns {Object} Risk matrix
   */
  getRiskMatrix() {
    const repos = this.portfolio.repositories;
    const matrix = {};

    repos.forEach((repo) => {
      const factors = [];

      if (repo.healthScore < 5) factors.push('low_health');
      if (['critical', 'high'].includes(repo.debtLevel)) factors.push('high_debt');
      if (repo.testCoverage < 50) factors.push('low_coverage');
      if (repo.totalFiles > 500) factors.push('large_codebase');
      if (repo.codeQuality < 5) factors.push('poor_quality');

      matrix[repo.name] = {
        riskFactors: factors,
        riskScore: this._calculateRiskScore(repo),
        riskLevel: this._getRiskLevel(factors.length),
      };
    });

    return {
      timestamp: new Date().toISOString(),
      totalRepositories: repos.length,
      atRiskRepositories: Object.values(matrix).filter(m => m.riskLevel !== 'low').length,
      matrix: matrix,
    };
  }

  /**
   * Get debt trend (accumulation/reduction)
   * @returns {Object} Debt trend
   */
  getDebtTrend() {
    const repos = this.portfolio.repositories;
    const debtLevels = { critical: 5, high: 4, moderate: 3, low: 2, minimal: 1 };

    const avgDebtScore = repos.reduce((sum, r) => sum + (debtLevels[r.debtLevel] || 3), 0) / repos.length;

    const distribution = {
      critical: repos.filter(r => r.debtLevel === 'critical').length,
      high: repos.filter(r => r.debtLevel === 'high').length,
      moderate: repos.filter(r => r.debtLevel === 'moderate').length,
      low: repos.filter(r => r.debtLevel === 'low').length,
      minimal: repos.filter(r => r.debtLevel === 'minimal').length,
    };

    return {
      averageDebtScore: Math.round(avgDebtScore * 100) / 100,
      distribution: distribution,
      totalRepositories: repos.length,
      percentCritical: Math.round((distribution.critical / repos.length) * 100),
      recommendedActions: this._getDebtReductionActions(distribution),
    };
  }

  /**
   * Calculate portfolio risk level
   * @private
   */
  _calculatePortfolioRisk(riskLevels) {
    const total = Object.values(riskLevels).reduce((a, b) => a + b, 0);
    if (total === 0) return 'unknown';

    const criticalPercent = (riskLevels.critical / total) * 100;
    const highPercent = ((riskLevels.critical + riskLevels.high) / total) * 100;

    if (criticalPercent > 10) return 'critical';
    if (highPercent > 25) return 'high';
    if (riskLevels.medium + riskLevels.high > total * 0.5) return 'medium';
    return 'low';
  }

  /**
   * Check if debt worsened
   * @private
   */
  _isDebtWorsened(from, to) {
    const levels = { minimal: 5, low: 4, moderate: 3, high: 2, critical: 1 };
    return (levels[to] || 0) < (levels[from] || 0);
  }

  /**
   * Calculate risk score for repository
   * @private
   */
  _calculateRiskScore(repo) {
    let score = 0;
    if (repo.healthScore < 5) score += 3;
    if (['critical', 'high'].includes(repo.debtLevel)) score += 2;
    if (repo.testCoverage < 50) score += 2;
    if (repo.codeQuality < 5) score += 1;
    return Math.min(score, 10);
  }

  /**
   * Get risk level based on factors
   * @private
   */
  _getRiskLevel(factorCount) {
    if (factorCount >= 4) return 'critical';
    if (factorCount === 3) return 'high';
    if (factorCount === 2) return 'medium';
    if (factorCount === 1) return 'low';
    return 'minimal';
  }

  /**
   * Generate risk recommendations
   * @private
   */
  _generateRiskRecommendations(atRiskRepos) {
    const recommendations = [];

    if (atRiskRepos.length > 5) {
      recommendations.push({
        priority: 'critical',
        action: 'Establish debt reduction program',
        rationale: `${atRiskRepos.length} repositories are at risk`,
      });
    }

    atRiskRepos.slice(0, 3).forEach((repo) => {
      recommendations.push({
        priority: 'high',
        action: `Review and remediate ${repo.name}`,
        rationale: `Health score: ${repo.healthScore}/10, Debt: ${repo.debtLevel}`,
      });
    });

    return recommendations;
  }

  /**
   * Get debt reduction actions
   * @private
   */
  _getDebtReductionActions(distribution) {
    const actions = [];

    if (distribution.critical > 0) {
      actions.push('Allocate resources to critical debt reduction');
    }
    if (distribution.high > 0) {
      actions.push('Schedule debt remediation sprints');
    }
    if (distribution.moderate > 0) {
      actions.push('Include debt reduction in regular development');
    }

    return actions;
  }
}

module.exports = RiskAssessor;
