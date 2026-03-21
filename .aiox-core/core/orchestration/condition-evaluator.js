/**
 * Condition Evaluator - Evaluates workflow conditions using TechStackProfile
 *
 * DETERMINISTIC: All evaluations use profile data,
 * no AI involvement in condition evaluation.
 *
 * Responsibilities:
 * - Evaluate condition strings against tech stack profile
 * - Determine if workflow phases should execute
 * - Provide skip reasons for non-applicable phases
 *
 * @module core/orchestration/condition-evaluator
 * @version 1.0.0
 */

/**
 * @typedef {import('./tech-stack-detector').TechStackProfile} TechStackProfile
 */

/**
 * @typedef {Object} PhaseEvaluationResult
 * @property {boolean} shouldExecute - Whether the phase should execute
 * @property {string} reason - Reason for the decision
 */

/**
 * Evaluates workflow conditions based on detected tech stack
 */
class ConditionEvaluator {
  /**
   * @param {TechStackProfile} techStackProfile - Profile from TechStackDetector
   */
  constructor(techStackProfile) {
    this.profile = techStackProfile;

    // Context for QA approval tracking (updated externally)
    this._qaApproved = false;
    this._phaseOutputs = {};
  }

  /**
   * Update QA approval status
   * @param {boolean} approved
   */
  setQAApproval(approved) {
    this._qaApproved = approved;
  }

  /**
   * Update phase outputs for context-aware conditions
   * @param {Object} outputs - Map of phase number to output data
   */
  setPhaseOutputs(outputs) {
    this._phaseOutputs = outputs;
  }

  /**
   * Evaluate a condition string
   * @param {string} condition - Condition like 'project_has_database'
   * @returns {boolean} Whether condition is met
   */
  evaluate(condition) {
    // Handle null/undefined conditions
    if (!condition) {
      return true;
    }

    // Built-in condition evaluators
    const evaluators = {
      // Tech stack conditions
      project_has_database: () => this.profile.hasDatabase,
      project_has_frontend: () => this.profile.hasFrontend,
      project_has_backend: () => this.profile.hasBackend,
      project_has_typescript: () => this.profile.hasTypeScript,
      project_has_tests: () => this.profile.hasTests,

      // Database-specific conditions
      supabase_configured: () =>
        this.profile.database.type === 'supabase' && this.profile.database.envVarsConfigured,
      database_has_rls: () => this.profile.database.hasRLS,
      database_has_migrations: () => this.profile.database.hasMigrations,

      // Frontend-specific conditions
      frontend_has_react: () => this.profile.frontend.framework === 'react',
      frontend_has_vue: () => this.profile.frontend.framework === 'vue',
      frontend_has_tailwind: () => this.profile.frontend.styling === 'tailwind',

      // Workflow state conditions
      qa_review_approved: () => this._checkQAApproval(),
      phase_2_completed: () => this._checkPhaseCompleted(2),
      phase_3_completed: () => this._checkPhaseCompleted(3),
      all_collection_phases_complete: () =>
        this._checkPhaseCompleted(1) &&
        this._checkPhaseCompleted(2) &&
        this._checkPhaseCompleted(3),

      // Composite conditions
      has_any_data_to_analyze: () =>
        this.profile.hasDatabase || this.profile.hasFrontend || this.profile.hasBackend,
    };

    // Check for built-in evaluator
    const evaluator = evaluators[condition];
    if (evaluator) {
      return evaluator();
    }

    // Handle negation first
    if (condition.startsWith('!')) {
      return !this.evaluate(condition.substring(1).trim());
    }

    // Handle complex condition expressions
    // LIMITATION: Mixed && and || without parentheses uses left-to-right evaluation
    // For predictable behavior, use only && or only || in a single expression
    const hasAnd = condition.includes('&&');
    const hasOr = condition.includes('||');

    if (hasAnd && hasOr) {
      // Warn about mixed operators - evaluate as && groups separated by ||
      // e.g., "a && b || c && d" becomes ["a && b", "c && d"], any group passing = true
      console.warn(
        `[ConditionEvaluator] Mixed && and || in condition: "${condition}". ` +
          'Using OR-of-ANDs evaluation. Consider using only one operator type.',
      );
      const orGroups = condition.split('||').map((g) => g.trim());
      return orGroups.some((group) => {
        if (group.includes('&&')) {
          return group.split('&&').every((c) => this.evaluate(c.trim()));
        }
        return this.evaluate(group);
      });
    }

    if (hasAnd) {
      return condition.split('&&').every((c) => this.evaluate(c.trim()));
    }

    if (hasOr) {
      return condition.split('||').some((c) => this.evaluate(c.trim()));
    }

    // Handle dot-notation access to profile
    if (condition.includes('.')) {
      return this._evaluateDotNotation(condition);
    }

    // Unknown condition - default to true (permissive)
    console.warn(`[ConditionEvaluator] Unknown condition: ${condition}`);
    return true;
  }

  /**
   * Evaluate dot-notation condition against profile
   * @private
   * @param {string} condition - e.g., 'database.type === "supabase"'
   * @returns {boolean}
   */
  _evaluateDotNotation(condition) {
    // Handle equality checks
    const eqMatch = condition.match(/^(\w+(?:\.\w+)*)\s*===?\s*["']?(\w+)["']?$/);
    if (eqMatch) {
      const [, path, value] = eqMatch;
      const actualValue = this._getProfileValue(path);
      return actualValue === value;
    }

    // Handle boolean checks (e.g., "database.hasRLS")
    const value = this._getProfileValue(condition);
    return Boolean(value);
  }

  /**
   * Get value from profile using dot notation
   * @private
   * @param {string} path - e.g., 'database.type'
   * @returns {any}
   */
  _getProfileValue(path) {
    const parts = path.split('.');
    let value = this.profile;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Check if QA review was approved
   * @private
   * @returns {boolean}
   */
  _checkQAApproval() {
    // Check external flag
    if (this._qaApproved) {
      return true;
    }

    // Check phase outputs for QA review
    const qaOutput = this._phaseOutputs[7];
    if (qaOutput) {
      return (
        qaOutput.status === 'approved' ||
        qaOutput.status === 'success' ||
        (qaOutput.result && qaOutput.result.approved)
      );
    }

    return false;
  }

  /**
   * Check if a phase was completed
   * @private
   * @param {number} phaseNum
   * @returns {boolean}
   */
  _checkPhaseCompleted(phaseNum) {
    const output = this._phaseOutputs[phaseNum];
    if (!output) {
      return false;
    }

    // Phase is complete if status is success or skipped
    return output.status === 'success' || output.status === 'skipped';
  }

  /**
   * Check if a phase should be executed based on its conditions
   * @param {Object} phase - Phase configuration from workflow
   * @returns {PhaseEvaluationResult}
   */
  shouldExecutePhase(phase) {
    // No condition means always execute
    if (!phase.condition) {
      return {
        shouldExecute: true,
        reason: 'no_condition',
      };
    }

    const result = this.evaluate(phase.condition);

    return {
      shouldExecute: result,
      reason: result ? 'condition_met' : `condition_not_met:${phase.condition}`,
    };
  }

  /**
   * Get all conditions that failed for a phase
   * @param {Object} phase - Phase configuration from workflow
   * @returns {string[]} List of failed conditions
   */
  getFailedConditions(phase) {
    const failed = [];

    if (!phase.condition) {
      return failed;
    }

    const hasAnd = phase.condition.includes('&&');
    const hasOr = phase.condition.includes('||');

    // Handle mixed operators: OR-of-ANDs
    if (hasAnd && hasOr) {
      const orGroups = phase.condition.split('||').map((g) => g.trim());
      // For OR groups, only report failures if ALL groups fail
      const groupResults = orGroups.map((group) => ({
        group,
        passed: this.evaluate(group),
      }));

      // If any group passed, no failed conditions to report
      if (groupResults.some((r) => r.passed)) {
        return failed;
      }

      // All groups failed - report each failed group
      for (const result of groupResults) {
        if (!result.passed) {
          failed.push(result.group);
        }
      }
      return failed;
    }

    // Handle pure OR conditions
    if (hasOr) {
      const conditions = phase.condition.split('||').map((c) => c.trim());
      // For OR, only fail if ALL conditions fail
      const allFailed = conditions.every((c) => !this.evaluate(c));
      if (allFailed) {
        // Report all failed conditions
        for (const condition of conditions) {
          failed.push(condition);
        }
      }
      return failed;
    }

    // Handle pure AND conditions (original behavior)
    const conditions = hasAnd
      ? phase.condition.split('&&').map((c) => c.trim())
      : [phase.condition];

    for (const condition of conditions) {
      if (!this.evaluate(condition)) {
        failed.push(condition);
      }
    }

    return failed;
  }

  /**
   * Get a human-readable explanation of why a phase was skipped
   * @param {Object} phase - Phase configuration
   * @returns {string} Explanation
   */
  getSkipExplanation(phase) {
    const failed = this.getFailedConditions(phase);

    if (failed.length === 0) {
      return 'Phase should execute (all conditions met)';
    }

    const explanations = {
      project_has_database: 'No database detected in project',
      project_has_frontend: 'No frontend framework detected',
      project_has_backend: 'No backend framework detected',
      supabase_configured: 'Supabase not configured or missing environment variables',
      qa_review_approved: 'QA review not yet approved',
    };

    const reasons = failed.map((c) => explanations[c] || `Condition not met: ${c}`);

    return reasons.join('; ');
  }

  /**
   * Create a summary of which phases will execute
   * @param {Object[]} phases - Array of phase configurations
   * @returns {Object} Summary with applicable/skipped phases
   */
  evaluateAllPhases(phases) {
    const summary = {
      applicable: [],
      skipped: [],
      details: {},
    };

    for (const phase of phases) {
      const phaseNum = phase.phase || phase.step;
      const evaluation = this.shouldExecutePhase(phase);

      summary.details[phaseNum] = {
        name: phase.phase_name || phase.step,
        condition: phase.condition || null,
        ...evaluation,
      };

      if (evaluation.shouldExecute) {
        summary.applicable.push(phaseNum);
      } else {
        summary.skipped.push(phaseNum);
      }
    }

    return summary;
  }
}

/**
 * Enhanced Condition Evaluator for boolean expressions and context variables
 */
class EnhancedConditionEvaluator {
  constructor(options = {}) {
    this.cache = new Map();
    this.contextStack = [];
    this.stats = {
      evaluated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
    this.enableCache = options.enableCache !== false;
    this.cacheMaxSize = options.cacheMaxSize || 1000;
  }

  /**
   * Push context onto stack
   */
  pushContext(context) {
    this.contextStack.push(context || {});
  }

  /**
   * Pop context from stack
   */
  popContext() {
    if (this.contextStack.length > 0) {
      return this.contextStack.pop();
    }
    return null;
  }

  /**
   * Get current merged context
   */
  getCurrentContext() {
    const merged = {};
    for (const ctx of this.contextStack) {
      Object.assign(merged, ctx);
    }
    return merged;
  }

  /**
   * Evaluate a condition expression against context
   */
  evaluateExpression(condition, context) {
    const ctx = context || this.getCurrentContext();
    const cacheKey = this.generateCacheKey(condition, ctx);

    if (this.enableCache && this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }

    this.stats.cacheMisses++;

    try {
      const result = this._evaluateExpr(condition, ctx);
      this.stats.evaluated++;

      if (this.enableCache) {
        this._setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Internal expression evaluation
   */
  _evaluateExpr(expr, context) {
    if (expr === null || expr === undefined) {
      return false;
    }

    if (typeof expr === 'boolean') {
      return expr;
    }

    if (typeof expr === 'string') {
      return this._evaluateStringExpr(expr, context);
    }

    if (typeof expr === 'object') {
      return this._evaluateASTExpr(expr, context);
    }

    return Boolean(expr);
  }

  /**
   * Evaluate string expression
   */
  _evaluateStringExpr(expr, context) {
    const trimmed = expr.trim();

    // Handle NOT
    if (trimmed.startsWith('!')) {
      return !this._evaluateExpr(trimmed.substring(1).trim(), context);
    }

    // Handle parentheses
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return this._evaluateExpr(trimmed.substring(1, trimmed.length - 1), context);
    }

    // Handle OR
    const orIdx = this._findOperator(trimmed, '||');
    if (orIdx !== -1) {
      const left = trimmed.substring(0, orIdx);
      const right = trimmed.substring(orIdx + 2);
      return this._evaluateExpr(left, context) || this._evaluateExpr(right, context);
    }

    // Handle AND
    const andIdx = this._findOperator(trimmed, '&&');
    if (andIdx !== -1) {
      const left = trimmed.substring(0, andIdx);
      const right = trimmed.substring(andIdx + 2);
      return this._evaluateExpr(left, context) && this._evaluateExpr(right, context);
    }

    // Handle comparisons (check multi-char operators first)
    const compOps = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];
    for (const op of compOps) {
      const opIdx = this._findOperator(trimmed, op);
      if (opIdx !== -1) {
        const left = trimmed.substring(0, opIdx).trim();
        const right = trimmed.substring(opIdx + op.length).trim();
        const leftVal = this._resolveValue(left, context);
        const rightVal = this._resolveValue(right, context);

        switch (op) {
          case '==':
            return leftVal == rightVal; // eslint-disable-line eqeqeq
          case '!=':
            return leftVal != rightVal; // eslint-disable-line eqeqeq
          case '===':
            return leftVal === rightVal;
          case '!==':
            return leftVal !== rightVal;
          case '>=':
            return leftVal >= rightVal;
          case '<=':
            return leftVal <= rightVal;
          case '>':
            return leftVal > rightVal;
          case '<':
            return leftVal < rightVal;
        }
      }
    }

    // Handle 'in' operator separately (requires word boundaries)
    const inIdx = this._findOperator(trimmed, ' in ');
    if (inIdx !== -1) {
      const left = trimmed.substring(0, inIdx).trim();
      const right = trimmed.substring(inIdx + 4).trim();
      const leftVal = this._resolveValue(left, context);
      const rightVal = this._resolveValue(right, context);
      return rightVal && rightVal.includes ? rightVal.includes(leftVal) : false;
    }

    // Variable reference
    return this._resolveValue(trimmed, context);
  }

  /**
   * Evaluate AST expression
   */
  _evaluateASTExpr(expr, context) {
    if (expr.type === 'and') {
      return this._evaluateExpr(expr.left, context) && this._evaluateExpr(expr.right, context);
    }
    if (expr.type === 'or') {
      return this._evaluateExpr(expr.left, context) || this._evaluateExpr(expr.right, context);
    }
    if (expr.type === 'not') {
      return !this._evaluateExpr(expr.value, context);
    }
    if (expr.type === 'variable') {
      return this._resolveValue(expr.name, context);
    }
    return Boolean(expr);
  }

  /**
   * Resolve a value (variable or literal)
   */
  _resolveValue(value, context) {
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // String literal
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
      }

      // Number
      if (!isNaN(trimmed) && trimmed !== '') {
        return Number(trimmed);
      }

      // Booleans
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (trimmed === 'null') return null;
      if (trimmed === 'undefined') return undefined;

      // Variable
      return this._getContextValue(trimmed, context);
    }

    return value;
  }

  /**
   * Get context value by path
   */
  _getContextValue(path, context) {
    const parts = path.split('.');
    let current = context;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Find operator position outside parentheses
   */
  _findOperator(expr, operator) {
    let depth = 0;
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === '(') depth++;
      else if (expr[i] === ')') depth--;
      else if (depth === 0 && expr.substring(i, i + operator.length) === operator) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(condition, context) {
    const cond = typeof condition === 'string' ? condition : JSON.stringify(condition);
    const ctx = JSON.stringify(context);
    return `${cond}|${ctx}`;
  }

  /**
   * Set cache with eviction
   */
  _setCache(key, value) {
    if (this.cache.size >= this.cacheMaxSize) {
      const first = this.cache.keys().next().value;
      this.cache.delete(first);
    }
    this.cache.set(key, value);
  }

  /**
   * Clear cache
   */
  clearCache() {
    const cleared = this.cache.size;
    this.cache.clear();
    return cleared;
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRatio: total > 0 ? this.stats.cacheHits / total : 0,
      contextStackSize: this.contextStack.length
    };
  }
}

module.exports = ConditionEvaluator;
module.exports.EnhancedConditionEvaluator = EnhancedConditionEvaluator;
