/**
 * Anomaly Detector - Detects error spikes and latency increases
 * @module core/orchestration/anomaly-detector
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * AnomalyDetector - Detects anomalies in component metrics
 */
class AnomalyDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'anomaly-detector';
    this.windowSizeMs = options.windowSizeMs || 60000; // 1 minute window
    this.spikeThreshold = options.spikeThreshold || 2.0; // 2x baseline
    this.latencyThreshold = options.latencyThreshold || 5000; // 5 seconds
    this.minDataPointsForBaseline = options.minDataPointsForBaseline || 10;

    // Metric collections per component
    this.metrics = new Map(); // componentId -> metrics data
    this.baselines = new Map(); // componentId -> baseline stats
    this.anomalyHistory = [];
    this.maxHistory = options.maxHistory || 1000;

    this.stats = {
      anomaliesDetected: 0,
      falsePositives: 0,
      spikeAnomalies: 0,
      latencyAnomalies: 0
    };
  }

  /**
   * Record error rate metric
   */
  recordErrorRate(componentId, errorRate, timestamp = Date.now()) {
    if (!this.metrics.has(componentId)) {
      this.metrics.set(componentId, { errors: [], latencies: [] });
    }

    const componentMetrics = this.metrics.get(componentId);
    componentMetrics.errors.push({ value: errorRate, timestamp });

    // Keep only data within window
    this._pruneOldData(componentMetrics.errors, timestamp);

    this._checkForErrorSpike(componentId, errorRate, timestamp);
  }

  /**
   * Record latency metric
   */
  recordLatency(componentId, latencyMs, timestamp = Date.now()) {
    if (!this.metrics.has(componentId)) {
      this.metrics.set(componentId, { errors: [], latencies: [] });
    }

    const componentMetrics = this.metrics.get(componentId);
    componentMetrics.latencies.push({ value: latencyMs, timestamp });

    // Keep only data within window
    this._pruneOldData(componentMetrics.latencies, timestamp);

    this._checkForLatencySpike(componentId, latencyMs, timestamp);
  }

  /**
   * Check for error rate spike
   */
  _checkForErrorSpike(componentId, currentErrorRate, timestamp) {
    const baseline = this._getOrUpdateBaseline(componentId, 'errorRate');
    if (!baseline) return; // Not enough data yet

    // Error spike = sudden increase from baseline
    if (currentErrorRate > baseline.mean + (baseline.stdDev * 2)) {
      this.stats.spikeAnomalies++;
      this.stats.anomaliesDetected++;

      this._recordAnomaly({
        componentId,
        type: 'ERROR_SPIKE',
        severity: this._calculateSeverity(currentErrorRate, baseline),
        value: currentErrorRate,
        baseline: baseline.mean,
        timestamp
      });

      this.emit('anomaly-detected', {
        componentId,
        type: 'ERROR_SPIKE',
        severity: this._calculateSeverity(currentErrorRate, baseline),
        currentValue: currentErrorRate,
        baseline: baseline.mean,
        timestamp
      });
    }
  }

  /**
   * Check for latency spike
   */
  _checkForLatencySpike(componentId, currentLatency, timestamp) {
    const baseline = this._getOrUpdateBaseline(componentId, 'latency');
    if (!baseline) return; // Not enough data yet

    // Latency spike = increase above threshold or 2x baseline
    const isAboveThreshold = currentLatency > this.latencyThreshold;
    const isAboveBaseline = currentLatency > baseline.mean * this.spikeThreshold;

    if (isAboveThreshold || isAboveBaseline) {
      this.stats.latencyAnomalies++;
      this.stats.anomaliesDetected++;

      this._recordAnomaly({
        componentId,
        type: 'LATENCY_SPIKE',
        severity: this._calculateLatencySeverity(currentLatency, baseline),
        value: currentLatency,
        baseline: baseline.mean,
        threshold: this.latencyThreshold,
        timestamp
      });

      this.emit('anomaly-detected', {
        componentId,
        type: 'LATENCY_SPIKE',
        severity: this._calculateLatencySeverity(currentLatency, baseline),
        currentValue: currentLatency,
        baseline: baseline.mean,
        threshold: this.latencyThreshold,
        timestamp
      });
    }
  }

  /**
   * Get or update baseline statistics
   */
  _getOrUpdateBaseline(componentId, metricType) {
    const key = `${componentId}:${metricType}`;
    if (!this.baselines.has(key)) {
      this.baselines.set(key, { mean: null, stdDev: null, count: 0 });
    }

    const metrics = this.metrics.get(componentId);
    if (!metrics) return null;

    const dataPoints = metricType === 'errorRate' ? metrics.errors : metrics.latencies;
    if (dataPoints.length < this.minDataPointsForBaseline) {
      return null; // Not enough data
    }

    const baseline = this.baselines.get(key);
    const values = dataPoints.map(d => d.value);

    // Calculate mean and standard deviation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    baseline.mean = mean;
    baseline.stdDev = stdDev;
    baseline.count = values.length;

    return baseline;
  }

  /**
   * Calculate severity for error spike
   */
  _calculateSeverity(currentValue, baseline) {
    const ratio = currentValue / baseline.mean;
    if (ratio > 5) return 'CRITICAL';
    if (ratio > 3) return 'HIGH';
    if (ratio > 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate severity for latency spike
   */
  _calculateLatencySeverity(currentLatency, baseline) {
    if (currentLatency > this.latencyThreshold * 2) return 'CRITICAL';
    if (currentLatency > this.latencyThreshold) return 'HIGH';
    if (currentLatency > baseline.mean * this.spikeThreshold) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Record anomaly in history
   */
  _recordAnomaly(anomaly) {
    this.anomalyHistory.push(anomaly);
    if (this.anomalyHistory.length > this.maxHistory) {
      this.anomalyHistory.shift();
    }
  }

  /**
   * Remove data points older than window
   */
  _pruneOldData(dataArray, currentTime) {
    const cutoff = currentTime - this.windowSizeMs;
    while (dataArray.length > 0 && dataArray[0].timestamp < cutoff) {
      dataArray.shift();
    }
  }

  /**
   * Get anomaly statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalAnomalies: this.anomalyHistory.length,
      avgAnomalyRate: this.stats.anomaliesDetected / Math.max(1, this.anomalyHistory.length)
    };
  }

  /**
   * Get anomalies for component
   */
  getAnomalies(componentId, timeWindowMs = 3600000) {
    const cutoff = Date.now() - timeWindowMs;
    return this.anomalyHistory.filter(a => a.componentId === componentId && a.timestamp >= cutoff);
  }

  /**
   * Reset detector
   */
  reset() {
    this.metrics.clear();
    this.baselines.clear();
    this.anomalyHistory = [];
    this.stats = {
      anomaliesDetected: 0,
      falsePositives: 0,
      spikeAnomalies: 0,
      latencyAnomalies: 0
    };
  }
}

module.exports = AnomalyDetector;
