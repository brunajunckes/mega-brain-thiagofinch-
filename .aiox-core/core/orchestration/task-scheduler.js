/**
 * Task Scheduler - Dynamic scheduling with priority adjustment
 * @module core/orchestration/task-scheduler
 * @version 1.0.0
 */

const EventEmitter = require('events');
const PriorityQueue = require('./priority-queue');

/**
 * TaskScheduler - Schedules and manages task execution with dynamic priority
 */
class TaskScheduler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.priorityQueue = new PriorityQueue(options.priorityQueue || {});
    this.executingTasks = new Map(); // taskId -> { task, startTime, priority }
    this.completedTasks = new Map(); // taskId -> { task, completionTime, duration }

    // Configuration
    this.maxConcurrentTasks = options.maxConcurrentTasks || 10;
    this.taskTimeoutMs = options.taskTimeoutMs || 30000;
    this.enableDynamicAdjustment = options.enableDynamicAdjustment !== false;

    this.stats = {
      scheduled: 0,
      started: 0,
      completed: 0,
      failed: 0,
      timedOut: 0,
      priorityAdjustments: 0
    };

    // Forward priority queue events
    this.priorityQueue.on('task-enqueued', (data) => {
      this.emit('task-enqueued', data);
    });

    this.priorityQueue.on('task-dequeued', (data) => {
      this.emit('task-dequeued', data);
    });

    this.priorityQueue.on('task-aged', (data) => {
      this.emit('task-aged', data);
    });

    this.priorityQueue.on('priority-updated', (data) => {
      this.emit('priority-updated', data);
    });
  }

  /**
   * Schedule a task with optional priority
   */
  scheduleTask(task, priority = 'MEDIUM') {
    const taskId = this.priorityQueue.enqueue(task, priority);
    this.stats.scheduled++;

    this.emit('task-scheduled', {
      taskId,
      priority,
      queueSize: this.priorityQueue.size()
    });

    return taskId;
  }

  /**
   * Get next task to execute
   */
  getNextTask() {
    if (this.executingTasks.size >= this.maxConcurrentTasks) {
      return null;
    }

    const task = this.priorityQueue.dequeue();
    if (!task) {
      return null;
    }

    // Mark as executing
    this.executingTasks.set(task.id, {
      task,
      startTime: Date.now(),
      priority: this.priorityQueue.taskMetadata.get(task.id)?.priority
    });

    this.stats.started++;

    this.emit('task-started', {
      taskId: task.id,
      priority: this.executingTasks.get(task.id).priority,
      executingCount: this.executingTasks.size
    });

    return task;
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId, result) {
    const executing = this.executingTasks.get(taskId);
    if (!executing) {
      return false;
    }

    const duration = Date.now() - executing.startTime;
    this.executingTasks.delete(taskId);

    this.completedTasks.set(taskId, {
      task: executing.task,
      completionTime: Date.now(),
      duration,
      result
    });

    this.stats.completed++;

    this.emit('task-completed', {
      taskId,
      duration,
      priority: executing.priority,
      result
    });

    return true;
  }

  /**
   * Mark task as failed
   */
  failTask(taskId, error) {
    const executing = this.executingTasks.get(taskId);
    if (!executing) {
      return false;
    }

    const duration = Date.now() - executing.startTime;
    this.executingTasks.delete(taskId);

    // For failures, try to re-queue the task
    const metadata = this.priorityQueue.taskMetadata.get(taskId);
    if (metadata) {
      // Boost priority on failure (urgent retry)
      const newPriority = Math.max(0, metadata.priority - 1);
      this.priorityQueue.enqueue(executing.task, newPriority);
    }

    this.stats.failed++;

    this.emit('task-failed', {
      taskId,
      duration,
      error: error.message || error
    });

    return true;
  }

  /**
   * Timeout a task
   */
  timeoutTask(taskId) {
    const executing = this.executingTasks.get(taskId);
    if (!executing) {
      return false;
    }

    const duration = Date.now() - executing.startTime;
    this.executingTasks.delete(taskId);

    this.stats.timedOut++;

    this.emit('task-timedout', {
      taskId,
      duration,
      timeout: this.taskTimeoutMs
    });

    return true;
  }

  /**
   * Adjust task priority dynamically based on execution metrics
   */
  adjustTaskPriority(taskId, adjustment = 'boost') {
    const metadata = this.priorityQueue.taskMetadata.get(taskId);
    if (!metadata) {
      return false;
    }

    const oldPriority = metadata.priority;
    let newPriority = oldPriority;

    if (adjustment === 'boost') {
      newPriority = Math.max(0, newPriority - 1);
    } else if (adjustment === 'demote') {
      newPriority = Math.min(2, newPriority + 1);
    } else {
      // Direct priority level (string or number)
      const normalized = this.priorityQueue.normalizePriority(adjustment);
      newPriority = normalized;
    }

    if (newPriority !== oldPriority) {
      const success = this.priorityQueue.updatePriority(taskId, newPriority);
      if (success) {
        this.stats.priorityAdjustments++;
        this.emit('task-priority-adjusted', {
          taskId,
          oldPriority,
          newPriority,
          reason: adjustment
        });
      }
      return success;
    }

    return false;
  }

  /**
   * Get task statistics
   */
  getExecutionStats(taskId) {
    const executing = this.executingTasks.get(taskId);
    if (executing) {
      return {
        status: 'executing',
        duration: Date.now() - executing.startTime,
        priority: executing.priority
      };
    }

    const completed = this.completedTasks.get(taskId);
    if (completed) {
      return {
        status: 'completed',
        duration: completed.duration,
        result: completed.result
      };
    }

    const metadata = this.priorityQueue.taskMetadata.get(taskId);
    if (metadata) {
      return {
        status: 'queued',
        priority: metadata.priority,
        waitTime: Date.now() - metadata.enqueueTime
      };
    }

    return null;
  }

  /**
   * Get all stats
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.priorityQueue.size(),
      executingCount: this.executingTasks.size,
      completedCount: this.completedTasks.size,
      maxConcurrent: this.maxConcurrentTasks,
      utilizationRatio: this.executingTasks.size / this.maxConcurrentTasks
    };
  }

  /**
   * Get queue info
   */
  getQueueInfo() {
    return {
      size: this.priorityQueue.size(),
      sizeByPriority: this.priorityQueue.getSizeByPriority(),
      executing: this.executingTasks.size,
      maxConcurrent: this.maxConcurrentTasks
    };
  }

  /**
   * Get all pending tasks
   */
  getPendingTasks() {
    return this.priorityQueue.getAllTasks();
  }

  /**
   * Get all executing tasks
   */
  getExecutingTasks() {
    const executing = [];
    for (const [taskId, info] of this.executingTasks) {
      executing.push({
        taskId,
        task: info.task,
        duration: Date.now() - info.startTime,
        priority: info.priority
      });
    }
    return executing;
  }

  /**
   * Clear all queues
   */
  clear() {
    const queueCleared = this.priorityQueue.clear();
    this.executingTasks.clear();
    this.completedTasks.clear();

    this.emit('scheduler-cleared', {
      queueCleared,
      executingCount: 0,
      completedCount: 0
    });

    return queueCleared;
  }

  /**
   * Shutdown scheduler
   */
  shutdown() {
    this.priorityQueue.stopAgingTimer();
    this.clear();
    this.emit('scheduler-shutdown');
  }
}

module.exports = TaskScheduler;
