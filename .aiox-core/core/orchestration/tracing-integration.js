/**
 * Tracing Integration - Integrates tracing with task execution system
 * @module core/orchestration/tracing-integration
 * @version 1.0.0
 */

const { TracingProvider, TraceContext } = require('./tracing-provider');

/**
 * InstrumentedTaskExecutor - Wraps TaskExecutor with tracing
 */
class InstrumentedTaskExecutor {
  constructor(taskExecutor, tracingProvider) {
    this.taskExecutor = taskExecutor;
    this.tracing = tracingProvider || new TracingProvider({ serviceName: 'task-executor' });
    this.executionTraces = new Map(); // taskId -> traceId
  }

  /**
   * Execute task with tracing
   */
  async executeWithTracing(task) {
    const traceContext = this.tracing.startTrace();
    if (!traceContext) {
      return this.taskExecutor.execute(task);
    }

    const traceId = traceContext.traceId;
    this.executionTraces.set(task.id, traceId);

    try {
      // Create spans for each phase
      const enqueueSpan = this.tracing.startSpan(traceContext, 'task.enqueue');
      enqueueSpan?.setAttribute('task.id', task.id);
      enqueueSpan?.setAttribute('task.type', task.type);
      this.tracing.endSpan(traceContext, 'OK');

      const executionSpan = this.tracing.startSpan(traceContext, 'task.execution');
      executionSpan?.setAttribute('task.timeout', task.timeout);

      const result = await this.taskExecutor.execute(task);

      executionSpan?.addEvent('task.completed', { status: 'success' });
      this.tracing.endSpan(traceContext, 'OK');

      // Export trace
      await this.tracing.exportTrace(traceId);

      return result;
    } catch (error) {
      const errorSpan = this.tracing.startSpan(traceContext, 'task.error');
      errorSpan?.setAttribute('error.message', error.message);
      errorSpan?.setAttribute('error.stack', error.stack);
      this.tracing.endSpan(traceContext, 'ERROR', error);

      await this.tracing.exportTrace(traceId);
      throw error;
    } finally {
      this.executionTraces.delete(task.id);
    }
  }

  /**
   * Get trace for task
   */
  getTaskTrace(taskId) {
    const traceId = this.executionTraces.get(taskId);
    if (!traceId) return null;

    return this.tracing.getTraceData(traceId);
  }
}

/**
 * InstrumentedQueue - Wraps queue with tracing
 */
class InstrumentedQueue {
  constructor(queue, tracingProvider) {
    this.queue = queue;
    this.tracing = tracingProvider || new TracingProvider({ serviceName: 'queue' });
  }

  /**
   * Enqueue with tracing
   */
  enqueueWithTracing(task, traceContext = null) {
    if (!traceContext) {
      traceContext = this.tracing.startTrace();
    }

    if (traceContext) {
      const span = this.tracing.startSpan(traceContext, 'queue.enqueue');
      span?.setAttribute('task.id', task.id);
      span?.setAttribute('queue.size', this.queue.size());
    }

    const result = this.queue.enqueue(task);

    if (traceContext) {
      this.tracing.endSpan(traceContext, 'OK');
    }

    return result;
  }

  /**
   * Dequeue with tracing
   */
  dequeueWithTracing(traceContext = null) {
    if (!traceContext) {
      traceContext = this.tracing.startTrace();
    }

    if (traceContext) {
      const span = this.tracing.startSpan(traceContext, 'queue.dequeue');
      span?.setAttribute('queue.size', this.queue.size());
    }

    const result = this.queue.dequeue();

    if (traceContext && result) {
      const activeSpan = traceContext.activeSpan();
      activeSpan?.setAttribute('task.id', result.id);
    }

    if (traceContext) {
      this.tracing.endSpan(traceContext, 'OK');
    }

    return result;
  }
}

/**
 * InstrumentedResourceAllocator - Wraps allocator with tracing
 */
class InstrumentedResourceAllocator {
  constructor(allocator, tracingProvider) {
    this.allocator = allocator;
    this.tracing = tracingProvider || new TracingProvider({ serviceName: 'resource-allocator' });
  }

  /**
   * Allocate resources with tracing
   */
  allocateWithTracing(task, traceContext = null) {
    if (!traceContext) {
      traceContext = this.tracing.startTrace();
    }

    const span = this.tracing.startSpan(traceContext, 'resource.allocate');
    span?.setAttribute('task.id', task.id);
    span?.setAttribute('task.cpu', task.cpu);
    span?.setAttribute('task.memory', task.memory);

    try {
      const result = this.allocator.allocateTask(task.id, {
        cpuMHz: task.cpu,
        memoryMB: task.memory
      });
      span?.setAttribute('allocation.success', true);
      this.tracing.endSpan(traceContext, 'OK');
      return result;
    } catch (error) {
      span?.setAttribute('allocation.error', error.message);
      this.tracing.endSpan(traceContext, 'ERROR', error);
      throw error;
    }
  }
}

/**
 * InstrumentedHealthMonitor - Wraps health monitor with tracing
 */
class InstrumentedHealthMonitor {
  constructor(monitor, tracingProvider) {
    this.monitor = monitor;
    this.tracing = tracingProvider || new TracingProvider({ serviceName: 'health-monitor' });
  }

  /**
   * Record health check with tracing
   */
  recordCheckWithTracing(componentId, success, error = null, traceContext = null) {
    if (!traceContext) {
      traceContext = this.tracing.startTrace();
    }

    const span = this.tracing.startSpan(traceContext, 'health.check');
    span?.setAttribute('component.id', componentId);
    span?.setAttribute('check.success', success);

    if (error) {
      span?.setAttribute('check.error', error);
    }

    this.monitor.recordCheck(componentId, success, error);

    const health = this.monitor.getComponentHealth(componentId);
    span?.setAttribute('component.status', health?.status);
    span?.setAttribute('component.successRate', health?.successRate);

    this.tracing.endSpan(traceContext, 'OK');

    return health;
  }
}

/**
 * TraceExporter - Base exporter for traces
 */
class TraceExporter {
  constructor(options = {}) {
    this.name = options.name || 'exporter';
  }

  async export(traceData) {
    // Override in subclasses
    throw new Error('export() must be implemented');
  }
}

/**
 * ConsoleTraceExporter - Exports traces to console
 */
class ConsoleTraceExporter extends TraceExporter {
  async export(traceData) {
    console.log(`[Trace] ${traceData.serviceName}:${traceData.traceId}`);
    console.log(`  Spans: ${traceData.spans.length}`);
    traceData.spans.forEach(span => {
      console.log(`    - ${span.name} (${span.duration?.toFixed(2)}ms) [${span.status}]`);
    });
  }
}

/**
 * FileTraceExporter - Exports traces to file
 */
class FileTraceExporter extends TraceExporter {
  constructor(filepath) {
    super({ name: 'file-exporter' });
    this.filepath = filepath;
    this.traces = [];
  }

  async export(traceData) {
    this.traces.push(traceData);
  }

  async save() {
    const fs = require('fs').promises;
    await fs.writeFile(this.filepath, JSON.stringify(this.traces, null, 2));
  }
}

/**
 * MetricsTraceExporter - Aggregates trace metrics
 */
class MetricsTraceExporter extends TraceExporter {
  constructor() {
    super({ name: 'metrics-exporter' });
    this.metrics = {
      totalTraces: 0,
      totalSpans: 0,
      totalDuration: 0,
      errorCount: 0,
      spansByName: {}
    };
  }

  async export(traceData) {
    this.metrics.totalTraces++;
    this.metrics.totalSpans += traceData.spans.length;

    let traceDuration = 0;
    traceData.spans.forEach(span => {
      traceDuration = Math.max(traceDuration, span.endTime - span.startTime);

      // Aggregate by span name
      if (!this.metrics.spansByName[span.name]) {
        this.metrics.spansByName[span.name] = {
          count: 0,
          totalDuration: 0,
          errors: 0
        };
      }

      this.metrics.spansByName[span.name].count++;
      this.metrics.spansByName[span.name].totalDuration += span.duration || 0;

      if (span.status === 'ERROR') {
        this.metrics.spansByName[span.name].errors++;
        this.metrics.errorCount++;
      }
    });

    this.metrics.totalDuration += traceDuration;
  }

  getMetrics() {
    const spanMetrics = {};
    Object.entries(this.metrics.spansByName).forEach(([name, data]) => {
      spanMetrics[name] = {
        count: data.count,
        avgDuration: data.totalDuration / data.count,
        errorRate: (data.errors / data.count * 100).toFixed(2) + '%'
      };
    });

    return {
      ...this.metrics,
      spanMetrics,
      avgTraceDuration: this.metrics.totalDuration / Math.max(1, this.metrics.totalTraces)
    };
  }
}

module.exports = {
  InstrumentedTaskExecutor,
  InstrumentedQueue,
  InstrumentedResourceAllocator,
  InstrumentedHealthMonitor,
  TraceExporter,
  ConsoleTraceExporter,
  FileTraceExporter,
  MetricsTraceExporter
};
