/**
 * Benchmark Suite - Performance testing for task orchestration
 * @module core/orchestration/benchmarks
 * @version 1.0.0
 */

const { performance } = require('perf_hooks');

/**
 * BenchmarkSuite - Runs performance benchmarks on orchestration components
 */
class BenchmarkSuite {
  constructor(options = {}) {
    this.name = options.name || 'benchmark';
    this.verbose = options.verbose || false;
    this.results = [];
    this.warmupIterations = options.warmupIterations || 10;
    this.benchmarkIterations = options.benchmarkIterations || 100;
  }

  /**
   * Run a benchmark
   */
  async run(name, fn, options = {}) {
    const iterations = options.iterations || this.benchmarkIterations;
    const setup = options.setup || (() => {});
    const teardown = options.teardown || (() => {});

    // Warmup
    for (let i = 0; i < this.warmupIterations; i++) {
      await setup();
      await fn();
      await teardown();
    }

    // Benchmark
    const times = [];
    for (let i = 0; i < iterations; i++) {
      await setup();
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
      await teardown();
    }

    // Calculate statistics
    const result = {
      name,
      iterations,
      times,
      mean: this._calculateMean(times),
      median: this._calculateMedian(times),
      min: Math.min(...times),
      max: Math.max(...times),
      stdDev: this._calculateStdDev(times),
      p95: this._calculatePercentile(times, 0.95),
      p99: this._calculatePercentile(times, 0.99),
      throughput: 1000 / this._calculateMean(times) // ops per second
    };

    this.results.push(result);

    if (this.verbose) {
      console.log(`✓ ${name}: ${result.mean.toFixed(2)}ms (±${result.stdDev.toFixed(2)}ms)`);
    }

    return result;
  }

  /**
   * Run benchmarks with progressively increasing load
   */
  async runLoadTest(name, fnFactory, options = {}) {
    const loads = options.loads || [1, 10, 50, 100, 500, 1000];
    const results = [];

    for (const load of loads) {
      const startMem = process.memoryUsage();
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < load; i++) {
        promises.push(fnFactory(i));
      }
      await Promise.all(promises);

      const end = performance.now();
      const endMem = process.memoryUsage();

      const result = {
        load,
        duration: end - start,
        throughput: (load / ((end - start) / 1000)).toFixed(2),
        memoryDelta: {
          heapUsed: (endMem.heapUsed - startMem.heapUsed) / 1024 / 1024, // MB
          heapTotal: (endMem.heapTotal - startMem.heapTotal) / 1024 / 1024 // MB
        }
      };

      results.push(result);

      if (this.verbose) {
        console.log(`  Load ${load}: ${result.duration.toFixed(2)}ms, ${result.throughput} ops/sec`);
      }
    }

    return {
      name,
      loadTest: true,
      results
    };
  }

  /**
   * Calculate mean
   */
  _calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate median
   */
  _calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate standard deviation
   */
  _calculateStdDev(values) {
    const mean = this._calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate percentile
   */
  _calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get results summary
   */
  getSummary() {
    return {
      benchmarks: this.results,
      totalTests: this.results.length,
      avgDuration: this.results.reduce((sum, r) => sum + r.mean, 0) / this.results.length,
      fastestOp: this.results.reduce((min, r) => r.mean < min.mean ? r : min),
      slowestOp: this.results.reduce((max, r) => r.mean > max.mean ? r : max)
    };
  }

  /**
   * Generate HTML report
   */
  generateReport(filename = null) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Benchmark Report - ${this.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .metric { font-weight: bold; color: #2196F3; }
  </style>
</head>
<body>
  <h1>Benchmark Report: ${this.name}</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <h2>Summary</h2>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    ${this.results.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>
        Mean: ${r.mean.toFixed(2)}ms |
        Median: ${r.median.toFixed(2)}ms |
        P95: ${r.p95.toFixed(2)}ms |
        P99: ${r.p99.toFixed(2)}ms |
        Throughput: ${r.throughput.toFixed(2)} ops/sec
      </td>
    </tr>
    `).join('')}
  </table>

  <h2>Detailed Results</h2>
  ${this.results.map(r => `
  <h3>${r.name}</h3>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Iterations</td>
      <td>${r.iterations}</td>
    </tr>
    <tr>
      <td>Mean</td>
      <td>${r.mean.toFixed(3)}ms</td>
    </tr>
    <tr>
      <td>Median</td>
      <td>${r.median.toFixed(3)}ms</td>
    </tr>
    <tr>
      <td>Min</td>
      <td>${r.min.toFixed(3)}ms</td>
    </tr>
    <tr>
      <td>Max</td>
      <td>${r.max.toFixed(3)}ms</td>
    </tr>
    <tr>
      <td>Std Dev</td>
      <td>${r.stdDev.toFixed(3)}ms</td>
    </tr>
    <tr>
      <td>P95</td>
      <td>${r.p95.toFixed(3)}ms</td>
    </tr>
    <tr>
      <td>P99</td>
      <td>${r.p99.toFixed(3)}ms</td>
    </tr>
    <tr>
      <td>Throughput</td>
      <td>${r.throughput.toFixed(2)} ops/sec</td>
    </tr>
  </table>
  `).join('')}
</body>
</html>
    `;

    if (filename) {
      const fs = require('fs');
      fs.writeFileSync(filename, html);
    }

    return html;
  }
}

module.exports = BenchmarkSuite;
