'use strict';

/**
 * Risk Assessment — Identifies at-risk repositories
 *
 * @class RiskAssessment
 * @version 1.0.0
 * @story 3.1
 */
class RiskAssessment {
  /**
   * Assess risks in portfolio
   * @param {Array} repositories Repository metrics
   * @returns {Object} Risk assessment
   */
  static assess(repositories) {
    if (!repositories || repositories.length === 0) {
      return { status: 'no_data', risks: [], summary: {} };
    }

    const risks = [];
    const criticalRepos = [];
    const highRiskRepos = [];

    for (const repo of repositories) {
      const riskLevel = this._assessRepositoryRisk(repo);

      if (riskLevel.level === 'critical') {
        criticalRepos.push({
          repository: repo.repository,
          score: repo.healthScore,
          issues: riskLevel.issues,
        });
      } else if (riskLevel.level === 'high') {
        highRiskRepos.push({
          repository: repo.repository,
          score: repo.healthScore,
          issues: riskLevel.issues,
        });
      }

      if (riskLevel.issues.length > 0) {
        risks.push({
          repository: repo.repository,
          level: riskLevel.level,
          issues: riskLevel.issues,
        });
      }
    }

    return {
      status: 'ok',
      summary: {
        totalRepositories: repositories.length,
        critical: criticalRepos.length,
        high: highRiskRepos.length,
        medium: risks.length - criticalRepos.length - highRiskRepos.length,
      },
      criticalRepos,
      highRiskRepos,
      allRisks: risks,
    };
  }

  /**
   * Assess single repository risk
   * @private
   */
  static _assessRepositoryRisk(repo) {
    const issues = [];

    if (repo.healthScore < 4) {
      issues.push('Critical health score');
    } else if (repo.healthScore < 6) {
      issues.push('Low health score');
    }

    if (repo.testCoverage < 50) {
      issues.push('Test coverage critically low');
    } else if (repo.testCoverage < 70) {
      issues.push('Test coverage below standard');
    }

    if (repo.codeQuality < 4) {
      issues.push('Code quality degraded');
    }

    if (repo.loc > 500000) {
      issues.push('Large codebase - consider modularization');
    }

    if (repo.languages > 4) {
      issues.push('Too many programming languages');
    }

    let level = 'low';
    if (issues.length >= 3) {
      level = 'critical';
    } else if (issues.length === 2) {
      level = 'high';
    } else if (issues.length === 1) {
      level = 'medium';
    }

    return { level, issues };
  }
}

module.exports = { RiskAssessment };
