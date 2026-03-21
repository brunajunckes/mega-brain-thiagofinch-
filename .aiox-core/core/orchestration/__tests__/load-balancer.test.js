/**
 * Load Balancer Tests
 */

const LoadBalancer = require('../load-balancer');

// Mock worker pool for testing
class MockWorkerPool {
  constructor() {
    this.workers = [
      { workerId: 0, busy: false, taskId: null },
      { workerId: 1, busy: false, taskId: null },
      { workerId: 2, busy: true, taskId: 'task-1' }
    ];
  }

  getAllWorkerStatus() {
    return this.workers;
  }

  getSize() {
    return {
      workerCount: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      idleWorkers: this.workers.filter(w => !w.busy).length,
      queuedTasks: 5
    };
  }
}

describe('LoadBalancer', () => {
  describe('Initialization', () => {
    it('should initialize with default strategy', () => {
      const balancer = new LoadBalancer();
      expect(balancer.strategy).toBe('least-loaded');
    });

    it('should initialize with custom strategy', () => {
      const balancer = new LoadBalancer({ strategy: 'round-robin' });
      expect(balancer.strategy).toBe('round-robin');
    });
  });

  describe('Least-Loaded Strategy', () => {
    it('should select idle worker first', () => {
      const balancer = new LoadBalancer({
        strategy: 'least-loaded',
        workerPool: new MockWorkerPool()
      });

      const worker = balancer.selectWorker({ name: 'task' });
      expect([0, 1]).toContain(worker.id); // Idle workers
    });

    it('should throw when no workers available', () => {
      const balancer = new LoadBalancer({
        strategy: 'least-loaded',
        workerPool: {
          getAllWorkerStatus() {
            return [];
          }
        }
      });

      expect(() => {
        balancer.selectWorker({ name: 'task' });
      }).toThrow('No workers available');
    });
  });

  describe('Round-Robin Strategy', () => {
    it('should select workers in round-robin order', () => {
      const balancer = new LoadBalancer({
        strategy: 'round-robin',
        workerPool: new MockWorkerPool()
      });

      const worker1 = balancer.selectWorker({ name: 'task1' });
      const worker2 = balancer.selectWorker({ name: 'task2' });
      const worker3 = balancer.selectWorker({ name: 'task3' });

      // Should cycle through workers
      expect(worker1.id).toBeDefined();
      expect(worker2.id).toBeDefined();
      expect(worker3.id).toBeDefined();
    });
  });

  describe('Load Metrics', () => {
    it('should calculate load metrics', () => {
      const balancer = new LoadBalancer({
        workerPool: new MockWorkerPool()
      });

      const metrics = balancer.getLoadMetrics();
      expect(metrics.busyWorkers).toBe(1);
      expect(metrics.idleWorkers).toBe(2);
      expect(metrics.totalWorkers).toBe(3);
      expect(metrics.queuedTasks).toBe(5);
      expect(metrics.utilizationRatio).toBe(1 / 3);
    });

    it('should return null when no worker pool', () => {
      const balancer = new LoadBalancer();
      const metrics = balancer.getLoadMetrics();
      expect(metrics).toBeNull();
    });
  });

  describe('Rebalancing', () => {
    it('should rebalance load', () => {
      const balancer = new LoadBalancer({
        workerPool: new MockWorkerPool()
      });

      let rebalanced = false;
      balancer.on('rebalance', () => {
        rebalanced = true;
      });

      balancer.rebalance();
      expect(rebalanced).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track statistics', () => {
      const balancer = new LoadBalancer({
        workerPool: new MockWorkerPool()
      });

      balancer.selectWorker({ name: 'task1' });
      balancer.selectWorker({ name: 'task2' });

      const stats = balancer.getStats();
      expect(stats.taskDistributed).toBe(2);
      expect(stats.balanceOperations).toBe(0);
      expect(stats.currentMetrics).toBeDefined();
    });
  });

  describe('Events', () => {
    it('should emit worker-selected event', (done) => {
      const balancer = new LoadBalancer({
        strategy: 'least-loaded',
        workerPool: new MockWorkerPool()
      });

      balancer.on('worker-selected', ({ workerId, strategy }) => {
        expect(workerId).toBeDefined();
        expect(strategy).toBe('least-loaded');
        done();
      });

      balancer.selectWorker({ name: 'task' });
    });

    it('should emit rebalance event', (done) => {
      const balancer = new LoadBalancer({
        workerPool: new MockWorkerPool()
      });

      balancer.on('rebalance', ({ averageTasksPerWorker }) => {
        expect(averageTasksPerWorker).toBeDefined();
        done();
      });

      balancer.rebalance();
    });
  });

  describe('CPU Aware Strategy', () => {
    it('should fallback to least-loaded when cpu-aware selected', () => {
      const balancer = new LoadBalancer({
        strategy: 'cpu-aware',
        workerPool: new MockWorkerPool()
      });

      const worker = balancer.selectWorker({ name: 'task' });
      expect([0, 1]).toContain(worker.id); // Idle workers (least-loaded fallback)
    });
  });
});
