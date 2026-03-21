/**
 * Distributed Tracing Tests
 * Tests for tracing provider and integration
 */

const { TracingProvider, TraceContext, Span } = require('../tracing-provider');
const {
  InstrumentedTaskExecutor,
  InstrumentedQueue,
  InstrumentedResourceAllocator,
  InstrumentedHealthMonitor,
  ConsoleTraceExporter,
  FileTraceExporter,
  MetricsTraceExporter
} = require('../tracing-integration');

const TaskQueue = require('../task-queue');
const ResourceAllocator = require('../resource-allocator');
const HealthMonitor = require('../health-monitor');

describe('Distributed Tracing', () => {
  describe('Span', () => {
    test('should create span with required fields', () => {
      const span = new Span('test.operation', 'trace-123');
      expect(span.name).toBe('test.operation');
      expect(span.traceId).toBe('trace-123');
      expect(span.spanId).toBeDefined();
      expect(span.status).toBe('UNSET');
    });

    test('should set attributes', () => {
      const span = new Span('test', 'trace-123');
      span.setAttribute('key1', 'value1');
      span.setAttribute('key2', 42);

      expect(span.attributes.key1).toBe('value1');
      expect(span.attributes.key2).toBe(42);
    });

    test('should add events', () => {
      const span = new Span('test', 'trace-123');
      span.addEvent('event1', { detail: 'test' });
      span.addEvent('event2');

      expect(span.events.length).toBe(2);
      expect(span.events[0].name).toBe('event1');
    });

    test('should end span and calculate duration', (done) => {
      const span = new Span('test', 'trace-123');
      setTimeout(() => {
        span.end('OK');
        expect(span.duration).toBeGreaterThan(0);
        expect(span.status).toBe('OK');
        done();
      }, 10);
    });

    test('should handle error status', () => {
      const span = new Span('test', 'trace-123');
      const error = new Error('Test error');
      span.end('ERROR', error);

      expect(span.status).toBe('ERROR');
      expect(span.error).toBe(error);
    });

    test('should convert to JSON', () => {
      const span = new Span('test', 'trace-123', 'parent-123');
      span.setAttribute('key', 'value');
      span.end('OK');

      const json = span.toJSON();
      expect(json.traceId).toBe('trace-123');
      expect(json.parentSpanId).toBe('parent-123');
      expect(json.status).toBe('OK');
      expect(json.duration).toBeGreaterThan(0);
    });
  });

  describe('TraceContext', () => {
    test('should create trace context with unique trace ID', () => {
      const ctx1 = new TraceContext();
      const ctx2 = new TraceContext();

      expect(ctx1.traceId).not.toBe(ctx2.traceId);
    });

    test('should accept provided trace ID', () => {
      const ctx = new TraceContext('my-trace-id');
      expect(ctx.traceId).toBe('my-trace-id');
    });

    test('should manage span stack', () => {
      const ctx = new TraceContext();
      const span1 = new Span('op1', ctx.traceId);
      const span2 = new Span('op2', ctx.traceId, span1.spanId);

      ctx.pushSpan(span1);
      expect(ctx.activeSpan()).toBe(span1);

      ctx.pushSpan(span2);
      expect(ctx.activeSpan()).toBe(span2);

      const popped = ctx.popSpan();
      expect(popped).toBe(span2);
      expect(ctx.activeSpan()).toBe(span1);
    });

    test('should manage baggage items', () => {
      const ctx = new TraceContext();
      ctx.setBaggage('user-id', '12345');
      ctx.setBaggage('request-id', 'req-abc');

      expect(ctx.getBaggage('user-id')).toBe('12345');
      expect(ctx.getBaggage('request-id')).toBe('req-abc');
    });

    test('should generate trace headers', () => {
      const ctx = new TraceContext('trace-123');
      const span = new Span('op', ctx.traceId);
      ctx.pushSpan(span);
      ctx.setBaggage('key', 'value');

      const headers = ctx.toHeaders();
      expect(headers['traceparent']).toContain('trace-123');
      expect(headers['baggage']).toContain('key=value');
    });

    test('should create context from headers', () => {
      const originalCtx = new TraceContext('trace-456');
      originalCtx.setBaggage('env', 'prod');

      const headers = originalCtx.toHeaders();
      const newCtx = TraceContext.fromHeaders(headers);

      expect(newCtx.traceId).toBe('trace-456');
      expect(newCtx.getBaggage('env')).toBe('prod');
    });
  });

  describe('TracingProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new TracingProvider({ serviceName: 'test-service' });
    });

    test('should create tracing provider', () => {
      expect(provider.enabled).toBe(true);
      expect(provider.serviceName).toBe('test-service');
    });

    test('should start trace', () => {
      const ctx = provider.startTrace();
      expect(ctx).toBeDefined();
      expect(ctx.traceId).toBeDefined();
      expect(provider.stats.tracesCreated).toBe(1);
    });

    test('should start span in context', () => {
      const ctx = provider.startTrace();
      const span = provider.startSpan(ctx, 'operation');

      expect(span).toBeDefined();
      expect(span.name).toBe('operation');
      expect(provider.stats.spansCreated).toBe(1);
    });

    test('should end span', () => {
      const ctx = provider.startTrace();
      const span = provider.startSpan(ctx, 'op');

      provider.endSpan(ctx, 'OK');

      expect(span.status).toBe('OK');
      expect(provider.stats.spansEnded).toBe(1);
    });

    test('should handle disabled tracing', () => {
      provider.setEnabled(false);
      const ctx = provider.startTrace();

      expect(ctx).toBeNull();
      expect(provider.stats.tracesCreated).toBe(0);
    });

    test('should respect sampling rate', () => {
      provider.setSamplingRate(0.0); // 0% sampling
      let tracedCount = 0;

      for (let i = 0; i < 100; i++) {
        if (provider.startTrace()) {
          tracedCount++;
        }
      }

      expect(tracedCount).toBe(0);
    });

    test('should export trace', async () => {
      let exportedCount = 0;
      provider.registerExporter(async (traceData) => {
        exportedCount++;
      });

      const ctx = provider.startTrace();
      provider.startSpan(ctx, 'op');
      provider.endSpan(ctx);

      await provider.exportTrace(ctx.traceId);

      expect(exportedCount).toBe(1);
      expect(provider.traces.has(ctx.traceId)).toBe(false);
    });

    test('should get trace data', () => {
      const ctx = provider.startTrace();
      const span = provider.startSpan(ctx, 'operation');
      provider.endSpan(ctx, 'OK');

      const data = provider.getTraceData(ctx.traceId);
      expect(data).toBeDefined();
      expect(data.traceId).toBe(ctx.traceId);
      expect(data.spans.length).toBe(1);
    });

    test('should track statistics', () => {
      provider.startTrace();
      provider.startTrace();

      const stats = provider.getStats();
      expect(stats.tracesCreated).toBe(2);
      expect(stats.activeTraces).toBe(2);
    });

    test('should clear all traces', () => {
      provider.startTrace();
      provider.startTrace();
      provider.clear();

      expect(provider.traces.size).toBe(0);
    });
  });

  describe('TraceExporters', () => {
    test('should export traces to console', async () => {
      const exporter = new ConsoleTraceExporter();
      const traceData = {
        serviceName: 'test',
        traceId: 'trace-123',
        spans: [
          {
            name: 'op1',
            duration: 10.5,
            status: 'OK'
          }
        ]
      };

      await expect(exporter.export(traceData)).resolves.not.toThrow();
    });

    test('should collect file trace exports', async () => {
      const exporter = new FileTraceExporter('/tmp/traces.json');
      const traceData = {
        serviceName: 'test',
        traceId: 'trace-123',
        spans: []
      };

      await exporter.export(traceData);
      expect(exporter.traces.length).toBe(1);
    });

    test('should aggregate metrics from traces', async () => {
      const exporter = new MetricsTraceExporter();
      const traceData = {
        serviceName: 'test',
        traceId: 'trace-123',
        spans: [
          {
            name: 'span1',
            startTime: 0,
            endTime: 10,
            duration: 10,
            status: 'OK'
          },
          {
            name: 'span2',
            startTime: 10,
            endTime: 25,
            duration: 15,
            status: 'ERROR'
          }
        ]
      };

      await exporter.export(traceData);
      const metrics = exporter.getMetrics();

      expect(metrics.totalTraces).toBe(1);
      expect(metrics.totalSpans).toBe(2);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.spanMetrics['span1']).toBeDefined();
    });
  });

  describe('InstrumentedQueue', () => {
    test('should enqueue with tracing', () => {
      const provider = new TracingProvider();
      const queue = new TaskQueue();
      const instrumented = new InstrumentedQueue(queue, provider);
      const traceCtx = provider.startTrace();

      instrumented.enqueueWithTracing({ id: 'task1' }, traceCtx);

      expect(queue.size()).toBe(1);
      expect(traceCtx.spans.length).toBeGreaterThan(0);
    });

    test('should dequeue with tracing', () => {
      const provider = new TracingProvider();
      const queue = new TaskQueue();
      const instrumented = new InstrumentedQueue(queue, provider);

      queue.enqueue({ id: 'task1' });

      const traceCtx = provider.startTrace();
      const task = instrumented.dequeueWithTracing(traceCtx);

      expect(task.id).toBe('task1');
      expect(traceCtx.spans.length).toBeGreaterThan(0);
    });
  });

  describe('InstrumentedResourceAllocator', () => {
    test('should allocate resources with tracing', () => {
      const provider = new TracingProvider();
      const allocator = new ResourceAllocator();
      const instrumented = new InstrumentedResourceAllocator(allocator, provider);
      const traceCtx = provider.startTrace();

      const result = instrumented.allocateWithTracing(
        { id: 'task1', cpu: 20, memory: 256 },
        traceCtx
      );

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task1');
      expect(result.cpuMHz).toBe(20);
      expect(result.memoryMB).toBe(256);
      expect(traceCtx.spans.length).toBeGreaterThan(0);
    });
  });

  describe('InstrumentedHealthMonitor', () => {
    test('should record health checks with tracing', () => {
      const provider = new TracingProvider();
      const monitor = new HealthMonitor();
      const instrumented = new InstrumentedHealthMonitor(monitor, provider);
      const traceCtx = provider.startTrace();

      monitor.registerComponent('service1');
      const health = instrumented.recordCheckWithTracing(
        'service1',
        true,
        null,
        traceCtx
      );

      expect(health.status).toBe('HEALTHY');
      expect(traceCtx.spans.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Tracing', () => {
    test('should trace complete workflow', async () => {
      const provider = new TracingProvider({ serviceName: 'workflow' });
      let exportedTraces = [];

      provider.registerExporter(async (traceData) => {
        exportedTraces.push(traceData);
      });

      // Start trace
      const ctx = provider.startTrace();

      // Create spans for workflow phases
      const phase1 = provider.startSpan(ctx, 'workflow.start');
      phase1?.setAttribute('phase', 1);
      provider.endSpan(ctx, 'OK');

      const phase2 = provider.startSpan(ctx, 'workflow.processing');
      phase2?.setAttribute('phase', 2);
      provider.endSpan(ctx, 'OK');

      const phase3 = provider.startSpan(ctx, 'workflow.complete');
      phase3?.setAttribute('phase', 3);
      provider.endSpan(ctx, 'OK');

      // Export
      await provider.exportTrace(ctx.traceId);

      expect(exportedTraces.length).toBe(1);
      expect(exportedTraces[0].spans.length).toBe(3);
    });

    test('should trace errors in workflow', async () => {
      const provider = new TracingProvider({ serviceName: 'error-workflow' });
      let exportedTraces = [];

      provider.registerExporter(async (traceData) => {
        exportedTraces.push(traceData);
      });

      const ctx = provider.startTrace();
      const span = provider.startSpan(ctx, 'risky.operation');

      try {
        throw new Error('Operation failed');
      } catch (error) {
        provider.endSpan(ctx, 'ERROR', error);
      }

      await provider.exportTrace(ctx.traceId);

      expect(exportedTraces[0].spans[0].status).toBe('ERROR');
      expect(exportedTraces[0].spans[0].error).toBeDefined();
    });

    test('should propagate context across processes', () => {
      const provider = new TracingProvider();

      // Service A creates trace
      const ctxA = provider.startTrace('shared-trace-id');
      ctxA.setBaggage('user-id', '12345');
      const headersA = ctxA.toHeaders();

      // Service B receives headers
      const ctxB = TraceContext.fromHeaders(headersA);
      expect(ctxB.traceId).toBe('shared-trace-id');
      expect(ctxB.getBaggage('user-id')).toBe('12345');
    });
  });

  describe('Performance Overhead', () => {
    test('should have minimal tracing overhead', async () => {
      const provider = new TracingProvider({ serviceName: 'perf-test' });

      const startTime = Date.now();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const ctx = provider.startTrace();
        const span = provider.startSpan(ctx, 'operation');
        provider.endSpan(ctx, 'OK');
      }

      const elapsed = Date.now() - startTime;
      const avgTime = elapsed / iterations;

      // Should be able to create and end spans in <0.5ms average
      expect(avgTime).toBeLessThan(0.5);
    });
  });
});
