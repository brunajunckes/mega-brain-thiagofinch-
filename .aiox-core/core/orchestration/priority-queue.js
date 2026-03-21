/**
 * Priority Queue - Task prioritization with aging and starvation prevention
 * @module core/orchestration/priority-queue
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * PriorityQueue - Manages tasks by priority level with aging
 * Priority levels: HIGH (0), MEDIUM (1), LOW (2)
 */
class PriorityQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.priorities = {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2
    };

    // Queue organized by priority level
    this.queues = {
      [this.priorities.HIGH]: [],
      [this.priorities.MEDIUM]: [],
      [this.priorities.LOW]: []
    };

    // Task metadata tracking
    this.taskMetadata = new Map(); // taskId -> { priority, enqueueTime, accessCount, boosted }

    // Aging configuration
    this.agingIntervalMs = options.agingIntervalMs || 5000; // Age tasks every 5s
    this.agingThresholdMs = options.agingThresholdMs || 30000; // Age after 30s
    this.boostAmount = options.boostAmount || 1; // Boost priority by 1 level when aged

    // Starvation prevention
    this.maxStarvationTime = options.maxStarvationTime || 60000; // Prevent starvation after 60s
    this.starvedBoostAmount = options.starvedBoostAmount || 2; // Emergency boost by 2 levels

    this.stats = {
      enqueued: 0,
      dequeued: 0,
      aged: 0,
      boosted: 0,
      starved: 0
    };

    // Start aging timer if enabled
    if (options.enableAging !== false) {
      this.startAgingTimer();
    }
  }

  /**
   * Parse priority string or number to priority level
   */
  normalizePriority(priority) {
    if (typeof priority === 'string') {
      return this.priorities[priority.toUpperCase()] ?? this.priorities.MEDIUM;
    }
    if (typeof priority === 'number' && priority in Object.values(this.priorities)) {
      return priority;
    }
    return this.priorities.MEDIUM;
  }

  /**
   * Enqueue task with priority
   */
  enqueue(task, priority = 'MEDIUM') {
    const normalizedPriority = this.normalizePriority(priority);
    const taskId = task.id || `task-${Date.now()}-${Math.random()}`;

    // Store task with ID
    const taskWithId = { ...task, id: taskId };

    // Track metadata
    this.taskMetadata.set(taskId, {
      priority: normalizedPriority,
      enqueueTime: Date.now(),
      accessCount: 0,
      boosted: false,
      originalPriority: normalizedPriority
    });

    // Add to appropriate queue
    this.queues[normalizedPriority].push(taskWithId);
    this.stats.enqueued++;

    this.emit('task-enqueued', {
      taskId,
      priority: normalizedPriority,
      queueSize: this.size()
    });

    return taskId;
  }

  /**
   * Dequeue next task (highest priority first)
   */
  dequeue() {
    // Check for starved tasks first
    const starvedTask = this.findAndRemoveStarvedTask();
    if (starvedTask) {
      const metadata = this.taskMetadata.get(starvedTask.id);
      this.stats.dequeued++;
      this.stats.starved++;
      this.emit('task-dequeued', {
        taskId: starvedTask.id,
        priority: metadata.priority,
        reason: 'starved'
      });
      return starvedTask;
    }

    // Check HIGH priority queue
    if (this.queues[this.priorities.HIGH].length > 0) {
      const task = this.queues[this.priorities.HIGH].shift();
      const metadata = this.taskMetadata.get(task.id);
      metadata.accessCount++;
      this.stats.dequeued++;
      this.emit('task-dequeued', {
        taskId: task.id,
        priority: this.priorities.HIGH,
        reason: 'normal'
      });
      return task;
    }

    // Check MEDIUM priority queue
    if (this.queues[this.priorities.MEDIUM].length > 0) {
      const task = this.queues[this.priorities.MEDIUM].shift();
      const metadata = this.taskMetadata.get(task.id);
      metadata.accessCount++;
      this.stats.dequeued++;
      this.emit('task-dequeued', {
        taskId: task.id,
        priority: this.priorities.MEDIUM,
        reason: 'normal'
      });
      return task;
    }

    // Check LOW priority queue
    if (this.queues[this.priorities.LOW].length > 0) {
      const task = this.queues[this.priorities.LOW].shift();
      const metadata = this.taskMetadata.get(task.id);
      metadata.accessCount++;
      this.stats.dequeued++;
      this.emit('task-dequeued', {
        taskId: task.id,
        priority: this.priorities.LOW,
        reason: 'normal'
      });
      return task;
    }

    return null;
  }

  /**
   * Peek at next task without removing
   */
  peek() {
    // Check HIGH priority queue
    if (this.queues[this.priorities.HIGH].length > 0) {
      return this.queues[this.priorities.HIGH][0];
    }

    // Check MEDIUM priority queue
    if (this.queues[this.priorities.MEDIUM].length > 0) {
      return this.queues[this.priorities.MEDIUM][0];
    }

    // Check LOW priority queue
    if (this.queues[this.priorities.LOW].length > 0) {
      return this.queues[this.priorities.LOW][0];
    }

    return null;
  }

  /**
   * Update task priority
   */
  updatePriority(taskId, newPriority) {
    const metadata = this.taskMetadata.get(taskId);
    if (!metadata) {
      return false;
    }

    const oldPriority = metadata.priority;
    const normalizedPriority = this.normalizePriority(newPriority);

    // Find and remove task from old queue
    const oldQueue = this.queues[oldPriority];
    const taskIndex = oldQueue.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return false;
    }

    const task = oldQueue.splice(taskIndex, 1)[0];

    // Add to new queue
    metadata.priority = normalizedPriority;
    this.queues[normalizedPriority].push(task);

    this.emit('priority-updated', {
      taskId,
      oldPriority,
      newPriority: normalizedPriority
    });

    return true;
  }

  /**
   * Find and remove starved task (waiting > maxStarvationTime)
   */
  findAndRemoveStarvedTask() {
    const now = Date.now();

    // Check all queues for starved tasks
    for (const priorityLevel of Object.values(this.priorities)) {
      const queue = this.queues[priorityLevel];
      for (let i = 0; i < queue.length; i++) {
        const task = queue[i];
        const metadata = this.taskMetadata.get(task.id);

        if (now - metadata.enqueueTime > this.maxStarvationTime) {
          const starvedTask = queue.splice(i, 1)[0];
          metadata.boosted = true;
          metadata.priority = Math.max(0, metadata.priority - this.starvedBoostAmount);
          return starvedTask;
        }
      }
    }

    return null;
  }

  /**
   * Age tasks in the queue - boost priority if they've been waiting too long
   */
  ageQueue() {
    const now = Date.now();
    let agedCount = 0;

    for (const priorityLevel of Object.values(this.priorities)) {
      // Only age MEDIUM and LOW priority tasks
      if (priorityLevel === this.priorities.HIGH) {
        continue;
      }

      const queue = this.queues[priorityLevel];
      for (let i = 0; i < queue.length; i++) {
        const task = queue[i];
        const metadata = this.taskMetadata.get(task.id);

        const waitTime = now - metadata.enqueueTime;

        if (waitTime > this.agingThresholdMs && !metadata.boosted) {
          // Remove from current queue
          queue.splice(i, 1);
          i--;

          // Boost priority
          const newPriority = Math.max(0, priorityLevel - this.boostAmount);
          metadata.priority = newPriority;
          metadata.boosted = true;

          // Add to new queue
          this.queues[newPriority].push(task);

          this.stats.aged++;
          this.stats.boosted++;
          agedCount++;

          this.emit('task-aged', {
            taskId: task.id,
            waitTime,
            oldPriority: priorityLevel,
            newPriority,
            threshold: this.agingThresholdMs
          });
        }
      }
    }

    return agedCount;
  }

  /**
   * Start aging timer
   */
  startAgingTimer() {
    this.agingTimer = setInterval(() => {
      this.ageQueue();
    }, this.agingIntervalMs);
  }

  /**
   * Stop aging timer
   */
  stopAgingTimer() {
    if (this.agingTimer) {
      clearInterval(this.agingTimer);
      this.agingTimer = null;
    }
  }

  /**
   * Get queue size
   */
  size() {
    return Object.values(this.queues).reduce((sum, q) => sum + q.length, 0);
  }

  /**
   * Get queue sizes by priority
   */
  getSizeByPriority() {
    return {
      HIGH: this.queues[this.priorities.HIGH].length,
      MEDIUM: this.queues[this.priorities.MEDIUM].length,
      LOW: this.queues[this.priorities.LOW].length
    };
  }

  /**
   * Clear queue
   */
  clear() {
    const cleared = this.size();
    this.queues[this.priorities.HIGH] = [];
    this.queues[this.priorities.MEDIUM] = [];
    this.queues[this.priorities.LOW] = [];
    this.taskMetadata.clear();
    this.emit('queue-cleared', { cleared });
    return cleared;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentSize: this.size(),
      sizeByPriority: this.getSizeByPriority(),
      tasksTracked: this.taskMetadata.size
    };
  }

  /**
   * Get all tasks (for inspection)
   */
  getAllTasks() {
    const all = [];
    for (const priority of Object.values(this.priorities)) {
      all.push(...this.queues[priority]);
    }
    return all;
  }
}

module.exports = PriorityQueue;
