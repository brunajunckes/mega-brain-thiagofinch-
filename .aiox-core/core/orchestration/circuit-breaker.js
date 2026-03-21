/**
 * Circuit Breaker - Pattern for handling degraded dependencies
 * @module core/orchestration/circuit-breaker
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * CircuitBreaker - Prevents cascading failures from degraded dependencies
 */
class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 60000; // 1 minute
    this.halfOpenThreshold = options.halfOpenThreshold || 3;

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.resetTimeout = null;

    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      rejects: 0,
      stateChanges: 0
    };

    this.callHistory = [];
    this.maxHistory = options.maxHistory || 100;
  }

  /**
   * Execute function through circuit breaker
   */
  async execute(fn, args = []) {
    this.stats.attempts++;

    // If OPEN, reject immediately (with possible reset)
    if (this.state === 'OPEN') {
      this._checkReset();

      if (this.state === 'OPEN') {
        this.stats.rejects++;
        this.emit('request-rejected', {
          name: this.name,
          state: this.state
        });
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await Promise.resolve(fn(...args));
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  /**
   * Handle successful call
   */
  _onSuccess() {
    this.stats.successes++;
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      // If enough successes, close circuit
      if (this.successCount >= this.halfOpenThreshold) {
        this._setState('CLOSED');
        this.successCount = 0;
      }
    }

    this._recordHistory('success');
  }

  /**
   * Handle failed call
   */
  _onFailure() {
    this.stats.failures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // If failure in HALF_OPEN, go back to OPEN
      this._setState('OPEN');
      this.successCount = 0;
    } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      // If threshold reached in CLOSED, go to OPEN
      this._setState('OPEN');
    }

    this._recordHistory('failure');
  }

  /**
   * Check if circuit should reset
   */
  _checkReset() {
    if (this.state === 'OPEN') {
      const timeSinceOpen = Date.now() - this.lastStateChange;

      if (timeSinceOpen >= this.resetTimeoutMs) {
        this._setState('HALF_OPEN');
        this.successCount = 0;
        this.failureCount = 0;
      }
    }
  }

  /**
   * Set circuit state
   */
  _setState(newState) {
    if (this.state === newState) {
      return;
    }

    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    this.stats.stateChanges++;

    this.emit('state-change', {
      name: this.name,
      previousState: oldState,
      newState,
      timestamp: this.lastStateChange
    });
  }

  /**
   * Record call history
   */
  _recordHistory(result) {
    this.callHistory.push({
      timestamp: Date.now(),
      result,
      state: this.state
    });

    // Trim history
    if (this.callHistory.length > this.maxHistory) {
      this.callHistory.shift();
    }
  }

  /**
   * Get current state
   */
  getState() {
    this._checkReset();
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentState: this.state,
      failureRate: this.stats.attempts > 0 ? (this.stats.failures / this.stats.attempts) * 100 : 0,
      rejectRate: this.stats.attempts > 0 ? (this.stats.rejects / this.stats.attempts) * 100 : 0
    };
  }

  /**
   * Get call history
   */
  getHistory() {
    return [...this.callHistory];
  }

  /**
   * Reset circuit manually
   */
  reset() {
    this._setState('CLOSED');
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;

    this.emit('manual-reset', {
      name: this.name,
      timestamp: Date.now()
    });
  }

  /**
   * Force open circuit
   */
  forceOpen() {
    this._setState('OPEN');

    this.emit('force-open', {
      name: this.name,
      timestamp: Date.now()
    });
  }

  /**
   * Clear history
   */
  clearHistory() {
    const cleared = this.callHistory.length;
    this.callHistory = [];
    return cleared;
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy() {
    return this.state === 'CLOSED' || this.state === 'HALF_OPEN';
  }
}

module.exports = CircuitBreaker;
