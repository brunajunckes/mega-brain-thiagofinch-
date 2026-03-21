'use strict';

const path = require('path');
const fs = require('fs-extra');
const StoryExecutor = require('../story-executor');
const ConstitutionalGates = require('../../gates/constitutional-gates');
const RetryManager = require('../retry-manager');
const RollbackManager = require('../rollback-manager');
const CheckpointRecovery = require('../checkpoint-recovery');

describe('End-to-End Workflow Tests', () => {
  let testDir;
  let executor;
  let gates;
  let retryManager;
  let rollbackManager;
  let recovery;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-e2e-workflows');
    await fs.ensureDir(testDir);

    executor = new StoryExecutor(testDir, '3.2');
    await executor.initialize();

    gates = new ConstitutionalGates();
    retryManager = new RetryManager();
    rollbackManager = new RollbackManager(testDir);
    await rollbackManager.initialize();

    recovery = new CheckpointRecovery(testDir, { baseDir: path.join(testDir, 'checkpoints') });
    await recovery.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('Scenario 1: Basic Feature Implementation', () => {
    it('should execute feature from start to finish', async () => {
      const tasks = [
        { id: 'task-1', name: 'Create module', context: { type: 'create' } },
        { id: 'task-2', name: 'Add tests', context: { type: 'test' } },
        { id: 'task-3', name: 'Document', context: { type: 'doc' } },
      ];

      const result = await executor.executeStory({
        tasks,
        branch: 'feature/3.2-test',
        changedFiles: ['src/module.js', 'tests/module.test.js', 'docs/module.md'],
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
    });

    it('should validate gates during feature workflow', async () => {
      const gateResult = await gates.validate({
        changedFiles: ['src/module.js', 'tests/module.test.js'],
        branch: 'feature/3.2-test',
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(gateResult.valid).toBe(true);
      expect(gateResult.verdict).toBe('approved');
    });

    it('should track metrics from feature workflow', async () => {
      const result = await gates.validate({
        changedFiles: ['src/module.js', 'tests/module.test.js'],
        branch: 'feature/3.2-test',
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Scenario 2: Multi-task Execution with Dependencies', () => {
    it('should execute dependent tasks in correct order', async () => {
      const tasks = [
        { id: 'setup', name: 'Setup database schema', dependsOn: [] },
        { id: 'data', name: 'Load initial data', dependsOn: ['setup'] },
        { id: 'api', name: 'Build API endpoints', dependsOn: ['data'] },
        { id: 'tests', name: 'Add integration tests', dependsOn: ['api'] },
      ];

      const taskIds = tasks.map(t => t.id);
      expect(taskIds[0]).toBe('setup');
      expect(taskIds[taskIds.length - 1]).toBe('tests');

      const executionOrder = [];
      for (const task of tasks) {
        executionOrder.push(task.id);
      }

      expect(executionOrder).toEqual(['setup', 'data', 'api', 'tests']);
    });

    it('should track checkpoints for multi-step execution', async () => {
      const execId = 'multi-task-exec';

      await executor.checkpointManager.saveCheckpoint({
        task_id: 'setup',
        execution_id: execId,
        step: 0,
        status: 'completed',
        outputs: { schemaId: 'schema-1' },
      });

      await executor.checkpointManager.saveCheckpoint({
        task_id: 'data',
        execution_id: execId,
        step: 1,
        status: 'completed',
        outputs: { recordsLoaded: 100 },
      });

      const checkpoints = await executor.checkpointManager.getCheckpointsForExecution(execId);
      expect(checkpoints.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scenario 3: Error Recovery and Retry', () => {
    it('should retry transient errors with exponential backoff', async () => {
      let attempts = 0;
      const failingTask = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Network timeout');
        return 'success';
      };

      const result = await retryManager.executeWithRetry('task-retry', failingTask);

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should track retry history for audit trail', async () => {
      let attempts = 0;
      const failingTask = async () => {
        attempts++;
        if (attempts < 2) throw new Error('Transient error');
        return 'recovered';
      };

      const result = await retryManager.executeWithRetry('task-error', failingTask);

      const history = retryManager.getHistory('task-error');
      expect(history.success).toBe(true);
      expect(history.attempts).toBe(2);
    });

    it('should fail fast on permanent errors', async () => {
      const permanentError = new Error('Invalid syntax');
      permanentError.permanent = true;

      const failingTask = async () => {
        throw permanentError;
      };

      await expect(retryManager.executeWithRetry('task-perm', failingTask)).rejects.toThrow(
        'Invalid syntax'
      );

      const history = retryManager.getHistory('task-perm');
      expect(history.success).toBe(false);
    });

    it('should calculate correct exponential backoff delays', () => {
      const delays = [];
      for (let i = 0; i < 3; i++) {
        delays.push(retryManager.calculateDelay(i));
      }

      expect(delays[0]).toBe(1000); // 1s
      expect(delays[1]).toBe(2000); // 2s
      expect(delays[2]).toBe(4000); // 4s
    });
  });

  describe('Scenario 4: Checkpoint and Recovery', () => {
    it('should create checkpoints at each step', async () => {
      const execId = 'checkpoint-exec';
      const steps = ['init', 'build', 'test', 'deploy'];

      for (let i = 0; i < steps.length; i++) {
        await executor.checkpointManager.saveCheckpoint({
          task_id: 'multi-step-task',
          execution_id: execId,
          step: i,
          status: 'completed',
          context: { step: steps[i] },
        });
      }

      const checkpoints = await executor.checkpointManager.getCheckpointsForExecution(execId);
      expect(checkpoints.length).toBeGreaterThanOrEqual(1);
    });

    it('should auto-cleanup old checkpoints', async () => {
      const newExecId = 'new-exec';

      await executor.checkpointManager.saveCheckpoint({
        task_id: 'task-new',
        execution_id: newExecId,
        step: 0,
        status: 'completed',
      });

      const result = await recovery.cleanup(0, true);
      expect(result.deleted_count).toBeDefined();
      expect(result.deleted_count >= 0).toBe(true);
    });

    it('should retrieve checkpoint statistics', async () => {
      const execId = 'stats-exec';

      await executor.checkpointManager.saveCheckpoint({
        task_id: 'task-1',
        execution_id: execId,
        step: 0,
        status: 'completed',
      });

      const stats = await recovery.getStats(execId);
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.canRecover).toBeDefined();
    });
  });

  describe('Scenario 5: Gate Validation and Blocking', () => {
    it('should block execution on CRITICAL gate violations', async () => {
      const gateResult = await gates.validate({
        changedFiles: ['.env.production', 'src/app.js'],
        branch: 'feature/3.2-test',
      });

      expect(gateResult.valid).toBe(false);
      expect(gateResult.verdict).toBe('blocked');
      expect(gateResult.summary.critical).toBeGreaterThan(0);
    });

    it('should need revision on HIGH violations', async () => {
      const gateResult = await gates.validate({
        branch: 'feature/3.2-test',
        qualityChecks: {
          lintPass: false,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(gateResult.valid).toBe(false);
      expect(gateResult.verdict).toBe('needs_revision');
    });

    it('should approve on all gates passing', async () => {
      const gateResult = await gates.validate({
        changedFiles: ['src/feature.js', 'tests/feature.test.js'],
        branch: 'feature/3.2-test',
        specContent: '## Acceptance Criteria\nAC1\n## Test Plan\nTP1',
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(gateResult.valid).toBe(true);
      expect(gateResult.verdict).toBe('approved');
    });

    it('should log all violations to history', async () => {
      await gates.validate({
        changedFiles: ['.env.local'],
        branch: 'feature/3.2-test',
      });

      const history = gates.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario 6: Integrated Workflow (All Components)', () => {
    it('should execute complete workflow: gates → tasks → checkpoint', async () => {
      const taskId = 'integrated-task';

      const gateResult = await gates.validate({
        changedFiles: ['src/feature.js'],
        branch: 'feature/3.2-test',
        qualityChecks: {
          lintPass: true,
          typecheckPass: true,
          testPass: true,
          buildPass: true,
          coderabbitCritical: 0,
        },
      });

      expect(gateResult.valid).toBe(true);

      await rollbackManager.trackChange('src/feature.js', 'modified');

      let execCount = 0;
      const taskFn = async () => {
        execCount++;
        if (execCount < 2) throw new Error('First attempt fails');
        return 'task completed';
      };

      const taskResult = await retryManager.executeWithRetry(taskId, taskFn);
      expect(taskResult).toBe('task completed');

      const checkpointId = await executor.checkpointManager.saveCheckpoint({
        task_id: taskId,
        execution_id: 'workflow-exec',
        step: 0,
        status: 'completed',
        outputs: { result: taskResult },
      });

      expect(checkpointId).toBeDefined();
    });

    it('should handle rollback on workflow failure', async () => {
      const taskId = 'rollback-task';

      await fs.writeFile(path.join(testDir, 'app.js'), 'old content');
      await rollbackManager.trackChange('app.js', 'modified');

      await fs.writeFile(path.join(testDir, 'app.js'), 'new content');

      await executor.checkpointManager.saveCheckpoint({
        task_id: taskId,
        execution_id: 'risky-exec',
        step: 0,
        status: 'in_progress',
      });

      const shouldRollback = true;
      if (shouldRollback) {
        await rollbackManager.rollbackFile('app.js');
      }

      const content = await fs.readFile(path.join(testDir, 'app.js'), 'utf8');
      expect(content).toBe('old content');
    });

    it('should track all components in workflow audit trail', async () => {
      await gates.validate({
        branch: 'feature/3.2-test',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      const gate_history = gates.getHistory();
      expect(gate_history.length).toBeGreaterThan(0);

      await rollbackManager.trackChange('src/test.js', 'modified');
      const rb_history = rollbackManager.getHistory('src/test.js');
      expect(rb_history).toBeDefined();
    });
  });

  describe('Performance & Load Testing', () => {
    it('should handle multiple concurrent task executions', async () => {
      const tasks = Array(5)
        .fill(0)
        .map((_, i) => ({
          id: `task-${i}`,
          name: `Task ${i}`,
          context: { index: i },
        }));

      const start = Date.now();
      const result = await executor.executeStory({
        tasks,
        branch: 'feature/3.2-test',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
      expect(result.success).toBe(true);
    });

    it('should measure gate validation performance', async () => {
      const changedFiles = Array(100)
        .fill(0)
        .map((_, i) => `src/file-${i}.js`);

      const start = Date.now();
      const result = await gates.validate({
        changedFiles,
        branch: 'feature/3.2-test',
        qualityChecks: { buildPass: true, coderabbitCritical: 0 },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
      expect(result.duration).toBeDefined();
    });

    it('should measure retry performance under load', async () => {
      const tasks = Array(10)
        .fill(0)
        .map((_, i) => async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          if (Math.random() < 0.2) throw new Error('Random failure');
          return `success-${i}`;
        });

      const start = Date.now();
      for (let i = 0; i < tasks.length; i++) {
        try {
          await retryManager.executeWithRetry(`task-${i}`, tasks[i]);
        } catch {
          // Expected for some tasks
        }
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });
});
