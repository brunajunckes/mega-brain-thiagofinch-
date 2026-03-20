'use strict';

/**
 * RecommendationGenerator — Generates intelligent, prioritized recommendations
 *
 * Creates recommendations for:
 * - Architecture improvements
 * - Dependency modernization
 * - Testing strategy enhancements
 * - Language/framework adoption
 *
 * Includes:
 * - Impact scoring
 * - Confidence levels
 * - Effort estimation
 * - Implementation guidance
 *
 * @class RecommendationGenerator
 * @version 1.0.0
 * @story 2.3 Phase 2
 */
class RecommendationGenerator {
  /**
   * Create recommendation generator
   * @param {Object} options Configuration
   */
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Generate recommendations from decision context
   * @param {Object} context Decision context from DecisionAnalyzer
   * @returns {Promise<Array>} Prioritized recommendations
   */
  async generateRecommendations(context) {
    try {
      if (!context) {
        throw new Error('Decision context required');
      }

      const recommendations = [];

      // Architecture recommendations
      recommendations.push(...this._generateArchitectureRecs(context));

      // Dependency recommendations
      recommendations.push(...this._generateDependencyRecs(context));

      // Testing recommendations
      recommendations.push(...this._generateTestingRecs(context));

      // Language/framework recommendations
      recommendations.push(...this._generateLanguageRecs(context));

      // Modernization recommendations
      recommendations.push(...this._generateModernizationRecs(context));

      // Prioritize by impact and confidence
      const prioritized = this._prioritizeByImpact(recommendations);

      // Add confidence scores
      const scored = this._addConfidenceScores(prioritized);

      return scored;
    } catch (error) {
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  /**
   * Generate architecture improvement recommendations
   * @private
   */
  _generateArchitectureRecs(context) {
    const recs = [];
    const arch = context.currentState?.architecture || {};
    const debtLevel = context.debtLevel;

    // Modularization recommendation
    if (arch.pattern === 'monolithic') {
      recs.push({
        id: 'arch_modularize',
        category: 'architecture',
        title: 'Implement Microservices/Modular Architecture',
        description: 'Break monolithic structure into feature-based modules with clear boundaries',
        impact: 'high',
        effort: 'high',
        estimatedDays: 40,
        priority: 1,
        rationale: 'Loose coupling reduces maintenance burden and enables parallel development',
        blockers: [],
        implementationSteps: [
          'Define module boundaries based on features',
          'Extract shared utilities to common module',
          'Implement API contracts between modules',
          'Setup module-level testing',
          'Migrate module by module',
        ],
        risks: ['Integration complexity', 'Performance overhead', 'Team coordination'],
      });
    }

    // Layering improvement
    if (!arch.hasLayering) {
      recs.push({
        id: 'arch_layering',
        category: 'architecture',
        title: 'Implement Layered Architecture',
        description: 'Organize code into presentation, business, and data layers',
        impact: 'medium',
        effort: 'medium',
        estimatedDays: 20,
        priority: 2,
        rationale: 'Clear separation of concerns improves testability and maintainability',
        blockers: [],
        implementationSteps: [
          'Define layer responsibilities',
          'Create folder structure for layers',
          'Move code to appropriate layers',
          'Add layer-level interfaces',
        ],
        risks: ['Circular dependencies', 'Performance degradation'],
      });
    }

    // Technical debt remediation
    if (debtLevel === 'high' || debtLevel === 'critical') {
      recs.push({
        id: 'arch_debt_remediation',
        category: 'architecture',
        title: 'Technical Debt Remediation Sprint',
        description: 'Allocate dedicated sprint to address accumulated technical debt',
        impact: 'high',
        effort: 'high',
        estimatedDays: 30,
        priority: 1,
        rationale: `Current debt level (${debtLevel}) is impacting velocity and quality`,
        blockers: [],
        implementationSteps: [
          'Catalog all debt items',
          'Prioritize by impact',
          'Schedule dedicated remediation sprint',
          'Track metrics before/after',
        ],
        risks: ['Timeline impact', 'Feature delays'],
      });
    }

    return recs;
  }

  /**
   * Generate dependency modernization recommendations
   * @private
   */
  _generateDependencyRecs(context) {
    const recs = [];
    const deps = context.currentState?.dependencies || 0;
    const outdated = context.opportunities?.outdatedDeps || [];

    // Dependency update recommendations
    outdated.forEach((dep, index) => {
      recs.push({
        id: `dep_update_${dep.name}`,
        category: 'dependency',
        title: `Update ${dep.name} to v${dep.latest}`,
        description: `Current: v${dep.current} → Latest: v${dep.latest}`,
        impact: dep.breaking ? 'medium' : 'low',
        effort: dep.breaking ? 'medium' : 'low',
        estimatedDays: dep.breaking ? 5 : 1,
        priority: 3 + index,
        rationale: `Get security fixes, performance improvements, and new features from ${dep.name}`,
        blockers: dep.breaking ? ['Breaking changes require code updates'] : [],
        implementationSteps: [
          `Review ${dep.name} v${dep.latest} changelog`,
          'Update in package.json',
          'Run tests to verify compatibility',
          'Deploy to staging for validation',
          'Release to production',
        ],
        risks: dep.breaking ? ['Breaking changes', 'Compatibility issues'] : ['Minor breaking changes'],
      });
    });

    // Dependency consolidation
    if (deps > 50) {
      recs.push({
        id: 'dep_consolidation',
        category: 'dependency',
        title: 'Consolidate Dependencies',
        description: `Reduce duplicate dependencies and remove unused packages (current: ${deps})`,
        impact: 'medium',
        effort: 'medium',
        estimatedDays: 5,
        priority: 2,
        rationale: 'Fewer dependencies = smaller bundle, faster installs, less maintenance',
        blockers: [],
        implementationSteps: [
          'Audit all dependencies',
          'Identify duplicates and alternatives',
          'Remove unused packages',
          'Test thoroughly',
        ],
        risks: ['Breaking changes in removed packages'],
      });
    }

    return recs;
  }

  /**
   * Generate testing strategy recommendations
   * @private
   */
  _generateTestingRecs(context) {
    const recs = [];
    const coverage = context.currentState?.testCoverage || 0;

    // Coverage improvement
    if (coverage < 80) {
      recs.push({
        id: 'test_coverage_improvement',
        category: 'testing',
        title: 'Improve Test Coverage',
        description: `Increase coverage from ${coverage}% to 85%+`,
        impact: 'high',
        effort: 'high',
        estimatedDays: coverage < 50 ? 20 : 10,
        priority: 1,
        rationale: 'Higher coverage reduces production bugs and speeds up refactoring',
        blockers: [],
        implementationSteps: [
          'Run coverage report and identify gaps',
          'Write tests for uncovered lines',
          'Focus on critical paths first',
          'Update CI/CD to enforce coverage thresholds',
        ],
        risks: ['Time investment', 'Test maintenance overhead'],
      });
    }

    // E2E testing setup
    if (!context.currentState?.hasE2E) {
      recs.push({
        id: 'test_e2e_setup',
        category: 'testing',
        title: 'Implement End-to-End Testing',
        description: 'Add E2E tests using Playwright or Cypress for critical user flows',
        impact: 'high',
        effort: 'medium',
        estimatedDays: 15,
        priority: 2,
        rationale: 'E2E tests catch integration issues that unit tests miss',
        blockers: [],
        implementationSteps: [
          'Choose E2E framework (Playwright recommended)',
          'Set up test infrastructure',
          'Write critical path tests',
          'Integrate with CI/CD',
        ],
        risks: ['Test maintenance', 'Flaky tests'],
      });
    }

    return recs;
  }

  /**
   * Generate language/framework recommendations
   * @private
   */
  _generateLanguageRecs(context) {
    const recs = [];
    const frameworks = context.currentState?.frameworks || [];

    // TypeScript adoption
    if (!context.currentState?.usesTypeScript) {
      recs.push({
        id: 'lang_typescript',
        category: 'language',
        title: 'Adopt TypeScript',
        description: 'Migrate from JavaScript to TypeScript for type safety',
        impact: 'high',
        effort: 'high',
        estimatedDays: 30,
        priority: 2,
        rationale: 'TypeScript catches errors at compile-time and improves IDE support',
        blockers: ['Team training needed', 'Build pipeline changes'],
        implementationSteps: [
          'Set up TypeScript compiler',
          'Migrate files incrementally (.js → .ts)',
          'Update build pipeline',
          'Configure strict mode gradually',
        ],
        risks: ['Team learning curve', 'Build time increase'],
      });
    }

    // Framework consolidation
    if (frameworks.length > 2) {
      recs.push({
        id: 'lang_framework_consolidation',
        category: 'language',
        title: 'Consolidate Frameworks',
        description: `Reduce from ${frameworks.length} to 1-2 primary frameworks`,
        impact: 'medium',
        effort: 'high',
        estimatedDays: frameworks.length * 10,
        priority: 3,
        rationale: 'Multiple frameworks increase complexity, learning burden, and bundle size',
        blockers: ['Major refactoring required'],
        implementationSteps: [
          'Analyze framework usage patterns',
          'Choose primary framework',
          'Plan gradual migration',
          'Migrate incrementally',
        ],
        risks: ['Timeline impact', 'Knowledge gaps'],
      });
    }

    return recs;
  }

  /**
   * Generate modernization recommendations
   * @private
   */
  _generateModernizationRecs(context) {
    const recs = [];
    const healthScore = context.healthScore || 5;

    // Version upgrades
    if (healthScore < 6) {
      recs.push({
        id: 'mod_version_upgrades',
        category: 'modernization',
        title: 'Major Version Upgrades',
        description: 'Upgrade to latest major versions of core dependencies',
        impact: 'high',
        effort: 'high',
        estimatedDays: 25,
        priority: 2,
        rationale: 'Major versions bring significant performance and security improvements',
        blockers: [],
        implementationSteps: [
          'Plan upgrade strategy',
          'Update dependencies',
          'Address breaking changes',
          'Comprehensive testing',
          'Staged rollout',
        ],
        risks: ['Breaking changes', 'Compatibility issues', 'Performance regressions'],
      });
    }

    // Performance optimization
    if (context.currentState?.performanceScore < 7) {
      recs.push({
        id: 'mod_performance',
        category: 'modernization',
        title: 'Performance Optimization',
        description: 'Improve page load time and runtime performance',
        impact: 'medium',
        effort: 'medium',
        estimatedDays: 15,
        priority: 3,
        rationale: 'Faster apps improve user experience and SEO',
        blockers: [],
        implementationSteps: [
          'Run performance audit',
          'Identify bottlenecks',
          'Implement optimizations (code splitting, lazy loading, caching)',
          'Measure improvements',
        ],
        risks: ['Over-optimization', 'Complex code'],
      });
    }

    return recs;
  }

  /**
   * Prioritize recommendations by impact
   * @private
   */
  _prioritizeByImpact(recommendations) {
    const impactScore = { high: 3, medium: 2, low: 1 };
    const effortScore = { low: 3, medium: 2, high: 1 };

    return recommendations.sort((a, b) => {
      const scoreA = (impactScore[a.impact] || 0) * (effortScore[a.effort] || 0);
      const scoreB = (impactScore[b.impact] || 0) * (effortScore[b.effort] || 0);
      return scoreB - scoreA; // Descending order
    });
  }

  /**
   * Add confidence scores to recommendations
   * @private
   */
  _addConfidenceScores(recommendations) {
    return recommendations.map((rec) => {
      // Higher confidence for well-understood patterns
      let confidence = 0.75; // Base confidence

      // Adjust based on type
      if (rec.category === 'testing') confidence += 0.15; // Testing is well-understood
      if (rec.category === 'dependency') confidence += 0.10; // Dependency updates are low-risk
      if (rec.impact === 'high' && rec.effort === 'low') confidence += 0.10; // High-impact, low-effort is safe bet

      // Cap at 100%
      confidence = Math.min(confidence, 1.0);

      return {
        ...rec,
        confidence: Math.round(confidence * 100),
        confidenceReason: this._getConfidenceReason(rec, confidence),
      };
    });
  }

  /**
   * Generate confidence reason
   * @private
   */
  _getConfidenceReason(rec, confidence) {
    const thresholds = {
      high: 'Strong evidence from industry practices and codebase analysis',
      medium: 'Good evidence with some uncertainty',
      low: 'Limited evidence, requires validation',
    };

    const level = confidence >= 0.85 ? 'high' : confidence >= 0.65 ? 'medium' : 'low';
    return thresholds[level];
  }
}

module.exports = RecommendationGenerator;
