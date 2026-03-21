'use strict';

/**
 * Recommendation Generator — Creates actionable recommendations
 *
 * Generates prioritized recommendations based on:
 * - Repository analysis
 * - Health scores
 * - Detected opportunities
 * - Risk assessment
 *
 * @class RecommendationGenerator
 * @version 1.0.0
 * @story 2.3
 */
class RecommendationGenerator {
  constructor(options = {}) {
    this.analysis = null;
  }

  /**
   * Generate recommendations from analysis
   * @param {Object} analysis Analysis results from DecisionAnalyzer
   * @returns {Promise<Array>} Prioritized recommendations
   */
  async generate(analysis) {
    try {
      if (!analysis) {
        throw new Error('Analysis data is required');
      }

      this.analysis = analysis;
      const recommendations = [];

      // Generate architecture recommendations
      recommendations.push(...this._generateArchitectureRecs());

      // Generate dependency recommendations
      recommendations.push(...this._generateDependencyRecs());

      // Generate testing recommendations
      recommendations.push(...this._generateTestingRecs());

      // Generate language recommendations
      recommendations.push(...this._generateLanguageRecs());

      // Sort by priority (high impact, high confidence, low effort)
      recommendations.sort((a, b) => b.priority - a.priority);

      return {
        success: true,
        recommendations,
        summary: {
          total: recommendations.length,
          highPriority: recommendations.filter((r) => r.priority >= 15).length,
          mediumPriority: recommendations.filter((r) => r.priority >= 8 && r.priority < 15).length,
          lowPriority: recommendations.filter((r) => r.priority < 8).length,
        },
      };
    } catch (error) {
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  /**
   * Generate architecture recommendations
   * @private
   */
  _generateArchitectureRecs() {
    const recs = [];
    const state = this.analysis.currentState || {};
    const scores = this.analysis.healthScores || {};

    if (scores.architecture < 7) {
      recs.push({
        id: 'arch-001',
        category: 'architecture',
        title: `Improve architecture score from ${scores.architecture.toFixed(1)}/10`,
        description: 'Current architecture pattern could benefit from modernization',
        impact: 'high',
        confidence: 0.85,
        effort: 'high',
        estimatedDays: 30,
        priority: this._calculatePriority('high', 0.85, 'high'),
        steps: [
          'Map current module dependencies',
          'Identify coupling points',
          'Design new architecture',
          'Plan migration strategy',
        ],
      });
    }

    if (state.architecturePattern === 'Monolithic' && state.summary.totalLoc > 100000) {
      recs.push({
        id: 'arch-002',
        category: 'architecture',
        title: 'Consider microservices architecture',
        description: 'Large monolith could benefit from service-based decomposition',
        impact: 'high',
        confidence: 0.7,
        effort: 'high',
        estimatedDays: 60,
        priority: this._calculatePriority('high', 0.7, 'high'),
        steps: [
          'Identify service boundaries',
          'Plan API contracts',
          'Setup infrastructure',
        ],
      });
    }

    return recs;
  }

  /**
   * Generate dependency recommendations
   * @private
   */
  _generateDependencyRecs() {
    const recs = [];
    const changes = this.analysis.changes || {};
    const deps = changes.dependencies || {};

    if ((deps.upgraded || 0) > 0) {
      recs.push({
        id: 'dep-001',
        category: 'dependencies',
        title: `Modernize ${deps.upgraded} outdated dependencies`,
        description: `${deps.upgraded} packages have available updates`,
        impact: 'medium',
        confidence: 0.95,
        effort: 'medium',
        estimatedDays: 10,
        priority: this._calculatePriority('medium', 0.95, 'medium'),
        steps: [
          'Review breaking changes',
          'Update packages',
          'Run tests',
          'Deploy gradually',
        ],
      });
    }

    if ((deps.removed || 0) > 0) {
      recs.push({
        id: 'dep-002',
        category: 'dependencies',
        title: `Complete migration away from ${deps.removed} deprecated packages`,
        description: `${deps.removed} dependencies are no longer needed`,
        impact: 'medium',
        confidence: 0.9,
        effort: 'low',
        estimatedDays: 5,
        priority: this._calculatePriority('medium', 0.9, 'low'),
      });
    }

    return recs;
  }

  /**
   * Generate testing recommendations
   * @private
   */
  _generateTestingRecs() {
    const recs = [];
    const state = this.analysis.currentState || {};
    const changes = this.analysis.changes || {};
    const metrics = changes.metrics || {};

    if (state.testCoverage < 70) {
      recs.push({
        id: 'test-001',
        category: 'testing',
        title: `Increase test coverage from ${state.testCoverage}% to 85%`,
        description: 'Current coverage is below industry standard',
        impact: 'medium',
        confidence: 0.95,
        effort: 'medium',
        estimatedDays: 15,
        priority: this._calculatePriority('medium', 0.95, 'medium'),
        steps: [
          'Identify gaps',
          'Write unit tests',
          'Add integration tests',
          'Refactor for testability',
        ],
      });
    }

    if (metrics.testCoverageChange < -5) {
      recs.push({
        id: 'test-002',
        category: 'testing',
        title: `Restore test coverage (regressed ${Math.abs(metrics.testCoverageChange)}%)`,
        description: 'Test coverage has declined and should be recovered',
        impact: 'medium',
        confidence: 0.9,
        effort: 'medium',
        estimatedDays: 10,
        priority: this._calculatePriority('medium', 0.9, 'medium'),
      });
    }

    return recs;
  }

  /**
   * Generate language and framework recommendations
   * @private
   */
  _generateLanguageRecs() {
    const recs = [];
    const state = this.analysis.currentState || {};
    const changes = this.analysis.changes || {};

    if ((state.summary.languages || 0) > 3) {
      recs.push({
        id: 'lang-001',
        category: 'languages',
        title: `Consolidate ${state.summary.languages} languages to 2-3`,
        description: 'Multiple languages increase complexity and maintenance burden',
        impact: 'medium',
        confidence: 0.75,
        effort: 'high',
        estimatedDays: 20,
        priority: this._calculatePriority('medium', 0.75, 'high'),
        steps: [
          'Identify language usage patterns',
          'Select primary languages',
          'Plan migration for other code',
        ],
      });
    }

    if (changes.languages?.added > 0) {
      recs.push({
        id: 'lang-002',
        category: 'languages',
        title: `Standardize tooling for new language(s)`,
        description: `${changes.languages.added} new language(s) added - ensure team support`,
        impact: 'low',
        confidence: 0.85,
        effort: 'low',
        estimatedDays: 3,
        priority: this._calculatePriority('low', 0.85, 'low'),
      });
    }

    return recs;
  }

  /**
   * Calculate recommendation priority
   * @private
   */
  _calculatePriority(impact, confidence, effort) {
    const impactScore = { high: 10, medium: 5, low: 2 }[impact] || 0;
    const effortScore = { low: 10, medium: 5, high: 2 }[effort] || 0;
    const confidenceScore = confidence * 10;

    return Math.round((impactScore * confidenceScore) / effortScore);
  }
}

module.exports = { RecommendationGenerator };
