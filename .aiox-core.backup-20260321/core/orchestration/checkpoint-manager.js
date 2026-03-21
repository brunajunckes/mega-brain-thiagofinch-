'use strict';

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * CheckpointManager - Save and restore task execution state
 * Enables resumable execution after interruptions
 */
class CheckpointManager {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), '.aiox', 'checkpoints');
    this.checkpoints = new Map();
  }

  /**
   * Initialize checkpoint directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize checkpoint manager: ${error.message}`);
    }
  }

  /**
   * Save checkpoint for a task execution
   */
  async saveCheckpoint(checkpoint) {
    if (!checkpoint || !checkpoint.task_id || !checkpoint.execution_id) {
      throw new Error('Checkpoint must have task_id and execution_id');
    }

    try {
      const checkpointData = {
        id: checkpoint.id || crypto.randomUUID(),
        task_id: checkpoint.task_id,
        execution_id: checkpoint.execution_id,
        story_id: checkpoint.story_id || '',
        step: checkpoint.step || 0,
        total_steps: checkpoint.total_steps || 0,
        status: checkpoint.status || 'in_progress',
        started_at: checkpoint.started_at || new Date().toISOString(),
        last_checkpoint: new Date().toISOString(),
        outputs: checkpoint.outputs || {},
        context: checkpoint.context || {},
        errors: checkpoint.errors || [],
        retry_count: checkpoint.retry_count || 0,
        metadata: checkpoint.metadata || {},
      };

      const validation = this._validateCheckpoint(checkpointData);
      if (!validation.valid) {
        throw new Error(`Invalid checkpoint: ${validation.errors.join(', ')}`);
      }

      const json = JSON.stringify(checkpointData, null, 2);
      const filename = this._getCheckpointFilename(checkpoint.task_id, checkpoint.execution_id);
      const filepath = path.join(this.baseDir, filename);
      const tempPath = filepath + '.tmp';

      await fs.writeFile(tempPath, json, 'utf8');
      await fs.rename(tempPath, filepath);

      this.checkpoints.set(checkpointData.id, checkpointData);
      return checkpointData.id;
    } catch (error) {
      throw new Error(`Failed to save checkpoint: ${error.message}`);
    }
  }

  /**
   * Load checkpoint by ID
   */
  async loadCheckpoint(checkpoint_id) {
    try {
      if (this.checkpoints.has(checkpoint_id)) {
        return this.checkpoints.get(checkpoint_id);
      }

      const files = await fs.readdir(this.baseDir);
      for (const file of files) {
        if (file.endsWith('.tmp')) continue;

        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        if (json.id === checkpoint_id) {
          this.checkpoints.set(checkpoint_id, json);
          return json;
        }
      }

      throw new Error(`Checkpoint not found: ${checkpoint_id}`);
    } catch (error) {
      throw new Error(`Failed to load checkpoint: ${error.message}`);
    }
  }

  /**
   * Get latest checkpoint for a task
   */
  async getLatestCheckpoint(task_id) {
    try {
      const files = await fs.readdir(this.baseDir);
      let latest = null;
      let latestTime = 0;

      for (const file of files) {
        if (file.endsWith('.tmp') || !file.includes(task_id)) continue;

        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        if (json.task_id === task_id) {
          const time = new Date(json.last_checkpoint).getTime();
          if (time > latestTime) {
            latest = json;
            latestTime = time;
          }
        }
      }

      if (latest) {
        this.checkpoints.set(latest.id, latest);
      }

      return latest;
    } catch (error) {
      throw new Error(`Failed to get latest checkpoint: ${error.message}`);
    }
  }

  /**
   * Get all checkpoints for an execution
   */
  async getCheckpointsForExecution(execution_id) {
    try {
      const files = await fs.readdir(this.baseDir);
      const checkpoints = [];

      for (const file of files) {
        if (file.endsWith('.tmp')) continue;

        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        if (json.execution_id === execution_id) {
          checkpoints.push(json);
        }
      }

      checkpoints.sort((a, b) => a.step - b.step);
      return checkpoints;
    } catch (error) {
      throw new Error(`Failed to get checkpoints for execution: ${error.message}`);
    }
  }

  /**
   * Update checkpoint status
   */
  async updateCheckpointStatus(checkpoint_id, status, update = {}) {
    try {
      const checkpoint = await this.loadCheckpoint(checkpoint_id);

      checkpoint.status = status;
      checkpoint.last_checkpoint = new Date().toISOString();

      if (update.outputs) {
        checkpoint.outputs = { ...checkpoint.outputs, ...update.outputs };
      }
      if (update.errors) {
        checkpoint.errors.push(...update.errors);
      }
      if (update.context) {
        checkpoint.context = { ...checkpoint.context, ...update.context };
      }
      if (update.retry_count !== undefined) {
        checkpoint.retry_count = update.retry_count;
      }

      await this.saveCheckpoint(checkpoint);
    } catch (error) {
      throw new Error(`Failed to update checkpoint: ${error.message}`);
    }
  }

  /**
   * Check if execution can be resumed
   */
  async canResume(execution_id) {
    try {
      const checkpoints = await this.getCheckpointsForExecution(execution_id);
      return checkpoints.length > 0 && checkpoints[checkpoints.length - 1].status !== 'completed';
    } catch (error) {
      throw new Error(`Failed to check resumability: ${error.message}`);
    }
  }

  /**
   * Get resume point for execution
   */
  async getResumePoint(execution_id) {
    try {
      const checkpoints = await this.getCheckpointsForExecution(execution_id);

      if (checkpoints.length === 0) {
        return null;
      }

      for (let i = checkpoints.length - 1; i >= 0; i--) {
        const cp = checkpoints[i];
        if (cp.status === 'completed' || cp.status === 'in_progress') {
          return {
            checkpoint: cp,
            next_step: cp.step + 1,
            context: cp.context,
            outputs: cp.outputs,
          };
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to get resume point: ${error.message}`);
    }
  }

  /**
   * Delete checkpoint
   */
  async deleteCheckpoint(checkpoint_id) {
    try {
      const checkpoint = await this.loadCheckpoint(checkpoint_id);
      const filename = this._getCheckpointFilename(checkpoint.task_id, checkpoint.execution_id);
      const filepath = path.join(this.baseDir, filename);

      await fs.unlink(filepath);
      this.checkpoints.delete(checkpoint_id);
    } catch (error) {
      throw new Error(`Failed to delete checkpoint: ${error.message}`);
    }
  }

  /**
   * Clean up old checkpoints
   */
  async cleanup(days_to_keep = 7, only_completed = true) {
    try {
      const files = await fs.readdir(this.baseDir);
      const now = Date.now();
      const msPerDay = 24 * 60 * 60 * 1000;
      const cutoffTime = now - days_to_keep * msPerDay;

      let deleted_count = 0;

      for (const file of files) {
        if (file.endsWith('.tmp')) continue;

        const filepath = path.join(this.baseDir, file);
        const stats = await fs.stat(filepath);

        if (stats.mtimeMs < cutoffTime) {
          const content = await fs.readFile(filepath, 'utf8');
          const json = JSON.parse(content);

          if (!only_completed || json.status === 'completed') {
            await fs.unlink(filepath);
            this.checkpoints.delete(json.id);
            deleted_count++;
          }
        }
      }

      return { deleted_count };
    } catch (error) {
      throw new Error(`Failed to cleanup checkpoints: ${error.message}`);
    }
  }

  /**
   * Get checkpoint stats
   */
  async getStats() {
    try {
      const files = await fs.readdir(this.baseDir);
      const stats = {
        total_checkpoints: 0,
        by_status: {},
        by_task: {},
        oldest: null,
        newest: null,
      };

      for (const file of files) {
        if (file.endsWith('.tmp')) continue;

        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        stats.total_checkpoints++;

        stats.by_status[json.status] = (stats.by_status[json.status] || 0) + 1;
        stats.by_task[json.task_id] = (stats.by_task[json.task_id] || 0) + 1;

        const time = new Date(json.last_checkpoint).getTime();
        if (!stats.oldest || time < new Date(stats.oldest).getTime()) {
          stats.oldest = json.last_checkpoint;
        }
        if (!stats.newest || time > new Date(stats.newest).getTime()) {
          stats.newest = json.last_checkpoint;
        }
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get checkpoint stats: ${error.message}`);
    }
  }

  _getCheckpointFilename(task_id, execution_id) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `checkpoint-${task_id}-${execution_id}-${timestamp}.json`;
  }

  _validateCheckpoint(checkpoint) {
    const errors = [];

    if (!checkpoint.task_id) errors.push('task_id is required');
    if (!checkpoint.execution_id) errors.push('execution_id is required');
    if (typeof checkpoint.step !== 'number') errors.push('step must be a number');
    if (typeof checkpoint.total_steps !== 'number') errors.push('total_steps must be a number');
    if (!['in_progress', 'completed', 'failed', 'skipped'].includes(checkpoint.status)) {
      errors.push('status must be: in_progress, completed, failed, or skipped');
    }
    if (typeof checkpoint.retry_count !== 'number') errors.push('retry_count must be a number');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { CheckpointManager };
