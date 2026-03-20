/**
 * Checkpoint Manager - Saves and restores execution state
 * @module checkpoint-manager
 */

'use strict';

const fs = require('fs').promises;
const path = require('path');

class CheckpointManager {
  constructor(options = {}) {
    this.baseDir = options.baseDir || process.cwd();
    this.checkpointDir = path.join(this.baseDir, '.aiox', 'checkpoints');
    this.taskId = options.taskId;
  }

  /**
   * Ensure checkpoint directory exists
   */
  async ensureDir() {
    try {
      await fs.mkdir(this.checkpointDir, { recursive: true });
    } catch (error) {
      // Directory may already exist
    }
  }

  /**
   * Save a checkpoint
   */
  async save(taskId, state) {
    try {
      await this.ensureDir();
      const filePath = path.join(this.checkpointDir, `${taskId}.json`);
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn(`Failed to save checkpoint for ${taskId}: ${error.message}`);
    }
  }

  /**
   * Load a checkpoint
   */
  async load(taskId) {
    try {
      const filePath = path.join(this.checkpointDir, `${taskId}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a checkpoint
   */
  async delete(taskId) {
    try {
      const filePath = path.join(this.checkpointDir, `${taskId}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // File may not exist
    }
  }

  /**
   * List all checkpoints
   */
  async listAll() {
    try {
      const files = await fs.readdir(this.checkpointDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace(/\.json$/, ''));
    } catch (error) {
      return [];
    }
  }
}

module.exports = { CheckpointManager };
