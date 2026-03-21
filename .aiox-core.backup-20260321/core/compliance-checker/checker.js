'use strict';

/**
 * Compliance Checker — Validates repositories against standards
 *
 * @class ComplianceChecker
 * @version 1.0.0
 * @story 3.2
 */
class ComplianceChecker {
  constructor(options = {}) {
    this.rules = options.rules || this._getDefaultRules();
  }

  /**
   * Check repository compliance
   * @param {Object} repo Repository data
   * @returns {Object} Compliance results
   */
  check(repo) {
    try {
      if (!repo) throw new Error('Repository data required');

      const results = {
        timestamp: new Date().toISOString(),
        repository: repo.repository?.name || 'unknown',
        checks: {},
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          score: 0,
        },
      };

      // Run all checks
      for (const [ruleId, rule] of Object.entries(this.rules)) {
        const passed = this._runCheck(rule, repo);
        results.checks[ruleId] = {
          name: rule.name,
          passed,
          severity: rule.severity,
          message: passed ? rule.passMessage : rule.failMessage,
        };

        results.summary.total++;
        if (passed) {
          results.summary.passed++;
        } else {
          results.summary.failed++;
        }
      }

      // Calculate compliance score
      results.summary.score = Math.round((results.summary.passed / results.summary.total) * 100);

      return results;
    } catch (error) {
      throw new Error(`Compliance check failed: ${error.message}`);
    }
  }

  /**
   * Run individual check
   * @private
   */
  _runCheck(rule, repo) {
    const metrics = repo.metrics || {};
    const summary = repo.summary || {};
    const arch = repo.architecture || {};

    switch (rule.type) {
      case 'min_coverage':
        return (metrics.testCoverage || 0) >= rule.value;
      case 'min_quality':
        return (metrics.codeQuality || 0) >= rule.value;
      case 'max_languages':
        return Object.keys(repo.languages || {}).length <= rule.value;
      case 'architecture':
        return arch.pattern?.name === rule.value;
      case 'max_loc':
        return (summary.totalLoc || 0) <= rule.value;
      default:
        return true;
    }
  }

  /**
   * Get default compliance rules
   * @private
   */
  _getDefaultRules() {
    return {
      'test-coverage-75': {
        type: 'min_coverage',
        name: 'Minimum 75% test coverage',
        value: 75,
        severity: 'high',
        passMessage: 'Test coverage meets standard',
        failMessage: 'Test coverage below 75%',
      },
      'code-quality-7': {
        type: 'min_quality',
        name: 'Minimum code quality 7/10',
        value: 7,
        severity: 'medium',
        passMessage: 'Code quality is good',
        failMessage: 'Code quality below 7/10',
      },
      'languages-limit-3': {
        type: 'max_languages',
        name: 'Maximum 3 programming languages',
        value: 3,
        severity: 'medium',
        passMessage: 'Language diversity acceptable',
        failMessage: 'Too many programming languages',
      },
      'modular-architecture': {
        type: 'architecture',
        name: 'Use modular architecture',
        value: 'Modular',
        severity: 'low',
        passMessage: 'Architecture is modular',
        failMessage: 'Not using modular architecture',
      },
    };
  }
}

module.exports = { ComplianceChecker };
