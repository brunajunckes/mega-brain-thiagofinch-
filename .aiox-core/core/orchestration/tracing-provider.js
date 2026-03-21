/**
 * Tracing Provider - Distributed tracing for task orchestration
 * @module core/orchestration/tracing-provider
 * @version 1.0.0
 */

const { randomUUID } = require('crypto');
const { performance } = require('perf_hooks');

/**
 * Span - Represents a single operation in a trace
 */
class Span {
  constructor(name, traceId, parentSpanId = null) {
    this.spanId = randomUUID();
    this.traceId = traceId;
    this.parentSpanId = parentSpanId;
    this.name = name;
    this.startTime = performance.now();
    this.endTime = null;
    this.duration = null;
    this.attributes = {};
    this.events = [];
    this.status = 'UNSET'; // UNSET, OK, ERROR
    this.error = null;
  }

  /**
   * Add attribute to span
   */
  setAttribute(key, value) {
    this.attributes[key] = value;
  }

  /**
   * Add event to span
   */
  addEvent(name, attributes = {}) {
    this.events.push({
      name,
      timestamp: performance.now(),
      attributes
    });
  }

  /**
   * End span and calculate duration
   */
  end(status = 'OK', error = null) {
    this.endTime = performance.now();
    this.duration = this.endTime - this.startTime;
    this.status = status;
    this.error = error;
  }

  /**
   * Convert span to JSON
   */
  toJSON() {
    return {
      spanId: this.spanId,
      traceId: this.traceId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      attributes: this.attributes,
      events: this.events,
      status: this.status,
      error: this.error
    };
  }
}

/**
 * TraceContext - Manages trace context and propagation
 */
class TraceContext {
  constructor(traceId = null) {
    this.traceId = traceId || randomUUID();
    this.spanStack = [];
    this.spans = [];
    this.baggage = {};
  }

  /**
   * Push span onto stack
   */
  pushSpan(span) {
    this.spanStack.push(span);
    this.spans.push(span);
  }

  /**
   * Pop span from stack
   */
  popSpan() {
    return this.spanStack.pop();
  }

  /**
   * Get current active span
   */
  activeSpan() {
    return this.spanStack.length > 0 ? this.spanStack[this.spanStack.length - 1] : null;
  }

  /**
   * Set baggage item (propagated across processes)
   */
  setBaggage(key, value) {
    this.baggage[key] = value;
  }

  /**
   * Get baggage item
   */
  getBaggage(key) {
    return this.baggage[key];
  }

  /**
   * Convert context to trace headers for propagation
   */
  toHeaders() {
    return {
      'traceparent': `00-${this.traceId}-${this.activeSpan()?.spanId || '0000000000000000'}-01`,
      'baggage': Object.entries(this.baggage)
        .map(([k, v]) => `${k}=${v}`)
        .join(',')
    };
  }

  /**
   * Create context from headers
   */
  static fromHeaders(headers) {
    const traceparent = headers['traceparent'] || headers['x-trace-id'];
    let traceId = traceparent;

    if (traceparent && traceparent.includes('-')) {
      const parts = traceparent.split('-');
      // Format: 00-{traceId}-{spanId}-01
      // traceId can contain hyphens, so we need to parse from the end
      if (parts.length >= 4) {
        // Last part is '01', second-to-last is spanId
        const spanId = parts[parts.length - 2];
        // Everything between index 1 and length-2 is the traceId
        traceId = parts.slice(1, parts.length - 2).join('-');
      }
    }

    const context = new TraceContext(traceId);

    // Parse baggage
    if (headers['baggage']) {
      const items = headers['baggage'].split(',');
      items.forEach(item => {
        const [key, value] = item.split('=');
        if (key && value) {
          context.setBaggage(key.trim(), value.trim());
        }
      });
    }

    return context;
  }
}

/**
 * TracingProvider - Central tracing manager
 */
class TracingProvider {
  constructor(options = {}) {
    this.name = options.name || 'tracing-provider';
    this.serviceName = options.serviceName || 'unknown-service';
    this.enabled = options.enabled !== false;
    this.samplingRate = options.samplingRate || 1.0; // 0.0 to 1.0

    this.traces = new Map(); // traceId -> TraceContext
    this.exporters = []; // Trace exporters
    this.maxTraces = options.maxTraces || 10000;

    this.stats = {
      tracesCreated: 0,
      spansCreated: 0,
      spansEnded: 0,
      tracesExported: 0
    };
  }

  /**
   * Register trace exporter
   */
  registerExporter(exporter) {
    this.exporters.push(exporter);
  }

  /**
   * Start trace (create new context)
   */
  startTrace(traceId = null) {
    if (!this.enabled) return null;

    // Check sampling
    if (Math.random() > this.samplingRate) {
      return null;
    }

    const context = new TraceContext(traceId);
    this.traces.set(context.traceId, context);
    this.stats.tracesCreated++;

    // Cleanup old traces
    if (this.traces.size > this.maxTraces) {
      const firstKey = this.traces.keys().next().value;
      this.traces.delete(firstKey);
    }

    return context;
  }

  /**
   * Get trace context
   */
  getTrace(traceId) {
    return this.traces.get(traceId);
  }

  /**
   * Start span in context
   */
  startSpan(context, spanName) {
    if (!this.enabled || !context) return null;

    const activeSpan = context.activeSpan();
    const span = new Span(spanName, context.traceId, activeSpan?.spanId);
    context.pushSpan(span);
    this.stats.spansCreated++;

    return span;
  }

  /**
   * End span
   */
  endSpan(context, status = 'OK', error = null) {
    if (!this.enabled || !context) return;

    const span = context.popSpan();
    if (span) {
      span.end(status, error);
      this.stats.spansEnded++;
    }
  }

  /**
   * Export trace
   */
  async exportTrace(traceId) {
    if (!this.enabled) return;

    const context = this.traces.get(traceId);
    if (!context) return;

    const traceData = {
      traceId: context.traceId,
      serviceName: this.serviceName,
      spans: context.spans.map(s => s.toJSON()),
      timestamp: Date.now()
    };

    // Call all exporters
    for (const exporter of this.exporters) {
      try {
        await exporter(traceData);
      } catch (error) {
        console.error(`Exporter error: ${error.message}`);
      }
    }

    this.stats.tracesExported++;

    // Cleanup
    this.traces.delete(traceId);
  }

  /**
   * Get trace data
   */
  getTraceData(traceId) {
    const context = this.traces.get(traceId);
    if (!context) return null;

    return {
      traceId: context.traceId,
      serviceName: this.serviceName,
      spans: context.spans.map(s => s.toJSON()),
      spanCount: context.spans.length
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTraces: this.traces.size,
      exporterCount: this.exporters.length
    };
  }

  /**
   * Disable/enable tracing
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set sampling rate
   */
  setSamplingRate(rate) {
    this.samplingRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Clear all traces
   */
  clear() {
    this.traces.clear();
  }
}

module.exports = {
  Span,
  TraceContext,
  TracingProvider
};
