/**
 * Task Orchestration Benchmarks
 * Performance testing for core orchestration components
 */

const BenchmarkSuite = require('../benchmarks');
const TaskQueue = require('../task-queue');
const PriorityQueue = require('../priority-queue');
const TaskScheduler = require('../task-scheduler');
const ResourceMonitor = require('../resource-monitor');
const CircuitBreaker = require('../circuit-breaker');
const DegradationManager = require('../degradation-manager');

describe('Orchestration Benchmarks', () => {
  describe('TaskQueue Performance', () => {
    test('should benchmark queue operations', async () => {
      const suite = new BenchmarkSuite({ name: 'TaskQueue' });
      const queue = new TaskQueue();

      const enqueueResult = await suite.run('Enqueue Task', async () => {
        queue.enqueue({
          id: `task-${Date.now()}-${Math.random()}`,
          name: 'test-task',
          type: 'compute'
        });
      }, { iterations: 1000 });

      expect(enqueueResult.mean).toBeLessThan(10); // Should be very fast
      expect(enqueueResult.throughput).toBeGreaterThan(100); // >100 ops/sec
    });

    test('should benchmark dequeue operations', async () => {
      const suite = new BenchmarkSuite({ name: 'TaskQueue' });
      const queue = new TaskQueue();

      // Pre-populate queue
      for (let i = 0; i < 100; i++) {
        queue.enqueue({ id: `task-${i}`, name: `task-${i}`, type: 'compute' });
      }

      const dequeueResult = await suite.run('Dequeue Task', async () => {
        if (queue.size() > 0) {
          queue.dequeue();
        }
      }, { iterations: 100 });

      expect(dequeueResult.mean).toBeLessThan(5); // Should be very fast
    });

    test('should handle queue under load', async () => {
      const suite = new BenchmarkSuite({ name: 'TaskQueue Load Test' });
      const queue = new TaskQueue();

      const result = await suite.runLoadTest('Queue Operations', async (index) => {
        queue.enqueue({
          id: `task-${index}`,
          name: `task-${index}`,
          type: 'compute'
        });

        if (queue.size() > 0) {
          queue.dequeue();
        }
      }, { loads: [10, 50, 100, 500] });

      expect(result.results.length).toBe(4);
      expect(result.results[0].duration).toBeLessThan(1000);
    });
  });

  describe('PriorityQueue Performance', () => {
    test('should benchmark priority queue insertion', async () => {
      const suite = new BenchmarkSuite({ name: 'PriorityQueue' });
      const pq = new PriorityQueue();

      const insertResult = await suite.run('Insert with Priority', async () => {
        pq.enqueue(
          {
            id: `task-${Date.now()}-${Math.random()}`,
            name: 'test-task',
            type: 'compute'
          },
          Math.floor(Math.random() * 3) + 1 // Priority 1-3
        );
      }, { iterations: 1000 });

      expect(insertResult.mean).toBeLessThan(5);
      expect(insertResult.throughput).toBeGreaterThan(200); // >200 ops/sec
    });

    test('should benchmark priority queue extraction', async () => {
      const suite = new BenchmarkSuite({ name: 'PriorityQueue' });
      const pq = new PriorityQueue();

      // Pre-populate
      for (let i = 0; i < 200; i++) {
        pq.enqueue(
          { id: `task-${i}`, name: `task-${i}`, type: 'compute' },
          Math.floor(Math.random() * 3) + 1
        );
      }

      const extractResult = await suite.run('Extract High Priority', async () => {
        if (pq.size() > 0) {
          pq.dequeue();
        }
      }, { iterations: 200 });

      expect(extractResult.mean).toBeLessThan(5);
    });

    test('should handle priority queue under load', async () => {
      const suite = new BenchmarkSuite({ name: 'PriorityQueue Load Test' });
      const pq = new PriorityQueue();

      const result = await suite.runLoadTest('Priority Operations', async (index) => {
        const priority = Math.floor(Math.random() * 3) + 1;
        pq.enqueue(
          { id: `task-${index}`, name: `task-${index}`, type: 'compute' },
          priority
        );

        if (pq.size() > 0) {
          pq.dequeue();
        }
      }, { loads: [50, 200, 500, 1000] });

      expect(result.results.length).toBe(4);
      expect(result.results[0].throughput).toBeGreaterThan(100);
    });
  });

  describe('TaskScheduler Performance', () => {
    test('should benchmark task scheduling', async () => {
      const suite = new BenchmarkSuite({ name: 'TaskScheduler' });
      const scheduler = new TaskScheduler();

      const scheduleResult = await suite.run('Schedule Task', async () => {
        scheduler.schedule({
          id: `task-${Date.now()}-${Math.random()}`,
          name: 'test-task',
          type: 'compute',
          scheduledTime: Date.now() + 1000
        });
      }, { iterations: 1000 });

      expect(scheduleResult.mean).toBeLessThan(2);
      expect(scheduleResult.throughput).toBeGreaterThan(500);
    });

    test('should handle scheduler under load', async () => {
      const suite = new BenchmarkSuite({ name: 'TaskScheduler Load Test' });
      const scheduler = new TaskScheduler();

      const result = await suite.runLoadTest('Scheduling Operations', async (index) => {
        scheduler.schedule({
          id: `task-${index}`,
          name: `task-${index}`,
          type: 'compute',
          scheduledTime: Date.now() + (Math.random() * 10000)
        });
      }, { loads: [100, 500, 1000, 5000] });

      expect(result.results.length).toBe(4);
      expect(result.results[0].throughput).toBeGreaterThan(1000);
    });
  });

  describe('ResourceMonitor Performance', () => {
    test('should benchmark metric recording', async () => {
      const suite = new BenchmarkSuite({ name: 'ResourceMonitor' });
      const monitor = new ResourceMonitor();

      const recordResult = await suite.run('Record Metrics', async () => {
        monitor._recordMetrics({
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          taskQueueSize: Math.floor(Math.random() * 1000),
          activeTasks: Math.floor(Math.random() * 100)
        });
      }, { iterations: 1000 });

      expect(recordResult.mean).toBeLessThan(5);
      expect(recordResult.throughput).toBeGreaterThan(200);
    });

    test('should handle continuous monitoring under load', async () => {
      const suite = new BenchmarkSuite({ name: 'ResourceMonitor Load Test' });
      const monitor = new ResourceMonitor();

      const result = await suite.runLoadTest('Metric Operations', async (index) => {
        monitor._recordMetrics({
          cpuUsage: 30 + (Math.random() * 40),
          memoryUsage: 40 + (Math.random() * 30),
          taskQueueSize: 100 + Math.floor(Math.random() * 500),
          activeTasks: 20 + Math.floor(Math.random() * 50)
        });
      }, { loads: [100, 500, 1000, 5000] });

      expect(result.results.length).toBe(4);
    });
  });

  describe('CircuitBreaker Performance', () => {
    test('should benchmark circuit breaker execution', async () => {
      const suite = new BenchmarkSuite({ name: 'CircuitBreaker' });
      const breaker = new CircuitBreaker({ name: 'test-breaker' });
      let callCount = 0;

      const executeResult = await suite.run('Execute Through Breaker', async () => {
        await breaker.execute(async () => {
          callCount++;
          return Promise.resolve(callCount);
        });
      }, { iterations: 500 });

      expect(executeResult.mean).toBeLessThan(10);
      expect(executeResult.throughput).toBeGreaterThan(100);
    });

    test('should handle breaker state transitions under load', async () => {
      const suite = new BenchmarkSuite({ name: 'CircuitBreaker Load Test' });
      const breaker = new CircuitBreaker({
        name: 'test-breaker',
        failureThreshold: 50
      });

      let successCount = 0;
      const result = await suite.runLoadTest('Breaker Operations', async (index) => {
        try {
          await breaker.execute(async () => {
            if (Math.random() < 0.1) { // 10% failure rate
              throw new Error('Simulated failure');
            }
            successCount++;
            return Promise.resolve(true);
          });
        } catch (e) {
          // Expected
        }
      }, { loads: [100, 500, 1000] });

      expect(result.results.length).toBe(3);
    });
  });

  describe('DegradationManager Performance', () => {
    test('should benchmark degradation mode determination', async () => {
      const suite = new BenchmarkSuite({ name: 'DegradationManager' });
      const manager = new DegradationManager();

      const modeResult = await suite.run('Determine Degradation Mode', async () => {
        manager.updateLoad(
          Math.random() * 100,  // CPU
          Math.random() * 100,  // Memory
          Math.floor(Math.random() * 2000), // Queue depth
          Math.floor(Math.random() * 100)   // Active tasks
        );
      }, { iterations: 1000 });

      expect(modeResult.mean).toBeLessThan(5);
      expect(modeResult.throughput).toBeGreaterThan(200);
    });

    test('should handle load updates under stress', async () => {
      const suite = new BenchmarkSuite({ name: 'DegradationManager Load Test' });
      const manager = new DegradationManager();

      const result = await suite.runLoadTest('Load Update Operations', async (index) => {
        const cpu = 20 + (Math.random() * 70);
        const memory = 30 + (Math.random() * 60);
        const queueDepth = Math.floor(Math.random() * 3000);
        const activeTasks = Math.floor(Math.random() * 200);

        manager.updateLoad(cpu, memory, queueDepth, activeTasks);
      }, { loads: [100, 500, 1000, 5000] });

      expect(result.results.length).toBe(4);
    });
  });

  describe('Integration Benchmarks', () => {
    test('should benchmark complete task lifecycle', async () => {
      const suite = new BenchmarkSuite({ name: 'Complete Lifecycle' });
      const queue = new TaskQueue();
      const monitor = new ResourceMonitor();
      const breaker = new CircuitBreaker({ name: 'lifecycle-breaker' });

      const lifecycleResult = await suite.run('Task Lifecycle', async () => {
        // Enqueue
        const task = {
          id: `task-${Date.now()}-${Math.random()}`,
          name: 'lifecycle-task',
          type: 'compute'
        };
        queue.enqueue(task);

        // Record metrics
        monitor._recordMetrics({
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          taskQueueSize: queue.size(),
          activeTasks: 1
        });

        // Execute through breaker
        await breaker.execute(async () => {
          return Promise.resolve('task-complete');
        });

        // Dequeue
        if (queue.size() > 0) {
          queue.dequeue();
        }
      }, { iterations: 500 });

      expect(lifecycleResult.mean).toBeLessThan(20);
      expect(lifecycleResult.throughput).toBeGreaterThan(50);
    });

    test('should benchmark high-concurrency scenarios', async () => {
      const suite = new BenchmarkSuite({ name: 'High Concurrency' });
      const queue = new TaskQueue();
      const pq = new PriorityQueue();

      const result = await suite.runLoadTest('Concurrent Operations', async (index) => {
        // Simulate concurrent enqueue
        queue.enqueue({
          id: `queue-${index}`,
          name: `queue-task-${index}`,
          type: 'compute'
        });

        pq.enqueue({
          id: `pq-${index}`,
          name: `pq-task-${index}`,
          type: 'compute'
        }, Math.floor(Math.random() * 3) + 1);

        // Simulate concurrent dequeue
        if (Math.random() < 0.5 && queue.size() > 0) {
          queue.dequeue();
        }
        if (Math.random() < 0.5 && pq.size() > 0) {
          pq.dequeue();
        }
      }, { loads: [100, 500, 1000, 2000] });

      expect(result.results.length).toBe(4);
      expect(result.results[0].throughput).toBeGreaterThan(100);
    });
  });

  describe('Benchmark Report Generation', () => {
    test('should generate comprehensive report', async () => {
      const suite = new BenchmarkSuite({
        name: 'Complete System',
        verbose: false
      });

      const queue = new TaskQueue();
      const pq = new PriorityQueue();
      const scheduler = new TaskScheduler();

      await suite.run('Queue Operations', async () => {
        queue.enqueue({
          id: `task-${Date.now()}-${Math.random()}`,
          name: 'test',
          type: 'compute'
        });
      }, { iterations: 100 });

      await suite.run('Priority Queue', async () => {
        pq.enqueue(
          {
            id: `task-${Date.now()}-${Math.random()}`,
            name: 'test',
            type: 'compute'
          },
          1
        );
      }, { iterations: 100 });

      const summary = suite.getSummary();
      expect(summary.benchmarks.length).toBe(2);
      expect(summary.totalTests).toBe(2);

      const report = suite.generateReport();
      expect(report).toContain('Benchmark Report');
      expect(report).toContain('Queue Operations');
      expect(report).toContain('Priority Queue');
    });
  });
});
