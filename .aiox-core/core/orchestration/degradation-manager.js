/**
 * Degradation Manager - Handles graceful degradation under load
 * @module core/orchestration/degradation-manager
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * DegradationManager - Implements graceful degradation patterns
 */
class DegradationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.mode = 'NORMAL'; // NORMAL, DEGRADED, CRITICAL
    this.modeHistory = [];

    // Load thresholds for mode transitions
    this.thresholds = {
      degradedCpu: options.degradedCpuThreshold || 70,
      degradedMemory: options.degradedMemoryThreshold || 70,
      criticalCpu: options.criticalCpuThreshold || 85,
      criticalMemory: options.criticalMemoryThreshold || 85,
      queueDepth: options.queueDepthThreshold || 1000
    };

    // Degradation features
    this.degradedFeatures = {
      reduceHeavyProcessing: false,
      skipOptionalValidation: false,
      disableCaching: false,
      reduceConcurrency: false,
      limitRetries: false
    };

    this.criticalFeatures = {
      fastFailOnTimeout: false,
      rejectNonCritical: false,
      drainQueue: false,
      pauseNewWork: false
    };

    // Resources and limits
    this.currentLoad = {
      cpuPercent: 0,
      memoryPercent: 0,
      queueDepth: 0,
      activeTasks: 0
    };

    this.limits = {
      maxConcurrentNormal: options.maxConcurrentNormal || 50,
      maxConcurrentDegraded: options.maxConcurrentDegraded || 25,
      maxConcurrentCritical: options.maxConcurrentCritical || 10,
      retryAttemptsNormal: options.retryAttemptsNormal || 3,
      retryAttemptsDegraded: options.retryAttemptsDegraded || 1,
      retryAttemptsCritical: options.retryAttemptsCritical || 0
    };

    this.stats = {
      modeChanges: 0,
      rejectedRequests: 0,
      drainedTasks: 0,
      degradationEvents: 0
    };
  }

  /**
   * Update current load metrics
   */
  updateLoad(cpuPercent, memoryPercent, queueDepth, activeTasks) {
    this.currentLoad = {
      cpuPercent,
      memoryPercent,
      queueDepth,
      activeTasks
    };

    // Determine new mode
    const previousMode = this.mode;
    this._determineMode();

    if (previousMode !== this.mode) {
      this.stats.modeChanges++;
      this._recordModeChange(previousMode, this.mode);
    }
  }

  /**
   * Determine degradation mode based on load
   */
  _determineMode() {
    const { cpuPercent, memoryPercent, queueDepth } = this.currentLoad;

    // Check for critical mode
    if (cpuPercent >= this.thresholds.criticalCpu ||
        memoryPercent >= this.thresholds.criticalMemory ||
        queueDepth > this.thresholds.queueDepth * 1.5) {
      this._setMode('CRITICAL');
    }
    // Check for degraded mode
    else if (cpuPercent >= this.thresholds.degradedCpu ||
             memoryPercent >= this.thresholds.degradedMemory ||
             queueDepth > this.thresholds.queueDepth) {
      this._setMode('DEGRADED');
    }
    // Normal mode
    else {
      this._setMode('NORMAL');
    }
  }

  /**
   * Set degradation mode
   */
  _setMode(newMode) {
    if (this.mode === newMode) {
      return;
    }

    const oldMode = this.mode;
    this.mode = newMode;

    this._applyDegradation(newMode);
    this.stats.degradationEvents++;

    this.emit('mode-changed', {
      previousMode: oldMode,
      newMode,
      load: { ...this.currentLoad },
      timestamp: Date.now()
    });
  }

  /**
   * Apply degradation features for mode
   */
  _applyDegradation(mode) {
    // Reset all features
    Object.keys(this.degradedFeatures).forEach(key => {
      this.degradedFeatures[key] = false;
    });
    Object.keys(this.criticalFeatures).forEach(key => {
      this.criticalFeatures[key] = false;
    });

    if (mode === 'DEGRADED') {
      this.degradedFeatures.reduceHeavyProcessing = true;
      this.degradedFeatures.skipOptionalValidation = true;
      this.degradedFeatures.disableCaching = true;
      this.degradedFeatures.reduceConcurrency = true;
      this.degradedFeatures.limitRetries = true;
    } else if (mode === 'CRITICAL') {
      Object.keys(this.degradedFeatures).forEach(key => {
        this.degradedFeatures[key] = true;
      });
      this.criticalFeatures.fastFailOnTimeout = true;
      this.criticalFeatures.rejectNonCritical = true;
      this.criticalFeatures.pauseNewWork = true;
    }
  }

  /**
   * Record mode change history
   */
  _recordModeChange(from, to) {
    this.modeHistory.push({
      timestamp: Date.now(),
      from,
      to,
      load: { ...this.currentLoad }
    });

    // Keep history limited
    if (this.modeHistory.length > 1000) {
      this.modeHistory.shift();
    }
  }

  /**
   * Check if request should be accepted
   */
  shouldAcceptRequest(options = {}) {
    const priority = options.priority || 'normal'; // critical, high, normal, low

    // In critical mode, reject non-critical tasks
    if (this.mode === 'CRITICAL') {
      if (priority === 'low' || priority === 'normal') {
        this.stats.rejectedRequests++;
        this.emit('request-rejected', {
          reason: 'Critical degradation mode active',
          priority,
          mode: this.mode
        });
        return false;
      }
    }

    // In degraded mode, allow all but guide concurrency
    return true;
  }

  /**
   * Get max concurrent tasks for current mode
   */
  getMaxConcurrency() {
    switch (this.mode) {
      case 'NORMAL':
        return this.limits.maxConcurrentNormal;
      case 'DEGRADED':
        return this.limits.maxConcurrentDegraded;
      case 'CRITICAL':
        return this.limits.maxConcurrentCritical;
      default:
        return this.limits.maxConcurrentNormal;
    }
  }

  /**
   * Get retry attempts for current mode
   */
  getRetryAttempts() {
    switch (this.mode) {
      case 'NORMAL':
        return this.limits.retryAttemptsNormal;
      case 'DEGRADED':
        return this.limits.retryAttemptsDegraded;
      case 'CRITICAL':
        return this.limits.retryAttemptsCritical;
      default:
        return this.limits.retryAttemptsNormal;
    }
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName) {
    if (this.degradedFeatures.hasOwnProperty(featureName)) {
      return this.degradedFeatures[featureName];
    }
    if (this.criticalFeatures.hasOwnProperty(featureName)) {
      return this.criticalFeatures[featureName];
    }
    return false;
  }

  /**
   * Get degradation status
   */
  getStatus() {
    return {
      mode: this.mode,
      load: { ...this.currentLoad },
      limits: {
        maxConcurrency: this.getMaxConcurrency(),
        retryAttempts: this.getRetryAttempts()
      },
      features: {
        degraded: { ...this.degradedFeatures },
        critical: { ...this.criticalFeatures }
      },
      timestamp: Date.now()
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentMode: this.mode,
      modeHistoryLength: this.modeHistory.length
    };
  }

  /**
   * Get mode history
   */
  getModeHistory(timeWindowMs = 3600000) {
    const cutoff = Date.now() - timeWindowMs;
    return this.modeHistory.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Get time in each mode
   */
  getTimeInModes() {
    if (this.modeHistory.length === 0) {
      return {
        NORMAL: 0,
        DEGRADED: 0,
        CRITICAL: 0
      };
    }

    const times = {
      NORMAL: 0,
      DEGRADED: 0,
      CRITICAL: 0
    };

    for (let i = 0; i < this.modeHistory.length; i++) {
      const current = this.modeHistory[i];
      const next = this.modeHistory[i + 1];
      const duration = next ? next.timestamp - current.timestamp : Date.now() - current.timestamp;
      times[current.to] = (times[current.to] || 0) + duration;
    }

    return times;
  }

  /**
   * Force mode change (for testing)
   */
  forceMode(mode) {
    if (!['NORMAL', 'DEGRADED', 'CRITICAL'].includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    const previousMode = this.mode;
    this._setMode(mode);

    this.emit('forced-mode-change', {
      previousMode,
      newMode: mode,
      timestamp: Date.now()
    });
  }

  /**
   * Clear history
   */
  clearHistory() {
    const cleared = this.modeHistory.length;
    this.modeHistory = [];
    return cleared;
  }

  /**
   * Reset to normal
   */
  reset() {
    const previousMode = this.mode;
    this.mode = 'NORMAL';
    this._applyDegradation('NORMAL');

    this.modeHistory = [];
    this.stats = {
      modeChanges: 0,
      rejectedRequests: 0,
      drainedTasks: 0,
      degradationEvents: 0
    };

    this.emit('reset', {
      previousMode,
      timestamp: Date.now()
    });
  }
}

module.exports = DegradationManager;
