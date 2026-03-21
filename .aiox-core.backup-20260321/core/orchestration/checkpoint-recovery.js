/**
 * Checkpoint Recovery - Resume execution from checkpoints
 * @module core/orchestration/checkpoint-recovery
 * @version 1.0.0
 */

const { CheckpointManager } = require('./checkpoint-manager');

class CheckpointRecovery {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.checkpointManager = new CheckpointManager(options);
  }

  /**
   * Initialize recovery system
   */
  async initialize() {
    await this.checkpointManager.initialize();
  }

  /**
   * Validate checkpoint integrity
   */
  async validateCheckpoint(checkpointId) {
    try {
      const checkpoint = await this.checkpointManager.loadCheckpoint(checkpointId);

      const requiredFields = ['task_id', 'execution_id', 'step', 'status'];
      for (const field of requiredFields) {
        if (checkpoint[field] === undefined) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return { valid: true, checkpoint };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Recover from failed execution
   */
  async recoverExecution(executionId) {
    const checkpoints = await this.checkpointManager.getCheckpointsForExecution(executionId);

    if (checkpoints.length === 0) {
      throw new Error(`No checkpoints found for execution ${executionId}`);
    }

    // Find last valid checkpoint
    let lastValidCheckpoint = null;
    for (const checkpoint of checkpoints.reverse()) {
      const validation = await this.validateCheckpoint(checkpoint.id);
      if (validation.valid) {
        lastValidCheckpoint = checkpoint;
        break;
      }
    }

    if (!lastValidCheckpoint) {
      throw new Error('No valid checkpoints found');
    }

    return {
      executionId,
      resumePoint: {
        checkpointId: lastValidCheckpoint.id,
        step: lastValidCheckpoint.step,
        totalSteps: lastValidCheckpoint.total_steps,
        context: lastValidCheckpoint.context,
        outputs: lastValidCheckpoint.outputs,
      },
    };
  }

  /**
   * Cleanup old checkpoints
   */
  async cleanup(daysOld = 7, onlyCompleted = true) {
    return this.checkpointManager.cleanup(daysOld, onlyCompleted);
  }

  /**
   * Get recovery stats
   */
  async getStats(executionId) {
    const checkpoints = await this.checkpointManager.getCheckpointsForExecution(executionId);
    const stats = await this.checkpointManager.getStats();

    return {
      total: checkpoints.length,
      byStatus: this._groupByStatus(checkpoints),
      canRecover: checkpoints.length > 0,
      globalStats: stats,
    };
  }

  /**
   * Group checkpoints by status
   */
  _groupByStatus(checkpoints) {
    const grouped = {};
    for (const cp of checkpoints) {
      grouped[cp.status] = (grouped[cp.status] || 0) + 1;
    }
    return grouped;
  }
}

module.exports = CheckpointRecovery;
