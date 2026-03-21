'use strict';

/**
 * Impact Calculator — Assesses change severity and impact
 *
 * Scores:
 * - Architecture changes (0-3 points)
 * - Dependency changes (0-3 points)
 * - Metrics changes (0-2 points)
 * - Language changes (0-2 points)
 * = Total 0-10 impact score
 *
 * @class ImpactCalculator
 * @version 1.0.0
 * @story 2.2
 */
class ImpactCalculator {
  constructor() {
    this.changeScore = 0;
    this.breaking = false;
    this.recommendations = [];
  }

  /**
   * Calculate overall impact from diff
   * @param {Object} diff Diff report from DiffAnalyzer
   * @returns {Object} Impact assessment
   */
  assess(diff) {
    try {
      if (!diff || !diff.changes) {
        throw new Error('Invalid diff format');
      }

      this.changeScore = 0;
      this.breaking = false;
      this.recommendations = [];

      // Score each category
      const architectureScore = this._scoreArchitectureChange(diff.changes.architecture);
      const dependencyScore = this._scoreDependencyChange(diff.changes.dependencies);
      const metricsScore = this._scoreMetricsChange(diff.changes.metrics);
      const languageScore = this._scoreLanguageChange(diff.changes.languages);

      this.changeScore = Math.min(
        10,
        architectureScore + dependencyScore + metricsScore + languageScore,
      );

      // Generate recommendations
      this._generateRecommendations(diff.changes);

      return this._generateAssessment();
    } catch (error) {
      throw new Error(`Impact assessment failed: ${error.message}`);
    }
  }

  /**
   * Score architecture changes
   * @private
   */
  _scoreArchitectureChange(archChange) {
    if (!archChange || !archChange.changed) {
      return 0;
    }

    let score = 0;

    if (archChange.impact === 'major') {
      score = 3;
      this.breaking = true;
      this.recommendations.push('Major architecture refactoring required for this change');
    } else if (archChange.impact === 'minor') {
      score = 1;
    }

    return score;
  }

  /**
   * Score dependency changes
   * @private
   */
  _scoreDependencyChange(depChanges) {
    if (!depChanges) {
      return 0;
    }

    let score = 0;

    // Additions are lower risk
    const addedCount = (depChanges.added || []).length;
    if (addedCount > 0) {
      score += Math.min(1, addedCount * 0.1);
    }

    // Removals are moderate risk
    const removedCount = (depChanges.removed || []).length;
    if (removedCount > 0) {
      score += Math.min(1, removedCount * 0.2);
      if (removedCount > 3) {
        this.recommendations.push('Many dependencies removed - ensure full compatibility');
      }
    }

    // Major upgrades are higher risk
    const upgradedCount = (depChanges.upgraded || []).length;
    if (upgradedCount > 0) {
      score += Math.min(1, upgradedCount * 0.15);
      if (upgradedCount > 5) {
        this.recommendations.push('Multiple dependency upgrades - test thoroughly');
      }
    }

    return Math.min(3, score);
  }

  /**
   * Score metrics changes
   * @private
   */
  _scoreMetricsChange(metrics) {
    if (!metrics) {
      return 0;
    }

    let score = 0;

    // Test coverage regression
    if (metrics.testCoverage && metrics.testCoverage.status === 'regressed') {
      score += 1;
      this.recommendations.push(
        `Test coverage regressed by ${Math.abs(metrics.testCoverage.change)}% - add tests`,
      );
    }

    // Code quality regression
    if (metrics.codeQuality && metrics.codeQuality.status === 'regressed') {
      score += 1;
      this.recommendations.push('Code quality has regressed - review recent changes');
    }

    return Math.min(2, score);
  }

  /**
   * Score language changes
   * @private
   */
  _scoreLanguageChange(langChanges) {
    if (!langChanges) {
      return 0;
    }

    let score = 0;

    // New languages
    const addedCount = (langChanges.added || []).length;
    if (addedCount > 0) {
      score += Math.min(0.5, addedCount * 0.1);
      this.recommendations.push(
        `New language(s) detected: ${langChanges.added.map((l) => l.language).join(', ')} - ensure tooling support`,
      );
    }

    // Removed languages
    const removedCount = (langChanges.removed || []).length;
    if (removedCount > 0) {
      score += Math.min(1, removedCount * 0.2);
      this.recommendations.push(
        `Language(s) removed: ${langChanges.removed.map((l) => l.language).join(', ')}`,
      );
    }

    return Math.min(2, score);
  }

  /**
   * Generate recommendations
   * @private
   */
  _generateRecommendations(changes) {
    // Check for major changes
    if (changes.architecture && changes.architecture.changed) {
      this.recommendations.push('Comprehensive testing recommended for architecture changes');
    }

    // Check for test coverage improvements
    if (
      changes.metrics &&
      changes.metrics.testCoverage &&
      changes.metrics.testCoverage.status === 'improved'
    ) {
      this.recommendations.push('✅ Test coverage improved - keep it up!');
    }

    // Check for quality improvements
    if (
      changes.metrics &&
      changes.metrics.codeQuality &&
      changes.metrics.codeQuality.status === 'improved'
    ) {
      this.recommendations.push('✅ Code quality improved - great work!');
    }
  }

  /**
   * Generate impact assessment report
   * @private
   */
  _generateAssessment() {
    let severity = 'low';
    if (this.changeScore > 7) {
      severity = 'critical';
    } else if (this.changeScore > 5) {
      severity = 'high';
    } else if (this.changeScore > 3) {
      severity = 'moderate';
    }

    return {
      overallScore: this.changeScore,
      severity,
      breaking: this.breaking,
      recommendations: this.recommendations.length > 0 ? this.recommendations : ['No concerns detected'],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get impact score
   */
  getScore() {
    return this.changeScore;
  }

  /**
   * Check if changes are breaking
   */
  isBreaking() {
    return this.breaking;
  }

  /**
   * Get recommendations
   */
  getRecommendations() {
    return this.recommendations;
  }
}

module.exports = { ImpactCalculator };
