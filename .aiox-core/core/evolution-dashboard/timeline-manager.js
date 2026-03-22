'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Timeline Manager -- Stores and retrieves historical repository snapshots
 *
 * Manages:
 * - Snapshot storage with timestamps
 * - Historical data queries and filtering
 * - Delta calculations between snapshots
 * - Trend analysis over time periods
 *
 * @class TimelineManager
 * @version 2.0.0
 * @story 2.4
 */
class TimelineManager {
  /**
   * @param {Object} options Configuration
   * @param {string} options.dataDir Storage directory for snapshots
   */
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), '.aiox/evolution-data');
    this._ensureDataDir();
  }

  /**
   * Ensure data directory exists
   * @private
   */
  _ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Store snapshot with timestamp
   * @param {string} repoName Repository name
   * @param {Object} data Snapshot data
   * @returns {string} Snapshot ID
   */
  storeSnapshot(repoName, data) {
    if (!repoName || !data) {
      throw new Error('Repository name and data required');
    }

    const timestamp = new Date().toISOString();
    const snapshotId = `${repoName}-${Date.now()}`;
    const snapshotFile = path.join(this.dataDir, `${snapshotId}.json`);

    const snapshot = {
      id: snapshotId,
      repo: repoName,
      timestamp,
      data,
      metrics: this._extractMetrics(data),
    };

    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
    return snapshotId;
  }

  /**
   * Get snapshot by ID
   * @param {string} snapshotId Snapshot ID
   * @returns {Object} Snapshot data
   */
  getSnapshot(snapshotId) {
    const filePath = path.join(this.dataDir, `${snapshotId}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  /**
   * Get snapshots for repository
   * @param {string} repoName Repository name
   * @param {Object} options Query options
   * @param {number} options.limit Max results (default 100)
   * @param {number} options.days Filter to last N days (default 30)
   * @returns {Array} Snapshots sorted newest first
   */
  getSnapshots(repoName, options = {}) {
    const limit = options.limit || 100;
    const days = options.days || 30;

    const files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const snapshots = files
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf8'));
        } catch (_e) {
          return null;
        }
      })
      .filter((s) => s && s.repo === repoName && new Date(s.timestamp).getTime() > cutoffDate)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return snapshots;
  }

  /**
   * Get all snapshots for a repository as timeline
   * @param {string} repoName Repository name
   * @param {Object} options Query options
   * @returns {Array} Snapshots sorted by timestamp
   */
  getTimeline(repoName, options = {}) {
    const { limit = 100, order = 'desc' } = options;
    const files = fs.readdirSync(this.dataDir).filter((f) => f.startsWith(repoName) && f.endsWith('.json'));

    const snapshots = files.map((file) => {
      const filePath = path.join(this.dataDir, file);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    });

    snapshots.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return order === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return snapshots.slice(0, limit);
  }

  /**
   * Get latest snapshot for repository
   * @param {string} repoName Repository name
   * @returns {Object|null} Latest snapshot or null
   */
  getLatestSnapshot(repoName) {
    const snapshots = this.getSnapshots(repoName, { limit: 1 });
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  /**
   * Calculate delta between two snapshots
   * @param {string} snapshotId1 First snapshot ID
   * @param {string} snapshotId2 Second snapshot ID (newer)
   * @returns {Object} Delta metrics
   */
  calculateDelta(snapshotId1, snapshotId2) {
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
  }

  /**
   * Get trend for a specific metric over time
   * @param {string} repoName Repository name
   * @param {string} metricName Metric name (healthScore, testCoverage, etc)
   * @param {number} days Number of days to analyze
   * @returns {Array} Metric values over time [{timestamp, value}]
   */
  getMetricTrend(repoName, metricName, days = 30) {
    const timeline = this.getTimeline(repoName, { limit: 1000, order: 'asc' });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return timeline
      .filter((snap) => new Date(snap.timestamp) >= cutoffDate)
      .map((snap) => ({
        timestamp: snap.timestamp,
        value: snap.metrics[metricName] || null,
      }));
  }

  /**
   * Analyze trend direction and velocity
   * @param {Array} trend Metric trend array [{timestamp, value}]
   * @returns {Object} Trend analysis
   */
  analyzeTrend(trend) {
    if (trend.length < 2) {
      return { direction: 'insufficient_data', velocity: 0 };
    }

    const values = trend.map((t) => t.value).filter((v) => v !== null);
    if (values.length < 2) {
      return { direction: 'insufficient_data', velocity: 0 };
    }

    const first = values[0];
    const last = values[values.length - 1];
    const delta = last - first;
    const velocity = delta / (values.length - 1);

    let direction = 'stable';
    if (velocity > 0.1) {
      direction = 'improving';
    }
    if (velocity < -0.1) {
      direction = 'declining';
    }

    return {
      direction,
      velocity: Math.round(velocity * 100) / 100,
      totalDelta: Math.round(delta * 100) / 100,
      firstValue: first,
      lastValue: last,
      dataPoints: values.length,
    };
  }

  /**
   * Calculate trend between snapshots (simple)
   * @param {Array} snapshots Snapshots array
   * @returns {Object} Trend data
   */
  calculateTrend(snapshots) {
    if (snapshots.length < 2) {
      return { status: 'insufficient_data', current: null, previous: null };
    }

    const current = snapshots[0].data;
    const previous = snapshots[snapshots.length - 1].data;

    const currentMetrics = current.metrics || {};
    const previousMetrics = previous.metrics || {};

    const currentCoverage = currentMetrics.testCoverage || 0;
    const previousCoverage = previousMetrics.testCoverage || 0;

    const currentQuality = currentMetrics.codeQuality || 0;
    const previousQuality = previousMetrics.codeQuality || 0;

    return {
      status: 'ok',
      period: {
        from: snapshots[snapshots.length - 1].timestamp,
        to: snapshots[0].timestamp,
        days: Math.ceil(
          (new Date(snapshots[0].timestamp) - new Date(snapshots[snapshots.length - 1].timestamp)) /
            (1000 * 60 * 60 * 24)
        ),
      },
      coverage: {
        current: currentCoverage,
        previous: previousCoverage,
        change: currentCoverage - previousCoverage,
        trend: currentCoverage > previousCoverage ? 'improving' : 'declining',
      },
      quality: {
        current: currentQuality,
        previous: previousQuality,
        change: currentQuality - previousQuality,
        trend: currentQuality > previousQuality ? 'improving' : 'declining',
      },
      fileCount: {
        current: current.summary?.totalFiles || 0,
        previous: previous.summary?.totalFiles || 0,
        change: (current.summary?.totalFiles || 0) - (previous.summary?.totalFiles || 0),
      },
    };
  }

  /**
   * Compare two time periods
   * @param {string} repoName Repository name
   * @param {number} period1Days First period in days
   * @param {number} period2Days Second period in days
   * @returns {Object} Period comparison
   */
  comparePeriods(repoName, period1Days = 7, period2Days = 7) {
    const timeline = this.getTimeline(repoName, { limit: 1000, order: 'asc' });
    const now = new Date();

    const period2Start = new Date(now);
    period2Start.setDate(period2Start.getDate() - period2Days);

    const period1Start = new Date(period2Start);
    period1Start.setDate(period1Start.getDate() - period1Days);

    const period1 = timeline.filter((snap) => {
      const snapDate = new Date(snap.timestamp);
      return snapDate >= period1Start && snapDate < period2Start;
    });

    const period2 = timeline.filter((snap) => {
      const snapDate = new Date(snap.timestamp);
      return snapDate >= period2Start && snapDate <= now;
    });

    const avg = (arr, key) => {
      if (arr.length === 0) {
        return 0;
      }
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
  }

  /**
   * Get all repository names
   * @returns {Array<string>} Repository names
   */
  getRepositories() {
    const files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));
    const repos = new Set(
      files.map((f) => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf8'));
          return content.repo;
        } catch (_e) {
          return null;
        }
      }).filter(Boolean)
    );
    return Array.from(repos);
  }

  /**
   * Delete old snapshots beyond retention period
   * @param {number} daysToKeep Days to keep (default 90)
   * @returns {number} Number deleted
   */
  pruneOldSnapshots(daysToKeep = 90) {
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));

    let deleted = 0;
    files.forEach((f) => {
      const filePath = path.join(this.dataDir, f);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoffDate) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * Extract metrics from snapshot data
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
}

module.exports = { TimelineManager };
