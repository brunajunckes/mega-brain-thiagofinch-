/**
 * Task Queue - FIFO + Priority-based task distribution
 * @module core/orchestration/task-queue
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * TaskQueue - Manages task distribution with priority support
 */
class TaskQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queues = {
      high: [],
      medium: [],
      low: []
    };
    this.maxQueueSize = options.maxQueueSize || 10000;
    this.stats = {
      enqueued: 0,
      dequeued: 0,
      dropped: 0
    };
    this.taskMetadata = new Map();
  }

  /**
   * Enqueue a task with priority
   */
  enqueue(task, priority = 'medium') {
    if (!['high', 'medium', 'low'].includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    if (this.size() >= this.maxQueueSize) {
      this.stats.dropped++;
      this.emit('queue-full', { task, priority });
      return false;
    }

    // Store task with metadata
    const taskId = task.id || `task-${Date.now()}-${Math.random()}`;
    this.taskMetadata.set(taskId, {
      id: taskId,
      priority,
      enqueuedAt: Date.now(),
      attempts: 0,
      lastError: null
    });

    this.queues[priority].push({
      ...task,
      _taskId: taskId
    });

    this.stats.enqueued++;
    this.emit('task-enqueued', { taskId, priority, queueSize: this.size() });

    return taskId;
  }

  /**
   * Dequeue next task (respects priority: high > medium > low)
   */
  dequeue() {
    // Try high priority first
    if (this.queues.high.length > 0) {
      const task = this.queues.high.shift();
      this._recordDequeue(task._taskId);
      return task;
    }

    // Then medium
    if (this.queues.medium.length > 0) {
      const task = this.queues.medium.shift();
      this._recordDequeue(task._taskId);
      return task;
    }

    // Finally low
    if (this.queues.low.length > 0) {
      const task = this.queues.low.shift();
      this._recordDequeue(task._taskId);
      return task;
    }

    return null;
  }

  /**
   * Peek at next task without removing
   */
  peek() {
    return this.queues.high[0] || this.queues.medium[0] || this.queues.low[0] || null;
  }

  /**
   * Get queue size
   */
  size() {
    return this.queues.high.length + this.queues.medium.length + this.queues.low.length;
  }

  /**
   * Get size by priority
   */
  sizeByPriority() {
    return {
      high: this.queues.high.length,
      medium: this.queues.medium.length,
      low: this.queues.low.length,
      total: this.size()
    };
  }

  /**
   * Clear all queues
   */
  clear() {
    const cleared = this.size();
    this.queues.high = [];
    this.queues.medium = [];
    this.queues.low = [];
    this.taskMetadata.clear();
    this.emit('queue-cleared', { clearedCount: cleared });
    return cleared;
  }

  /**
   * Update task priority (for aging/boosting)
   */
  updatePriority(taskId, newPriority) {
    if (!this.taskMetadata.has(taskId)) {
      return false;
    }

    const metadata = this.taskMetadata.get(taskId);
    const oldPriority = metadata.priority;

    // Find and move task
    for (const priority of ['high', 'medium', 'low']) {
      const index = this.queues[priority].findIndex(t => t._taskId === taskId);
      if (index !== -1) {
        const task = this.queues[priority].splice(index, 1)[0];
        metadata.priority = newPriority;
        this.queues[newPriority].push(task);

        this.emit('priority-updated', { taskId, oldPriority, newPriority });
        return true;
      }
    }

    return false;
  }

  /**
   * Record task dequeue
   */
  _recordDequeue(taskId) {
    const metadata = this.taskMetadata.get(taskId);
    if (metadata) {
      metadata.attempts++;
      metadata.dequeuedAt = Date.now();
    }
    this.stats.dequeued++;
    this.emit('task-dequeued', { taskId });
  }

  /**
   * Record task completion
   */
  recordCompletion(taskId, success = true, error = null) {
    const metadata = this.taskMetadata.get(taskId);
    if (metadata) {
      metadata.completed = true;
      metadata.completedAt = Date.now();
      metadata.success = success;
      metadata.lastError = error;
    }
    this.emit('task-completed', { taskId, success, error });
  }

  /**
   * Get task metadata
   */
  getMetadata(taskId) {
    return this.taskMetadata.get(taskId) || null;
  }

  /**
   * Get all metadata
   */
  getAllMetadata() {
    return Array.from(this.taskMetadata.values());
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentSize: this.size(),
      sizeByPriority: this.sizeByPriority(),
      maxQueueSize: this.maxQueueSize
    };
  }

  /**
   * Drain queue (get all tasks)
   */
  drain() {
    const tasks = [];
    let task;
    while ((task = this.dequeue())) {
      tasks.push(task);
    }
    return tasks;
  }
}

module.exports = TaskQueue;
