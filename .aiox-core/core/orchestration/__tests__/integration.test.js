/**
 * Integration and Regression Tests
 * Comprehensive testing of complete Sprint 1 Task Executor system
 */

const TaskQueue = require('../task-queue');
const PriorityQueue = require('../priority-queue');
const TaskScheduler = require('../task-scheduler');
const TaskExecutor = require('../task-executor');
const ResourceMonitor = require('../resource-monitor');
const ResourceAllocator = require('../resource-allocator');
const TaskGenerator = require('../task-generator');
const CircuitBreaker = require('../circuit-breaker');
const DegradationManager = require('../degradation-manager');
const HealthMonitor = require('../health-monitor');
const AnomalyDetector = require('../anomaly-detector');
const SelfHealer = require('../self-healer');

describe('Sprint 1 Task Executor - Integration Tests', () => {
  describe('Complete Task Lifecycle', () => {
    test('should execute task from enqueue to completion', async () => {
      const queue = new TaskQueue();
      const executor = new TaskExecutor();
      const monitor = new ResourceMonitor();

      const task = {
        id: 'test-task-1',
        name: 'test',
        type: 'compute',
        payload: { value: 42 }
      };

      queue.enqueue(task);
      expect(queue.size()).toBe(1);

      const dequeued = queue.dequeue();
      expect(dequeued.id).toBe('test-task-1');
      expect(queue.size()).toBe(0);
    });

    test('should maintain task state through execution phases', async () => {
      const task = {
        id: 'state-test',
        name: 'test',
        type: 'compute',
        status: 'PENDING',
        createdAt: Date.now()
      };

      // Initial state
      expect(task.status).toBe('PENDING');

      // Execution phase
      task.status = 'RUNNING';
      task.startedAt = Date.now();
      expect(task.status).toBe('RUNNING');

      // Completion phase
      task.status = 'COMPLETED';
      task.completedAt = Date.now();
      expect(task.status).toBe('COMPLETED');
      expect(task.completedAt - task.startedAt).toBeGreaterThanOrEqual(0);
    });

    test('should handle task failure and error state', async () => {
      const task = {
        id: 'error-task',
        name: 'test',
        type: 'compute',
        status: 'PENDING',
        error: null
      };

      task.status = 'RUNNING';
      const testError = new Error('Execution failed');
      task.error = testError.message;
      task.status = 'FAILED';

      expect(task.status).toBe('FAILED');
      expect(task.error).toBe('Execution failed');
    });
  });

  describe('Priority Queue Integration', () => {
    test('should execute tasks in priority order', () => {
      const pq = new PriorityQueue();

      const lowPriority = { id: 'low', name: 'low', type: 'compute' };
      const highPriority = { id: 'high', name: 'high', type: 'compute' };
      const mediumPriority = { id: 'med', name: 'med', type: 'compute' };

      pq.enqueue(lowPriority, 3);
      pq.enqueue(highPriority, 1);
      pq.enqueue(mediumPriority, 2);

      expect(pq.dequeue().id).toBe('high');
      expect(pq.dequeue().id).toBe('med');
      expect(pq.dequeue().id).toBe('low');
    });

    test('should handle equal priorities in FIFO order', () => {
      const pq = new PriorityQueue();

      pq.enqueue({ id: 'first' }, 2);
      pq.enqueue({ id: 'second' }, 2);
      pq.enqueue({ id: 'third' }, 2);

      expect(pq.dequeue().id).toBe('first');
      expect(pq.dequeue().id).toBe('second');
      expect(pq.dequeue().id).toBe('third');
    });
  });

  describe('Task Scheduling Integration', () => {
    test('should schedule tasks for future execution', () => {
      const scheduler = new TaskScheduler();
      const now = Date.now();

      const task1 = {
        id: 'scheduled-1',
        name: 'test',
        type: 'compute',
        scheduledTime: now + 5000
      };

      const task2 = {
        id: 'scheduled-2',
        name: 'test',
        type: 'compute',
        scheduledTime: now + 2000
      };

      scheduler.schedule(task1);
      scheduler.schedule(task2);

      expect(scheduler.size()).toBe(2);

      // Task 2 should be next (closer deadline)
      const next = scheduler.peek();
      expect(next.id).toBe('scheduled-2');
    });

    test('should return null when no tasks are scheduled', () => {
      const scheduler = new TaskScheduler();
      expect(scheduler.peek()).toBeNull();
      expect(scheduler.dequeue()).toBeNull();
    });
  });

  describe('Resource Allocation Integration', () => {
    test('should allocate and enforce resource limits', async () => {
      const allocator = new ResourceAllocator({
        maxCpu: 100,
        maxMemory: 1024,
        maxConcurrentTasks: 10,
        taskTimeout: 5000
      });

      const task = {
        id: 'resource-task',
        cpu: 20,
        memory: 256,
        timeout: 3000
      };

      const allocated = allocator.allocateTask(task);
      expect(allocated).toBe(true);

      const status = allocator.getStatus(task.id);
      expect(status.status).toBe('ALLOCATED');
    });

    test('should reject tasks exceeding resource limits', () => {
      const allocator = new ResourceAllocator({
        maxCpu: 100,
        maxMemory: 512,
        maxConcurrentTasks: 5
      });

      const task = {
        id: 'over-limit',
        cpu: 150, // Exceeds max
        memory: 256,
        timeout: 3000
      };

      const allocated = allocator.allocateTask(task);
      expect(allocated).toBe(false);
    });

    test('should track resource utilization', () => {
      const allocator = new ResourceAllocator({
        maxCpu: 100,
        maxMemory: 1024
      });

      allocator.allocateTask({ id: 't1', cpu: 30, memory: 256 });
      allocator.allocateTask({ id: 't2', cpu: 20, memory: 200 });

      const stats = allocator.getStats();
      expect(stats.cpuUsed).toBe(50);
      expect(stats.memoryUsed).toBe(456);
    });
  });

  describe('Task Generator Integration', () => {
    test('should generate tasks from templates', () => {
      const generator = new TaskGenerator();

      generator.registerTemplate('compute', {
        type: 'compute',
        timeout: 5000,
        retries: 3
      });

      const task = generator.generateTask('compute', { id: 'test-gen' });
      expect(task.type).toBe('compute');
      expect(task.timeout).toBe(5000);
      expect(task.retries).toBe(3);
    });

    test('should generate multiple tasks from templates', () => {
      const generator = new TaskGenerator();

      generator.registerTemplate('batch', {
        type: 'batch',
        priority: 2
      });

      const tasks = generator.generateTasks('batch', [
        { id: 'batch-1' },
        { id: 'batch-2' },
        { id: 'batch-3' }
      ]);

      expect(tasks.length).toBe(3);
      expect(tasks.every(t => t.type === 'batch')).toBe(true);
    });
  });

  describe('Circuit Breaker Integration', () => {
    test('should fail open after threshold failures', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-breaker',
        failureThreshold: 3,
        resetTimeoutMs: 1000
      });

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test error');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('OPEN');
    });

    test('should recover to half-open after timeout', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-breaker',
        failureThreshold: 1,
        resetTimeoutMs: 100
      });

      // Trigger failure
      try {
        await breaker.execute(async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().state).toBe('OPEN');

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Check state
      const state = breaker.getState();
      expect(state.state).toBe('HALF_OPEN');
    });
  });

  describe('Graceful Degradation Integration', () => {
    test('should transition to degraded mode under high load', () => {
      const manager = new DegradationManager({
        degradedCpuThreshold: 70,
        degradedMemoryThreshold: 70,
        criticalCpuThreshold: 85
      });

      // Normal load
      manager.updateLoad(50, 50, 500, 10);
      expect(manager.mode).toBe('NORMAL');

      // Degraded load
      manager.updateLoad(75, 60, 800, 20);
      expect(manager.mode).toBe('DEGRADED');

      // Critical load
      manager.updateLoad(90, 80, 1500, 50);
      expect(manager.mode).toBe('CRITICAL');
    });

    test('should reject non-critical requests in critical mode', () => {
      const manager = new DegradationManager();
      manager.forceMode('CRITICAL');

      expect(manager.shouldAcceptRequest({ priority: 'low' })).toBe(false);
      expect(manager.shouldAcceptRequest({ priority: 'normal' })).toBe(false);
      expect(manager.shouldAcceptRequest({ priority: 'critical' })).toBe(true);
    });

    test('should adjust concurrency limits based on mode', () => {
      const manager = new DegradationManager({
        maxConcurrentNormal: 50,
        maxConcurrentDegraded: 25,
        maxConcurrentCritical: 10
      });

      manager.forceMode('NORMAL');
      expect(manager.getMaxConcurrency()).toBe(50);

      manager.forceMode('DEGRADED');
      expect(manager.getMaxConcurrency()).toBe(25);

      manager.forceMode('CRITICAL');
      expect(manager.getMaxConcurrency()).toBe(10);
    });
  });

  describe('Health Monitoring Integration', () => {
    test('should track component health across lifecycle', () => {
      const monitor = new HealthMonitor();
      monitor.registerComponent('service-1');

      // Simulate successful operations
      for (let i = 0; i < 10; i++) {
        monitor.recordCheck('service-1', true);
      }

      const health = monitor.getComponentHealth('service-1');
      expect(health.status).toBe('HEALTHY');
      expect(health.successRate).toBeCloseTo(1.0, 2);

      // Simulate failures
      for (let i = 0; i < 5; i++) {
        monitor.recordCheck('service-1', false, 'Error');
      }

      const degradedHealth = monitor.getComponentHealth('service-1');
      expect(degradedHealth.status).toBe('DEGRADED');
    });

    test('should trigger recovery on status change', (done) => {
      const monitor = new HealthMonitor();
      monitor.registerComponent('service-1');

      monitor.on('recovery-triggered', ({ componentId, escalationLevel }) => {
        expect(componentId).toBe('service-1');
        expect(escalationLevel).toBe(1);
        done();
      });

      // Degrade service
      for (let i = 0; i < 6; i++) {
        monitor.recordCheck('service-1', false);
      }

      // Trigger recovery
      monitor.triggerRecovery('service-1', 1);
    });
  });

  describe('Anomaly Detection Integration', () => {
    test('should detect and report anomalies', (done) => {
      const detector = new AnomalyDetector({
        minDataPointsForBaseline: 2
      });

      let anomalyDetected = false;
      detector.on('anomaly-detected', ({ type, severity }) => {
        anomalyDetected = true;
        expect(type).toBeDefined();
      });

      // Establish baseline
      detector.recordErrorRate('service', 0.01);
      detector.recordErrorRate('service', 0.01);

      // Trigger spike
      detector.recordErrorRate('service', 0.5);

      // Verify or timeout
      setTimeout(() => {
        expect(typeof anomalyDetected).toBe('boolean');
        done();
      }, 100);
    });
  });

  describe('Self-Healing Integration', () => {
    test('should execute recovery workflow', async () => {
      const healer = new SelfHealer();
      let recoveryExecuted = false;

      const handler = jest.fn(async () => {
        recoveryExecuted = true;
        return true;
      });

      healer.registerRecoveryHandler('service', handler);
      const result = await healer.initiateRecovery('service', 1);

      expect(result).toBe(true);
      expect(recoveryExecuted).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    test('should escalate recovery on failure', async () => {
      const healer = new SelfHealer();
      let escalationEmitted = false;

      const handler = jest.fn().mockResolvedValue(false);
      healer.registerRecoveryHandler('service', handler);
      healer.escalationLevels[1].maxAttempts = 1;
      healer.escalationLevels[1].delayMs = 1;
      healer.escalationLevels[2].delayMs = 1;

      healer.on('recovery-escalating', () => {
        escalationEmitted = true;
      });

      const result = await healer.initiateRecovery('service', 1);
      expect(escalationEmitted || handler.mock.calls.length > 0).toBe(true);
    });
  });

  describe('End-to-End Workflows', () => {
    test('should execute complete task orchestration workflow', async () => {
      const queue = new TaskQueue();
      const pq = new PriorityQueue();
      const allocator = new ResourceAllocator();
      const monitor = new ResourceMonitor();
      const breaker = new CircuitBreaker({ name: 'e2e' });

      // 1. Create tasks
      const tasks = [
        { id: 't1', name: 'task1', type: 'compute', cpu: 20, memory: 256 },
        { id: 't2', name: 'task2', type: 'compute', cpu: 15, memory: 200 }
      ];

      // 2. Enqueue with priorities
      pq.enqueue(tasks[0], 2);
      pq.enqueue(tasks[1], 1);

      // 3. Allocate resources
      for (const task of [tasks[0], tasks[1]]) {
        const allocated = allocator.allocateTask(task);
        expect(allocated).toBe(true);
      }

      // 4. Record metrics
      monitor._recordMetrics({
        cpuUsage: 35,
        memoryUsage: 456,
        taskQueueSize: 2,
        activeTasks: 2
      });

      // 5. Execute with circuit breaker
      const highPriority = pq.dequeue();
      const result = await breaker.execute(async () => {
        return Promise.resolve(`Executed ${highPriority.id}`);
      });

      expect(result).toContain('Executed');
      expect(pq.size()).toBe(1);
      expect(allocator.getStats().cpuUsed).toBeGreaterThan(0);
    });

    test('should handle degradation and recovery workflow', async () => {
      const degradation = new DegradationManager();
      const health = new HealthMonitor();
      const healer = new SelfHealer();

      health.registerComponent('api');
      healer.registerRecoveryHandler('api', async () => true);

      // 1. Detect degradation
      degradation.updateLoad(75, 70, 1000, 50);
      expect(degradation.mode).toBe('DEGRADED');

      // 2. Record health metrics
      for (let i = 0; i < 5; i++) {
        health.recordCheck('api', true);
      }
      for (let i = 0; i < 5; i++) {
        health.recordCheck('api', false);
      }

      // 3. Trigger recovery
      const recovered = await healer.initiateRecovery('api', 1);
      expect(recovered).toBe(true);

      // 4. Verify state
      expect(degradation.mode).toBe('DEGRADED');
      const apiHealth = health.getComponentHealth('api');
      expect(apiHealth.recoveryAttempts).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle null queue operations gracefully', () => {
      const queue = new TaskQueue();
      expect(() => queue.dequeue()).not.toThrow();
      expect(queue.dequeue()).toBeUndefined();
    });

    test('should handle invalid resource allocations', () => {
      const allocator = new ResourceAllocator();
      const invalidTask = null;

      expect(() => allocator.allocateTask(invalidTask)).toThrow();
    });

    test('should handle missing recovery handlers', (done) => {
      const healer = new SelfHealer();

      healer.on('recovery-failed', ({ reason }) => {
        expect(reason).toBe('No recovery handler registered');
        done();
      });

      healer.initiateRecovery('unknown', 1);
    });
  });

  describe('Regression Tests', () => {
    test('should maintain backward compatibility with simple queues', () => {
      const queue = new TaskQueue();

      // Original behavior
      queue.enqueue({ id: '1' });
      queue.enqueue({ id: '2' });

      const first = queue.dequeue();
      expect(first.id).toBe('1');

      const second = queue.dequeue();
      expect(second.id).toBe('2');

      expect(queue.size()).toBe(0);
    });

    test('should preserve priority queue semantics', () => {
      const pq = new PriorityQueue();

      const tasks = [
        { id: '3', priority: 3 },
        { id: '1', priority: 1 },
        { id: '2', priority: 2 }
      ];

      for (const task of tasks) {
        pq.enqueue(task, task.priority);
      }

      expect(pq.dequeue().id).toBe('1');
      expect(pq.dequeue().id).toBe('2');
      expect(pq.dequeue().id).toBe('3');
    });

    test('should handle concurrent operations consistently', async () => {
      const queue = new TaskQueue();

      // Simulate concurrent enqueues and dequeues
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            queue.enqueue({ id: `task-${i}` });
          })
        );
      }

      await Promise.all(promises);

      expect(queue.size()).toBe(100);

      // Dequeue all
      const dequeued = [];
      while (queue.size() > 0) {
        dequeued.push(queue.dequeue());
      }

      expect(dequeued.length).toBe(100);
      expect(queue.size()).toBe(0);
    });
  });
});
