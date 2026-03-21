'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Timeline Manager — Stores and retrieves historical snapshots
 *
 * @class TimelineManager
 * @version 1.0.0
 * @story 2.4
 */
class TimelineManager {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), '.aiox/evolution-data');
    this.ensureDataDir();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Store snapshot with timestamp
   * @param {string} repoName Repository name
   * @param {Object} data Snapshot data (repo.json)
   * @returns {Promise<string>} Snapshot ID
   */
  async storeSnapshot(repoName, data) {
    try {
      if (!repoName || !data) {
        throw new Error('Repository name and data required');
      }

      const timestamp = new Date().toISOString();
      const snapshotId = `${repoName}-${Date.now()}`;
      const snapshotFile = path.join(this.dataDir, `${snapshotId}.json`);

      const snapshot = {
        id: snapshotId,
        repository: repoName,
        timestamp,
        data,
      };

      fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));

      return snapshotId;
    } catch (error) {
      throw new Error(`Failed to store snapshot: ${error.message}`);
    }
  }

  /**
   * Get snapshots for repository
   * @param {string} repoName Repository name
   * @param {Object} options Query options
   * @returns {Promise<Array>} Snapshots
   */
  async getSnapshots(repoName, options = {}) {
    try {
      const limit = options.limit || 100;
      const days = options.days || 30;

      const files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));
      const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

      const snapshots = files
        .map((f) => {
          const content = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf8'));
          return content;
        })
        .filter((s) => s.repository === repoName && new Date(s.timestamp).getTime() > cutoffDate)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return snapshots;
    } catch (error) {
      throw new Error(`Failed to get snapshots: ${error.message}`);
    }
  }

  /**
   * Get latest snapshot
   * @param {string} repoName Repository name
   * @returns {Promise<Object>} Latest snapshot
   */
  async getLatestSnapshot(repoName) {
    try {
      const snapshots = await this.getSnapshots(repoName, { limit: 1 });
      return snapshots.length > 0 ? snapshots[0] : null;
    } catch (error) {
      throw new Error(`Failed to get latest snapshot: ${error.message}`);
    }
  }

  /**
   * Calculate trend between snapshots
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
            (1000 * 60 * 60 * 24),
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
   * Get all repositories
   * @returns {Promise<Array>} Repository names
   */
  async getRepositories() {
    try {
      const files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));
      const repos = new Set(
        files.map((f) => {
          const content = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf8'));
          return content.repository;
        }),
      );

      return Array.from(repos);
    } catch (error) {
      throw new Error(`Failed to get repositories: ${error.message}`);
    }
  }

  /**
   * Delete old snapshots
   * @param {number} daysToKeep Days to keep (default 90)
   * @returns {Promise<number>} Number deleted
   */
  async pruneOldSnapshots(daysToKeep = 90) {
    try {
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
    } catch (error) {
      throw new Error(`Failed to prune snapshots: ${error.message}`);
    }
  }
}

module.exports = { TimelineManager };
