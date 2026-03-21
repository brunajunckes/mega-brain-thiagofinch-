/**
 * Priority Queue Tests
 */

const PriorityQueue = require('../priority-queue');

describe('PriorityQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new PriorityQueue({ enableAging: false });
  });

  afterEach(() => {
    queue.stopAgingTimer();
  });

  describe('Initialization', () => {
    it('should initialize with default priority levels', () => {
      expect(queue.priorities.HIGH).toBe(0);
      expect(queue.priorities.MEDIUM).toBe(1);
      expect(queue.priorities.LOW).toBe(2);
    });

    it('should initialize with empty queues', () => {
      expect(queue.size()).toBe(0);
      expect(queue.getSizeByPriority()).toEqual({
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      });
    });
  });

  describe('Priority Normalization', () => {
    it('should normalize string priorities', () => {
      expect(queue.normalizePriority('HIGH')).toBe(0);
      expect(queue.normalizePriority('MEDIUM')).toBe(1);
      expect(queue.normalizePriority('LOW')).toBe(2);
    });

    it('should normalize number priorities', () => {
      expect(queue.normalizePriority(0)).toBe(0);
      expect(queue.normalizePriority(1)).toBe(1);
      expect(queue.normalizePriority(2)).toBe(2);
    });

    it('should default to MEDIUM for invalid priority', () => {
      expect(queue.normalizePriority('INVALID')).toBe(1);
      expect(queue.normalizePriority(99)).toBe(1);
    });
  });

  describe('Enqueue/Dequeue', () => {
    it('should enqueue and dequeue in priority order', () => {
      const task1 = { name: 'low' };
      const task2 = { name: 'high' };
      const task3 = { name: 'medium' };

      queue.enqueue(task1, 'LOW');
      queue.enqueue(task2, 'HIGH');
      queue.enqueue(task3, 'MEDIUM');

      const dequeued1 = queue.dequeue();
      const dequeued2 = queue.dequeue();
      const dequeued3 = queue.dequeue();

      expect(dequeued1.name).toBe('high');
      expect(dequeued2.name).toBe('medium');
      expect(dequeued3.name).toBe('low');
    });

    it('should return null when queue is empty', () => {
      expect(queue.dequeue()).toBeNull();
    });

    it('should maintain FIFO within same priority', () => {
      const task1 = { name: 'first' };
      const task2 = { name: 'second' };
      const task3 = { name: 'third' };

      queue.enqueue(task1, 'MEDIUM');
      queue.enqueue(task2, 'MEDIUM');
      queue.enqueue(task3, 'MEDIUM');

      expect(queue.dequeue().name).toBe('first');
      expect(queue.dequeue().name).toBe('second');
      expect(queue.dequeue().name).toBe('third');
    });
  });

  describe('Peek', () => {
    it('should peek at next task without removing', () => {
      const task1 = { name: 'task1' };
      const task2 = { name: 'task2' };

      queue.enqueue(task1, 'HIGH');
      queue.enqueue(task2, 'LOW');

      const peeked1 = queue.peek();
      expect(peeked1.name).toBe('task1');

      const peeked2 = queue.peek();
      expect(peeked2.name).toBe('task1'); // Same task

      const dequeued = queue.dequeue();
      expect(dequeued.name).toBe('task1');

      const peeked3 = queue.peek();
      expect(peeked3.name).toBe('task2');
    });

    it('should return null when peeking empty queue', () => {
      expect(queue.peek()).toBeNull();
    });
  });

  describe('Priority Updates', () => {
    it('should update task priority', () => {
      const task = { name: 'test' };
      const taskId = queue.enqueue(task, 'LOW');

      expect(queue.getSizeByPriority().LOW).toBe(1);

      const success = queue.updatePriority(taskId, 'HIGH');
      expect(success).toBe(true);

      expect(queue.getSizeByPriority().LOW).toBe(0);
      expect(queue.getSizeByPriority().HIGH).toBe(1);
    });

    it('should return false for non-existent task', () => {
      const success = queue.updatePriority('nonexistent', 'HIGH');
      expect(success).toBe(false);
    });
  });

  describe('Aging', () => {
    it('should age tasks after threshold', (done) => {
      const queue = new PriorityQueue({
        enableAging: true,
        agingIntervalMs: 100,
        agingThresholdMs: 150
      });

      const task = { name: 'task' };
      const taskId = queue.enqueue(task, 'LOW');

      expect(queue.getSizeByPriority().LOW).toBe(1);

      setTimeout(() => {
        // After aging threshold, task should be boosted to MEDIUM
        expect(queue.getSizeByPriority().LOW).toBe(0);
        expect(queue.getSizeByPriority().MEDIUM).toBe(1);
        queue.stopAgingTimer();
        done();
      }, 300);
    });

    it('should only age tasks once', (done) => {
      const queue = new PriorityQueue({
        enableAging: true,
        agingIntervalMs: 100,
        agingThresholdMs: 150,
        boostAmount: 1
      });

      const task = { name: 'task' };
      const taskId = queue.enqueue(task, 'LOW');

      setTimeout(() => {
        // After first aging
        expect(queue.getSizeByPriority().MEDIUM).toBe(1);
        expect(queue.getSizeByPriority().LOW).toBe(0);

        // Wait for potential second aging
        setTimeout(() => {
          // Should not age again (already boosted)
          expect(queue.getSizeByPriority().MEDIUM).toBe(1);
          queue.stopAgingTimer();
          done();
        }, 300);
      }, 300);
    });
  });

  describe('Starvation Prevention', () => {
    it('should prevent task starvation', (done) => {
      const queue = new PriorityQueue({
        enableAging: false,
        maxStarvationTime: 150
      });

      const lowTask = { name: 'low-priority' };
      const lowTaskId = queue.enqueue(lowTask, 'LOW');

      // Enqueue high priority tasks to starve the low priority one
      for (let i = 0; i < 5; i++) {
        queue.enqueue({ name: `high-${i}` }, 'HIGH');
      }

      setTimeout(() => {
        // Dequeue high priority tasks
        queue.dequeue(); // high-0
        queue.dequeue(); // high-1
        queue.dequeue(); // high-2
        queue.dequeue(); // high-3
        queue.dequeue(); // high-4

        // Next dequeue should return the starved low-priority task
        const dequeuedTask = queue.dequeue();
        expect(dequeuedTask.name).toBe('low-priority');

        done();
      }, 200);
    });

    it('should boost starved task priority', (done) => {
      const queue = new PriorityQueue({
        enableAging: false,
        maxStarvationTime: 150,
        starvedBoostAmount: 2
      });

      const lowTask = { name: 'task' };
      const taskId = queue.enqueue(lowTask, 'LOW');
      const metadata = queue.taskMetadata.get(taskId);

      setTimeout(() => {
        const starved = queue.findAndRemoveStarvedTask();
        expect(starved).toBeDefined();
        expect(metadata.boosted).toBe(true);
        // Should boost from LOW(2) to HIGH(0) with boost amount of 2
        expect(metadata.priority).toBe(0);
        done();
      }, 200);
    });
  });

  describe('Queue Statistics', () => {
    it('should track statistics', () => {
      const task1 = { name: 'task1' };
      const task2 = { name: 'task2' };

      queue.enqueue(task1, 'HIGH');
      queue.enqueue(task2, 'MEDIUM');

      const stats = queue.getStats();
      expect(stats.enqueued).toBe(2);
      expect(stats.dequeued).toBe(0);
      expect(stats.currentSize).toBe(2);
    });

    it('should track aging statistics', (done) => {
      const queue = new PriorityQueue({
        enableAging: true,
        agingIntervalMs: 100,
        agingThresholdMs: 150
      });

      const task = { name: 'task' };
      queue.enqueue(task, 'LOW');

      setTimeout(() => {
        const stats = queue.getStats();
        expect(stats.aged).toBeGreaterThan(0);
        expect(stats.boosted).toBeGreaterThan(0);
        queue.stopAgingTimer();
        done();
      }, 300);
    });
  });

  describe('Events', () => {
    it('should emit task-enqueued event', (done) => {
      queue.on('task-enqueued', ({ taskId, priority }) => {
        expect(taskId).toBeDefined();
        expect(priority).toBe(1);
        done();
      });

      queue.enqueue({ name: 'task' }, 'MEDIUM');
    });

    it('should emit task-dequeued event', (done) => {
      const task = { name: 'task' };
      queue.enqueue(task, 'HIGH');

      queue.on('task-dequeued', ({ taskId, reason }) => {
        expect(taskId).toBeDefined();
        expect(reason).toBe('normal');
        done();
      });

      queue.dequeue();
    });

    it('should emit task-aged event', (done) => {
      const queue = new PriorityQueue({
        enableAging: true,
        agingIntervalMs: 100,
        agingThresholdMs: 150
      });

      const task = { name: 'task' };
      queue.enqueue(task, 'LOW');

      queue.on('task-aged', ({ taskId, oldPriority, newPriority }) => {
        expect(taskId).toBeDefined();
        expect(oldPriority).toBe(2);
        expect(newPriority).toBeLessThan(oldPriority);
        queue.stopAgingTimer();
        done();
      });
    });

    it('should emit priority-updated event', (done) => {
      const task = { name: 'task' };
      const taskId = queue.enqueue(task, 'LOW');

      queue.on('priority-updated', ({ taskId: id, oldPriority, newPriority }) => {
        expect(id).toBe(taskId);
        expect(oldPriority).toBe(2);
        expect(newPriority).toBe(0);
        done();
      });

      queue.updatePriority(taskId, 'HIGH');
    });
  });

  describe('Clear and State Management', () => {
    it('should clear all queues', () => {
      queue.enqueue({ name: 'task1' }, 'HIGH');
      queue.enqueue({ name: 'task2' }, 'MEDIUM');
      queue.enqueue({ name: 'task3' }, 'LOW');

      expect(queue.size()).toBe(3);

      const cleared = queue.clear();
      expect(cleared).toBe(3);
      expect(queue.size()).toBe(0);
    });

    it('should return all tasks', () => {
      queue.enqueue({ name: 'task1' }, 'HIGH');
      queue.enqueue({ name: 'task2' }, 'MEDIUM');
      queue.enqueue({ name: 'task3' }, 'LOW');

      const all = queue.getAllTasks();
      expect(all.length).toBe(3);
      expect(all.map(t => t.name).sort()).toEqual(['task1', 'task2', 'task3'].sort());
    });
  });

  describe('Task ID Generation', () => {
    it('should generate task IDs for tasks without IDs', () => {
      const task = { name: 'task' };
      const taskId = queue.enqueue(task);

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      expect(taskId.startsWith('task-')).toBe(true);
    });

    it('should use provided task IDs', () => {
      const task = { id: 'my-task', name: 'task' };
      const taskId = queue.enqueue(task);

      expect(taskId).toBe('my-task');
    });
  });
});
