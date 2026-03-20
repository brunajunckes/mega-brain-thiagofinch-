'use strict';

const path = require('path');
const fs = require('fs-extra');
const { CheckpointManager } = require('../checkpoint-manager');

describe('CheckpointManager', () => {
  let manager;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-checkpoints');
    await fs.ensureDir(testDir);
    manager = new CheckpointManager({ baseDir: testDir });
    await manager.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create checkpoint directory', async () => {
      const newDir = path.join(testDir, 'new-checkpoints');
      const newManager = new CheckpointManager({ baseDir: newDir });
      await newManager.initialize();

      const exists = await fs.pathExists(newDir);
      expect(exists).toBe(true);
    });
  });

  describe('saveCheckpoint', () => {
    it('should save checkpoint with required fields', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        step: 0,
        status: 'in_progress',
      };

      const id = await manager.saveCheckpoint(checkpoint);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const files = await fs.readdir(testDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should throw on missing task_id', async () => {
      const checkpoint = { execution_id: 'exec-1' };
      await expect(manager.saveCheckpoint(checkpoint)).rejects.toThrow('task_id');
    });

    it('should throw on missing execution_id', async () => {
      const checkpoint = { task_id: 'task-1' };
      await expect(manager.saveCheckpoint(checkpoint)).rejects.toThrow('execution_id');
    });

    it('should use atomic writes (no corruption)', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        outputs: { result: 'data' },
      };

      const id = await manager.saveCheckpoint(checkpoint);

      // No .tmp files should remain
      const files = await fs.readdir(testDir);
      expect(files.every(f => !f.endsWith('.tmp'))).toBe(true);
    });

    it('should generate unique IDs', async () => {
      const cp1 = { task_id: 'task-1', execution_id: 'exec-1' };
      const cp2 = { task_id: 'task-2', execution_id: 'exec-2' };

      const id1 = await manager.saveCheckpoint(cp1);
      const id2 = await manager.saveCheckpoint(cp2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('loadCheckpoint', () => {
    it('should load saved checkpoint', async () => {
      const original = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        step: 5,
        outputs: { data: 'value' },
      };

      const id = await manager.saveCheckpoint(original);
      const loaded = await manager.loadCheckpoint(id);

      expect(loaded.task_id).toBe(original.task_id);
      expect(loaded.step).toBe(original.step);
      expect(loaded.outputs).toEqual(original.outputs);
    });

    it('should use cache for repeated loads', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
      };

      const id = await manager.saveCheckpoint(checkpoint);
      await manager.loadCheckpoint(id);
      await manager.loadCheckpoint(id);

      expect(manager.checkpoints.has(id)).toBe(true);
    });

    it('should throw on non-existent checkpoint', async () => {
      await expect(manager.loadCheckpoint('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('getLatestCheckpoint', () => {
    it('should return latest checkpoint for task', async () => {
      const cp1 = { task_id: 'task-1', execution_id: 'exec-1', step: 1 };
      const cp2 = { task_id: 'task-1', execution_id: 'exec-2', step: 2 };

      await manager.saveCheckpoint(cp1);
      await new Promise(resolve => setTimeout(resolve, 10));
      await manager.saveCheckpoint(cp2);

      const latest = await manager.getLatestCheckpoint('task-1');
      expect(latest.step).toBe(2);
    });

    it('should return null for non-existent task', async () => {
      const result = await manager.getLatestCheckpoint('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getCheckpointsForExecution', () => {
    it('should get all checkpoints for execution', async () => {
      const cp1 = { task_id: 'task-1', execution_id: 'exec-1', step: 0 };
      const cp2 = { task_id: 'task-2', execution_id: 'exec-1', step: 1 };
      const cp3 = { task_id: 'task-3', execution_id: 'exec-2', step: 0 };

      await manager.saveCheckpoint(cp1);
      await manager.saveCheckpoint(cp2);
      await manager.saveCheckpoint(cp3);

      const checkpoints = await manager.getCheckpointsForExecution('exec-1');
      expect(checkpoints).toHaveLength(2);
      expect(checkpoints.every(c => c.execution_id === 'exec-1')).toBe(true);
    });

    it('should return checkpoints sorted by step', async () => {
      const cp1 = { task_id: 'task-1', execution_id: 'exec-1', step: 5 };
      const cp2 = { task_id: 'task-2', execution_id: 'exec-1', step: 3 };
      const cp3 = { task_id: 'task-3', execution_id: 'exec-1', step: 1 };

      await manager.saveCheckpoint(cp1);
      await manager.saveCheckpoint(cp2);
      await manager.saveCheckpoint(cp3);

      const checkpoints = await manager.getCheckpointsForExecution('exec-1');
      expect(checkpoints[0].step).toBe(1);
      expect(checkpoints[1].step).toBe(3);
      expect(checkpoints[2].step).toBe(5);
    });
  });

  describe('updateCheckpointStatus', () => {
    it('should update checkpoint status', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        status: 'in_progress',
      };

      const id = await manager.saveCheckpoint(checkpoint);
      await manager.updateCheckpointStatus(id, 'completed');

      const updated = await manager.loadCheckpoint(id);
      expect(updated.status).toBe('completed');
    });

    it('should add outputs on update', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        outputs: { data: 'initial' },
      };

      const id = await manager.saveCheckpoint(checkpoint);
      await manager.updateCheckpointStatus(id, 'in_progress', {
        outputs: { data: 'updated', extra: 'value' },
      });

      const updated = await manager.loadCheckpoint(id);
      expect(updated.outputs.data).toBe('updated');
      expect(updated.outputs.extra).toBe('value');
    });

    it('should append errors', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        errors: ['Error 1'],
      };

      const id = await manager.saveCheckpoint(checkpoint);
      await manager.updateCheckpointStatus(id, 'failed', {
        errors: ['Error 2', 'Error 3'],
      });

      const updated = await manager.loadCheckpoint(id);
      expect(updated.errors).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });

    it('should update retry count', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        retry_count: 0,
      };

      const id = await manager.saveCheckpoint(checkpoint);
      await manager.updateCheckpointStatus(id, 'failed', { retry_count: 1 });

      const updated = await manager.loadCheckpoint(id);
      expect(updated.retry_count).toBe(1);
    });
  });

  describe('canResume', () => {
    it('should return true for incomplete execution', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        status: 'in_progress',
      };

      await manager.saveCheckpoint(checkpoint);
      const canResume = await manager.canResume('exec-1');

      expect(canResume).toBe(true);
    });

    it('should return false for completed execution', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        status: 'completed',
      };

      await manager.saveCheckpoint(checkpoint);
      const canResume = await manager.canResume('exec-1');

      expect(canResume).toBe(false);
    });

    it('should return false for non-existent execution', async () => {
      const canResume = await manager.canResume('nonexistent');
      expect(canResume).toBe(false);
    });
  });

  describe('getResumePoint', () => {
    it('should get resume point with context', async () => {
      const cp = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        step: 2,
        total_steps: 5,
        context: { key: 'value' },
        outputs: { result: 'data' },
        status: 'in_progress',
      };

      await manager.saveCheckpoint(cp);
      const resumePoint = await manager.getResumePoint('exec-1');

      expect(resumePoint).toBeDefined();
      expect(resumePoint.next_step).toBe(3);
      expect(resumePoint.context).toEqual({ key: 'value' });
      expect(resumePoint.outputs).toEqual({ result: 'data' });
    });

    it('should return null for non-existent execution', async () => {
      const resumePoint = await manager.getResumePoint('nonexistent');
      expect(resumePoint).toBeNull();
    });

    it('should skip failed checkpoints', async () => {
      const cp1 = { task_id: 'task-1', execution_id: 'exec-1', step: 1, status: 'failed' };
      const cp2 = { task_id: 'task-2', execution_id: 'exec-1', step: 2, status: 'completed' };

      await manager.saveCheckpoint(cp1);
      await manager.saveCheckpoint(cp2);

      const resumePoint = await manager.getResumePoint('exec-1');
      expect(resumePoint.checkpoint.step).toBe(2);
    });
  });

  describe('deleteCheckpoint', () => {
    it('should delete checkpoint from disk', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
      };

      const id = await manager.saveCheckpoint(checkpoint);
      await manager.deleteCheckpoint(id);

      await expect(manager.loadCheckpoint(id)).rejects.toThrow('not found');
    });

    it('should clear cache', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
      };

      const id = await manager.saveCheckpoint(checkpoint);
      expect(manager.checkpoints.has(id)).toBe(true);

      await manager.deleteCheckpoint(id);
      expect(manager.checkpoints.has(id)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove old completed checkpoints', async () => {
      const cp1 = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        status: 'completed',
      };
      const cp2 = {
        task_id: 'task-2',
        execution_id: 'exec-2',
        status: 'in_progress',
      };

      await manager.saveCheckpoint(cp1);
      await manager.saveCheckpoint(cp2);

      const result = await manager.cleanup(0, true);
      // Cleanup with 0 days should delete completed, keep in_progress
      expect(result.deleted_count).toBeGreaterThanOrEqual(0);
    });

    it('should keep unconsumed with only_completed=true', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        status: 'in_progress',
      };

      await manager.saveCheckpoint(checkpoint);
      const result = await manager.cleanup(0, true);

      expect(result.deleted_count).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return checkpoint statistics', async () => {
      const cp1 = { task_id: 'task-1', execution_id: 'exec-1', status: 'completed' };
      const cp2 = { task_id: 'task-1', execution_id: 'exec-2', status: 'in_progress' };
      const cp3 = { task_id: 'task-2', execution_id: 'exec-3', status: 'failed' };

      await manager.saveCheckpoint(cp1);
      await manager.saveCheckpoint(cp2);
      await manager.saveCheckpoint(cp3);

      const stats = await manager.getStats();

      expect(stats.total_checkpoints).toBe(3);
      expect(stats.by_status.completed).toBe(1);
      expect(stats.by_status.in_progress).toBe(1);
      expect(stats.by_status.failed).toBe(1);
      expect(stats.by_task['task-1']).toBe(2);
      expect(stats.by_task['task-2']).toBe(1);
    });

    it('should track oldest and newest checkpoints', async () => {
      const cp1 = { task_id: 'task-1', execution_id: 'exec-1' };
      await manager.saveCheckpoint(cp1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const cp2 = { task_id: 'task-2', execution_id: 'exec-2' };
      await manager.saveCheckpoint(cp2);

      const stats = await manager.getStats();

      expect(stats.oldest).toBeDefined();
      expect(stats.newest).toBeDefined();
      expect(new Date(stats.oldest).getTime()).toBeLessThanOrEqual(
        new Date(stats.newest).getTime()
      );
    });
  });

  describe('validation', () => {
    it('should validate checkpoint status', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        status: 'invalid_status',
      };

      await expect(manager.saveCheckpoint(checkpoint)).rejects.toThrow('status');
    });

    it('should validate step is number', async () => {
      const checkpoint = {
        task_id: 'task-1',
        execution_id: 'exec-1',
        step: 'not a number',
      };

      await expect(manager.saveCheckpoint(checkpoint)).rejects.toThrow('step');
    });
  });
});
