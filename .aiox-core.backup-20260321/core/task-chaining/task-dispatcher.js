'use strict';

/**
 * Task Dispatcher — Execute Task Chains in Sequence
 *
 * Handles sequential execution of chained tasks, passing outputs
 * as inputs to dependent tasks.
 *
 * @class TaskDispatcher
 * @version 1.0.0
 * @story 1.2
 */
class TaskDispatcher {
  /**
   * Initialize TaskDispatcher
   * @param {Object} options Configuration
   */
  constructor(options = {}) {
    this.taskRegistry = new Map();
    this.executionHistory = [];
    this.maxHistory = options.maxHistory || 1000;
    this.onTaskStart = options.onTaskStart || (() => {});
    this.onTaskEnd = options.onTaskEnd || (() => {});
    this.onChainError = options.onChainError || (() => {});
  }

  /**
   * Register a task executor function
   * @param {string} taskName Task name
   * @param {Function} executor Task executor function
   */
  registerTask(taskName, executor) {
    if (typeof executor !== 'function') {
      throw new Error(`Task executor for '${taskName}' must be a function`);
    }
    this.taskRegistry.set(taskName, executor);
  }

  /**
   * Execute a task chain
   * @param {Array} chain Array of tasks to execute
   * @param {Object} initialContext Initial execution context
   * @returns {Promise<Object>} Chain execution result
   */
  async executeChain(chain, initialContext = {}) {
    if (!Array.isArray(chain) || chain.length === 0) {
      throw new Error('Chain must be a non-empty array of tasks');
    }

    const chainId = this._generateChainId();
    const context = { ...initialContext, chainId };
    const results = [];

    try {
      for (const task of chain) {
        const taskResult = await this._executeTask(task, context, results);

        if (!taskResult.success) {
          // Task failed - decide whether to continue or abort
          if (task.continueOnError === false) {
            throw new Error(`Task '${task.name}' failed: ${taskResult.error}`);
          }
          // Continue with other tasks
        }

        results.push(taskResult);
        context.lastResult = taskResult;
      }

      return {
        chainId,
        status: 'success',
        results,
        duration: this._calculateDuration(results),
      };
    } catch (error) {
      this.onChainError({ chainId, error, results });
      return {
        chainId,
        status: 'failed',
        error: error.message,
        results,
        failedAt: results.length,
      };
    } finally {
      this._recordExecution(chainId, results);
    }
  }

  /**
   * Execute a single task
   * @private
   * @param {Object} task Task definition
   * @param {Object} context Execution context
   * @param {Array} previousResults Previous task results
   * @returns {Promise<Object>} Task execution result
   */
  async _executeTask(task, context, previousResults) {
    const { name, handler, input_mapping = {}, timeout = 300000 } = task;

    if (!name) {
      throw new Error('Task must have a name');
    }

    const executor = this.taskRegistry.get(name) || handler;
    if (!executor) {
      return {
        name,
        success: false,
        error: `No executor registered for task '${name}'`,
      };
    }

    const startTime = Date.now();
    this.onTaskStart({ taskName: name, context });

    try {
      // Build task input from context and previous results
      const taskInput = this._buildTaskInput(task, context, previousResults);

      // Execute with timeout
      const result = await this._executeWithTimeout(executor, taskInput, timeout);

      const duration = Date.now() - startTime;

      const taskResult = {
        name,
        success: true,
        output: result,
        duration,
        timestamp: new Date().toISOString(),
      };

      this.onTaskEnd({ taskName: name, result: taskResult });
      return taskResult;
    } catch (error) {
      const duration = Date.now() - startTime;

      const taskResult = {
        name,
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString(),
      };

      this.onTaskEnd({ taskName: name, result: taskResult, error });
      return taskResult;
    }
  }

  /**
   * Build task input from context and previous results
   * @private
   * @param {Object} task Task definition
   * @param {Object} context Execution context
   * @param {Array} previousResults Previous task results
   * @returns {Object} Built input
   */
  _buildTaskInput(task, context, previousResults) {
    const input = { ...context };

    // Apply input mappings from previous results
    if (task.input_mapping && typeof task.input_mapping === 'object') {
      for (const [targetKey, sourceKey] of Object.entries(task.input_mapping)) {
        // Find source in previous results
        for (const result of previousResults) {
          if (result.name === task.depends_on) {
            const sourceValue = this._getNestedValue(result.output, sourceKey);
            if (sourceValue !== undefined) {
              input[targetKey] = sourceValue;
            }
          }
        }
      }
    }

    return input;
  }

  /**
   * Get nested value from object using dot notation
   * @private
   * @param {Object} obj Object to search
   * @param {string} path Dot-notation path (e.g., 'foo.bar.baz')
   * @returns {*} Value or undefined
   */
  _getNestedValue(obj, path) {
    if (!obj || typeof path !== 'string') return undefined;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Execute function with timeout
   * @private
   * @param {Function} fn Function to execute
   * @param {*} input Input to pass
   * @param {number} timeout Timeout in ms
   * @returns {Promise} Execution result
   */
  async _executeWithTimeout(fn, input, timeout) {
    return Promise.race([
      fn(input),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Task timeout after ${timeout}ms`)), timeout),
      ),
    ]);
  }

  /**
   * Calculate total duration of chain
   * @private
   * @param {Array} results Task results
   * @returns {number} Total duration in ms
   */
  _calculateDuration(results) {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + (r.duration || 0), 0);
  }

  /**
   * Generate unique chain ID
   * @private
   * @returns {string} Chain ID
   */
  _generateChainId() {
    return `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record execution in history
   * @private
   * @param {string} chainId Chain ID
   * @param {Array} results Execution results
   */
  _recordExecution(chainId, results) {
    this.executionHistory.push({
      chainId,
      results,
      timestamp: new Date().toISOString(),
    });

    // Keep history size in check
    if (this.executionHistory.length > this.maxHistory) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get execution history
   * @param {number} limit Maximum number of records
   * @returns {Array} Execution history
   */
  getHistory(limit = 100) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }

  /**
   * Get registered tasks
   * @returns {Array} Array of task names
   */
  getRegisteredTasks() {
    return Array.from(this.taskRegistry.keys());
  }
}

module.exports = { TaskDispatcher };
