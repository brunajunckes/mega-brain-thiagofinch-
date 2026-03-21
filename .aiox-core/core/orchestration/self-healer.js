/**
 * Self Healer - Auto-restart mechanisms and recovery escalation
 * @module core/orchestration/self-healer
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * SelfHealer - Automatically restarts components and escalates recovery
 */
class SelfHealer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'self-healer';

    // Recovery escalation levels
    this.escalationLevels = {
      1: { name: 'RESTART', delayMs: 1000, maxAttempts: 3 },
      2: { name: 'HEAVY_RESTART', delayMs: 5000, maxAttempts: 2 },
      3: { name: 'DEPENDENCY_RESTART', delayMs: 10000, maxAttempts: 1 },
      4: { name: 'FULL_RESET', delayMs: 30000, maxAttempts: 1 }
    };

    this.recoveryHandlers = new Map(); // componentId -> recovery handler function
    this.recoveryState = new Map(); // componentId -> recovery state
    this.recoveryHistory = [];
    this.maxHistory = options.maxHistory || 1000;

    this.stats = {
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      escalatedRecoveries: 0
    };
  }

  /**
   * Register recovery handler for component
   */
  registerRecoveryHandler(componentId, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Recovery handler must be a function');
    }
    this.recoveryHandlers.set(componentId, handler);
  }

  /**
   * Initiate recovery for component
   */
  async initiateRecovery(componentId, escalationLevel = 1) {
    if (!this.recoveryHandlers.has(componentId)) {
      this.emit('recovery-failed', {
        componentId,
        reason: 'No recovery handler registered',
        timestamp: Date.now()
      });
      return false;
    }

    if (!this.recoveryState.has(componentId)) {
      this.recoveryState.set(componentId, {
        currentEscalation: 1,
        attemptCount: 0,
        lastAttempt: null,
        lastSuccess: null
      });
    }

    const state = this.recoveryState.get(componentId);
    state.currentEscalation = escalationLevel;

    this.stats.recoveryAttempts++;

    const escalationInfo = this.escalationLevels[escalationLevel];
    if (!escalationInfo) {
      this.emit('recovery-failed', {
        componentId,
        reason: 'Invalid escalation level',
        timestamp: Date.now()
      });
      return false;
    }

    this.emit('recovery-started', {
      componentId,
      escalationLevel,
      escalationName: escalationInfo.name,
      timestamp: Date.now()
    });

    // Apply delay before attempting recovery
    await this._delay(escalationInfo.delayMs);

    // Attempt recovery
    try {
      const handler = this.recoveryHandlers.get(componentId);
      const result = await Promise.resolve(handler(escalationLevel));

      if (result) {
        state.attemptCount = 0;
        state.lastSuccess = Date.now();
        this.stats.successfulRecoveries++;

        this._recordRecovery({
          componentId,
          escalationLevel,
          escalationName: escalationInfo.name,
          status: 'SUCCESS',
          timestamp: Date.now()
        });

        this.emit('recovery-succeeded', {
          componentId,
          escalationLevel,
          escalationName: escalationInfo.name,
          timestamp: Date.now()
        });

        return true;
      } else {
        // Recovery returned false, try escalation
        return this._escalateRecovery(componentId, escalationLevel);
      }
    } catch (error) {
      return this._escalateRecovery(componentId, escalationLevel, error);
    }
  }

  /**
   * Escalate recovery to next level
   */
  async _escalateRecovery(componentId, currentLevel, error = null) {
    const state = this.recoveryState.get(componentId);
    const escalationInfo = this.escalationLevels[currentLevel];

    state.attemptCount++;
    state.lastAttempt = Date.now();

    if (state.attemptCount >= escalationInfo.maxAttempts) {
      // Try next escalation level
      const nextLevel = currentLevel + 1;
      if (nextLevel <= 4) {
        this.stats.escalatedRecoveries++;

        this.emit('recovery-escalating', {
          componentId,
          currentLevel,
          nextLevel,
          reason: error ? error.message : 'Handler returned false',
          timestamp: Date.now()
        });

        return this.initiateRecovery(componentId, nextLevel);
      } else {
        // All escalation levels exhausted
        this.stats.failedRecoveries++;

        this._recordRecovery({
          componentId,
          escalationLevel: currentLevel,
          escalationName: escalationInfo.name,
          status: 'FAILED',
          reason: error ? error.message : 'All escalation levels exhausted',
          timestamp: Date.now()
        });

        this.emit('recovery-failed', {
          componentId,
          escalationLevel: currentLevel,
          escalationName: escalationInfo.name,
          reason: 'All escalation levels exhausted',
          error: error ? error.message : null,
          timestamp: Date.now()
        });

        return false;
      }
    } else {
      // Retry at same escalation level
      this.emit('recovery-retrying', {
        componentId,
        escalationLevel: currentLevel,
        escalationName: escalationInfo.name,
        attemptNumber: state.attemptCount,
        maxAttempts: escalationInfo.maxAttempts,
        reason: error ? error.message : 'Handler returned false',
        timestamp: Date.now()
      });

      return this.initiateRecovery(componentId, currentLevel);
    }
  }

  /**
   * Record recovery attempt in history
   */
  _recordRecovery(recovery) {
    this.recoveryHistory.push(recovery);
    if (this.recoveryHistory.length > this.maxHistory) {
      this.recoveryHistory.shift();
    }
  }

  /**
   * Delay utility
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recovery state for component
   */
  getRecoveryState(componentId) {
    if (!this.recoveryState.has(componentId)) {
      return null;
    }

    const state = this.recoveryState.get(componentId);
    const escalationInfo = this.escalationLevels[state.currentEscalation];

    return {
      componentId,
      currentEscalation: state.currentEscalation,
      escalationName: escalationInfo.name,
      attemptCount: state.attemptCount,
      maxAttempts: escalationInfo.maxAttempts,
      lastAttempt: state.lastAttempt,
      lastSuccess: state.lastSuccess
    };
  }

  /**
   * Get recovery history for component
   */
  getRecoveryHistory(componentId, timeWindowMs = 3600000) {
    const cutoff = Date.now() - timeWindowMs;
    return this.recoveryHistory.filter(
      r => r.componentId === componentId && r.timestamp >= cutoff
    );
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalRecoveries: this.recoveryHistory.length,
      successRate: this.stats.recoveryAttempts > 0
        ? (this.stats.successfulRecoveries / this.stats.recoveryAttempts) * 100
        : 0
    };
  }

  /**
   * Reset healer state
   */
  reset() {
    this.recoveryState.clear();
    this.recoveryHistory = [];
    this.stats = {
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      escalatedRecoveries: 0
    };
  }
}

module.exports = SelfHealer;
