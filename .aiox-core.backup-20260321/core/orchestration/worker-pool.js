/**
 * Worker Pool - Multi-process task execution
 * @module core/orchestration/worker-pool
 * @version 1.0.0
 */

const { Worker } = require('worker_threads');
const EventEmitter = require('events');
const TaskQueue = require('./task-queue');

/**
 * WorkerPool - Manages multiple workers processing tasks from queue
 */
class WorkerPool extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workerCount = options.workerCount || 4;
    this.maxWorkersQueueSize = options.maxWorkersQueueSize || 100;
    this.workerScript = options.workerScript || './worker-thread.js';

    this.workers = [];
    this.taskQueue = new TaskQueue(options.queue || {});
    this.activeWorkers = new Map();
    this.stats = {
      tasksProcessed: 0,
      tasksFailed: 0,
      workersCreated: 0,
      workersRestarted: 0
    };
  }

  /**
   * Initialize worker pool
   */
  async initialize() {
    for (let i = 0; i < this.workerCount; i++) {
      this._createWorker(i);
    }
    this.emit('pool-initialized', { workerCount: this.workerCount });
  }

  /**
   * Create a worker thread
   */
  _createWorker(workerId) {
    const worker = new Worker(this.workerScript, {
      workerData: { workerId }
    });

    worker.on('message', (msg) => this._handleWorkerMessage(workerId, msg));
    worker.on('error', (err) => this._handleWorkerError(workerId, err));
    worker.on('exit', (code) => this._handleWorkerExit(workerId, code));

    this.workers[workerId] = worker;
    this.activeWorkers.set(workerId, { busy: false, taskId: null });
    this.stats.workersCreated++;

    this.emit('worker-created', { workerId });
  }

  /**
   * Process next task in queue
   */
  async processNextTask(workerId) {
    const worker = this.workers[workerId];
    if (!worker) return;

    const task = this.taskQueue.dequeue();
    if (!task) return;

    const metadata = this.activeWorkers.get(workerId);
    metadata.busy = true;
    metadata.taskId = task._taskId;
    metadata.startTime = Date.now();

    worker.postMessage({
      type: 'execute-task',
      task
    });

    this.emit('task-processing', { workerId, taskId: task._taskId });
  }

  /**
   * Handle worker message
   */
  _handleWorkerMessage(workerId, msg) {
    const metadata = this.activeWorkers.get(workerId);

    if (msg.type === 'task-complete') {
      const duration = Date.now() - metadata.startTime;
      this.taskQueue.recordCompletion(metadata.taskId, msg.success, msg.error);

      if (msg.success) {
        this.stats.tasksProcessed++;
      } else {
        this.stats.tasksFailed++;
      }

      this.emit('task-completed', {
        workerId,
        taskId: metadata.taskId,
        success: msg.success,
        duration,
        error: msg.error
      });

      // Mark worker as available
      metadata.busy = false;
      metadata.taskId = null;

      // Process next task
      this.processNextTask(workerId);

    } else if (msg.type === 'ready') {
      metadata.busy = false;
      this.processNextTask(workerId);
    }
  }

  /**
   * Handle worker error
   */
  _handleWorkerError(workerId, error) {
    this.emit('worker-error', { workerId, error: error.message });
  }

  /**
   * Handle worker exit
   */
  _handleWorkerExit(workerId, code) {
    this.emit('worker-exit', { workerId, exitCode: code });

    // Auto-restart worker
    if (code !== 0) {
      this.stats.workersRestarted++;
      this._createWorker(workerId);
    }
  }

  /**
   * Enqueue task
   */
  enqueueTask(task, priority = 'medium') {
    return this.taskQueue.enqueue(task, priority);
  }

  /**
   * Get pool size
   */
  getSize() {
    return {
      workerCount: this.workerCount,
      busyWorkers: Array.from(this.activeWorkers.values()).filter(w => w.busy).length,
      idleWorkers: Array.from(this.activeWorkers.values()).filter(w => !w.busy).length,
      queuedTasks: this.taskQueue.size()
    };
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueStats: this.taskQueue.getStats(),
      poolSize: this.getSize()
    };
  }

  /**
   * Start worker pool processing
   */
  start() {
    for (let i = 0; i < this.workerCount; i++) {
      this.processNextTask(i);
    }
    this.emit('pool-started');
  }

  /**
   * Stop worker pool gracefully
   */
  async stop(timeout = 5000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        // Force terminate workers
        for (const worker of this.workers) {
          if (worker) worker.terminate();
        }
        this.workers = [];
        resolve();
      }, timeout);

      // Wait for workers to finish
      const checkInterval = setInterval(() => {
        const allIdle = Array.from(this.activeWorkers.values()).every(w => !w.busy);
        if (allIdle && this.taskQueue.size() === 0) {
          clearInterval(checkInterval);
          clearTimeout(timer);

          for (const worker of this.workers) {
            if (worker) worker.terminate();
          }
          this.workers = [];
          this.emit('pool-stopped');
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Get worker status
   */
  getWorkerStatus(workerId) {
    return this.activeWorkers.get(workerId) || null;
  }

  /**
   * Get all worker statuses
   */
  getAllWorkerStatus() {
    return Array.from(this.activeWorkers.entries()).map(([id, status]) => ({
      workerId: id,
      ...status
    }));
  }
}

module.exports = WorkerPool;
