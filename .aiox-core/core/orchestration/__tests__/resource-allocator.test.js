/**
 * Resource Allocator and Monitor Tests
 */

const ResourceAllocator = require('../resource-allocator');
const ResourceMonitor = require('../resource-monitor');

describe('ResourceAllocator', () => {
  let allocator;

  beforeEach(() => {
    allocator = new ResourceAllocator({
      maxCpuMHz: 4000,
      maxMemoryMB: 2048,
      maxConcurrentTasks: 50
    });
  });

  describe('Initialization', () => {
    it('should initialize with default limits', () => {
      const usage = allocator.getWorkerUsage();
      expect(usage.cpuMHz).toBe(0);
      expect(usage.memoryMB).toBe(0);
      expect(usage.activeTasks).toBe(0);
    });

    it('should use provided limits', () => {
      const custom = new ResourceAllocator({
        maxCpuMHz: 8000,
        maxMemoryMB: 4096
      });

      const usage = custom.getWorkerUsage();
      expect(usage.limits.maxCpuMHz).toBe(8000);
      expect(usage.limits.maxMemoryMB).toBe(4096);
    });

    it('should initialize statistics', () => {
      const stats = allocator.getStats();
      expect(stats.allocationsCreated).toBe(0);
      expect(stats.allocationsFailed).toBe(0);
      expect(stats.timeoutsEnforced).toBe(0);
    });
  });

  describe('Task Allocation', () => {
    it('should allocate resources for task', () => {
      const allocation = allocator.allocateTask('task-1', {
        cpuMHz: 500,
        memoryMB: 256
      });

      expect(allocation.taskId).toBe('task-1');
      expect(allocation.cpuMHz).toBe(500);
      expect(allocation.memoryMB).toBe(256);
      expect(allocation.status).toBe('allocated');
    });

    it('should track resource usage', () => {
      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256 });

      const usage = allocator.getWorkerUsage();
      expect(usage.cpuMHz).toBe(500);
      expect(usage.memoryMB).toBe(256);
      expect(usage.activeTasks).toBe(1);
    });

    it('should use default resource values', () => {
      const allocation = allocator.allocateTask('task-1', {});

      expect(allocation.cpuMHz).toBe(500); // default
      expect(allocation.memoryMB).toBe(256); // default
    });

    it('should emit allocation event', (done) => {
      allocator.on('task-allocated', (data) => {
        expect(data.taskId).toBe('task-1');
        expect(data.cpuMHz).toBe(500);
        done();
      });

      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256 });
    });

    it('should reject allocation exceeding CPU limit', () => {
      expect(() => {
        allocator.allocateTask('task-1', { cpuMHz: 5000, memoryMB: 256 });
      }).toThrow('Worker resource limits exceeded');
    });

    it('should reject allocation exceeding memory limit', () => {
      expect(() => {
        allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 3000 });
      }).toThrow('Worker resource limits exceeded');
    });

    it('should reject allocation exceeding timeout limit', () => {
      expect(() => {
        allocator.allocateTask('task-1', { timeoutMs: 4000000 });
      }).toThrow('Timeout exceeds maximum allowed');
    });

    it('should increment allocations created count', () => {
      allocator.allocateTask('task-1', {});
      allocator.allocateTask('task-2', {});

      const stats = allocator.getStats();
      expect(stats.allocationsCreated).toBe(2);
    });

    it('should reject when concurrent limit reached', () => {
      const limited = new ResourceAllocator({
        maxConcurrentTasks: 2
      });

      limited.allocateTask('task-1', {});
      limited.allocateTask('task-2', {});

      expect(() => {
        limited.allocateTask('task-3', {});
      }).toThrow('Worker resource limits exceeded');
    });
  });

  describe('Task Execution Lifecycle', () => {
    it('should start task execution', () => {
      allocator.allocateTask('task-1', {});

      const startSpy = jest.fn();
      allocator.on('task-started', startSpy);

      allocator.startTask('task-1');

      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 'task-1' })
      );
    });

    it('should complete task and release resources', () => {
      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256 });
      allocator.startTask('task-1');

      expect(allocator.getWorkerUsage().cpuMHz).toBe(500);

      allocator.completeTask('task-1');

      expect(allocator.getWorkerUsage().cpuMHz).toBe(0);
      expect(allocator.getWorkerUsage().memoryMB).toBe(0);
      expect(allocator.getWorkerUsage().activeTasks).toBe(0);
    });

    it('should track task duration', (done) => {
      allocator.allocateTask('task-1', {});
      allocator.startTask('task-1');

      setTimeout(() => {
        allocator.on('task-completed', (data) => {
          expect(data.duration).toBeGreaterThan(0);
          done();
        });

        allocator.completeTask('task-1');
      }, 50);
    });

    it('should emit completion event', (done) => {
      allocator.allocateTask('task-1', {});
      allocator.startTask('task-1');

      allocator.on('task-completed', (data) => {
        expect(data.taskId).toBe('task-1');
        done();
      });

      allocator.completeTask('task-1');
    });

    it('should cancel task and release resources', () => {
      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256 });

      allocator.cancelTask('task-1', 'user-cancelled');

      const usage = allocator.getWorkerUsage();
      expect(usage.cpuMHz).toBe(0);
      expect(usage.activeTasks).toBe(0);
    });

    it('should emit cancellation event', (done) => {
      allocator.allocateTask('task-1', {});

      allocator.on('task-cancelled', (data) => {
        expect(data.taskId).toBe('task-1');
        expect(data.reason).toBe('user-cancelled');
        done();
      });

      allocator.cancelTask('task-1', 'user-cancelled');
    });
  });

  describe('Timeout Enforcement', () => {
    it('should enforce timeout on task', (done) => {
      allocator.allocateTask('task-1', { timeoutMs: 100 });

      allocator.on('task-timeout', (data) => {
        expect(data.taskId).toBe('task-1');
        done();
      });

      allocator.startTask('task-1', () => {
        // Callback
      });
    });

    it('should call timeout callback', (done) => {
      allocator.allocateTask('task-1', { timeoutMs: 100 });

      const callback = (taskId, reason) => {
        expect(taskId).toBe('task-1');
        expect(reason).toBe('timeout');
        done();
      };

      allocator.startTask('task-1', callback);
    });

    it('should release resources on timeout', (done) => {
      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256, timeoutMs: 100 });

      allocator.on('task-timeout', () => {
        expect(allocator.getWorkerUsage().cpuMHz).toBe(0);
        done();
      });

      allocator.startTask('task-1');
    });

    it('should increment timeout count', (done) => {
      allocator.allocateTask('task-1', { timeoutMs: 50 });

      allocator.on('task-timeout', () => {
        const stats = allocator.getStats();
        expect(stats.timeoutsEnforced).toBe(1);
        done();
      });

      allocator.startTask('task-1');
    });

    it('should not timeout if completed before deadline', (done) => {
      allocator.allocateTask('task-1', { timeoutMs: 200 });

      const timeoutSpy = jest.fn();
      allocator.on('task-timeout', timeoutSpy);

      allocator.startTask('task-1');

      setTimeout(() => {
        allocator.completeTask('task-1');

        setTimeout(() => {
          expect(timeoutSpy).not.toHaveBeenCalled();
          done();
        }, 100);
      }, 50);
    });
  });

  describe('Allocation Queries', () => {
    it('should retrieve allocation by task ID', () => {
      const allocated = allocator.allocateTask('task-1', { cpuMHz: 500 });

      const retrieved = allocator.getAllocation('task-1');
      expect(retrieved.taskId).toBe('task-1');
      expect(retrieved.cpuMHz).toBe(500);
    });

    it('should return null for non-existent allocation', () => {
      const allocation = allocator.getAllocation('non-existent');
      expect(allocation).toBeNull();
    });

    it('should list all allocations', () => {
      allocator.allocateTask('task-1', {});
      allocator.allocateTask('task-2', {});
      allocator.allocateTask('task-3', {});

      const allocations = allocator.getAllAllocations();
      expect(allocations.length).toBe(3);
    });

    it('should filter allocations by status', () => {
      allocator.allocateTask('task-1', {});
      allocator.allocateTask('task-2', {});
      allocator.startTask('task-1');

      const running = allocator.getAllocationsByStatus('running');
      expect(running.length).toBe(1);
      expect(running[0].taskId).toBe('task-1');
    });

    it('should get available resources', () => {
      allocator.allocateTask('task-1', { cpuMHz: 1000, memoryMB: 512 });

      const usage = allocator.getWorkerUsage();
      expect(usage.available.cpuMHz).toBe(3000);
      expect(usage.available.memoryMB).toBe(1536);
    });
  });

  describe('Cleanup', () => {
    it('should clear all allocations and timers', () => {
      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256 });
      allocator.allocateTask('task-2', { cpuMHz: 500, memoryMB: 256 });
      allocator.startTask('task-1');
      allocator.startTask('task-2');

      allocator.clearAll();

      expect(allocator.getAllAllocations().length).toBe(0);
      expect(allocator.getWorkerUsage().cpuMHz).toBe(0);
      expect(allocator.getWorkerUsage().activeTasks).toBe(0);
    });

    it('should emit cleared event', (done) => {
      allocator.on('cleared', () => {
        done();
      });

      allocator.clearAll();
    });
  });

  describe('Statistics', () => {
    it('should track allocation metrics', () => {
      allocator.allocateTask('task-1', {});
      allocator.allocateTask('task-2', {});

      try {
        allocator.allocateTask('task-3', { timeoutMs: 4000000 });
      } catch (e) {
        // Expected - timeout exceeds limit
      }

      const stats = allocator.getStats();
      expect(stats.allocationsCreated).toBe(2);
      expect(stats.allocationsFailed).toBe(1);
    });

    it('should include current usage in stats', () => {
      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256 });

      const stats = allocator.getStats();
      expect(stats.currentUsage.cpuMHz).toBe(500);
      expect(stats.currentUsage.activeTasks).toBe(1);
    });
  });
});

describe('ResourceMonitor', () => {
  let allocator;
  let monitor;

  beforeEach(() => {
    allocator = new ResourceAllocator();
    monitor = new ResourceMonitor({
      allocator,
      checkIntervalMs: 50,
      maxSamples: 100
    });
  });

  afterEach(() => {
    if (monitor.monitoringActive) {
      monitor.stop();
    }
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      expect(monitor.monitoringActive).toBe(false);
      monitor.start();
      expect(monitor.monitoringActive).toBe(true);
    });

    it('should stop monitoring', () => {
      monitor.start();
      expect(monitor.monitoringActive).toBe(true);
      monitor.stop();
      expect(monitor.monitoringActive).toBe(false);
    });

    it('should emit start event', (done) => {
      monitor.on('monitoring-started', () => {
        done();
      });
      monitor.start();
    });

    it('should emit stop event', (done) => {
      monitor.start();
      monitor.on('monitoring-stopped', () => {
        done();
      });
      monitor.stop();
    });

    it('should not start twice', () => {
      monitor.start();
      const interval1 = monitor.monitorInterval;
      monitor.start();
      const interval2 = monitor.monitorInterval;
      expect(interval1).toBe(interval2);
      monitor.stop();
    });
  });

  describe('Metric Collection', () => {
    it('should collect CPU utilization metrics', (done) => {
      monitor.start();

      allocator.allocateTask('task-1', { cpuMHz: 500 });

      setTimeout(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.cpu.current).toBeGreaterThan(0);
        monitor.stop();
        done();
      }, 100);
    });

    it('should collect memory utilization metrics', (done) => {
      monitor.start();

      allocator.allocateTask('task-1', { memoryMB: 256 });

      setTimeout(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.memory.current).toBeGreaterThan(0);
        monitor.stop();
        done();
      }, 100);
    });

    it('should track task concurrency', (done) => {
      monitor.start();

      allocator.allocateTask('task-1', {});
      allocator.allocateTask('task-2', {});

      setTimeout(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.tasks.current).toBe(2);
        monitor.stop();
        done();
      }, 100);
    });

    it('should calculate averages and peaks', (done) => {
      monitor.start();

      allocator.allocateTask('task-1', { cpuMHz: 500 });
      setTimeout(() => allocator.allocateTask('task-2', { cpuMHz: 1000 }), 25);
      setTimeout(() => allocator.cancelTask('task-1'), 50);

      setTimeout(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.cpu.average).toBeGreaterThan(0);
        expect(metrics.cpu.peak).toBeGreaterThanOrEqual(metrics.cpu.current);
        monitor.stop();
        done();
      }, 150);
    });
  });

  describe('Alerting', () => {
    it('should emit alert on high CPU', (done) => {
      const customMon = new ResourceMonitor({
        allocator,
        checkIntervalMs: 50,
        cpuWarnThreshold: 10,
        cpuCriticalThreshold: 20
      });

      customMon.on('alert', (alert) => {
        if (alert.resource === 'CPU' && alert.severity === 'WARNING') {
          expect(alert.utilization).toBeGreaterThan(10);
          customMon.stop();
          done();
        }
      });

      customMon.start();

      allocator.allocateTask('task-1', { cpuMHz: 500 });
    });

    it('should emit alert on high memory', (done) => {
      const customMon = new ResourceMonitor({
        allocator,
        checkIntervalMs: 50,
        memoryWarnThreshold: 10,
        memoryCriticalThreshold: 20
      });

      customMon.on('alert', (alert) => {
        if (alert.resource === 'Memory' && alert.severity === 'WARNING') {
          expect(alert.utilization).toBeGreaterThan(10);
          customMon.stop();
          done();
        }
      });

      customMon.start();

      allocator.allocateTask('task-1', { memoryMB: 256 });
    });

    it('should distinguish warning and critical alerts', (done) => {
      const customMon = new ResourceMonitor({
        allocator,
        checkIntervalMs: 50,
        cpuWarnThreshold: 15,
        cpuCriticalThreshold: 25
      });

      const alerts = [];
      customMon.on('alert', (alert) => {
        if (alert.resource === 'CPU') {
          alerts.push(alert);
        }
      });

      customMon.start();

      // This will use 25% of 4000 CPU (1000 MHz)
      allocator.allocateTask('task-1', { cpuMHz: 1000 });

      setTimeout(() => {
        // Should have CRITICAL alert (25% >= 25% threshold)
        const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
        expect(criticalAlerts.length).toBeGreaterThan(0);
        customMon.stop();
        done();
      }, 200);
    });
  });

  describe('Queries', () => {
    it('should return current metrics', (done) => {
      monitor.start();
      allocator.allocateTask('task-1', { cpuMHz: 500, memoryMB: 256 });

      setTimeout(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics).toHaveProperty('cpu');
        expect(metrics).toHaveProperty('memory');
        expect(metrics).toHaveProperty('tasks');
        expect(metrics.cpu).toHaveProperty('current');
        expect(metrics.cpu).toHaveProperty('average');
        expect(metrics.cpu).toHaveProperty('peak');
        monitor.stop();
        done();
      }, 100);
    });

    it('should return metric history', (done) => {
      monitor.start();
      allocator.allocateTask('task-1', {});

      setTimeout(() => {
        const history = monitor.getMetricHistory(60000);
        expect(history).toHaveProperty('cpu');
        expect(history).toHaveProperty('memory');
        expect(history).toHaveProperty('tasks');
        expect(history.samples).toBeGreaterThan(0);
        monitor.stop();
        done();
      }, 100);
    });

    it('should return recent alerts', () => {
      monitor.recordMetric('custom-metric', 42);
      const alerts = monitor.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should return alert summary', () => {
      const summary = monitor.getAlertSummary();
      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('byResource');
      expect(summary).toHaveProperty('bySeverity');
    });

    it('should return performance report', (done) => {
      monitor.start();
      allocator.allocateTask('task-1', { cpuMHz: 500 });

      setTimeout(() => {
        const report = monitor.getPerformanceReport();
        expect(report).toHaveProperty('metrics');
        expect(report).toHaveProperty('alerts');
        expect(report).toHaveProperty('allocator');
        expect(report).toHaveProperty('status');
        monitor.stop();
        done();
      }, 100);
    });
  });

  describe('Health Status', () => {
    it('should report HEALTHY status', (done) => {
      monitor.start();

      setTimeout(() => {
        const report = monitor.getPerformanceReport();
        expect(report.status).toBe('HEALTHY');
        monitor.stop();
        done();
      }, 100);
    });

    it('should report WARNING status', (done) => {
      const customMon = new ResourceMonitor({
        allocator,
        checkIntervalMs: 50,
        cpuWarnThreshold: 10,
        cpuCriticalThreshold: 50
      });

      customMon.start();
      allocator.allocateTask('task-1', { cpuMHz: 500 });

      setTimeout(() => {
        const report = customMon.getPerformanceReport();
        expect(report.status).toBe('WARNING');
        customMon.stop();
        done();
      }, 150);
    });

    it('should report CRITICAL status', (done) => {
      const customMon = new ResourceMonitor({
        allocator,
        checkIntervalMs: 50,
        cpuCriticalThreshold: 10
      });

      customMon.start();
      allocator.allocateTask('task-1', { cpuMHz: 500 });

      setTimeout(() => {
        const report = customMon.getPerformanceReport();
        expect(report.status).toBe('CRITICAL');
        customMon.stop();
        done();
      }, 150);
    });
  });

  describe('Custom Metrics', () => {
    it('should record custom metric', () => {
      monitor.recordMetric('custom-metric', 42);
      const metrics = monitor.metrics;
      expect(metrics['custom-metric']).toBeDefined();
      expect(metrics['custom-metric'].length).toBe(1);
    });

    it('should trim samples to max', () => {
      const smallMon = new ResourceMonitor({ maxSamples: 3 });
      smallMon.recordMetric('test', 1);
      smallMon.recordMetric('test', 2);
      smallMon.recordMetric('test', 3);
      smallMon.recordMetric('test', 4);

      expect(smallMon.metrics.test.length).toBe(3);
    });
  });

  describe('Cleanup', () => {
    it('should clear all data', () => {
      monitor.recordMetric('custom', 42);
      monitor.clear();

      expect(monitor.metrics.cpuUtilization.length).toBe(0);
      expect(monitor.alerts.length).toBe(0);
    });
  });
});
