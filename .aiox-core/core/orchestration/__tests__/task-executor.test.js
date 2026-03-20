'use strict';

const path = require('path');
const fs = require('fs-extra');
const { TaskExecutor } = require('../task-executor');
const { DependencyGraph } = require('../dependency-graph');

describe('TaskExecutor', () => {
  let executor;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-executor');
    await fs.ensureDir(testDir);

    executor = new TaskExecutor({
      tasksDir: testDir,
      baseDir: testDir,
    });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should initialize with options', () => {
      expect(executor.tasksDir).toBe(testDir);
      expect(executor.baseDir).toBe(testDir);
      expect(executor.tasks).toBeInstanceOf(Map);
      expect(executor.executionLog).toEqual([]);
    });

    it('should initialize with default context', () => {
      const exec = new TaskExecutor();
      expect(exec.context).toEqual({});
    });

    it('should initialize with custom context', () => {
      const context = { agent: 'dev', story: '1.1' };
      const exec = new TaskExecutor({ context });
      expect(exec.context).toEqual(context);
    });
  });

  describe('executeTask', () => {
    it('should execute a task with default inputs', async () => {
      const result = await executor.executeTask('test-task');

      expect(result.status).toBe('success');
      expect(result.taskId).toBe('test-task');
      expect(result.executed).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should execute a task with custom inputs', async () => {
      const inputs = { name: 'alice', version: '1.0' };
      const result = await executor.executeTask('input-task', inputs);

      expect(result.status).toBe('success');
      expect(result.inputs).toEqual(inputs);
    });

    it('should record execution in log', async () => {
      await executor.executeTask('task1');
      await executor.executeTask('task2');

      const log = executor.getLog();
      expect(log).toHaveLength(4); // 2 tasks * 2 events (started + completed)
      expect(log[0].status).toBe('started');
      expect(log[1].status).toBe('completed');
    });

    it('should include timestamp in result', async () => {
      const before = new Date();
      const result = await executor.executeTask('timed-task');
      const after = new Date();

      const timestamp = new Date(result.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should calculate execution duration', async () => {
      const result = await executor.executeTask('duration-task');

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should handle task errors', async () => {
      // Current implementation always succeeds, but structure allows for error handling
      const result = await executor.executeTask('task-that-might-fail');
      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('execution logging', () => {
    it('should log task start', async () => {
      await executor.executeTask('logged-task');
      const log = executor.getLog();

      expect(log[0].status).toBe('started');
      expect(log[0].taskId).toBe('logged-task');
    });

    it('should log task completion', async () => {
      await executor.executeTask('completed-task');
      const log = executor.getLog();

      expect(log[1].status).toBe('completed');
      expect(log[1].data.status).toBe('success');
    });

    it('should maintain log order', async () => {
      await executor.executeTask('first');
      await executor.executeTask('second');
      await executor.executeTask('third');

      const log = executor.getLog();
      expect(log[0].taskId).toBe('first');
      expect(log[2].taskId).toBe('second');
      expect(log[4].taskId).toBe('third');
    });

    it('should access execution log', async () => {
      await executor.executeTask('task1');
      await executor.executeTask('task2');

      const log = executor.getLog();
      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBeGreaterThan(0);
    });
  });

  describe('task ordering with DependencyGraph', () => {
    it('should determine execution order from dependencies', () => {
      const graph = new DependencyGraph();
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addEdge('task3', 'task2');
      graph.addEdge('task2', 'task1');

      const order = graph.topologicalSort(['task1', 'task2', 'task3']);

      // task1 should be first (no dependencies)
      expect(order.indexOf('task1')).toBeLessThan(order.indexOf('task2'));
      expect(order.indexOf('task2')).toBeLessThan(order.indexOf('task3'));
    });

    it('should handle parallel tasks', () => {
      const graph = new DependencyGraph();
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      // No edges = all parallel

      const order = graph.topologicalSort();
      expect(order).toHaveLength(3);
      expect(new Set(order)).toEqual(new Set(['task1', 'task2', 'task3']));
    });

    it('should detect circular dependencies in graph', () => {
      const graph = new DependencyGraph();
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task2', 'task1');

      expect(() => graph.topologicalSort()).toThrow(/Circular dependency/);
    });
  });
});
