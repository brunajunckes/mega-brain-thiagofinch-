/**
 * Conditional Executor - Executes tasks based on conditions and routing
 * @module core/orchestration/conditional-executor
 * @version 1.0.0
 */

const EventEmitter = require('events');
const { EnhancedConditionEvaluator } = require('./condition-evaluator');

/**
 * ConditionalExecutor - Handles if/else and switch/case task routing
 */
class ConditionalExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.evaluator = new EnhancedConditionEvaluator(options.evaluator || {});
    this.routingHistory = [];
    this.stats = {
      ifExecuted: 0,
      switchExecuted: 0,
      casesMatched: 0,
      defaultsFallback: 0,
      routingDecisions: 0
    };
  }

  /**
   * Execute if/else routing based on condition
   */
  executeIf(condition, onTrue, onFalse, context) {
    const ctx = context || this.evaluator.getCurrentContext();
    const result = this.evaluator.evaluateExpression(condition, ctx);

    this.stats.ifExecuted++;
    this.stats.routingDecisions++;

    const decision = {
      type: 'if',
      condition,
      result,
      onTrueBranch: result,
      timestamp: Date.now(),
      context: ctx
    };

    this.routingHistory.push(decision);

    this.emit('if-decision', decision);

    if (result) {
      return onTrue ? this._executeTaskOrCallback(onTrue, ctx) : null;
    } else {
      return onFalse ? this._executeTaskOrCallback(onFalse, ctx) : null;
    }
  }

  /**
   * Execute switch/case routing
   */
  executeSwitch(expression, cases, defaultCase, context) {
    const ctx = context || this.evaluator.getCurrentContext();
    const expressionValue = this.evaluator.evaluateExpression(expression, ctx);

    this.stats.switchExecuted++;

    // Find matching case
    let matchedCase = null;
    let caseIndex = -1;

    for (let i = 0; i < cases.length; i++) {
      const caseVal = this.evaluator.evaluateExpression(cases[i].value, ctx);
      if (expressionValue === caseVal) {
        matchedCase = cases[i];
        caseIndex = i;
        break;
      }
    }

    this.stats.routingDecisions++;

    const decision = {
      type: 'switch',
      expression,
      expressionValue,
      cases: cases.map((c, i) => ({
        index: i,
        value: c.value,
        matched: i === caseIndex
      })),
      matchedCaseIndex: caseIndex,
      usedDefault: matchedCase === null,
      timestamp: Date.now(),
      context: ctx
    };

    this.routingHistory.push(decision);

    if (matchedCase) {
      this.stats.casesMatched++;
      this.emit('switch-decision', decision);
      return this._executeTaskOrCallback(matchedCase.execute, ctx);
    } else {
      this.stats.defaultsFallback++;
      this.emit('switch-default', decision);
      return defaultCase ? this._executeTaskOrCallback(defaultCase, ctx) : null;
    }
  }

  /**
   * Execute conditional branch (if/else) with task template
   */
  executeBranch(branch, context) {
    if (!branch || !branch.condition) {
      throw new Error('Branch requires condition');
    }

    const ctx = context || this.evaluator.getCurrentContext();
    const result = this.evaluator.evaluateExpression(branch.condition, ctx);

    return result ? branch.ifTrue : branch.ifFalse;
  }

  /**
   * Execute task routing configuration
   */
  executeRouting(routing, context) {
    const ctx = context || this.evaluator.getCurrentContext();

    if (routing.type === 'if') {
      return this.executeIf(
        routing.condition,
        routing.ifTrue,
        routing.ifFalse,
        ctx
      );
    }

    if (routing.type === 'switch') {
      return this.executeSwitch(
        routing.expression,
        routing.cases,
        routing.default,
        ctx
      );
    }

    throw new Error(`Unknown routing type: ${routing.type}`);
  }

  /**
   * Create a nested routing condition (multi-level if/switch)
   */
  createNestedRouting(conditions, context) {
    const ctx = context || this.evaluator.getCurrentContext();
    const results = [];

    for (const cond of conditions) {
      const result = this.evaluator.evaluateExpression(cond, ctx);
      results.push({
        condition: cond,
        result
      });
    }

    return results;
  }

  /**
   * Evaluate all branches and return matching ones
   */
  evaluateAllBranches(branches, context) {
    const ctx = context || this.evaluator.getCurrentContext();
    const results = [];

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      const result = this.evaluator.evaluateExpression(branch.condition, ctx);
      results.push({
        branchIndex: i,
        condition: branch.condition,
        matched: result,
        value: result ? branch.value : null
      });
    }

    return results;
  }

  /**
   * Execute task or callback
   */
  _executeTaskOrCallback(taskOrCallback, context) {
    if (!taskOrCallback) {
      return null;
    }

    // If it's a function, execute it with context
    if (typeof taskOrCallback === 'function') {
      try {
        return taskOrCallback(context || this.evaluator.getCurrentContext());
      } catch (error) {
        this.emit('execution-error', { error: error.message });
        throw error;
      }
    }

    // If it's a task object, return it
    if (typeof taskOrCallback === 'object') {
      return taskOrCallback;
    }

    // String might be task ID
    return taskOrCallback;
  }

  /**
   * Set context for evaluation
   */
  setContext(context) {
    this.evaluator.pushContext(context);
  }

  /**
   * Clear context
   */
  clearContext() {
    this.evaluator.popContext();
  }

  /**
   * Get routing history
   */
  getRoutingHistory() {
    return [...this.routingHistory];
  }

  /**
   * Clear routing history
   */
  clearRoutingHistory() {
    const cleared = this.routingHistory.length;
    this.routingHistory = [];
    return cleared;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      evaluatorStats: this.evaluator.getStats(),
      historySize: this.routingHistory.length
    };
  }

  /**
   * Validate routing configuration
   */
  validateRouting(routing) {
    const errors = [];

    if (!routing.type) {
      errors.push('Missing routing type (if|switch)');
    }

    if (routing.type === 'if') {
      if (!routing.condition) {
        errors.push('If routing requires condition');
      }
    }

    if (routing.type === 'switch') {
      if (!routing.expression) {
        errors.push('Switch routing requires expression');
      }
      if (!routing.cases || routing.cases.length === 0) {
        errors.push('Switch routing requires at least one case');
      }
      for (let i = 0; i < (routing.cases || []).length; i++) {
        if (!routing.cases[i].value) {
          errors.push(`Case ${i} missing value`);
        }
        if (!routing.cases[i].execute) {
          errors.push(`Case ${i} missing execute`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = ConditionalExecutor;
