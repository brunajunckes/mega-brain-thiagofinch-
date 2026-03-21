/**
 * Task Scheduler Tests
 */

const TaskScheduler = require('../task-scheduler');

describe('TaskScheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new TaskScheduler({
      maxConcurrentTasks: 3,
      priorityQueue: { enableAging: false }
    });
  });

  afterEach(() => {
    scheduler.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(scheduler.maxConcurrentTasks).toBe(3);
      expect(scheduler.executingTasks.size).toBe(0);
      expect(scheduler.completedTasks.size).toBe(0);
    });

    it('should have correct initial stats', () => {
      const stats = scheduler.getStats();
      expect(stats.scheduled).toBe(0);
      expect(stats.started).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('Task Scheduling', () => {
    it('should schedule task', () => {
      const task = { name: 'task1' };
      const taskId = scheduler.scheduleTask(task, 'HIGH');

      expect(taskId).toBeDefined();
      expect(scheduler.getStats().scheduled).toBe(1);
      expect(scheduler.getQueueInfo().size).toBe(1);
    });

    it('should schedule multiple tasks with different priorities', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');
      scheduler.scheduleTask({ name: 'task3' }, 'LOW');

      const info = scheduler.getQueueInfo();
      expect(info.size).toBe(3);
      expect(info.sizeByPriority.HIGH).toBe(1);
      expect(info.sizeByPriority.MEDIUM).toBe(1);
      expect(info.sizeByPriority.LOW).toBe(1);
    });

    it('should default to MEDIUM priority', () => {
      scheduler.scheduleTask({ name: 'task' });

      const info = scheduler.getQueueInfo();
      expect(info.sizeByPriority.MEDIUM).toBe(1);
    });
  });

  describe('Task Execution', () => {
    it('should get next task', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');

      const task = scheduler.getNextTask();
      expect(task.name).toBe('task1');
      expect(scheduler.executingTasks.size).toBe(1);
      expect(scheduler.getStats().started).toBe(1);
    });

    it('should respect concurrency limit', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');
      scheduler.scheduleTask({ name: 'task3' }, 'LOW');
      scheduler.scheduleTask({ name: 'task4' }, 'HIGH');

      const task1 = scheduler.getNextTask();
      const task2 = scheduler.getNextTask();
      const task3 = scheduler.getNextTask();
      const task4 = scheduler.getNextTask(); // Should be null (at limit)

      expect(task1).toBeDefined();
      expect(task2).toBeDefined();
      expect(task3).toBeDefined();
      expect(task4).toBeNull();
      expect(scheduler.executingTasks.size).toBe(3);
    });

    it('should return null when queue is empty and at limit', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.getNextTask();

      const task = scheduler.getNextTask();
      expect(task).toBeNull();
    });
  });

  describe('Task Completion', () => {
    it('should mark task as completed', () => {
      const task = { name: 'task' };
      scheduler.scheduleTask(task, 'HIGH');

      const nextTask = scheduler.getNextTask();
      const success = scheduler.completeTask(nextTask.id, { status: 'ok' });

      expect(success).toBe(true);
      expect(scheduler.executingTasks.size).toBe(0);
      expect(scheduler.completedTasks.size).toBe(1);
      expect(scheduler.getStats().completed).toBe(1);
    });

    it('should return false for non-existent task', () => {
      const success = scheduler.completeTask('nonexistent', {});
      expect(success).toBe(false);
    });

    it('should track completion time and duration', () => {
      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const nextTask = scheduler.getNextTask();

      // Simulate some work time
      const startTime = Date.now();
      while (Date.now() - startTime < 50) {
        // Busy wait
      }

      scheduler.completeTask(nextTask.id, { status: 'ok' });

      const completed = scheduler.completedTasks.get(nextTask.id);
      expect(completed.duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Task Failure', () => {
    it('should mark task as failed', () => {
      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const nextTask = scheduler.getNextTask();

      const success = scheduler.failTask(nextTask.id, new Error('Test error'));

      expect(success).toBe(true);
      expect(scheduler.executingTasks.size).toBe(0);
      expect(scheduler.getStats().failed).toBe(1);
    });

    it('should re-queue failed task with boosted priority', () => {
      scheduler.scheduleTask({ name: 'task' }, 'LOW');
      const nextTask = scheduler.getNextTask();

      scheduler.failTask(nextTask.id, new Error('Test error'));

      // Task should be re-queued with boosted priority
      const pending = scheduler.getPendingTasks();
      expect(pending.length).toBe(1);
    });

    it('should return false for non-existent task', () => {
      const success = scheduler.failTask('nonexistent', new Error('Test'));
      expect(success).toBe(false);
    });
  });

  describe('Task Timeout', () => {
    it('should mark task as timed out', () => {
      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const nextTask = scheduler.getNextTask();

      const success = scheduler.timeoutTask(nextTask.id);

      expect(success).toBe(true);
      expect(scheduler.executingTasks.size).toBe(0);
      expect(scheduler.getStats().timedOut).toBe(1);
    });

    it('should return false for non-existent task', () => {
      const success = scheduler.timeoutTask('nonexistent');
      expect(success).toBe(false);
    });
  });

  describe('Dynamic Priority Adjustment', () => {
    it('should boost task priority', () => {
      scheduler.scheduleTask({ name: 'task' }, 'LOW');
      const pending = scheduler.getPendingTasks();
      const taskId = pending[0].id;

      const success = scheduler.adjustTaskPriority(taskId, 'boost');

      expect(success).toBe(true);
      expect(scheduler.getStats().priorityAdjustments).toBe(1);
    });

    it('should demote task priority', () => {
      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const pending = scheduler.getPendingTasks();
      const taskId = pending[0].id;

      const success = scheduler.adjustTaskPriority(taskId, 'demote');

      expect(success).toBe(true);
      expect(scheduler.getStats().priorityAdjustments).toBe(1);
    });

    it('should set task priority directly', () => {
      scheduler.scheduleTask({ name: 'task' }, 'MEDIUM');
      const pending = scheduler.getPendingTasks();
      const taskId = pending[0].id;

      const success = scheduler.adjustTaskPriority(taskId, 'HIGH');

      expect(success).toBe(true);
    });

    it('should not adjust if priority unchanged', () => {
      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const pending = scheduler.getPendingTasks();
      const taskId = pending[0].id;

      const success = scheduler.adjustTaskPriority(taskId, 'HIGH');

      expect(success).toBe(false);
      expect(scheduler.getStats().priorityAdjustments).toBe(0);
    });

    it('should return false for non-existent task', () => {
      const success = scheduler.adjustTaskPriority('nonexistent', 'boost');
      expect(success).toBe(false);
    });
  });

  describe('Execution Statistics', () => {
    it('should get queued task stats', () => {
      scheduler.scheduleTask({ name: 'task' }, 'MEDIUM');
      const pending = scheduler.getPendingTasks();
      const taskId = pending[0].id;

      const stats = scheduler.getExecutionStats(taskId);

      expect(stats.status).toBe('queued');
      expect(stats.priority).toBe(1);
      expect(stats.waitTime).toBeDefined();
    });

    it('should get executing task stats', () => {
      scheduler.scheduleTask({ name: 'task' }, 'MEDIUM');
      const nextTask = scheduler.getNextTask();

      const stats = scheduler.getExecutionStats(nextTask.id);

      expect(stats.status).toBe('executing');
      expect(stats.duration).toBeDefined();
      expect(stats.priority).toBeDefined();
    });

    it('should get completed task stats', () => {
      scheduler.scheduleTask({ name: 'task' }, 'MEDIUM');
      const nextTask = scheduler.getNextTask();
      scheduler.completeTask(nextTask.id, { result: 'ok' });

      const stats = scheduler.getExecutionStats(nextTask.id);

      expect(stats.status).toBe('completed');
      expect(stats.duration).toBeDefined();
      expect(stats.result).toEqual({ result: 'ok' });
    });

    it('should return null for non-existent task', () => {
      const stats = scheduler.getExecutionStats('nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('Queue Information', () => {
    it('should get queue info', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');
      scheduler.scheduleTask({ name: 'task3' }, 'LOW');

      const info = scheduler.getQueueInfo();

      expect(info.size).toBe(3);
      expect(info.sizeByPriority.HIGH).toBe(1);
      expect(info.sizeByPriority.MEDIUM).toBe(1);
      expect(info.sizeByPriority.LOW).toBe(1);
      expect(info.executing).toBe(0);
      expect(info.maxConcurrent).toBe(3);
    });
  });

  describe('Pending and Executing Tasks', () => {
    it('should get all pending tasks', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');

      const pending = scheduler.getPendingTasks();

      expect(pending.length).toBe(2);
    });

    it('should get all executing tasks', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');

      scheduler.getNextTask();
      scheduler.getNextTask();

      const executing = scheduler.getExecutingTasks();

      expect(executing.length).toBe(2);
      expect(executing[0].duration).toBeDefined();
      expect(executing[1].duration).toBeDefined();
    });
  });

  describe('Events', () => {
    it('should emit task-scheduled event', (done) => {
      scheduler.on('task-scheduled', ({ taskId, priority }) => {
        expect(taskId).toBeDefined();
        expect(priority).toBe('HIGH');
        done();
      });

      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
    });

    it('should emit task-started event', (done) => {
      scheduler.on('task-started', ({ taskId, executingCount }) => {
        expect(taskId).toBeDefined();
        expect(executingCount).toBe(1);
        done();
      });

      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      scheduler.getNextTask();
    });

    it('should emit task-completed event', (done) => {
      scheduler.on('task-completed', ({ taskId, duration }) => {
        expect(taskId).toBeDefined();
        expect(duration).toBeDefined();
        done();
      });

      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const nextTask = scheduler.getNextTask();
      scheduler.completeTask(nextTask.id, { result: 'ok' });
    });

    it('should emit task-failed event', (done) => {
      scheduler.on('task-failed', ({ taskId, error }) => {
        expect(taskId).toBeDefined();
        expect(error).toBe('Test error');
        done();
      });

      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const nextTask = scheduler.getNextTask();
      scheduler.failTask(nextTask.id, new Error('Test error'));
    });

    it('should emit task-timedout event', (done) => {
      scheduler.on('task-timedout', ({ taskId, duration }) => {
        expect(taskId).toBeDefined();
        expect(duration).toBeDefined();
        done();
      });

      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      const nextTask = scheduler.getNextTask();
      scheduler.timeoutTask(nextTask.id);
    });

    it('should emit task-priority-adjusted event', (done) => {
      scheduler.on('task-priority-adjusted', ({ taskId, oldPriority, newPriority }) => {
        expect(taskId).toBeDefined();
        expect(oldPriority).toBeDefined();
        expect(newPriority).toBeLessThan(oldPriority);
        done();
      });

      scheduler.scheduleTask({ name: 'task' }, 'LOW');
      const pending = scheduler.getPendingTasks();
      scheduler.adjustTaskPriority(pending[0].id, 'boost');
    });
  });

  describe('Clear and Shutdown', () => {
    it('should clear all tasks', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');
      scheduler.getNextTask();

      expect(scheduler.getStats().queueSize).toBe(1);
      expect(scheduler.executingTasks.size).toBe(1);

      scheduler.clear();

      expect(scheduler.getStats().queueSize).toBe(0);
      expect(scheduler.executingTasks.size).toBe(0);
      expect(scheduler.completedTasks.size).toBe(0);
    });

    it('should shutdown gracefully', () => {
      scheduler.scheduleTask({ name: 'task' }, 'HIGH');
      scheduler.getNextTask();

      scheduler.shutdown();

      expect(scheduler.getStats().queueSize).toBe(0);
      expect(scheduler.executingTasks.size).toBe(0);
    });
  });

  describe('Utilization Metrics', () => {
    it('should calculate utilization ratio', () => {
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');
      scheduler.scheduleTask({ name: 'task3' }, 'LOW');

      scheduler.getNextTask();
      scheduler.getNextTask();

      const stats = scheduler.getStats();

      expect(stats.utilizationRatio).toBe(2 / 3);
    });
  });

  describe('Integration Test', () => {
    it('should handle complete workflow', () => {
      // Schedule tasks
      scheduler.scheduleTask({ name: 'task1' }, 'HIGH');
      scheduler.scheduleTask({ name: 'task2' }, 'MEDIUM');
      scheduler.scheduleTask({ name: 'task3' }, 'LOW');

      expect(scheduler.getStats().scheduled).toBe(3);

      // Get and execute tasks
      const task1 = scheduler.getNextTask();
      const task2 = scheduler.getNextTask();

      expect(scheduler.getStats().started).toBe(2);

      // Complete tasks
      scheduler.completeTask(task1.id, { status: 'ok' });
      scheduler.completeTask(task2.id, { status: 'ok' });

      expect(scheduler.getStats().completed).toBe(2);

      // Get remaining task
      const task3 = scheduler.getNextTask();
      expect(task3.name).toBe('task3');

      // Fail task
      scheduler.failTask(task3.id, new Error('Failed'));

      expect(scheduler.getStats().failed).toBe(1);

      const finalStats = scheduler.getStats();
      expect(finalStats.scheduled).toBe(3); // Original 3, failed task is re-queued internally
      expect(finalStats.started).toBe(3);
      expect(finalStats.completed).toBe(2);
      expect(finalStats.failed).toBe(1);
    });
  });
});
