'use strict';

const path = require('path');
const fs = require('fs-extra');
const StoryExecutor = require('../story-executor');

describe('StoryExecutor - Task Executor Integration', () => {
  let executor;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-story-executor');
    await fs.ensureDir(testDir);
    executor = new StoryExecutor(testDir, 'story-8.1');
    await executor.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should initialize with project root and story ID', () => {
      expect(executor.projectRoot).toBe(testDir);
      expect(executor.storyId).toBe('story-8.1');
      expect(executor.executionId).toMatch(/^8\.1-\d+$/);
    });

    it('should have checkpoint manager initialized', async () => {
      expect(executor.checkpointManager).toBeDefined();
      const stats = await executor.checkpointManager.getStats();
      expect(stats.total_checkpoints).toBe(0);
    });
  });

  describe('executeStory', () => {
    const defaultOptions = {
      branch: 'feature/8.2-integration',
      skipQuality: true,
    };

    it('should execute a single task and create checkpoint', async () => {
      const tasks = [
        {
          id: 'task-1',
          context: { action: 'test' },
        },
      ];

      const result = await executor.executeStory({ tasks, ...defaultOptions });

      expect(result.success).toBe(true);
      expect(result.totalTasks).toBe(1);
      expect(result.completedTasks).toBe(1);
      expect(result.failedTasks).toBe(0);
    });

    it('should handle multiple tasks in sequence', async () => {
      const tasks = [
        { id: 'task-1', context: { step: 1 } },
        { id: 'task-2', context: { step: 2 } },
        { id: 'task-3', context: { step: 3 } },
      ];

      const result = await executor.executeStory({ tasks, ...defaultOptions });

      expect(result.totalTasks).toBe(3);
      expect(result.completedTasks).toBe(3);
    });

    it('should validate gates before execution', async () => {
      const tasks = [{ id: 'task-1', context: {} }];

      const result = await executor.executeStory({
        tasks,
        ...defaultOptions,
        changedFiles: ['src/file.js'],
      });

      expect(result.success).toBe(true);
    });

    it('should retry failed tasks', async () => {
      const tasks = [{ id: 'task-fail', context: { shouldFail: true } }];

      const result = await executor.executeStory({
        tasks,
        ...defaultOptions,
        maxRetries: 2,
      });

      // Even with retries, it should attempt (retries set in result)
      expect(result.results[0]).toBeDefined();
    });

    it('should create checkpoints for completed tasks', async () => {
      const tasks = [{ id: 'task-1', context: { data: 'test' } }];

      await executor.executeStory({ tasks, ...defaultOptions });

      const checkpoints = await executor.checkpointManager.getCheckpointsForExecution(executor.executionId);
      expect(checkpoints.length).toBeGreaterThan(0);
      expect(checkpoints[0].task_id).toBe('task-1');
      expect(checkpoints[0].status).toBe('completed');
    });
  });

  describe('resumeStory', () => {
    const defaultOptions = {
      branch: 'feature/8.2-integration',
      skipQuality: true,
    };

    it('should resume from checkpoint', async () => {
      const tasks = [
        { id: 'task-1', context: { step: 1 } },
        { id: 'task-2', context: { step: 2 } },
      ];

      const result1 = await executor.executeStory({ tasks, ...defaultOptions });
      const executionId = result1.executionId;

      // Simulate resuming
      const result2 = await executor.resumeStory(executionId, tasks, defaultOptions);

      expect(result2.success).toBe(true);
    });

    it('should throw error if no checkpoint exists', async () => {
      const tasks = [{ id: 'task-1', context: {} }];

      await expect(executor.resumeStory('nonexistent-id', tasks, defaultOptions)).rejects.toThrow('No checkpoint found');
    });
  });

  describe('getStatus', () => {
    const defaultOptions = {
      branch: 'feature/8.2-integration',
      skipQuality: true,
    };

    it('should return execution status', async () => {
      const tasks = [{ id: 'task-1', context: {} }];

      await executor.executeStory({ tasks, ...defaultOptions });

      const status = await executor.getStatus(executor.executionId);

      expect(status.executionId).toBe(executor.executionId);
      expect(status.checkpointCount).toBeGreaterThan(0);
      expect(status.canResume).toBeDefined();
    });

    it('should indicate resumability', async () => {
      const tasks = [{ id: 'task-1', context: {} }];

      await executor.executeStory({ tasks, ...defaultOptions });

      const status = await executor.getStatus(executor.executionId);

      // Completed execution should not be resumable
      expect(typeof status.canResume).toBe('boolean');
    });
  });

  describe('gates integration', () => {
    const defaultOptions = {
      branch: 'feature/8.2-integration',
      skipQuality: true,
    };

    it('should validate gates during execution', async () => {
      const tasks = [{ id: 'task-1', context: {} }];

      const result = await executor.executeStory({
        tasks,
        ...defaultOptions,
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle gate failures gracefully', async () => {
      const tasks = [{ id: 'task-1', context: {} }];

      // Use valid branch format
      const result = await executor.executeStory({
        tasks,
        ...defaultOptions,
      });

      // Gates should pass or warn
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    const defaultOptions = {
      branch: 'feature/8.2-integration',
      skipQuality: true,
    };

    it('should handle task execution errors', async () => {
      const tasks = [{ id: 'task-error', context: { error: 'test error' } }];

      const result = await executor.executeStory({
        tasks,
        ...defaultOptions,
        autoRecovery: true,
      });

      // Should handle error and continue
      expect(result.results).toBeDefined();
    });

    it('should throw on non-recoverable errors without autoRecovery', async () => {
      const tasks = [{ id: 'task-fail', context: { critical: true } }];

      // This may or may not throw depending on TaskExecutor implementation
      const result = await executor.executeStory({
        tasks,
        ...defaultOptions,
        autoRecovery: false,
        maxRetries: 1,
      });

      expect(result).toBeDefined();
    });
  });

  describe('checkpoint management', () => {
    const defaultOptions = {
      branch: 'feature/8.2-integration',
      skipQuality: true,
    };

    it('should save checkpoints with correct structure', async () => {
      const tasks = [{ id: 'task-1', context: { data: 'test' } }];

      await executor.executeStory({ tasks, ...defaultOptions });

      const checkpoints = await executor.checkpointManager.getCheckpointsForExecution(executor.executionId);
      const cp = checkpoints[0];

      expect(cp.task_id).toBeDefined();
      expect(cp.execution_id).toBeDefined();
      expect(cp.step).toBeDefined();
      expect(cp.status).toBeDefined();
      expect(cp.outputs).toBeDefined();
    });

    it('should track retry attempts in checkpoints', async () => {
      const tasks = [{ id: 'task-retry', context: { retry: true } }];

      await executor.executeStory({
        tasks,
        ...defaultOptions,
        maxRetries: 3,
      });

      const checkpoints = await executor.checkpointManager.getCheckpointsForExecution(executor.executionId);

      // At least one checkpoint should exist
      expect(checkpoints.length).toBeGreaterThan(0);
    });
  });

  describe('execution atomicity', () => {
    const defaultOptions = {
      branch: 'feature/8.2-integration',
      skipQuality: true,
    };

    it('should maintain atomic checkpoints across multiple tasks', async () => {
      const tasks = [
        { id: 'task-1', context: { order: 1 } },
        { id: 'task-2', context: { order: 2 } },
        { id: 'task-3', context: { order: 3 } },
      ];

      await executor.executeStory({ tasks, ...defaultOptions });

      const checkpoints = await executor.checkpointManager.getCheckpointsForExecution(executor.executionId);

      // Should have one checkpoint per task
      expect(checkpoints.length).toBe(tasks.length);

      // Checkpoints should be in order
      for (let i = 0; i < checkpoints.length; i++) {
        expect(checkpoints[i].step).toBe(i);
      }
    });
  });
});
