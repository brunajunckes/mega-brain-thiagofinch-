/**
 * Worker Pool Tests
 */

const WorkerPool = require('../worker-pool');
const TaskQueue = require('../task-queue');

describe('WorkerPool', () => {
  describe('Initialization', () => {
    it('should initialize with correct worker count', async () => {
      const pool = new WorkerPool({ workerCount: 4 });
      // Note: full initialization would require actual worker threads
      // For unit tests, we verify the structure
      expect(pool.workerCount).toBe(4);
      expect(pool.workers).toHaveLength(0); // Before initialize()
    });

    it('should use default worker count if not specified', () => {
      const pool = new WorkerPool();
      expect(pool.workerCount).toBe(4);
    });

    it('should use custom task queue options', () => {
      const pool = new WorkerPool({
        workerCount: 2,
        queue: { maxQueueSize: 50 }
      });
      expect(pool.taskQueue.maxQueueSize).toBe(50);
    });
  });

  describe('Task Queue Integration', () => {
    it('should enqueue tasks', () => {
      const pool = new WorkerPool();
      const taskId = pool.enqueueTask({ name: 'task' }, 'high');
      expect(taskId).toBeDefined();
      expect(pool.taskQueue.size()).toBe(1);
    });

    it('should respect task priority', () => {
      const pool = new WorkerPool();
      pool.enqueueTask({ name: 'low' }, 'low');
      pool.enqueueTask({ name: 'high' }, 'high');
      pool.enqueueTask({ name: 'medium' }, 'medium');

      const task1 = pool.taskQueue.dequeue();
      expect(task1.name).toBe('high');

      const task2 = pool.taskQueue.dequeue();
      expect(task2.name).toBe('medium');

      const task3 = pool.taskQueue.dequeue();
      expect(task3.name).toBe('low');
    });
  });

  describe('Pool Size Reporting', () => {
    it('should report pool size before workers created', () => {
      const pool = new WorkerPool({ workerCount: 4 });
      pool.enqueueTask({ name: 'task1' }, 'high');
      pool.enqueueTask({ name: 'task2' }, 'medium');

      const size = pool.getSize();
      expect(size.workerCount).toBe(4);
      expect(size.queuedTasks).toBe(2);
      expect(size.busyWorkers).toBe(0);
      expect(size.idleWorkers).toBe(0); // No workers created yet
    });
  });

  describe('Statistics', () => {
    it('should track statistics', () => {
      const pool = new WorkerPool();
      pool.enqueueTask({ name: 'task' }, 'high');

      const stats = pool.getStats();
      expect(stats.tasksProcessed).toBe(0);
      expect(stats.tasksFailed).toBe(0);
      expect(stats.workersCreated).toBe(0); // Not initialized
      expect(stats.queueStats).toBeDefined();
    });
  });

  describe('Worker Status', () => {
    it('should initialize worker status on pool create', () => {
      const pool = new WorkerPool({ workerCount: 2 });
      // Manually populate workers for testing
      pool.activeWorkers.set(0, { busy: false, taskId: null });
      pool.activeWorkers.set(1, { busy: false, taskId: null });

      const status0 = pool.getWorkerStatus(0);
      expect(status0.busy).toBe(false);

      const allStatus = pool.getAllWorkerStatus();
      expect(allStatus).toHaveLength(2);
    });
  });
});
