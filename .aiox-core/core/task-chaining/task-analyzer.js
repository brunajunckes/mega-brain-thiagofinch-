'use strict';

/**
 * Task Analyzer — Automatic Task Dependency Detection
 *
 * Analyzes task outputs to detect patterns and infer dependencies
 * for automatic task chaining.
 *
 * @class TaskAnalyzer
 * @version 1.0.0
 * @story 1.2
 */
class TaskAnalyzer {
  /**
   * Initialize TaskAnalyzer
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    this.patterns = this._initializePatterns();
    this.cache = new Map();
    this.maxCacheSize = options.maxCacheSize || 1000;
  }

  /**
   * Analyze a task result and detect potential chains
   * @param {Object} taskResult Task execution result
   * @returns {Object} Analysis with detected chains
   */
  analyzeTask(taskResult) {
    if (!taskResult || !taskResult.name) {
      throw new Error('TaskResult must have a name');
    }

    const analysis = {
      taskName: taskResult.name,
      status: taskResult.status,
      outputKeys: this._extractOutputKeys(taskResult),
      detectedPatterns: [],
      suggestedChains: [],
      confidence: 0,
    };

    // Detect output patterns
    if (taskResult.output) {
      analysis.detectedPatterns = this._matchPatterns(taskResult);
    }

    // Suggest chains based on patterns
    analysis.suggestedChains = this._suggestChains(taskResult, analysis.detectedPatterns);

    // Calculate confidence score
    analysis.confidence = this._calculateConfidence(analysis);

    return analysis;
  }

  /**
   * Extract output keys from task result
   * @private
   * @param {Object} taskResult Task result
   * @returns {Array} Array of output key names
   */
  _extractOutputKeys(taskResult) {
    const keys = [];

    const traverse = (obj, prefix = '') => {
      if (obj === null || typeof obj !== 'object') return;

      Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);

        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          traverse(obj[key], fullKey);
        }
      });
    };

    traverse(taskResult.output);
    return keys;
  }

  /**
   * Match output patterns against known patterns
   * @private
   * @param {Object} taskResult Task result
   * @returns {Array} Matched patterns
   */
  _matchPatterns(taskResult) {
    const matched = [];

    for (const [patternName, patternFn] of Object.entries(this.patterns)) {
      try {
        if (patternFn(taskResult)) {
          matched.push(patternName);
        }
      } catch (e) {
        // Pattern matching failed, skip
      }
    }

    return matched;
  }

  /**
   * Suggest chains based on detected patterns and task output
   * @private
   * @param {Object} taskResult Task result
   * @param {Array} patterns Detected patterns
   * @returns {Array} Suggested chains
   */
  _suggestChains(taskResult, patterns) {
    const chains = [];

    // Pattern-based suggestions
    if (patterns.includes('build-output')) {
      chains.push({
        name: 'test-after-build',
        nextTask: 'test',
        confidence: 0.95,
        reason: 'Build output detected',
      });
      chains.push({
        name: 'lint-after-build',
        nextTask: 'lint',
        confidence: 0.8,
        reason: 'Build output detected',
      });
    }

    if (patterns.includes('test-results')) {
      chains.push({
        name: 'deploy-after-tests',
        nextTask: 'deploy',
        confidence: 0.9,
        reason: 'Test results detected (success)',
      });
    }

    if (patterns.includes('lint-output')) {
      chains.push({
        name: 'format-after-lint',
        nextTask: 'format',
        confidence: 0.85,
        reason: 'Lint issues detected',
      });
    }

    if (patterns.includes('artifact-output')) {
      chains.push({
        name: 'bundle-after-build',
        nextTask: 'bundle',
        confidence: 0.9,
        reason: 'Artifacts detected',
      });
      chains.push({
        name: 'publish-artifacts',
        nextTask: 'publish',
        confidence: 0.75,
        reason: 'Artifacts ready',
      });
    }

    return chains;
  }

  /**
   * Calculate confidence score for analysis
   * @private
   * @param {Object} analysis Analysis object
   * @returns {number} Confidence score 0-1
   */
  _calculateConfidence(analysis) {
    let score = 0;

    if (analysis.status === 'success') score += 0.3;
    if (analysis.detectedPatterns.length > 0) score += 0.3;
    if (analysis.suggestedChains.length > 0) score += 0.4;

    return Math.min(score, 1.0);
  }

  /**
   * Initialize built-in patterns
   * @private
   * @returns {Object} Pattern detection functions
   */
  _initializePatterns() {
    return {
      'build-output': (taskResult) => {
        const output = taskResult.output || {};
        return (
          output.artifacts ||
          output.dist ||
          output.build ||
          (output.files && Array.isArray(output.files) && output.files.length > 0)
        );
      },

      'test-results': (taskResult) => {
        const output = taskResult.output || {};
        return (
          (output.passed !== undefined || output.failed !== undefined) &&
          taskResult.status === 'success'
        );
      },

      'lint-output': (taskResult) => {
        const output = taskResult.output || {};
        return output.errors || output.warnings || output.issues;
      },

      'artifact-output': (taskResult) => {
        const output = taskResult.output || {};
        return (
          output.artifacts ||
          output.file ||
          output.jar ||
          output.zip ||
          (output.path && typeof output.path === 'string')
        );
      },

      'deployment-ready': (taskResult) => {
        const output = taskResult.output || {};
        return output.url || output.endpoint || output.deployed_at;
      },

      'error-output': (taskResult) => {
        const output = taskResult.output || {};
        return output.error || output.errors || output.exception;
      },

      'coverage-output': (taskResult) => {
        const output = taskResult.output || {};
        return output.coverage || output.coverage_percent || output.lines_covered;
      },

      'performance-output': (taskResult) => {
        const output = taskResult.output || {};
        return output.duration || output.time || output.performance_metrics;
      },
    };
  }

  /**
   * Register a custom pattern
   * @param {string} name Pattern name
   * @param {Function} fn Pattern detection function
   */
  registerPattern(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('Pattern must be a function');
    }
    this.patterns[name] = fn;
  }

  /**
   * Get all registered patterns
   * @returns {Array} Array of pattern names
   */
  getPatterns() {
    return Object.keys(this.patterns);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = { TaskAnalyzer };
