'use strict';

/**
 * ImpactCalculator — Evaluates impact of repository changes
 *
 * Scores changes on scale 1-10:
 * - Architecture changes (major/minor)
 * - Dependency changes (security/compatibility risk)
 * - Metrics regression (quality loss)
 * - Overall impact assessment
 *
 * @class ImpactCalculator
 * @version 1.0.0
 * @story 2.2
 */
class ImpactCalculator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Calculate overall impact from diff
   * @param {Object} diff Diff object from DiffAnalyzer
   * @returns {Object} Impact assessment
   */
  calculateImpact(diff) {
    if (!diff) {
      throw new Error('Diff object required');
    }

    const changes = diff.changes || {};

    const architectureImpact = this._scoreArchitectureChange(changes.architecture);
    const dependencyImpact = this._scoreDependencyChange(changes.dependencies);
    const metricsImpact = this._scoreMetricsChange(changes.metrics);
    const languageImpact = this._scoreLanguageChange(changes.languages);

    const scores = [architectureImpact, dependencyImpact, metricsImpact, languageImpact];

    // Weighted score: architecture has 50% weight (structural changes are critical)
    const overallScore = Math.round(
      (architectureImpact * 0.5 + dependencyImpact * 0.2 + metricsImpact * 0.15 + languageImpact * 0.15) * 10
    ) / 10;

    return {
      overallScore,
      severity: this._getSeverity(overallScore),
      breaking: architectureImpact >= 8 && dependencyImpact >= 7,
      components: {
        architecture: architectureImpact,
        dependencies: dependencyImpact,
        metrics: metricsImpact,
        languages: languageImpact,
      },
      summary: this._generateSummary(diff, scores),
      recommendations: this._generateRecommendations(diff, scores),
    };
  }

  /**
   * Score architecture changes
   * @private
   */
  _scoreArchitectureChange(archDiff) {
    if (!archDiff) return 2;

    // No change
    if (!archDiff.changed) return 1;

    // Major pattern shift (e.g., Monolithic → Modular)
    const majorShifts = [
      ['Monolithic', 'Modular'],
      ['Monolithic', 'Layered'],
      ['Layered', 'Modular'],
    ];

    const isMajor = majorShifts.some(
      ([from, to]) =>
        (archDiff.change?.from === from && archDiff.change?.to === to) ||
        (archDiff.change?.from === to && archDiff.change?.to === from),
    );

    return isMajor ? 8 : 5;
  }

  /**
   * Score dependency changes
   * @private
   */
  _scoreDependencyChange(depDiff) {
    if (!depDiff) return 1;

    let score = 0;

    // Major version upgrades in production
    const prodUpgrades = depDiff.production?.upgraded || [];
    const majorUpgrades = prodUpgrades.filter((u) => {
      const fromVersion = u.from.split('@').pop();
      const toVersion = u.to.split('@').pop();
      const fromMajor = fromVersion.split('.')[0];
      const toMajor = toVersion.split('.')[0];
      return fromMajor !== toMajor;
    }).length;

    score += majorUpgrades * 2;

    // Removed production dependencies (risky)
    const prodRemoved = depDiff.production?.removed?.length || 0;
    score += prodRemoved * 1.5;

    // Many additions (complexity)
    const prodAdded = depDiff.production?.added?.length || 0;
    if (prodAdded > 5) score += 2;
    else if (prodAdded > 0) score += 0.5;

    // Normalize to 1-10
    return Math.min(10, Math.max(1, score));
  }

  /**
   * Score metrics changes
   * @private
   */
  _scoreMetricsChange(metricsDiff) {
    if (!metricsDiff) return 3;

    let regressionCount = 0;
    let improvementCount = 0;

    for (const [key, metric] of Object.entries(metricsDiff)) {
      if (metric.status === 'regressed') regressionCount++;
      if (metric.status === 'improved') improvementCount++;
    }

    // Regressions are bad (reduce score)
    let score = 5;
    score -= regressionCount * 1.5;
    score += improvementCount * 0.5;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Score language changes
   * @private
   */
  _scoreLanguageChange(langDiff) {
    if (!langDiff) return 2;

    let score = 2;

    // Adding new languages increases complexity
    if (langDiff.added?.length > 0) {
      score += langDiff.added.length * 0.5;
    }

    // Removing languages is risky (dependencies?)
    if (langDiff.removed?.length > 0) {
      score += langDiff.removed.length * 1.5;
    }

    // Major changes in primary language
    const modified = langDiff.modified || [];
    const significantChange = modified.some((m) => Math.abs(m.fileChange) > 50 || Math.abs(m.locChange) > 5000);
    if (significantChange) score += 1;

    return Math.min(10, score);
  }

  /**
   * Get severity label
   * @private
   */
  _getSeverity(score) {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'moderate';
    if (score >= 2) return 'low';
    return 'minimal';
  }

  /**
   * Generate impact summary
   * @private
   */
  _generateSummary(diff, scores) {
    const changes = diff.changes || {};

    const parts = [];

    if (changes.architecture?.changed) {
      parts.push(`Architecture shifted from ${changes.architecture.change?.from} to ${changes.architecture.change?.to}`);
    }

    const fileChange = changes.metadata?.fileChange || 0;
    if (fileChange !== 0) {
      parts.push(`${fileChange > 0 ? '+' : ''}${fileChange} files (${fileChange > 0 ? 'growth' : 'shrinkage'})`);
    }

    const depChange = changes.dependencies?.total?.change || 0;
    if (depChange !== 0) {
      parts.push(`${depChange > 0 ? '+' : ''}${depChange} dependencies`);
    }

    if (changes.metrics?.codeQuality?.status === 'regressed') {
      parts.push(`Code quality ${changes.metrics.codeQuality.before}/10 → ${changes.metrics.codeQuality.after}/10`);
    }

    return parts.length > 0 ? parts.join('; ') : 'Minor repository changes';
  }

  /**
   * Generate recommendations
   * @private
   */
  _generateRecommendations(diff, scores) {
    const changes = diff.changes || {};
    const recs = [];

    // Architecture recommendations
    if (changes.architecture?.changed) {
      recs.push({
        category: 'Architecture',
        priority: 'high',
        message: `Verify new ${changes.architecture.change?.to} architecture is fully tested`,
      });
    }

    // Dependency recommendations
    const prodRemoved = changes.dependencies?.production?.removed || [];
    if (prodRemoved.length > 0) {
      recs.push({
        category: 'Dependencies',
        priority: 'critical',
        message: `${prodRemoved.length} production dependencies removed - ensure proper migration`,
      });
    }

    const majorUpgrades = (changes.dependencies?.production?.upgraded || []).filter((u) => {
      const fromMajor = u.from.split('@').pop().split('.')[0];
      const toMajor = u.to.split('@').pop().split('.')[0];
      return fromMajor !== toMajor;
    });
    if (majorUpgrades.length > 0) {
      recs.push({
        category: 'Dependencies',
        priority: 'high',
        message: `${majorUpgrades.length} major version upgrades - test thoroughly`,
      });
    }

    // Metrics recommendations
    if (changes.metrics?.codeQuality?.status === 'regressed') {
      recs.push({
        category: 'Quality',
        priority: 'high',
        message: 'Code quality regressed - prioritize refactoring',
      });
    }

    if (changes.metrics?.testCoverage?.status === 'regressed') {
      recs.push({
        category: 'Testing',
        priority: 'high',
        message: 'Test coverage decreased - add more tests',
      });
    }

    // Language recommendations
    const newLanguages = changes.languages?.added || [];
    if (newLanguages.length > 0) {
      recs.push({
        category: 'Languages',
        priority: 'medium',
        message: `${newLanguages.length} new language(s) added - update documentation and tooling`,
      });
    }

    if (recs.length === 0) {
      recs.push({
        category: 'General',
        priority: 'low',
        message: 'No major issues detected - changes look healthy',
      });
    }

    return recs;
  }
}

module.exports = { ImpactCalculator };
