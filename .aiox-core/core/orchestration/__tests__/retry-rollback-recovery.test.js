'use strict';

const path = require('path');
const fs = require('fs-extra');
const RetryManager = require('../retry-manager');
const RollbackManager = require('../rollback-manager');
const CheckpointRecovery = require('../checkpoint-recovery');

describe('Retry, Rollback & Recovery Integration', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-retry-rollback');
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('RetryManager', () => {
    let retryMgr;

    beforeEach(() => {
      retryMgr = new RetryManager({ maxRetries: 3 });
    });

    it('should retry transient errors', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) throw new Error('Transient');
        return 'success';
      };

      const result = await retryMgr.executeWithRetry('task-1', fn);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should not retry permanent errors', async () => {
      const error = new Error('Permanent');
      error.permanent = true;

      const fn = async () => {
        throw error;
      };

      await expect(retryMgr.executeWithRetry('task-1', fn)).rejects.toThrow('Permanent');
    });

    it('should calculate exponential backoff', () => {
      const delay1 = retryMgr.calculateDelay(0);
      const delay2 = retryMgr.calculateDelay(1);
      const delay3 = retryMgr.calculateDelay(2);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should track retry history', async () => {
      const fn = async () => 'result';
      await retryMgr.executeWithRetry('task-x', fn);

      const history = retryMgr.getHistory('task-x');
      expect(history.success).toBe(true);
      expect(history.attempts).toBe(1);
    });
  });

  describe('RollbackManager', () => {
    let rollbackMgr;

    beforeEach(async () => {
      rollbackMgr = new RollbackManager(testDir);
      await rollbackMgr.initialize();
    });

    it('should track file modifications', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'original');

      await rollbackMgr.trackChange('test.txt', 'modified');

      const history = rollbackMgr.getHistory('test.txt');
      expect(history.changeType).toBe('modified');
      expect(history.backupPath).toBeDefined();
    });

    it('should rollback modified files', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'original');

      await rollbackMgr.trackChange('test.txt', 'modified');

      // Modify file
      await fs.writeFile(testFile, 'modified');

      // Rollback
      await rollbackMgr.rollbackFile('test.txt');

      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe('original');
    });

    it('should rollback created files', async () => {
      const testFile = path.join(testDir, 'created.txt');
      await rollbackMgr.trackChange('created.txt', 'created');

      // Simulate file creation
      await fs.writeFile(testFile, 'new file');

      // Rollback
      await rollbackMgr.rollbackFile('created.txt');

      expect(await fs.pathExists(testFile)).toBe(false);
    });

    it('should rollback all changes', async () => {
      const file1 = path.join(testDir, 'file1.txt');
      const file2 = path.join(testDir, 'file2.txt');

      await fs.writeFile(file1, 'original1');
      await fs.writeFile(file2, 'original2');

      await rollbackMgr.trackChange('file1.txt', 'modified');
      await rollbackMgr.trackChange('file2.txt', 'modified');

      await fs.writeFile(file1, 'modified1');
      await fs.writeFile(file2, 'modified2');

      await rollbackMgr.rollbackAll();

      expect(await fs.readFile(file1, 'utf8')).toBe('original1');
      expect(await fs.readFile(file2, 'utf8')).toBe('original2');
    });
  });

  describe('CheckpointRecovery', () => {
    let recovery;

    beforeEach(async () => {
      recovery = new CheckpointRecovery(testDir, { baseDir: path.join(testDir, 'checkpoints') });
      await recovery.initialize();
    });

    it('should validate checkpoints', async () => {
      const checkpointId = await recovery.checkpointManager.saveCheckpoint({
        task_id: 'task-1',
        execution_id: 'exec-1',
        step: 0,
        status: 'completed',
      });

      const validation = await recovery.validateCheckpoint(checkpointId);
      expect(validation.valid).toBe(true);
      expect(validation.checkpoint.task_id).toBe('task-1');
    });

    it('should recover from failed execution', async () => {
      const execId = 'exec-recovery';

      await recovery.checkpointManager.saveCheckpoint({
        task_id: 'task-1',
        execution_id: execId,
        step: 0,
        status: 'completed',
        outputs: { data: 'test' },
      });

      const recovery_result = await recovery.recoverExecution(execId);
      expect(recovery_result.executionId).toBe(execId);
      expect(recovery_result.resumePoint).toBeDefined();
      expect(recovery_result.resumePoint.step).toBe(0);
    });

    it('should get recovery stats', async () => {
      const execId = 'exec-stats';

      await recovery.checkpointManager.saveCheckpoint({
        task_id: 'task-1',
        execution_id: execId,
        step: 0,
        status: 'completed',
      });

      const stats = await recovery.getStats(execId);
      expect(stats.total).toBe(1);
      expect(stats.canRecover).toBe(true);
    });

    it('should cleanup old checkpoints', async () => {
      await recovery.checkpointManager.saveCheckpoint({
        task_id: 'task-old',
        execution_id: 'exec-old',
        status: 'completed',
      });

      const result = await recovery.cleanup(0, true);
      expect(result.deleted_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration', () => {
    it('should work together: retry + rollback + recovery', async () => {
      const retryMgr = new RetryManager();
      const rollbackMgr = new RollbackManager(testDir);
      const recovery = new CheckpointRecovery(testDir, { baseDir: path.join(testDir, 'chkpts') });

      await rollbackMgr.initialize();
      await recovery.initialize();

      // Create a test file
      const testFile = path.join(testDir, 'integration.txt');
      await fs.writeFile(testFile, 'original');

      // Track change
      await rollbackMgr.trackChange('integration.txt', 'modified');

      // Modify file
      await fs.writeFile(testFile, 'modified');

      // Retry something
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) throw new Error('Fail');
        return 'recovered';
      };

      const result = await retryMgr.executeWithRetry('task-integration', fn);
      expect(result).toBe('recovered');

      // Rollback changes
      await rollbackMgr.rollbackFile('integration.txt');
      expect(await fs.readFile(testFile, 'utf8')).toBe('original');
    });
  });
});
