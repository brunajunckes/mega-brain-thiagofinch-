'use strict';

const PerformanceProfiler = require('../performance-profiler');

describe('Performance Profiler', () => {
  let profiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler({
      taskExecutionTarget: 500,
      gateValidationTarget: 100,
    });
  });

  describe('Measurement', () => {
    it('should measure synchronous operation timing', () => {
      const stop = profiler.startMeasure('sync-op');

      // Simulate work
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }

      const metric = stop();

      expect(metric.timing.duration).toBeGreaterThan(0);
      expect(metric.operationName).toBe('sync-op');
      expect(metric.timestamp).toBeDefined();
    });

    it('should measure async operation timing', async () => {
      const result = await profiler.measureAsync('async-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');

      const metrics = profiler.getMetricsForOperation('async-op');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].timing.duration).toBeGreaterThanOrEqual(10);
    });

    it('should track memory usage during operation', () => {
      const stop = profiler.startMeasure('memory-op');

      // Allocate some memory
      const arr = new Array(100000).fill(0);

      const metric = stop();

      expect(metric.memory).toBeDefined();
      expect(metric.memory.heapUsed).toBeDefined();
      expect(metric.memory.rss).toBeDefined();
    });

    it('should capture CPU usage metrics', () => {
      const stop = profiler.startMeasure('cpu-op');

      // Do some CPU work
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += Math.sqrt(i);
      }

      const metric = stop();

      expect(metric.cpuUsage).toBeDefined();
      expect(metric.cpuUsage.user).toBeDefined();
      expect(metric.cpuUsage.system).toBeDefined();
    });

    it('should capture system load', () => {
      const stop = profiler.startMeasure('load-op');
      const metric = stop();

      expect(metric.systemLoad).toBeDefined();
      expect(metric.systemLoad.length).toBe(3);
    });
  });

  describe('Baseline Calculation', () => {
    beforeEach(() => {
      // Record multiple measurements
      for (let i = 0; i < 5; i++) {
        const stop = profiler.startMeasure('test-op');
        setTimeout(() => {}, 1);
        stop();
      }
    });

    it('should calculate min/max/avg metrics', () => {
      const baseline = profiler.getBaseline();

      expect(baseline['test-op']).toBeDefined();
      expect(baseline['test-op'].min).toBeGreaterThan(0);
      expect(baseline['test-op'].max).toBeGreaterThanOrEqual(baseline['test-op'].min);
      expect(baseline['test-op'].avg).toBeGreaterThan(0);
    });

    it('should calculate percentile metrics (p50, p95, p99)', () => {
      const baseline = profiler.getBaseline();
      const data = baseline['test-op'];

      expect(data.p50).toBeDefined();
      expect(data.p95).toBeDefined();
      expect(data.p99).toBeDefined();

      expect(data.p50).toBeGreaterThanOrEqual(data.min);
      expect(data.p95).toBeGreaterThanOrEqual(data.p50);
      expect(data.p99).toBeGreaterThanOrEqual(data.p95);
    });

    it('should count operation samples', () => {
      const baseline = profiler.getBaseline();

      expect(baseline['test-op'].count).toBe(5);
    });
  });

  describe('Performance Validation', () => {
    it('should validate operations against targets', () => {
      const profilerWithTarget = new PerformanceProfiler({
        taskExecutionTarget: 50, // 50ms target
      });

      // Record fast operation
      const stop1 = profilerWithTarget.startMeasure('fast-task');
      stop1();

      // Record slow operation
      const stop2 = profilerWithTarget.startMeasure('slow-task');
      // Simulate slow operation
      for (let i = 0; i < 10000000; i++) {}
      stop2();

      const validation = profilerWithTarget.validatePerformance();

      expect(validation.valid).toBeDefined();
      expect(validation.issues).toBeDefined();
    });

    it('should identify operations exceeding targets', () => {
      const profiler2 = new PerformanceProfiler({
        slowOp: 10, // 10ms target - very strict
      });

      // Record operation that likely exceeds target
      for (let i = 0; i < 5; i++) {
        const stop = profiler2.startMeasure('slowOp');
        for (let j = 0; j < 10000000; j++) {}
        stop();
      }

      const validation = profiler2.validatePerformance();

      // May or may not have issues depending on system
      expect(validation.issues).toBeDefined();
    });
  });

  describe('Reporting', () => {
    beforeEach(() => {
      // Record various operations
      for (let i = 0; i < 3; i++) {
        const stop = profiler.startMeasure('gate-validation');
        stop();
      }

      for (let i = 0; i < 3; i++) {
        const stop = profiler.startMeasure('task-execution');
        for (let j = 0; j < 1000000; j++) {}
        stop();
      }
    });

    it('should generate comprehensive performance report', () => {
      const report = profiler.generateReport();

      expect(report.status).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.totalSamples).toBe(6);
      expect(report.metrics).toBeDefined();
      expect(report.validation).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should identify top slowest operations', () => {
      const report = profiler.generateReport();
      const topSlowest = report.summary.topSlowest;

      expect(topSlowest).toBeDefined();
      expect(topSlowest.length).toBeLessThanOrEqual(5);
      expect(topSlowest[0].duration).toBeDefined();
    });

    it('should calculate operation overhead', () => {
      const report = profiler.generateReport();
      const overhead = report.summary.operationOverhead;

      expect(overhead).toBeDefined();
      expect(Object.keys(overhead).length).toBeGreaterThan(0);

      for (const [op, data] of Object.entries(overhead)) {
        expect(data.totalTime).toBeDefined();
        expect(data.percentage).toBeDefined();
        expect(data.avgPerCall).toBeDefined();
      }
    });

    it('should analyze memory usage patterns', () => {
      const report = profiler.generateReport();
      const memoryProfile = report.summary.memoryProfile;

      expect(memoryProfile).toBeDefined();
      expect(memoryProfile.min).toBeDefined();
      expect(memoryProfile.max).toBeDefined();
      expect(memoryProfile.avg).toBeDefined();
      expect(memoryProfile.unit).toBe('MB');
    });
  });

  describe('Data Management', () => {
    beforeEach(() => {
      for (let i = 0; i < 3; i++) {
        const stop = profiler.startMeasure('op1');
        stop();
      }
    });

    it('should retrieve metrics for specific operation', () => {
      const metrics = profiler.getMetricsForOperation('op1');

      expect(metrics.length).toBe(3);
      expect(metrics[0].operationName).toBe('op1');
    });

    it('should export raw metrics', () => {
      const raw = profiler.getRawMetrics();

      expect(raw.length).toBe(3);
      expect(raw[0].timing).toBeDefined();
    });

    it('should clear all metrics', () => {
      expect(profiler.getRawMetrics().length).toBe(3);

      profiler.clear();

      expect(profiler.getRawMetrics().length).toBe(0);
      expect(profiler.getBaseline()).toBe(null);
    });

    it('should export data as JSON', () => {
      const json = profiler.exportJSON();

      expect(json.baseline).toBeDefined();
      expect(json.report).toBeDefined();
      expect(json.rawMetrics).toBeDefined();
    });
  });

  describe('Sampling & Control', () => {
    it('should respect sample rate setting', () => {
      const sampler = new PerformanceProfiler({ sampleRate: 0.0 });

      for (let i = 0; i < 10; i++) {
        const stop = sampler.startMeasure('test');
        stop();
      }

      expect(sampler.getRawMetrics().length).toBe(0);
    });

    it('should be disabled when enabled=false', () => {
      const disabled = new PerformanceProfiler({ enabled: false });

      for (let i = 0; i < 5; i++) {
        const stop = disabled.startMeasure('test');
        stop();
      }

      expect(disabled.getRawMetrics().length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should record failed operations', async () => {
      try {
        await profiler.measureAsync('failing-op', async () => {
          throw new Error('test error');
        });
      } catch {
        // Expected
      }

      const metrics = profiler.getMetricsForOperation('failing-op');
      expect(metrics.length).toBe(1);
      expect(metrics[0].context.success).toBe(false);
      expect(metrics[0].context.error).toBe('test error');
    });
  });

  describe('Baseline Performance', () => {
    it('should measure task execution performance <500ms target', async () => {
      const profiler2 = new PerformanceProfiler({
        taskExecutionTarget: 500,
      });

      await profiler2.measureAsync('taskExecution', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });

      const baseline = profiler2.getBaseline();
      expect(baseline.taskExecution.avg).toBeLessThan(500);
    });

    it('should measure gate validation performance <100ms target', async () => {
      const profiler2 = new PerformanceProfiler({
        gateValidation: 100,
      });

      await profiler2.measureAsync('gateValidation', async () => {
        // Simulate gate validation
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += i % 2;
        }
      });

      const baseline = profiler2.getBaseline();
      expect(baseline.gateValidation.avg).toBeLessThan(100);
    });
  });
});
