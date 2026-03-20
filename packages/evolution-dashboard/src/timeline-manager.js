'use strict';

const fs = require('fs');
const path = require('path');

/**
 * TimelineManager — Store and retrieve historical repository snapshots
 *
 * Manages:
 * - Snapshot storage with timestamps
 * - Historical data queries
 * - Delta calculations between snapshots
 *
 * @class TimelineManager
 * @version 1.0.0
 * @story 2.4 Phase 1
 */
class TimelineManager {
  /**
   * Create timeline manager
   * @param {Object} options Configuration
   * @param {string} options.storageDir Storage directory for snapshots
   */
  constructor(options = {}) {
    this.storageDir = options.storageDir || path.join(process.cwd(), '.evolution-timeline');
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   * @private
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Store repository snapshot with timestamp
   * @param {string} repoName Repository name
   * @param {Object} snapshot Repository snapshot data
   * @returns {string} Snapshot ID
   */
  storeSnapshot(repoName, snapshot) {
    try {
      const timestamp = new Date().toISOString();
      const snapshotId = `${repoName}-${Date.now()}`;

      const snapshotData = {
        id: snapshotId,
        repo: repoName,
        timestamp,
        data: snapshot,
        metrics: this._extractMetrics(snapshot),
      };

      const filePath = path.join(this.storageDir, `${snapshotId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(snapshotData, null, 2));

      return snapshotId;
    } catch (error) {
      throw new Error(`Failed to store snapshot for ${repoName}: ${error.message}`);
    }
  }

  /**
   * Get snapshot by ID
   * @param {string} snapshotId Snapshot ID
   * @returns {Object} Snapshot data
   */
  getSnapshot(snapshotId) {
    try {
      const filePath = path.join(this.storageDir, `${snapshotId}.json`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to retrieve snapshot: ${error.message}`);
    }
  }

  /**
   * Get all snapshots for a repository
   * @param {string} repoName Repository name
   * @param {Object} options Query options
   * @returns {Array} Snapshots sorted by timestamp
   */
  getTimeline(repoName, options = {}) {
    try {
      const { limit = 100, order = 'desc' } = options;
      const files = fs.readdirSync(this.storageDir).filter(f => f.startsWith(repoName));

      const snapshots = files.map((file) => {
        const filePath = path.join(this.storageDir, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      });

      // Sort by timestamp
      snapshots.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return order === 'asc' ? timeA - timeB : timeB - timeA;
      });

      return snapshots.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to retrieve timeline for ${repoName}: ${error.message}`);
    }
  }

  /**
   * Calculate delta between two snapshots
   * @param {string} snapshotId1 First snapshot ID
   * @param {string} snapshotId2 Second snapshot ID (newer)
   * @returns {Object} Delta metrics
   */
  calculateDelta(snapshotId1, snapshotId2) {
    try {
      const snap1 = this.getSnapshot(snapshotId1);
      const snap2 = this.getSnapshot(snapshotId2);

      const metrics1 = snap1.metrics;
      const metrics2 = snap2.metrics;

      return {
        timeRange: {
          from: snap1.timestamp,
          to: snap2.timestamp,
        },
        healthScore: {
          from: metrics1.healthScore,
          to: metrics2.healthScore,
          delta: metrics2.healthScore - metrics1.healthScore,
          direction: metrics2.healthScore > metrics1.healthScore ? 'improving' : 'declining',
        },
        testCoverage: {
          from: metrics1.testCoverage,
          to: metrics2.testCoverage,
          delta: metrics2.testCoverage - metrics1.testCoverage,
        },
        codeQuality: {
          from: metrics1.codeQuality,
          to: metrics2.codeQuality,
          delta: metrics2.codeQuality - metrics1.codeQuality,
        },
        debtLevel: {
          from: metrics1.debtLevel,
          to: metrics2.debtLevel,
          changed: metrics1.debtLevel !== metrics2.debtLevel,
        },
        filesChanged: {
          from: metrics1.totalFiles,
          to: metrics2.totalFiles,
          delta: metrics2.totalFiles - metrics1.totalFiles,
        },
      };
    } catch (error) {
      throw new Error(`Failed to calculate delta: ${error.message}`);
    }
  }

  /**
   * Get trend for a specific metric over time
   * @param {string} repoName Repository name
   * @param {string} metricName Metric name (healthScore, testCoverage, etc)
   * @param {number} days Number of days to analyze
   * @returns {Array} Metric values over time
   */
  getMetricTrend(repoName, metricName, days = 30) {
    try {
      const timeline = this.getTimeline(repoName, { limit: 1000, order: 'asc' });
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return timeline
        .filter(snap => new Date(snap.timestamp) >= cutoffDate)
        .map(snap => ({
          timestamp: snap.timestamp,
          value: snap.metrics[metricName] || null,
        }));
    } catch (error) {
      throw new Error(`Failed to get trend for ${metricName}: ${error.message}`);
    }
  }

  /**
   * Calculate trend direction and velocity
   * @param {Array} trend Metric trend array
   * @returns {Object} Trend analysis
   */
  analyzeTrend(trend) {
    try {
      if (trend.length < 2) {
        return { direction: 'insufficient_data', velocity: 0 };
      }

      const values = trend.map(t => t.value).filter(v => v !== null);
      if (values.length < 2) {
        return { direction: 'insufficient_data', velocity: 0 };
      }

      const first = values[0];
      const last = values[values.length - 1];
      const delta = last - first;
      const velocity = delta / (values.length - 1);

      let direction = 'stable';
      if (velocity > 0.1) direction = 'improving';
      if (velocity < -0.1) direction = 'declining';

      return {
        direction,
        velocity: Math.round(velocity * 100) / 100,
        totalDelta: Math.round(delta * 100) / 100,
        firstValue: first,
        lastValue: last,
        dataPoints: values.length,
      };
    } catch (error) {
      throw new Error(`Failed to analyze trend: ${error.message}`);
    }
  }

  /**
   * Get comparison between two time periods
   * @param {string} repoName Repository name
   * @param {number} period1Days First period in days
   * @param {number} period2Days Second period in days
   * @returns {Object} Period comparison
   */
  comparePeriods(repoName, period1Days = 7, period2Days = 7) {
    try {
      const timeline = this.getTimeline(repoName, { limit: 1000, order: 'asc' });
      const now = new Date();

      // Get date ranges
      const period2Start = new Date(now);
      period2Start.setDate(period2Start.getDate() - period2Days);

      const period1Start = new Date(period2Start);
      period1Start.setDate(period1Start.getDate() - period1Days);

      // Filter snapshots
      const period1 = timeline.filter((snap) => {
        const snapDate = new Date(snap.timestamp);
        return snapDate >= period1Start && snapDate < period2Start;
      });

      const period2 = timeline.filter((snap) => {
        const snapDate = new Date(snap.timestamp);
        return snapDate >= period2Start && snapDate <= now;
      });

      const avg = (arr, key) => {
        if (arr.length === 0) return 0;
        const sum = arr.reduce((acc, snap) => acc + (snap.metrics[key] || 0), 0);
        return sum / arr.length;
      };

      return {
        period1: {
          days: period1Days,
          snapshots: period1.length,
          avgHealthScore: Math.round(avg(period1, 'healthScore') * 100) / 100,
          avgTestCoverage: Math.round(avg(period1, 'testCoverage') * 100) / 100,
        },
        period2: {
          days: period2Days,
          snapshots: period2.length,
          avgHealthScore: Math.round(avg(period2, 'healthScore') * 100) / 100,
          avgTestCoverage: Math.round(avg(period2, 'testCoverage') * 100) / 100,
        },
        improvement: {
          healthScore: Math.round((avg(period2, 'healthScore') - avg(period1, 'healthScore')) * 100) / 100,
          testCoverage: Math.round((avg(period2, 'testCoverage') - avg(period1, 'testCoverage')) * 100) / 100,
        },
      };
    } catch (error) {
      throw new Error(`Failed to compare periods: ${error.message}`);
    }
  }

  /**
   * Extract metrics from snapshot
   * @private
   */
  _extractMetrics(snapshot) {
    return {
      healthScore: snapshot.healthScore || 5,
      testCoverage: snapshot.metrics?.testCoverage || 0,
      codeQuality: snapshot.metrics?.codeQuality || 0,
      debtLevel: snapshot.debtLevel || 'unknown',
      totalFiles: snapshot.stats?.totalFiles || 0,
      totalLines: snapshot.stats?.totalLines || 0,
    };
  }

  /**
   * Clear old snapshots beyond retention period
   * @param {number} retentionDays Days to retain
   * @returns {number} Number of deleted snapshots
   */
  pruneOldSnapshots(retentionDays = 90) {
    try {
      const files = fs.readdirSync(this.storageDir);
      let deletedCount = 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      files.forEach((file) => {
        const filePath = path.join(this.storageDir, file);
        const snapshot = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (new Date(snapshot.timestamp) < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount += 1;
        }
      });

      return deletedCount;
    } catch (error) {
      throw new Error(`Failed to prune snapshots: ${error.message}`);
    }
  }
}

module.exports = TimelineManager;
