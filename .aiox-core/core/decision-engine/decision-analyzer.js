'use strict';

/**
 * Decision Analyzer — Evaluates repository state and opportunities
 *
 * Analyzes:
 * - Current repository health (architecture, code quality, debt)
 * - Changes from diff analysis
 * - Modernization opportunities
 * - Risk factors
 *
 * @class DecisionAnalyzer
 * @version 1.0.0
 * @story 2.3
 */
class DecisionAnalyzer {
  constructor(options = {}) {
    this.repo = null;
    this.diff = null;
    this.analysis = {
      currentState: {},
      opportunities: [],
      risks: [],
      context: {},
    };
  }

  /**
   * Analyze repository and changes
   * @param {Object} repo Repository analysis (repo.json from Story 2.1)
   * @param {Object} diff Optional diff data (diff output from Story 2.2)
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(repo, diff = null) {
    try {
      if (!repo) {
        throw new Error('Repository analysis is required');
      }

      this.repo = repo;
      this.diff = diff;

      // Analyze current state
      this.analysis.currentState = this._analyzeCurrentState();

      // Analyze differences if provided
      if (diff && diff.changes) {
        this.analysis.changes = this._analyzeDifferences(diff);
      }

      // Calculate health scores
      this.analysis.healthScores = this._calculateHealthScores();

      // Detect opportunities
      this.analysis.opportunities = this._detectOpportunities();

      // Assess risks
      this.analysis.risks = this._assessRisks();

      // Generate decision context
      this.analysis.context = this._generateContext();

      return {
        success: true,
        analysis: this.analysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze current repository state
   * @private
   */
  _analyzeCurrentState() {
    const repo = this.repo;
    const summary = repo.summary || {};
    const languages = repo.languages || {};
    const deps = repo.dependencies || {};
    const arch = repo.architecture || {};
    const metrics = repo.metrics || {};

    return {
      repository: repo.repository?.name || 'unknown',
      scannedAt: repo.repository?.scannedAt || new Date().toISOString(),
      summary: {
        totalFiles: summary.totalFiles || 0,
        totalLoc: summary.totalLoc || 0,
        languages: Object.keys(languages).length,
        frameworks: repo.frameworks?.length || 0,
      },
      languages: Object.keys(languages),
      architecturePattern: arch.pattern?.name || 'unknown',
      architectureScore: arch.pattern?.score || 0,
      testCoverage: metrics.testCoverage || 0,
      codeQuality: metrics.codeQuality || 0,
      dependencies: {
        total: (deps.production || []).length + (deps.development || []).length,
        production: (deps.production || []).length,
        development: (deps.development || []).length,
      },
    };
  }

  /**
   * Analyze differences from diff report
   * @private
   */
  _analyzeDifferences(diff) {
    const changes = diff.changes || {};

    return {
      languages: {
        added: (changes.languages?.added || []).length,
        removed: (changes.languages?.removed || []).length,
        modified: (changes.languages?.modified || []).length,
      },
      dependencies: {
        added: (changes.dependencies?.added || []).length,
        removed: (changes.dependencies?.removed || []).length,
        upgraded: (changes.dependencies?.upgraded || []).length,
        downgraded: (changes.dependencies?.downgraded || []).length,
      },
      architecture: {
        changed: changes.architecture?.changed || false,
        before: changes.architecture?.before || null,
        after: changes.architecture?.after || null,
        impact: changes.architecture?.impact || 'none',
      },
      metrics: {
        testCoverageChange: changes.metrics?.testCoverage?.change || 0,
        codeQualityChange: changes.metrics?.codeQuality?.change || 0,
      },
    };
  }

  /**
   * Calculate health scores
   * @private
   */
  _calculateHealthScores() {
    const state = this.analysis.currentState;
    const changes = this.analysis.changes || {};

    let architectureScore = state.architectureScore * 10; // 0-10
    let codeQualityScore = state.codeQuality; // Already 0-10
    let testingScore = state.testCoverage / 10; // Convert 0-100 to 0-10

    // Adjust based on changes
    if (changes.architecture?.changed) {
      if (changes.architecture?.impact === 'major') {
        architectureScore -= 2;
      } else if (changes.architecture?.impact === 'minor') {
        architectureScore -= 0.5;
      }
    }

    if (changes.metrics?.testCoverageChange < 0) {
      testingScore -= Math.abs(changes.metrics.testCoverageChange) / 10;
    }

    if (changes.metrics?.codeQualityChange < 0) {
      codeQualityScore -= Math.abs(changes.metrics.codeQualityChange);
    }

    const overallScore = (architectureScore + codeQualityScore + testingScore) / 3;

    return {
      architecture: Math.max(0, Math.min(10, architectureScore)),
      codeQuality: Math.max(0, Math.min(10, codeQualityScore)),
      testing: Math.max(0, Math.min(10, testingScore)),
      overall: Math.max(0, Math.min(10, overallScore)),
      debtLevel: this._assessDebtLevel(overallScore),
    };
  }

  /**
   * Assess technical debt level
   * @private
   */
  _assessDebtLevel(score) {
    if (score >= 8) return 'low';
    if (score >= 6) return 'moderate';
    if (score >= 4) return 'significant';
    return 'critical';
  }

  /**
   * Detect modernization opportunities
   * @private
   */
  _detectOpportunities() {
    const opportunities = [];
    const state = this.analysis.currentState;
    const changes = this.analysis.changes || {};
    const scores = this.analysis.healthScores;

    // Architecture improvement opportunity
    if (state.architectureScore < 0.8) {
      opportunities.push({
        id: 'arch-improvement',
        category: 'architecture',
        title: 'Modernize architecture',
        description: 'Current architecture pattern could be improved',
        impact: 'high',
        confidence: 0.8,
        effort: 'high',
        estimatedDays: 30,
        rationale: `Architecture score of ${state.architectureScore.toFixed(2)} suggests refactoring opportunity`,
      });
    }

    // Testing coverage improvement
    if (state.testCoverage < 70) {
      opportunities.push({
        id: 'testing-coverage',
        category: 'testing',
        title: 'Improve test coverage',
        description: `Increase test coverage from ${state.testCoverage}% to 85%+`,
        impact: 'medium',
        confidence: 0.95,
        effort: 'medium',
        estimatedDays: 14,
        rationale: `Test coverage at ${state.testCoverage}% is below recommended 85%`,
      });
    }

    // Dependency modernization
    if (changes.dependencies?.upgraded) {
      opportunities.push({
        id: 'dep-modernization',
        category: 'dependencies',
        title: `Modernize ${changes.dependencies.upgraded} dependencies`,
        description: `Update ${changes.dependencies.upgraded} outdated packages`,
        impact: 'medium',
        confidence: 0.9,
        effort: 'medium',
        estimatedDays: 10,
        rationale: 'Recent upgrades indicate packages are becoming outdated',
      });
    }

    // Language consolidation
    if (state.summary.languages > 3) {
      opportunities.push({
        id: 'lang-consolidation',
        category: 'languages',
        title: 'Consolidate programming languages',
        description: `Reduce from ${state.summary.languages} to 2-3 languages`,
        impact: 'medium',
        confidence: 0.7,
        effort: 'high',
        estimatedDays: 20,
        rationale: `${state.summary.languages} languages increases maintenance burden`,
      });
    }

    // Framework consolidation
    if (state.summary.frameworks > 2) {
      opportunities.push({
        id: 'framework-consolidation',
        category: 'frameworks',
        title: 'Consolidate frameworks',
        description: `Reduce ${state.summary.frameworks} frameworks to 1-2 primary ones`,
        impact: 'medium',
        confidence: 0.75,
        effort: 'high',
        estimatedDays: 25,
        rationale: `Multiple frameworks increases complexity and maintenance`,
      });
    }

    return opportunities;
  }

  /**
   * Assess risks
   * @private
   */
  _assessRisks() {
    const risks = [];
    const changes = this.analysis.changes || {};

    // Architecture change risk
    if (changes.architecture?.changed && changes.architecture?.impact === 'major') {
      risks.push({
        id: 'arch-change-risk',
        severity: 'high',
        description: 'Major architecture change in progress',
        details: `Transitioning from ${changes.architecture.before} to ${changes.architecture.after}`,
        mitigation: 'Comprehensive testing and phased rollout required',
      });
    }

    // Large number of dependency upgrades
    if ((changes.dependencies?.upgraded || 0) > 5) {
      risks.push({
        id: 'dep-upgrade-risk',
        severity: 'medium',
        description: `${changes.dependencies.upgraded} dependency upgrades detected`,
        details: 'Multiple version changes increase regression risk',
        mitigation: 'Thorough testing and gradual rollout recommended',
      });
    }

    // Test coverage regression
    if (changes.metrics?.testCoverageChange < -5) {
      risks.push({
        id: 'test-coverage-risk',
        severity: 'medium',
        description: 'Test coverage has regressed',
        details: `Coverage decreased by ${Math.abs(changes.metrics.testCoverageChange)}%`,
        mitigation: 'Prioritize test improvements before releases',
      });
    }

    // Language removal risk
    if ((changes.languages?.removed || 0) > 0) {
      risks.push({
        id: 'lang-removal-risk',
        severity: 'low',
        description: 'Languages being removed from codebase',
        details: `${changes.languages.removed} language(s) being deprecated`,
        mitigation: 'Ensure migration path for affected components',
      });
    }

    return risks;
  }

  /**
   * Generate decision context
   * @private
   */
  _generateContext() {
    const state = this.analysis.currentState;
    const scores = this.analysis.healthScores;
    const opportunities = this.analysis.opportunities || [];

    return {
      repositoryName: state.repository,
      healthScore: scores.overall,
      debtLevel: scores.debtLevel,
      topOpportunities: opportunities
        .sort((a, b) => {
          // Sort by: high impact first, then by confidence, then by lower effort
          if (a.impact !== b.impact) {
            const impactOrder = { high: 3, medium: 2, low: 1 };
            return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
          }
          if (a.confidence !== b.confidence) {
            return b.confidence - a.confidence;
          }
          const effortOrder = { low: 3, medium: 2, high: 1 };
          return (effortOrder[b.effort] || 0) - (effortOrder[a.effort] || 0);
        })
        .slice(0, 5)
        .map((opp) => ({
          ...opp,
          priority: this._calculatePriority(opp),
        })),
      technicalStack: {
        languages: state.languages,
        architecturePattern: state.architecturePattern,
        totalDependencies: state.dependencies.total,
      },
    };
  }

  /**
   * Calculate priority score for opportunity
   * @private
   */
  _calculatePriority(opportunity) {
    const impactScore = { high: 10, medium: 5, low: 2 }[opportunity.impact] || 0;
    const effortScore = { low: 10, medium: 5, high: 2 }[opportunity.effort] || 0;
    const confidenceScore = opportunity.confidence * 10;

    // Priority = (Impact * Confidence) / Effort
    return Math.round((impactScore * confidenceScore) / effortScore);
  }

  /**
   * Get analysis results
   */
  getAnalysis() {
    return this.analysis;
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.analysis.currentState;
  }

  /**
   * Get opportunities
   */
  getOpportunities() {
    return this.analysis.opportunities || [];
  }

  /**
   * Get health scores
   */
  getHealthScores() {
    return this.analysis.healthScores || {};
  }
}

module.exports = { DecisionAnalyzer };
