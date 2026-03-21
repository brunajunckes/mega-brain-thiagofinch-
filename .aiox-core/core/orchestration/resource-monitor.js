/**
 * Resource Monitor - Tracks and reports on resource usage metrics
 * @module core/orchestration/resource-monitor
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * ResourceMonitor - Monitors resource usage and provides metrics
 */
class ResourceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.allocator = options.allocator;
    this.checkIntervalMs = options.checkIntervalMs || 1000;

    this.metrics = {
      cpuUtilization: [], // array of percentage samples
      memoryUtilization: [], // array of percentage samples
      taskConcurrency: [], // array of active task counts
      timeouts: [], // array of timeout events
      errors: [] // array of errors
    };

    this.maxSamples = options.maxSamples || 3600; // 1 hour at 1s intervals
    this.thresholds = {
      cpuWarn: options.cpuWarnThreshold || 70,
      cpuCritical: options.cpuCriticalThreshold || 90,
      memoryWarn: options.memoryWarnThreshold || 70,
      memoryCritical: options.memoryCriticalThreshold || 90
    };

    this.alerts = [];
    this.monitoringActive = false;
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.monitoringActive) {
      return;
    }

    this.monitoringActive = true;
    this.monitorInterval = setInterval(() => {
      this._collectMetrics();
    }, this.checkIntervalMs);

    this.emit('monitoring-started', { timestamp: Date.now() });
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.monitoringActive) {
      return;
    }

    this.monitoringActive = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.emit('monitoring-stopped', { timestamp: Date.now() });
  }

  /**
   * Collect metrics sample
   */
  _collectMetrics() {
    if (!this.allocator) {
      return;
    }

    const usage = this.allocator.getWorkerUsage();
    const limits = usage.limits || {};

    // Calculate utilization percentages
    const cpuUtilization = limits.maxCpuMHz ? (usage.cpuMHz / limits.maxCpuMHz) * 100 : 0;
    const memoryUtilization = limits.maxMemoryMB ? (usage.memoryMB / limits.maxMemoryMB) * 100 : 0;

    // Record samples
    this.metrics.cpuUtilization.push({
      timestamp: Date.now(),
      value: cpuUtilization
    });
    this.metrics.memoryUtilization.push({
      timestamp: Date.now(),
      value: memoryUtilization
    });
    this.metrics.taskConcurrency.push({
      timestamp: Date.now(),
      value: usage.activeTasks
    });

    // Trim old samples
    this._trimSamples();

    // Check thresholds
    this._checkThresholds(cpuUtilization, memoryUtilization);
  }

  /**
   * Check utilization thresholds
   */
  _checkThresholds(cpuUtilization, memoryUtilization) {
    // Check CPU
    if (cpuUtilization >= this.thresholds.cpuCritical) {
      this._createAlert('CRITICAL', 'CPU', cpuUtilization);
    } else if (cpuUtilization >= this.thresholds.cpuWarn) {
      this._createAlert('WARNING', 'CPU', cpuUtilization);
    }

    // Check Memory
    if (memoryUtilization >= this.thresholds.memoryCritical) {
      this._createAlert('CRITICAL', 'Memory', memoryUtilization);
    } else if (memoryUtilization >= this.thresholds.memoryWarn) {
      this._createAlert('WARNING', 'Memory', memoryUtilization);
    }
  }

  /**
   * Create alert
   */
  _createAlert(severity, resource, utilization) {
    const alert = {
      timestamp: Date.now(),
      severity,
      resource,
      utilization: Math.round(utilization * 100) / 100
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    this.emit('alert', alert);
  }

  /**
   * Trim old samples
   */
  _trimSamples() {
    for (const key of Object.keys(this.metrics)) {
      if (Array.isArray(this.metrics[key]) && this.metrics[key].length > this.maxSamples) {
        this.metrics[key] = this.metrics[key].slice(-this.maxSamples);
      }
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    const cpuSamples = this.metrics.cpuUtilization;
    const memorySamples = this.metrics.memoryUtilization;
    const taskSamples = this.metrics.taskConcurrency;

    return {
      timestamp: Date.now(),
      cpu: {
        current: cpuSamples.length > 0 ? cpuSamples[cpuSamples.length - 1].value : 0,
        average: this._average(cpuSamples.map(s => s.value)),
        peak: this._max(cpuSamples.map(s => s.value)),
        threshold: this.thresholds
      },
      memory: {
        current: memorySamples.length > 0 ? memorySamples[memorySamples.length - 1].value : 0,
        average: this._average(memorySamples.map(s => s.value)),
        peak: this._max(memorySamples.map(s => s.value)),
        threshold: this.thresholds
      },
      tasks: {
        current: taskSamples.length > 0 ? taskSamples[taskSamples.length - 1].value : 0,
        average: this._average(taskSamples.map(s => s.value)),
        peak: this._max(taskSamples.map(s => s.value))
      }
    };
  }

  /**
   * Get metric history
   */
  getMetricHistory(timeWindowMs = 60000) {
    const cutoff = Date.now() - timeWindowMs;

    return {
      cpu: this.metrics.cpuUtilization.filter(s => s.timestamp >= cutoff),
      memory: this.metrics.memoryUtilization.filter(s => s.timestamp >= cutoff),
      tasks: this.metrics.taskConcurrency.filter(s => s.timestamp >= cutoff),
      timeWindow: timeWindowMs,
      samples: this.metrics.cpuUtilization.filter(s => s.timestamp >= cutoff).length
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 100) {
    return this.alerts.slice(-limit);
  }

  /**
   * Get alert summary
   */
  getAlertSummary() {
    const summary = {
      total: this.alerts.length,
      byResource: {},
      bySeverity: {},
      recent: this.alerts.slice(-10)
    };

    for (const alert of this.alerts) {
      summary.byResource[alert.resource] = (summary.byResource[alert.resource] || 0) + 1;
      summary.bySeverity[alert.severity] = (summary.bySeverity[alert.severity] || 0) + 1;
    }

    return summary;
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const metrics = this.getCurrentMetrics();
    const alerts = this.getAlertSummary();
    const allocatorStats = this.allocator ? this.allocator.getStats() : {};

    return {
      timestamp: Date.now(),
      metrics,
      alerts,
      allocator: allocatorStats,
      status: this._determineStatus(metrics)
    };
  }

  /**
   * Determine overall health status
   */
  _determineStatus(metrics) {
    if (metrics.cpu.current >= this.thresholds.cpuCritical ||
        metrics.memory.current >= this.thresholds.memoryCritical) {
      return 'CRITICAL';
    }

    if (metrics.cpu.current >= this.thresholds.cpuWarn ||
        metrics.memory.current >= this.thresholds.memoryWarn) {
      return 'WARNING';
    }

    return 'HEALTHY';
  }

  /**
   * Record custom metric
   */
  recordMetric(metricName, value) {
    if (!this.metrics[metricName]) {
      this.metrics[metricName] = [];
    }

    this.metrics[metricName].push({
      timestamp: Date.now(),
      value
    });

    if (this.metrics[metricName].length > this.maxSamples) {
      this.metrics[metricName] = this.metrics[metricName].slice(-this.maxSamples);
    }
  }

  /**
   * Clear all data
   */
  clear() {
    this.metrics = {
      cpuUtilization: [],
      memoryUtilization: [],
      taskConcurrency: [],
      timeouts: [],
      errors: []
    };
    this.alerts = [];
  }

  /**
   * Helper: calculate average
   */
  _average(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Helper: find maximum
   */
  _max(values) {
    return values.length > 0 ? Math.max(...values) : 0;
  }

  /**
   * Helper: find minimum
   */
  _min(values) {
    return values.length > 0 ? Math.min(...values) : 0;
  }
}

module.exports = ResourceMonitor;
