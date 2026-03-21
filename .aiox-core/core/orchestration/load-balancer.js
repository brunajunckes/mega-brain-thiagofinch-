/**
 * Load Balancer - Distributes tasks to workers
 * @module core/orchestration/load-balancer
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * LoadBalancer - Distributes load across workers
 */
class LoadBalancer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.strategy = options.strategy || 'least-loaded'; // least-loaded, round-robin, cpu-aware
    this.workerPool = options.workerPool;
    this.stats = {
      taskDistributed: 0,
      balanceOperations: 0
    };
  }

  /**
   * Select worker for task
   */
  selectWorker(task) {
    if (!this.workerPool) {
      throw new Error('Worker pool not set');
    }

    let selectedWorker;

    switch (this.strategy) {
      case 'least-loaded':
        selectedWorker = this._selectLeastLoaded();
        break;
      case 'round-robin':
        selectedWorker = this._selectRoundRobin();
        break;
      case 'cpu-aware':
        selectedWorker = this._selectCpuAware();
        break;
      default:
        selectedWorker = this._selectLeastLoaded();
    }

    this.stats.taskDistributed++;
    this.emit('worker-selected', { workerId: selectedWorker.id, strategy: this.strategy });

    return selectedWorker;
  }

  /**
   * Select least loaded worker
   */
  _selectLeastLoaded() {
    const workers = this.workerPool.getAllWorkerStatus();
    if (workers.length === 0) {
      throw new Error('No workers available');
    }

    // Find idle workers first
    const idleWorkers = workers.filter(w => !w.busy);
    if (idleWorkers.length > 0) {
      return { id: idleWorkers[0].workerId };
    }

    // If all busy, return least busy
    return workers.reduce((least, current) => {
      const currentLoad = current.busy ? 1 : 0;
      const leastLoad = least.busy ? 1 : 0;
      return currentLoad <= leastLoad ? current : least;
    });
  }

  /**
   * Select worker using round-robin
   */
  _selectRoundRobin() {
    if (!this.lastSelectedWorker) {
      this.lastSelectedWorker = 0;
    }

    const workers = this.workerPool.getAllWorkerStatus();
    if (workers.length === 0) {
      throw new Error('No workers available');
    }

    const selected = workers[this.lastSelectedWorker % workers.length];
    this.lastSelectedWorker++;

    return { id: selected.workerId };
  }

  /**
   * Select worker aware of CPU usage (requires monitoring)
   */
  _selectCpuAware() {
    // Fallback to least-loaded if CPU metrics not available
    return this._selectLeastLoaded();
  }

  /**
   * Rebalance tasks across workers
   */
  rebalance() {
    if (!this.workerPool) {
      return;
    }

    const poolSize = this.workerPool.getSize();
    const avgTasksPerWorker = poolSize.queuedTasks / poolSize.workerCount;

    this.stats.balanceOperations++;
    this.emit('rebalance', {
      averageTasksPerWorker: avgTasksPerWorker,
      totalTasks: poolSize.queuedTasks,
      workerCount: poolSize.workerCount
    });

    // Rebalancing logic could be implemented here
    // For now, it's just metrics collection
  }

  /**
   * Get load metrics
   */
  getLoadMetrics() {
    if (!this.workerPool) {
      return null;
    }

    const poolSize = this.workerPool.getSize();
    return {
      busyWorkers: poolSize.busyWorkers,
      idleWorkers: poolSize.idleWorkers,
      totalWorkers: poolSize.workerCount,
      queuedTasks: poolSize.queuedTasks,
      utilizationRatio: poolSize.busyWorkers / poolSize.workerCount,
      averageTasksPerWorker: poolSize.queuedTasks / poolSize.workerCount
    };
  }

  /**
   * Get load balancer statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentMetrics: this.getLoadMetrics()
    };
  }
}

module.exports = LoadBalancer;
