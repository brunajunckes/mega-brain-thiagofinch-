/**
 * Performance Profiler - Measure and baseline orchestration performance
 * @module core/orchestration/performance-profiler
 * @version 1.0.0
 *
 * Captures performance metrics for:
 * - Task execution time
 * - Memory usage
 * - Gate validation time
 * - Retry overhead
 * - Checkpoint I/O
 * - Rollback operations
 */

const os = require('os');

/**
 * Performance Profiler - Track timing and memory metrics
 */
class PerformanceProfiler {
  constructor(options = {}) {
    this.metrics = [];
    this.enabled = options.enabled ?? true;
    this.sampleRate = options.sampleRate ?? 1.0; // 0-1
    this.targets = {
      taskExecution: options.taskExecutionTarget || 500, // ms
      gateValidation: options.gateValidationTarget || 100, // ms
      checkpoint: options.checkpointTarget || 50, // ms
      retry: options.retryTarget || 10, // ms per attempt
    };
  }

  /**
   * Start measuring a named operation
   * @returns {Function} Stop function
   */
  startMeasure(operationName, context = {}) {
    if (!this.enabled || Math.random() > this.sampleRate) {
      return () => {}; // No-op if disabled
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    return (additionalContext = {}) => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const metric = {
        operationName,
        context: { ...context, ...additionalContext },
        timestamp: new Date().toISOString(),
        timing: {
          duration: endTime - startTime,
          startTime,
          endTime,
        },
        memory: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
        },
        systemLoad: os.loadavg(),
        cpuUsage: process.cpuUsage(),
      };

      this.metrics.push(metric);
      return metric;
    };
  }

  /**
   * Measure function execution
   */
  async measureAsync(operationName, asyncFn, context = {}) {
    const stop = this.startMeasure(operationName, context);
    try {
      const result = await asyncFn();
      stop({ success: true });
      return result;
    } catch (error) {
      stop({ success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Get baseline metrics from collected data
   */
  getBaseline() {
    if (this.metrics.length === 0) {
      return null;
    }

    const byOperation = {};
    for (const metric of this.metrics) {
      if (!byOperation[metric.operationName]) {
        byOperation[metric.operationName] = [];
      }
      byOperation[metric.operationName].push(metric);
    }

    const baseline = {};
    for (const [op, metrics] of Object.entries(byOperation)) {
      const durations = metrics.map(m => m.timing.duration);
      durations.sort((a, b) => a - b);

      baseline[op] = {
        count: metrics.length,
        min: durations[0],
        max: durations[durations.length - 1],
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        p50: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
        target: this.targets[op.replace(/[A-Z]/g, m => '_' + m.toLowerCase()).substring(1)] || null,
        meetsTarget: durations[Math.floor(durations.length * 0.95)] <= (this.targets[op.replace(/[A-Z]/g, m => '_' + m.toLowerCase()).substring(1)] || Infinity),
      };
    }

    return baseline;
  }

  /**
   * Check if metrics meet performance targets
   */
  validatePerformance(p95Threshold = 0.95) {
    const baseline = this.getBaseline();
    if (!baseline) {
      return { valid: true, issues: [] };
    }

    const issues = [];
    for (const [op, data] of Object.entries(baseline)) {
      if (data.target && data.p95 > data.target) {
        issues.push({
          operation: op,
          metric: 'p95',
          actual: data.p95,
          target: data.target,
          exceedance: data.p95 - data.target,
          percentOver: ((data.p95 / data.target - 1) * 100).toFixed(2),
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const baseline = this.getBaseline();
    if (!baseline) {
      return { status: 'no_data', metrics: {} };
    }

    const validation = this.validatePerformance();

    return {
      status: validation.valid ? 'pass' : 'fail',
      timestamp: new Date().toISOString(),
      totalSamples: this.metrics.length,
      operationCounts: Object.fromEntries(
        Object.entries(baseline).map(([op, data]) => [op, data.count])
      ),
      metrics: baseline,
      validation,
      summary: {
        topSlowest: this.getTopSlowest(5),
        operationOverhead: this.calculateOperationOverhead(),
        memoryProfile: this.analyzeMemoryUsage(),
      },
    };
  }

  /**
   * Get top slowest operations
   */
  getTopSlowest(limit = 5) {
    const sorted = [...this.metrics].sort((a, b) => b.timing.duration - a.timing.duration);
    return sorted.slice(0, limit).map(m => ({
      operation: m.operationName,
      duration: m.timing.duration.toFixed(2),
      timestamp: m.timestamp,
      context: m.context,
    }));
  }

  /**
   * Calculate operation overhead percentages
   */
  calculateOperationOverhead() {
    const baseline = this.getBaseline();
    if (!baseline) return {};

    const totalTime = Object.values(baseline).reduce((sum, data) => sum + data.avg * data.count, 0);
    const overhead = {};

    for (const [op, data] of Object.entries(baseline)) {
      overhead[op] = {
        totalTime: (data.avg * data.count).toFixed(2),
        percentage: ((data.avg * data.count / totalTime) * 100).toFixed(2),
        avgPerCall: data.avg.toFixed(2),
      };
    }

    return overhead;
  }

  /**
   * Analyze memory usage patterns
   */
  analyzeMemoryUsage() {
    if (this.metrics.length === 0) {
      return { status: 'no_data' };
    }

    const memoryPoints = this.metrics.map(m => m.memory.heapUsed);
    memoryPoints.sort((a, b) => a - b);

    return {
      min: (memoryPoints[0] / 1024 / 1024).toFixed(2), // MB
      max: (memoryPoints[memoryPoints.length - 1] / 1024 / 1024).toFixed(2),
      avg: (memoryPoints.reduce((a, b) => a + b, 0) / memoryPoints.length / 1024 / 1024).toFixed(2),
      p95: (memoryPoints[Math.floor(memoryPoints.length * 0.95)] / 1024 / 1024).toFixed(2),
      unit: 'MB',
    };
  }

  /**
   * Get metrics for specific operation
   */
  getMetricsForOperation(operationName) {
    return this.metrics.filter(m => m.operationName === operationName);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Get raw metrics
   */
  getRawMetrics() {
    return [...this.metrics];
  }

  /**
   * Export metrics as JSON
   */
  exportJSON() {
    return {
      baseline: this.getBaseline(),
      report: this.generateReport(),
      rawMetrics: this.metrics.length <= 1000 ? this.metrics : this.metrics.slice(-1000),
    };
  }
}

module.exports = PerformanceProfiler;
