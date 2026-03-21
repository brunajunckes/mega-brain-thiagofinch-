/**
 * Health Monitor - Tracks component health and triggers recovery
 * @module core/orchestration/health-monitor
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * HealthMonitor - Monitors component health and triggers self-healing
 */
class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'monitor';
    this.components = new Map(); // componentId -> health status

    this.checkIntervalMs = options.checkIntervalMs || 5000;
    this.healthyThreshold = options.healthyThreshold || 0.8; // 80% success rate
    this.degradedThreshold = options.degradedThreshold || 0.5; // 50% success rate
    this.criticalThreshold = options.criticalThreshold || 0.2; // 20% success rate

    this.checkInterval = null;
    this.monitoringActive = false;

    this.stats = {
      checksPerformed: 0,
      componentsChecked: 0,
      issuesDetected: 0,
      recoveryTriggered: 0
    };

    this.healthHistory = [];
    this.maxHistory = options.maxHistory || 1000;
  }

  /**
   * Register component for monitoring
   */
  registerComponent(componentId, options = {}) {
    const component = {
      id: componentId,
      name: options.name || componentId,
      status: 'HEALTHY',
      successCount: 0,
      failureCount: 0,
      lastCheckTime: null,
      lastErrorTime: null,
      lastError: null,
      checkCount: 0,
      successRate: 1.0,
      recoveryAttempts: 0,
      lastRecoveryTime: null
    };

    this.components.set(componentId, component);
    this.emit('component-registered', component);
    return component;
  }

  /**
   * Start health monitoring
   */
  start() {
    if (this.monitoringActive) {
      return;
    }

    this.monitoringActive = true;
    this.checkInterval = setInterval(() => {
      this._performHealthChecks();
    }, this.checkIntervalMs);

    this.emit('monitoring-started', { timestamp: Date.now() });
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (!this.monitoringActive) {
      return;
    }

    this.monitoringActive = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.emit('monitoring-stopped', { timestamp: Date.now() });
  }

  /**
   * Record component health check result
   */
  recordCheck(componentId, success, errorMessage = null) {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    component.checkCount++;
    component.lastCheckTime = Date.now();

    if (success) {
      component.successCount++;
    } else {
      component.failureCount++;
      component.lastErrorTime = Date.now();
      component.lastError = errorMessage;
    }

    component.successRate = component.successCount / component.checkCount;
    this._updateComponentStatus(componentId);

    this.stats.checksPerformed++;
  }

  /**
   * Perform health checks for all components
   */
  _performHealthChecks() {
    for (const [componentId, component] of this.components) {
      this.stats.componentsChecked++;

      // Record current status
      this._recordHealthSnapshot(componentId, component);

      // Assess health
      const oldStatus = component.status;
      this._updateComponentStatus(componentId);

      if (oldStatus !== component.status) {
        this.emit('status-changed', {
          componentId,
          oldStatus,
          newStatus: component.status,
          successRate: component.successRate
        });
      }
    }

    this.stats.checksPerformed++;
  }

  /**
   * Update component status based on success rate
   */
  _updateComponentStatus(componentId) {
    const component = this.components.get(componentId);
    if (!component) return;

    let newStatus;
    if (component.successRate >= this.healthyThreshold) {
      newStatus = 'HEALTHY';
    } else if (component.successRate >= this.degradedThreshold) {
      newStatus = 'DEGRADED';
      this.stats.issuesDetected++;
    } else if (component.successRate >= this.criticalThreshold) {
      newStatus = 'CRITICAL';
      this.stats.issuesDetected++;
    } else {
      newStatus = 'FAILED';
      this.stats.issuesDetected++;
    }

    component.status = newStatus;
  }

  /**
   * Record health snapshot
   */
  _recordHealthSnapshot(componentId, component) {
    this.healthHistory.push({
      timestamp: Date.now(),
      componentId,
      status: component.status,
      successRate: component.successRate,
      successCount: component.successCount,
      failureCount: component.failureCount
    });

    if (this.healthHistory.length > this.maxHistory) {
      this.healthHistory.shift();
    }
  }

  /**
   * Trigger recovery for component
   */
  triggerRecovery(componentId, escalationLevel = 1) {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    component.recoveryAttempts++;
    component.lastRecoveryTime = Date.now();
    this.stats.recoveryTriggered++;

    this.emit('recovery-triggered', {
      componentId,
      component: component.name,
      escalationLevel,
      recoveryAttempts: component.recoveryAttempts,
      timestamp: Date.now()
    });

    return escalationLevel;
  }

  /**
   * Get component health
   */
  getComponentHealth(componentId) {
    const component = this.components.get(componentId);
    if (!component) {
      return null;
    }

    return {
      id: component.id,
      name: component.name,
      status: component.status,
      successRate: Math.round(component.successRate * 100) / 100,
      successCount: component.successCount,
      failureCount: component.failureCount,
      checkCount: component.checkCount,
      lastCheckTime: component.lastCheckTime,
      lastErrorTime: component.lastErrorTime,
      lastError: component.lastError,
      recoveryAttempts: component.recoveryAttempts
    };
  }

  /**
   * Get all components health
   */
  getAllHealth() {
    const components = [];
    for (const [componentId, component] of this.components) {
      components.push(this.getComponentHealth(componentId));
    }
    return components;
  }

  /**
   * Get health summary
   */
  getHealthSummary() {
    const summary = {
      timestamp: Date.now(),
      totalComponents: this.components.size,
      byStatus: {
        HEALTHY: 0,
        DEGRADED: 0,
        CRITICAL: 0,
        FAILED: 0
      },
      components: []
    };

    for (const [componentId, component] of this.components) {
      summary.byStatus[component.status] = (summary.byStatus[component.status] || 0) + 1;
      summary.components.push({
        id: componentId,
        name: component.name,
        status: component.status,
        successRate: Math.round(component.successRate * 100) / 100
      });
    }

    summary.overallHealth = this._calculateOverallHealth();
    return summary;
  }

  /**
   * Calculate overall health
   */
  _calculateOverallHealth() {
    if (this.components.size === 0) {
      return 'UNKNOWN';
    }

    let totalSuccessRate = 0;
    for (const [, component] of this.components) {
      totalSuccessRate += component.successRate;
    }

    const avgSuccessRate = totalSuccessRate / this.components.size;
    if (avgSuccessRate >= this.healthyThreshold) return 'HEALTHY';
    if (avgSuccessRate >= this.degradedThreshold) return 'DEGRADED';
    if (avgSuccessRate >= this.criticalThreshold) return 'CRITICAL';
    return 'FAILED';
  }

  /**
   * Get health history
   */
  getHealthHistory(componentId = null, timeWindowMs = 300000) {
    const cutoff = Date.now() - timeWindowMs;
    let history = this.healthHistory.filter(h => h.timestamp >= cutoff);

    if (componentId) {
      history = history.filter(h => h.componentId === componentId);
    }

    return history;
  }

  /**
   * Reset component stats
   */
  resetComponent(componentId) {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    component.successCount = 0;
    component.failureCount = 0;
    component.checkCount = 0;
    component.successRate = 1.0;
    component.status = 'HEALTHY';

    this.emit('component-reset', { componentId });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      monitoringActive: this.monitoringActive,
      totalComponents: this.components.size,
      healthHistorySize: this.healthHistory.length
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.components.clear();
    this.healthHistory = [];
    this.stats = {
      checksPerformed: 0,
      componentsChecked: 0,
      issuesDetected: 0,
      recoveryTriggered: 0
    };
  }
}

module.exports = HealthMonitor;
