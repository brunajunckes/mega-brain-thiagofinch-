/**
 * Rollback Manager - Track and rollback file changes
 * @module core/orchestration/rollback-manager
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');

class RollbackManager {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.baseDir = options.baseDir || path.join(projectRoot, '.aiox', 'rollbacks');
    this.rollbackHistory = new Map();
  }

  /**
   * Initialize rollback directory
   */
  async initialize() {
    await fs.ensureDir(this.baseDir);
  }

  /**
   * Track file change (save backup)
   */
  async trackChange(filePath, changeType = 'modified') {
    const absPath = path.join(this.projectRoot, filePath);
    const backupKey = `${filePath}-${Date.now()}`;

    try {
      if (changeType === 'modified' && (await fs.pathExists(absPath))) {
        const backupPath = path.join(this.baseDir, `${backupKey}.backup`);
        await fs.copy(absPath, backupPath);
        this.rollbackHistory.set(filePath, { backupPath, changeType, timestamp: Date.now() });
      } else if (changeType === 'created') {
        this.rollbackHistory.set(filePath, { changeType, timestamp: Date.now() });
      }
    } catch (error) {
      throw new Error(`Failed to track change for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Rollback a single file
   */
  async rollbackFile(filePath) {
    const history = this.rollbackHistory.get(filePath);
    if (!history) {
      throw new Error(`No rollback history for ${filePath}`);
    }

    try {
      const absPath = path.join(this.projectRoot, filePath);

      if (history.changeType === 'modified' && history.backupPath) {
        await fs.copy(history.backupPath, absPath);
      } else if (history.changeType === 'created') {
        await fs.remove(absPath);
      }

      this.rollbackHistory.delete(filePath);
    } catch (error) {
      throw new Error(`Failed to rollback ${filePath}: ${error.message}`);
    }
  }

  /**
   * Rollback all tracked changes
   */
  async rollbackAll() {
    const files = Array.from(this.rollbackHistory.keys());

    for (const file of files) {
      try {
        await this.rollbackFile(file);
      } catch (error) {
        // Continue rolling back other files even if one fails
        console.error(`Error rolling back ${file}:`, error.message);
      }
    }

    this.rollbackHistory.clear();
  }

  /**
   * Get rollback history
   */
  getHistory(filePath) {
    if (filePath) {
      return this.rollbackHistory.get(filePath) || null;
    }
    return Array.from(this.rollbackHistory.entries());
  }

  /**
   * Clear rollback history
   */
  clearHistory(filePath) {
    if (filePath) {
      this.rollbackHistory.delete(filePath);
    } else {
      this.rollbackHistory.clear();
    }
  }
}

module.exports = RollbackManager;
