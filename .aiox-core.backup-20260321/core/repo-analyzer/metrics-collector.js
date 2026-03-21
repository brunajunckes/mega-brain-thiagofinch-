'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Metrics Collector — Collects code quality metrics
 *
 * Measures:
 * - Average function/method length
 * - Cyclomatic complexity estimation
 * - Test coverage detection
 * - Documentation ratio
 * - Unused imports
 * - Dead code patterns
 *
 * @class MetricsCollector
 * @version 1.0.0
 * @story 2.1
 */
class MetricsCollector {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.metrics = {
      avgFunctionLength: 0,
      complexityScore: 'low',
      testCoverage: 0,
      documentationRatio: 0,
      unusedImports: [],
      deadCodeEstimate: 'none',
    };
  }

  /**
   * Collect all metrics
   * @returns {Promise<Object>} Collected metrics
   */
  async collect() {
    try {
      await this._measureFunctionLength();
      await this._estimateComplexity();
      await this._detectTestCoverage();
      await this._measureDocumentation();
      await this._detectUnusedImports();
      await this._estimateDeadCode();
      return this._generateReport();
    } catch (error) {
      throw new Error(`Metrics collection failed: ${error.message}`);
    }
  }

  /**
   * Measure average function length
   * @private
   */
  async _measureFunctionLength() {
    const jsFiles = this._findFiles(['.js', '.ts']);
    const functionLengths = [];

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(path.join(this.rootPath, file), 'utf-8');
        const matches = content.match(/(?:function|const|let)\s+\w+\s*[=(]/g) || [];
        matches.forEach((match) => {
          // Estimate function length (very heuristic)
          const lines = content.split('\n').length / matches.length;
          functionLengths.push(Math.min(lines, 100)); // Cap at 100
        });
      } catch {
        // Skip unreadable files
      }
    }

    if (functionLengths.length > 0) {
      this.metrics.avgFunctionLength = Math.round(
        functionLengths.reduce((a, b) => a + b, 0) / functionLengths.length,
      );
    }
  }

  /**
   * Estimate complexity (simplified)
   * @private
   */
  async _estimateComplexity() {
    const jsFiles = this._findFiles(['.js', '.ts']);
    let complexityCount = 0;
    let fileCount = 0;

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(path.join(this.rootPath, file), 'utf-8');
        const ifCount = (content.match(/\bif\s*\(/g) || []).length;
        const switchCount = (content.match(/\bswitch\s*\(/g) || []).length;
        const loopCount = (content.match(/\b(for|while|do)\s*\(/g) || []).length;
        const catchCount = (content.match(/\bcatch\s*\(/g) || []).length;

        complexityCount += ifCount + switchCount * 2 + loopCount + catchCount;
        fileCount += 1;
      } catch {
        // Skip unreadable files
      }
    }

    const avgComplexity = fileCount > 0 ? complexityCount / fileCount : 0;

    if (avgComplexity < 5) {
      this.metrics.complexityScore = 'low';
    } else if (avgComplexity < 15) {
      this.metrics.complexityScore = 'medium';
    } else {
      this.metrics.complexityScore = 'high';
    }
  }

  /**
   * Detect test coverage
   * @private
   */
  async _detectTestCoverage() {
    const testFiles = this._findFiles(['.test.js', '.spec.js', '.test.ts', '.spec.ts']);
    const allJsFiles = this._findFiles(['.js', '.ts']);

    if (allJsFiles.length > 0) {
      this.metrics.testCoverage = Math.round((testFiles.length / allJsFiles.length) * 100);
    }

    // Check for coverage reports
    if (fs.existsSync(path.join(this.rootPath, 'coverage'))) {
      this.metrics.testCoverage = Math.min(this.metrics.testCoverage + 20, 100);
    }
  }

  /**
   * Measure documentation ratio
   * @private
   */
  async _measureDocumentation() {
    const jsFiles = this._findFiles(['.js', '.ts']);
    let totalLines = 0;
    let documentedLines = 0;

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(path.join(this.rootPath, file), 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line) => {
          const trimmed = line.trim();
          totalLines += 1;
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
            documentedLines += 1;
          }
        });
      } catch {
        // Skip unreadable files
      }
    }

    if (totalLines > 0) {
      this.metrics.documentationRatio = Math.round((documentedLines / totalLines) * 100) / 100;
    }
  }

  /**
   * Detect unused imports
   * @private
   */
  async _detectUnusedImports() {
    const jsFiles = this._findFiles(['.js', '.ts']);
    const unused = [];

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(path.join(this.rootPath, file), 'utf-8');
        const imports = content.match(/(?:import|require)\s+(?:{[^}]+}|['"]([^'"]+)['"])/g) || [];

        imports.forEach((imp) => {
          // Very simple heuristic: check if import appears only once (the import line)
          const importName = imp.match(/\{(\w+)\}/) || imp.match(/require\(['"]([^'"]+)['"]\)/);
          if (importName) {
            const name = importName[1];
            const occurrences = (content.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length;
            if (occurrences === 1) {
              unused.push({ file, import: name });
            }
          }
        });
      } catch {
        // Skip unreadable files
      }
    }

    this.metrics.unusedImports = unused.slice(0, 10); // Limit to 10
  }

  /**
   * Estimate dead code
   * @private
   */
  async _estimateDeadCode() {
    const jsFiles = this._findFiles(['.js', '.ts']);
    let deadCodeCount = 0;

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(path.join(this.rootPath, file), 'utf-8');
        // Very simple heuristic: functions that contain only return or empty
        const emptyFunctions = (content.match(/function\s+\w+\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
        deadCodeCount += emptyFunctions;
      } catch {
        // Skip unreadable files
      }
    }

    if (deadCodeCount === 0) {
      this.metrics.deadCodeEstimate = 'none';
    } else if (deadCodeCount < 5) {
      this.metrics.deadCodeEstimate = 'low';
    } else if (deadCodeCount < 15) {
      this.metrics.deadCodeEstimate = 'medium';
    } else {
      this.metrics.deadCodeEstimate = 'high';
    }
  }

  /**
   * Generate metrics report
   * @private
   */
  _generateReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: {
        codeQuality: this._scoreQuality(),
        recommendations: this._generateRecommendations(),
      },
    };
  }

  /**
   * Score overall code quality
   * @private
   */
  _scoreQuality() {
    let score = 5; // Start at 5

    // Penalize high function length
    if (this.metrics.avgFunctionLength > 30) {
      score -= 1;
    }

    // Penalize high complexity
    if (this.metrics.complexityScore === 'high') {
      score -= 1;
    }

    // Reward good test coverage
    if (this.metrics.testCoverage > 80) {
      score += 1;
    } else if (this.metrics.testCoverage < 50) {
      score -= 1;
    }

    // Reward good documentation
    if (this.metrics.documentationRatio > 0.2) {
      score += 1;
    }

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Generate recommendations
   * @private
   */
  _generateRecommendations() {
    const recs = [];

    if (this.metrics.avgFunctionLength > 30) {
      recs.push('Consider breaking down long functions');
    }
    if (this.metrics.complexityScore === 'high') {
      recs.push('Reduce cyclomatic complexity');
    }
    if (this.metrics.testCoverage < 70) {
      recs.push('Increase test coverage');
    }
    if (this.metrics.documentationRatio < 0.1) {
      recs.push('Add more code documentation');
    }
    if (this.metrics.unusedImports.length > 0) {
      recs.push('Remove unused imports');
    }
    if (this.metrics.deadCodeEstimate !== 'none') {
      recs.push('Remove dead code');
    }

    return recs;
  }

  /**
   * Find files by extensions
   * @private
   */
  _findFiles(extensions) {
    const files = [];
    const traverse = (dir) => {
      try {
        const entries = fs.readdirSync(dir);
        entries.forEach((entry) => {
          if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry)) {
            return;
          }
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            traverse(fullPath);
          } else if (extensions.some((ext) => entry.endsWith(ext))) {
            files.push(path.relative(this.rootPath, fullPath));
          }
        });
      } catch {
        // Skip inaccessible directories
      }
    };

    try {
      traverse(this.rootPath);
    } catch {
      // Silent fail
    }
    return files;
  }

  /**
   * Get collected metrics
   */
  getMetrics() {
    return this.metrics;
  }
}

module.exports = { MetricsCollector };
