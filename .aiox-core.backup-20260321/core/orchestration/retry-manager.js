/**
 * Retry Manager - Exponential backoff retry strategy
 * @module core/orchestration/retry-manager
 * @version 1.0.0
 */

class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 8000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryHistory = new Map();
  }

  /**
   * Calculate delay for retry attempt
   */
  calculateDelay(attemptNumber) {
    const delay = this.initialDelay * Math.pow(this.backoffMultiplier, attemptNumber);
    return Math.min(delay, this.maxDelay);
  }

  /**
   * Should retry based on error type
   */
  shouldRetry(error, attemptNumber) {
    if (attemptNumber >= this.maxRetries) {
      return false;
    }

    // Don't retry permanent errors
    if (error.code === 'PERMANENT' || error.permanent === true) {
      return false;
    }

    // Retry transient errors
    return true;
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry(taskId, executeFn, options = {}) {
    const { onRetry } = options;
    let lastError;
    let attemptNumber = 0;

    while (attemptNumber < this.maxRetries) {
      try {
        const result = await executeFn();
        this.retryHistory.set(taskId, { attempts: attemptNumber + 1, success: true });
        return result;
      } catch (error) {
        lastError = error;

        if (!this.shouldRetry(error, attemptNumber)) {
          break;
        }

        attemptNumber++;
        const delay = this.calculateDelay(attemptNumber);

        if (onRetry) {
          onRetry(taskId, attemptNumber, delay, error);
        }

        await this._sleep(delay);
      }
    }

    this.retryHistory.set(taskId, { attempts: attemptNumber, success: false, lastError });
    throw lastError;
  }

  /**
   * Get retry history for task
   */
  getHistory(taskId) {
    return this.retryHistory.get(taskId) || null;
  }

  /**
   * Clear retry history
   */
  clearHistory(taskId) {
    if (taskId) {
      this.retryHistory.delete(taskId);
    } else {
      this.retryHistory.clear();
    }
  }

  /**
   * Sleep utility
   */
  async _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = RetryManager;
