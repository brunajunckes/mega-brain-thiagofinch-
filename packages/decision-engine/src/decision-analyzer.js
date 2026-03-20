'use strict';

/**
 * DecisionAnalyzer — Evaluates repository state and generates decision context
 *
 * Analyzes:
 * - Current state (architecture, languages, frameworks, metrics)
 * - Technical debt levels and opportunities
 * - Architecture health scores
 * - Modernization candidates
 * - Risk factors and blocking issues
 *
 * @class DecisionAnalyzer
 * @version 1.0.0
 * @story 2.3
 */
class DecisionAnalyzer {
  /**
   * Create decision analyzer
   * @param {Object} options Configuration
   */
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Analyze repository state and generate decision context
   * @param {Object} repo Repository snapshot (repo.json)
   * @param {Object} diff Optional diff data for evolution analysis
   * @returns {Promise<Object>} Decision context
   */
  async analyzeDecision(repo, diff = null) {
    try {
      if (!repo) {
        throw new Error('Repository snapshot required');
      }

      const currentState = this._analyzeCurrentState(repo);
      const healthScore = this._calculateHealthScore(repo);
      const debtLevel = this._assessDebtLevel(repo);
      const opportunities = this._detectOpportunities(repo, diff);
      const risks = this._assessRisks(repo, diff);
      const context = this._generateDecisionContext(repo, diff, {
        currentState,
        healthScore,
        debtLevel,
        opportunities,
        risks,
      });

      return {
        timestamp: new Date().toISOString(),
        repository: repo.metadata?.repository?.name || 'unknown',
        currentState,
        healthScore,
        debtLevel,
        opportunities,
        risks,
        context,
      };
    } catch (error) {
      throw new Error(`Decision analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze current repository state
   * @private
   */
  _analyzeCurrentState(repo) {
    const summary = repo.summary || {};
    const metrics = repo.metrics || {};
    const arch = repo.architecture?.pattern || {};

    return {
      files: summary.totalFiles || 0,
      loc: summary.totalLoc || 0,
      languages: Object.keys(repo.languages || {}).length,
      frameworks: (repo.frameworks || []).length,
      dependencies: repo.dependencies?.totalDependencies || 0,
      architecture: {
        pattern: arch.name || 'Unknown',
        score: arch.score || 0,
      },
      testCoverage: metrics.testCoverage || 0,
      codeQuality: metrics.codeQuality || 0,
      complexity: metrics.complexityScore || 'unknown',
      documentation: Math.round((metrics.documentationRatio || 0) * 100),
    };
  }

  /**
   * Calculate overall health score
   * @private
   */
  _calculateHealthScore(repo) {
    const metrics = repo.metrics || {};
    const summary = repo.summary || {};
    const arch = repo.architecture?.pattern || {};

    let score = 5; // Base score

    // Test coverage (0-3 points)
    const testCoverage = metrics.testCoverage || 0;
    score += Math.min(3, (testCoverage / 100) * 3);

    // Code quality (0-2 points)
    const codeQuality = metrics.codeQuality || 0;
    score += Math.min(2, (codeQuality / 10) * 2);

    // Architecture fitness (0-1.5 points)
    const archScore = arch.score || 0;
    score += Math.min(1.5, archScore * 1.5);

    // Documentation (0-1 point)
    const docRatio = metrics.documentationRatio || 0;
    score += Math.min(1, docRatio * 1);

    // Complexity penalty (0-1 point)
    const complexityMap = { low: 1, medium: 0, high: -0.5 };
    const complexityScore = complexityMap[metrics.complexityScore] || 0;
    score -= Math.max(0, -complexityScore);

    return Math.round(Math.max(1, Math.min(10, score)) * 10) / 10;
  }

  /**
   * Assess technical debt level
   * @private
   */
  _assessDebtLevel(repo) {
    const metrics = repo.metrics || {};
    const healthScore = this._calculateHealthScore(repo);

    if (healthScore >= 8) return 'minimal';
    if (healthScore >= 6.5) return 'low';
    if (healthScore >= 5) return 'moderate';
    if (healthScore >= 3) return 'high';
    return 'critical';
  }

  /**
   * Detect modernization opportunities
   * @private
   */
  _detectOpportunities(repo, diff) {
    const opportunities = [];
    const metrics = repo.metrics || {};
    const frameworks = repo.frameworks || [];
    const arch = repo.architecture?.pattern || {};

    // Architecture modernization
    if (arch.name === 'Monolithic' && arch.score < 0.7) {
      opportunities.push({
        category: 'architecture',
        title: 'Modularize monolithic application',
        severity: 'high',
        confidence: 0.85,
      });
    }

    // Test coverage improvement
    if (metrics.testCoverage < 60) {
      opportunities.push({
        category: 'testing',
        title: 'Increase test coverage',
        severity: 'high',
        confidence: 0.95,
      });
    } else if (metrics.testCoverage < 80) {
      opportunities.push({
        category: 'testing',
        title: 'Achieve 80%+ test coverage',
        severity: 'medium',
        confidence: 0.90,
      });
    }

    // Code quality improvements
    if (metrics.codeQuality < 5) {
      opportunities.push({
        category: 'quality',
        title: 'Refactor for code quality',
        severity: 'high',
        confidence: 0.88,
      });
    }

    // Framework updates
    if (diff) {
      const prodDeps = diff.changes?.dependencies?.production || {};
      const majorUpgrades = (prodDeps.upgraded || []).filter((u) => {
        const fromMajor = u.from.split('@').pop().split('.')[0];
        const toMajor = u.to.split('@').pop().split('.')[0];
        return fromMajor !== toMajor;
      });

      if (majorUpgrades.length > 0) {
        opportunities.push({
          category: 'dependencies',
          title: `Upgrade ${majorUpgrades.length} major dependencies`,
          severity: 'medium',
          confidence: 0.92,
        });
      }
    }

    // Documentation
    const docRatio = metrics.documentationRatio || 0;
    if (docRatio < 0.2) {
      opportunities.push({
        category: 'documentation',
        title: 'Improve documentation coverage',
        severity: 'low',
        confidence: 0.80,
      });
    }

    return opportunities;
  }

  /**
   * Assess risks and blocking factors
   * @private
   */
  _assessRisks(repo, diff) {
    const risks = [];
    const metrics = repo.metrics || {};

    // High complexity
    if (metrics.complexityScore === 'high') {
      risks.push({
        type: 'complexity',
        description: 'High code complexity increases refactoring risk',
        severity: 'medium',
      });
    }

    // Low test coverage
    if (metrics.testCoverage < 40) {
      risks.push({
        type: 'testing',
        description: 'Low test coverage makes changes risky',
        severity: 'high',
      });
    }

    // Breaking changes in diff
    if (diff?.breaking) {
      risks.push({
        type: 'breaking',
        description: 'Breaking changes detected - migration path needed',
        severity: 'high',
      });
    }

    // Dependency risks
    if (diff) {
      const prodRemoved = diff.changes?.dependencies?.production?.removed || [];
      if (prodRemoved.length > 0) {
        risks.push({
          type: 'dependencies',
          description: `${prodRemoved.length} production dependencies removed`,
          severity: 'high',
        });
      }
    }

    return risks;
  }

  /**
   * Generate decision context
   * @private
   */
  _generateDecisionContext(repo, diff, analysis) {
    const { currentState, healthScore, debtLevel, opportunities, risks } = analysis;

    const context = {
      timestamp: new Date().toISOString(),
      repository: repo.metadata?.repository?.name || 'unknown',
      healthScore,
      debtLevel,
      readinessScore: this._calculateReadiness(repo, diff, risks),
      recommendedContext: this._recommendDecisionContext(healthScore, debtLevel),
      summary: this._generateSummary(healthScore, debtLevel, opportunities.length),
      opportunityCount: opportunities.length,
      riskCount: risks.length,
      estimatedEffort: this._estimateTotalEffort(opportunities),
    };

    return context;
  }

  /**
   * Calculate readiness for modernization
   * @private
   */
  _calculateReadiness(repo, diff, risks) {
    let readiness = 100;

    // Deduct for high-severity risks
    const highRisks = risks.filter((r) => r.severity === 'high');
    readiness -= highRisks.length * 15;

    // Deduct for low test coverage
    const testCoverage = repo.metrics?.testCoverage || 0;
    if (testCoverage < 50) readiness -= 20;
    else if (testCoverage < 70) readiness -= 10;

    // Deduct for complex code
    if (repo.metrics?.complexityScore === 'high') readiness -= 15;

    return Math.max(0, Math.min(100, readiness));
  }

  /**
   * Recommend decision context
   * @private
   */
  _recommendDecisionContext(healthScore, debtLevel) {
    if (healthScore >= 7.5) return 'optimization';
    if (healthScore >= 6) return 'modernization';
    if (healthScore >= 4) return 'remediation';
    return 'critical';
  }

  /**
   * Generate summary
   * @private
   */
  _generateSummary(healthScore, debtLevel, opportunityCount) {
    const debtLabels = {
      minimal: 'well-maintained',
      low: 'mostly healthy',
      moderate: 'needs attention',
      high: 'needs significant work',
      critical: 'requires urgent action',
    };

    return `Repository is ${debtLabels[debtLevel]} (Health: ${healthScore}/10) with ${opportunityCount} modernization opportunities.`;
  }

  /**
   * Estimate total effort
   * @private
   */
  _estimateTotalEffort(opportunities) {
    const high = opportunities.filter((o) => o.severity === 'high').length;
    const medium = opportunities.filter((o) => o.severity === 'medium').length;
    const low = opportunities.filter((o) => o.severity === 'low').length;

    const days = high * 30 + medium * 15 + low * 5;
    return { days, weeks: Math.ceil(days / 5), highPriority: high };
  }
}

module.exports = DecisionAnalyzer;
