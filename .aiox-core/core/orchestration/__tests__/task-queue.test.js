/**
 * Task Queue Tests
 */

const TaskQueue = require('../task-queue');

describe('TaskQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new TaskQueue({ maxQueueSize: 100 });
  });

  describe('Enqueue/Dequeue', () => {
    it('should enqueue task with priority', () => {
      const taskId = queue.enqueue({ name: 'test' }, 'high');
      expect(taskId).toBeDefined();
      expect(queue.size()).toBe(1);
    });

    it('should dequeue task with priority order', () => {
      queue.enqueue({ name: 'low-task' }, 'low');
      queue.enqueue({ name: 'high-task' }, 'high');
      queue.enqueue({ name: 'medium-task' }, 'medium');

      const task1 = queue.dequeue();
      expect(task1.name).toBe('high-task');

      const task2 = queue.dequeue();
      expect(task2.name).toBe('medium-task');

      const task3 = queue.dequeue();
      expect(task3.name).toBe('low-task');
    });

    it('should return null when queue is empty', () => {
      const task = queue.dequeue();
      expect(task).toBeNull();
    });

    it('should peek without removing', () => {
      queue.enqueue({ name: 'task' }, 'high');
      const peeked = queue.peek();
      expect(peeked.name).toBe('task');
      expect(queue.size()).toBe(1);

      const dequeued = queue.dequeue();
      expect(dequeued.name).toBe('task');
      expect(queue.size()).toBe(0);
    });
  });

  describe('Queue Size', () => {
    it('should track queue size', () => {
      expect(queue.size()).toBe(0);

      queue.enqueue({ name: 'task1' }, 'high');
      expect(queue.size()).toBe(1);

      queue.enqueue({ name: 'task2' }, 'medium');
      expect(queue.size()).toBe(2);

      queue.dequeue();
      expect(queue.size()).toBe(1);
    });

    it('should get size by priority', () => {
      queue.enqueue({ name: 'task1' }, 'high');
      queue.enqueue({ name: 'task2' }, 'high');
      queue.enqueue({ name: 'task3' }, 'medium');
      queue.enqueue({ name: 'task4' }, 'low');

      const sizes = queue.sizeByPriority();
      expect(sizes.high).toBe(2);
      expect(sizes.medium).toBe(1);
      expect(sizes.low).toBe(1);
      expect(sizes.total).toBe(4);
    });
  });

  describe('Queue Limits', () => {
    it('should reject enqueue when queue is full', () => {
      const smallQueue = new TaskQueue({ maxQueueSize: 2 });

      const id1 = smallQueue.enqueue({ name: 'task1' }, 'high');
      expect(id1).toBeDefined();

      const id2 = smallQueue.enqueue({ name: 'task2' }, 'high');
      expect(id2).toBeDefined();

      const id3 = smallQueue.enqueue({ name: 'task3' }, 'high');
      expect(id3).toBe(false);

      expect(smallQueue.getStats().dropped).toBe(1);
    });
  });

  describe('Priority Management', () => {
    it('should update task priority', () => {
      const taskId = queue.enqueue({ name: 'task' }, 'low');
      expect(taskId).toBeDefined();

      const initialMetadata = queue.getMetadata(taskId);
      expect(initialMetadata.priority).toBe('low');

      const updated = queue.updatePriority(taskId, 'high');
      expect(updated).toBe(true);

      const updatedMetadata = queue.getMetadata(taskId);
      expect(updatedMetadata.priority).toBe('high');
    });

    it('should not update non-existent task priority', () => {
      const updated = queue.updatePriority('non-existent', 'high');
      expect(updated).toBe(false);
    });
  });

  describe('Task Metadata', () => {
    it('should track task metadata', () => {
      const taskId = queue.enqueue({ name: 'task' }, 'high');
      const metadata = queue.getMetadata(taskId);

      expect(metadata.id).toBe(taskId);
      expect(metadata.priority).toBe('high');
      expect(metadata.enqueuedAt).toBeDefined();
      expect(metadata.attempts).toBe(0);
    });

    it('should record task completion', () => {
      const taskId = queue.enqueue({ name: 'task' }, 'high');
      queue.dequeue();

      queue.recordCompletion(taskId, true);

      const metadata = queue.getMetadata(taskId);
      expect(metadata.completed).toBe(true);
      expect(metadata.success).toBe(true);
      expect(metadata.completedAt).toBeDefined();
    });

    it('should record task failure', () => {
      const taskId = queue.enqueue({ name: 'task' }, 'high');
      queue.dequeue();

      const error = new Error('Task failed');
      queue.recordCompletion(taskId, false, error.message);

      const metadata = queue.getMetadata(taskId);
      expect(metadata.success).toBe(false);
      expect(metadata.lastError).toBeDefined();
    });
  });

  describe('Queue Operations', () => {
    it('should clear queue', () => {
      queue.enqueue({ name: 'task1' }, 'high');
      queue.enqueue({ name: 'task2' }, 'medium');
      queue.enqueue({ name: 'task3' }, 'low');

      expect(queue.size()).toBe(3);

      queue.clear();

      expect(queue.size()).toBe(0);
      expect(queue.getStats().enqueued).toBe(3);
    });

    it('should drain queue', () => {
      queue.enqueue({ name: 'task1' }, 'high');
      queue.enqueue({ name: 'task2' }, 'medium');
      queue.enqueue({ name: 'task3' }, 'low');

      const tasks = queue.drain();

      expect(tasks).toHaveLength(3);
      expect(queue.size()).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track statistics', () => {
      queue.enqueue({ name: 'task1' }, 'high');
      queue.enqueue({ name: 'task2' }, 'medium');

      queue.dequeue();
      queue.dequeue();

      const stats = queue.getStats();
      expect(stats.enqueued).toBe(2);
      expect(stats.dequeued).toBe(2);
      expect(stats.dropped).toBe(0);
      expect(stats.currentSize).toBe(0);
    });
  });

  describe('Events', () => {
    it('should emit task-enqueued event', (done) => {
      queue.on('task-enqueued', ({ taskId, priority }) => {
        expect(taskId).toBeDefined();
        expect(priority).toBe('high');
        done();
      });

      queue.enqueue({ name: 'task' }, 'high');
    });

    it('should emit task-dequeued event', (done) => {
      const taskId = queue.enqueue({ name: 'task' }, 'high');

      queue.on('task-dequeued', ({ taskId: dequeuedId }) => {
        expect(dequeuedId).toBe(taskId);
        done();
      });

      queue.dequeue();
    });

    it('should emit queue-full event', (done) => {
      const smallQueue = new TaskQueue({ maxQueueSize: 1 });

      smallQueue.on('queue-full', () => {
        done();
      });

      smallQueue.enqueue({ name: 'task1' }, 'high');
      smallQueue.enqueue({ name: 'task2' }, 'high');
    });
  });
});
