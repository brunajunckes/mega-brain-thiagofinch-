/**
 * Resource Allocator - Task resource specification and limit enforcement
 * @module core/orchestration/resource-allocator
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * ResourceAllocator - Manages task resource requests and limits
 */
class ResourceAllocator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workerLimits = {
      maxCpuMHz: options.maxCpuMHz || 4000,
      maxMemoryMB: options.maxMemoryMB || 2048,
      maxConcurrentTasks: options.maxConcurrentTasks || 50
    };

    this.taskLimits = {
      defaultCpuMHz: options.defaultCpuMHz || 500,
      defaultMemoryMB: options.defaultMemoryMB || 256,
      defaultTimeoutMs: options.defaultTimeoutMs || 300000, // 5 minutes
      maxTimeoutMs: options.maxTimeoutMs || 3600000 // 1 hour
    };

    this.allocations = new Map(); // taskId -> allocation
    this.workerUsage = {
      cpuMHz: 0,
      memoryMB: 0,
      activeTasks: 0
    };

    this.stats = {
      allocationsCreated: 0,
      allocationsFailed: 0,
      allocationsReleased: 0,
      timeoutsEnforced: 0,
      errors: 0
    };

    this.taskTimers = new Map(); // taskId -> timeout handle
  }

  /**
   * Create resource allocation for a task
   */
  allocateTask(taskId, resourceRequest = {}) {
    const cpuMHz = resourceRequest.cpuMHz || this.taskLimits.defaultCpuMHz;
    const memoryMB = resourceRequest.memoryMB || this.taskLimits.defaultMemoryMB;
    const timeoutMs = resourceRequest.timeoutMs || this.taskLimits.defaultTimeoutMs;

    // Validate timeout
    if (timeoutMs > this.taskLimits.maxTimeoutMs) {
      this.stats.allocationsFailed++;
      this.emit('allocation-failed', {
        taskId,
        reason: `Timeout ${timeoutMs}ms exceeds max ${this.taskLimits.maxTimeoutMs}ms`
      });
      throw new Error(`Timeout exceeds maximum allowed: ${timeoutMs}ms`);
    }

    // Check worker limits
    if (!this._canAllocate(cpuMHz, memoryMB)) {
      this.stats.allocationsFailed++;
      this.emit('allocation-failed', {
        taskId,
        reason: 'Worker limits exceeded',
        requested: { cpuMHz, memoryMB },
        available: this._getAvailableResources()
      });
      throw new Error('Worker resource limits exceeded');
    }

    // Create allocation
    const allocation = {
      taskId,
      cpuMHz,
      memoryMB,
      timeoutMs,
      allocatedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      status: 'allocated'
    };

    this.allocations.set(taskId, allocation);
    this.workerUsage.cpuMHz += cpuMHz;
    this.workerUsage.memoryMB += memoryMB;
    this.workerUsage.activeTasks += 1;

    this.stats.allocationsCreated++;

    this.emit('task-allocated', {
      taskId,
      cpuMHz,
      memoryMB,
      timeoutMs,
      workerUsage: { ...this.workerUsage }
    });

    return allocation;
  }

  /**
   * Start task execution
   */
  startTask(taskId, callback) {
    const allocation = this.allocations.get(taskId);
    if (!allocation) {
      throw new Error(`No allocation found for task: ${taskId}`);
    }

    allocation.startedAt = Date.now();
    allocation.status = 'running';

    // Set timeout enforcer
    const timeoutHandle = setTimeout(() => {
      this._enforceTimeout(taskId, callback);
    }, allocation.timeoutMs);

    this.taskTimers.set(taskId, timeoutHandle);

    this.emit('task-started', {
      taskId,
      startTime: allocation.startedAt,
      timeoutMs: allocation.timeoutMs
    });
  }

  /**
   * Complete task execution
   */
  completeTask(taskId) {
    const allocation = this.allocations.get(taskId);
    if (!allocation) {
      return;
    }

    allocation.completedAt = Date.now();
    allocation.status = 'completed';
    allocation.duration = allocation.completedAt - allocation.startedAt;

    // Clear timeout
    const timer = this.taskTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.taskTimers.delete(taskId);
    }

    // Release resources
    this._releaseResources(allocation);

    this.stats.allocationsReleased++;

    this.emit('task-completed', {
      taskId,
      duration: allocation.duration,
      cpuMHz: allocation.cpuMHz,
      memoryMB: allocation.memoryMB,
      workerUsage: { ...this.workerUsage }
    });
  }

  /**
   * Cancel task and release resources
   */
  cancelTask(taskId, reason = 'cancelled') {
    const allocation = this.allocations.get(taskId);
    if (!allocation) {
      return;
    }

    allocation.completedAt = Date.now();
    allocation.status = 'cancelled';
    allocation.cancelReason = reason;

    // Clear timeout
    const timer = this.taskTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.taskTimers.delete(taskId);
    }

    // Release resources
    this._releaseResources(allocation);

    this.emit('task-cancelled', {
      taskId,
      reason,
      workerUsage: { ...this.workerUsage }
    });
  }

  /**
   * Enforce timeout for task
   */
  _enforceTimeout(taskId, callback) {
    const allocation = this.allocations.get(taskId);
    if (!allocation || allocation.status !== 'running') {
      return;
    }

    allocation.completedAt = Date.now();
    allocation.status = 'timeout';
    allocation.duration = allocation.completedAt - allocation.startedAt;

    // Release resources
    this._releaseResources(allocation);

    this.stats.timeoutsEnforced++;

    this.emit('task-timeout', {
      taskId,
      duration: allocation.duration,
      timeoutMs: allocation.timeoutMs
    });

    // Call timeout callback
    if (typeof callback === 'function') {
      callback(taskId, 'timeout');
    }
  }

  /**
   * Release task resources
   */
  _releaseResources(allocation) {
    this.workerUsage.cpuMHz -= allocation.cpuMHz;
    this.workerUsage.memoryMB -= allocation.memoryMB;
    this.workerUsage.activeTasks -= 1;

    // Ensure non-negative
    this.workerUsage.cpuMHz = Math.max(0, this.workerUsage.cpuMHz);
    this.workerUsage.memoryMB = Math.max(0, this.workerUsage.memoryMB);
    this.workerUsage.activeTasks = Math.max(0, this.workerUsage.activeTasks);
  }

  /**
   * Check if resources can be allocated
   */
  _canAllocate(cpuMHz, memoryMB) {
    // Check CPU limit
    if (this.workerUsage.cpuMHz + cpuMHz > this.workerLimits.maxCpuMHz) {
      return false;
    }

    // Check memory limit
    if (this.workerUsage.memoryMB + memoryMB > this.workerLimits.maxMemoryMB) {
      return false;
    }

    // Check concurrent task limit
    if (this.workerUsage.activeTasks >= this.workerLimits.maxConcurrentTasks) {
      return false;
    }

    return true;
  }

  /**
   * Get available resources
   */
  _getAvailableResources() {
    return {
      cpuMHz: this.workerLimits.maxCpuMHz - this.workerUsage.cpuMHz,
      memoryMB: this.workerLimits.maxMemoryMB - this.workerUsage.memoryMB,
      concurrentSlots: this.workerLimits.maxConcurrentTasks - this.workerUsage.activeTasks
    };
  }

  /**
   * Get allocation for task
   */
  getAllocation(taskId) {
    return this.allocations.get(taskId) || null;
  }

  /**
   * Get current resource usage
   */
  getWorkerUsage() {
    return {
      ...this.workerUsage,
      limits: this.workerLimits,
      available: this._getAvailableResources()
    };
  }

  /**
   * Get all allocations
   */
  getAllAllocations() {
    const allocations = [];
    for (const [taskId, allocation] of this.allocations) {
      allocations.push(allocation);
    }
    return allocations;
  }

  /**
   * Get allocations by status
   */
  getAllocationsByStatus(status) {
    const matching = [];
    for (const [taskId, allocation] of this.allocations) {
      if (allocation.status === status) {
        matching.push(allocation);
      }
    }
    return matching;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentUsage: { ...this.workerUsage },
      totalAllocations: this.allocations.size,
      activeTimers: this.taskTimers.size
    };
  }

  /**
   * Clear all allocations
   */
  clearAll() {
    // Clear all timers
    for (const [taskId, timer] of this.taskTimers) {
      clearTimeout(timer);
    }
    this.taskTimers.clear();

    this.allocations.clear();
    this.workerUsage = {
      cpuMHz: 0,
      memoryMB: 0,
      activeTasks: 0
    };

    this.emit('cleared', {
      timestamp: Date.now()
    });
  }
}

module.exports = ResourceAllocator;
