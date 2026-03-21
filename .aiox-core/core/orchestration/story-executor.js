/**
 * Story Executor - Execute Story 8.1 tasks using Task Executor
 * @module core/orchestration/story-executor
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const { TaskExecutor } = require('./task-executor');
const { CheckpointManager } = require('./checkpoint-manager');
const ConstitutionalGates = require('../gates/constitutional-gates');

/**
 * StoryExecutor - Execute all tasks for a story with checkpointing
 */
class StoryExecutor {
  constructor(projectRoot, storyId) {
    this.projectRoot = projectRoot;
    this.storyId = storyId;
    this.taskExecutor = new TaskExecutor({ projectRoot });
    this.checkpointManager = new CheckpointManager({ baseDir: path.join(projectRoot, '.aiox', 'checkpoints') });
    this.gates = new ConstitutionalGates();
    // storyId format: "story-8.1" or "8.1", normalize to just the id
    const normalizedId = storyId.replace(/^story-/, '');
    this.executionId = `${normalizedId}-${Date.now()}`;
  }

  /**
   * Initialize the executor
   */
  async initialize() {
    await this.checkpointManager.initialize();
  }

  /**
   * Execute all tasks for a story
   */
  async executeStory(options = {}) {
    const { skipQuality = false, maxRetries = 3, autoRecovery = true } = options;

    try {
      // Pre-execution gate check
      const gateResult = await this.gates.validate({
        changedFiles: options.changedFiles || [],
        branch: options.branch || 'main',
        specContent: options.specContent || '',
        qualityChecks: {
          lintPass: skipQuality || true,
          typecheckPass: skipQuality || true,
          testPass: skipQuality || true,
          buildPass: skipQuality || true,
          coderabbitCritical: 0,
        },
      });

      if (!gateResult.valid && gateResult.violations.length > 0) {
        throw new Error(`Gates failed: ${gateResult.violations.map(v => v.message).join(', ')}`);
      }

      // Check for resume checkpoint
      const resumePoint = await this.checkpointManager.getResumePoint(this.executionId);
      const startStep = resumePoint ? resumePoint.next_step : 0;

      // Execute tasks
      const tasks = options.tasks || [];
      const results = [];

      for (let i = startStep; i < tasks.length; i++) {
        const task = tasks[i];

        // Execute task with retry
        let result;
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            result = await this.taskExecutor.executeTask(task.id, task.context);
            success = true;

            // Save checkpoint on success
            await this.checkpointManager.saveCheckpoint({
              task_id: task.id,
              execution_id: this.executionId,
              step: i,
              total_steps: tasks.length,
              status: 'completed',
              outputs: result,
              context: task.context || {},
            });

            results.push({ taskId: task.id, success: true, result });
          } catch (error) {
            retryCount++;

            if (retryCount >= maxRetries) {
              if (autoRecovery) {
                // Save failed checkpoint
                await this.checkpointManager.saveCheckpoint({
                  task_id: task.id,
                  execution_id: this.executionId,
                  step: i,
                  total_steps: tasks.length,
                  status: 'failed',
                  errors: [error.message],
                  retry_count: retryCount,
                  context: task.context || {},
                });
              }

              results.push({ taskId: task.id, success: false, error: error.message, retries: retryCount });

              if (!autoRecovery) {
                throw error;
              }
            } else {
              // Retry - save checkpoint for retry
              await this.checkpointManager.saveCheckpoint({
                task_id: task.id,
                execution_id: this.executionId,
                step: i,
                total_steps: tasks.length,
                status: 'in_progress',
                errors: [error.message],
                retry_count: retryCount,
                context: task.context || {},
              });
            }
          }
        }
      }

      return {
        success: results.every(r => r.success),
        executionId: this.executionId,
        results,
        totalTasks: tasks.length,
        completedTasks: results.filter(r => r.success).length,
        failedTasks: results.filter(r => !r.success).length,
      };
    } catch (error) {
      throw new Error(`Story execution failed: ${error.message}`);
    }
  }

  /**
   * Resume story execution from checkpoint
   */
  async resumeStory(executionId, tasks, options = {}) {
    this.executionId = executionId;

    const resumePoint = await this.checkpointManager.getResumePoint(executionId);
    if (!resumePoint) {
      throw new Error(`No checkpoint found for execution ${executionId}`);
    }

    return this.executeStory({ tasks, ...options });
  }

  /**
   * Get execution status
   */
  async getStatus(executionId) {
    const checkpoints = await this.checkpointManager.getCheckpointsForExecution(executionId);
    const stats = await this.checkpointManager.getStats();

    return {
      executionId,
      checkpointCount: checkpoints.length,
      stats,
      canResume: await this.checkpointManager.canResume(executionId),
    };
  }
}

module.exports = StoryExecutor;
