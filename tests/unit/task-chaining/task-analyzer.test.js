'use strict';

const { TaskAnalyzer } = require('../../../.aiox-core/core/task-chaining/task-analyzer');

describe('TaskAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new TaskAnalyzer();
  });

  describe('constructor', () => {
    it('should initialize with default patterns', () => {
      const patterns = analyzer.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns).toContain('build-output');
      expect(patterns).toContain('test-results');
      expect(patterns).toContain('lint-output');
    });

    it('should accept custom maxCacheSize', () => {
      const custom = new TaskAnalyzer({ maxCacheSize: 50 });
      expect(custom.maxCacheSize).toBe(50);
    });
  });

  describe('analyzeTask', () => {
    it('should throw on null input', () => {
      expect(() => analyzer.analyzeTask(null)).toThrow('TaskResult must have a name');
    });

    it('should throw on missing name', () => {
      expect(() => analyzer.analyzeTask({ status: 'success' })).toThrow('TaskResult must have a name');
    });

    it('should return analysis for valid task result', () => {
      const result = analyzer.analyzeTask({
        name: 'build',
        status: 'success',
        output: { artifacts: ['app.js'] },
      });

      expect(result.taskName).toBe('build');
      expect(result.status).toBe('success');
      expect(result.outputKeys).toBeDefined();
      expect(result.detectedPatterns).toBeDefined();
      expect(result.suggestedChains).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should detect build-output pattern', () => {
      const result = analyzer.analyzeTask({
        name: 'build',
        status: 'success',
        output: { artifacts: ['dist/app.js', 'dist/app.css'] },
      });

      expect(result.detectedPatterns).toContain('build-output');
      expect(result.suggestedChains.length).toBeGreaterThan(0);
    });

    it('should detect test-results pattern', () => {
      const result = analyzer.analyzeTask({
        name: 'test',
        status: 'success',
        output: { passed: 42, failed: 0 },
      });

      expect(result.detectedPatterns).toContain('test-results');
    });

    it('should detect lint-output pattern', () => {
      const result = analyzer.analyzeTask({
        name: 'lint',
        status: 'success',
        output: { errors: 3, warnings: 10 },
      });

      expect(result.detectedPatterns).toContain('lint-output');
    });

    it('should detect artifact-output pattern', () => {
      const result = analyzer.analyzeTask({
        name: 'package',
        status: 'success',
        output: { artifacts: ['bundle.zip'] },
      });

      expect(result.detectedPatterns).toContain('artifact-output');
    });

    it('should detect coverage-output pattern', () => {
      const result = analyzer.analyzeTask({
        name: 'coverage',
        status: 'success',
        output: { coverage: 85.5 },
      });

      expect(result.detectedPatterns).toContain('coverage-output');
    });

    it('should detect performance-output pattern', () => {
      const result = analyzer.analyzeTask({
        name: 'perf',
        status: 'success',
        output: { duration: 1200, performance_metrics: {} },
      });

      expect(result.detectedPatterns).toContain('performance-output');
    });

    it('should handle task with no output', () => {
      const result = analyzer.analyzeTask({
        name: 'empty',
        status: 'success',
      });

      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.suggestedChains).toHaveLength(0);
    });

    it('should calculate confidence based on status and patterns', () => {
      const successWithPatterns = analyzer.analyzeTask({
        name: 'build',
        status: 'success',
        output: { artifacts: ['app.js'] },
      });
      expect(successWithPatterns.confidence).toBeGreaterThan(0.5);

      const failedNoOutput = analyzer.analyzeTask({
        name: 'fail',
        status: 'failed',
      });
      expect(failedNoOutput.confidence).toBe(0);
    });
  });

  describe('_extractOutputKeys', () => {
    it('should extract flat keys', () => {
      const keys = analyzer._extractOutputKeys({
        output: { a: 1, b: 2, c: 3 },
      });
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
    });

    it('should extract nested keys with dot notation', () => {
      const keys = analyzer._extractOutputKeys({
        output: { foo: { bar: 1 } },
      });
      expect(keys).toContain('foo');
      expect(keys).toContain('foo.bar');
    });

    it('should handle null output', () => {
      const keys = analyzer._extractOutputKeys({ output: null });
      expect(keys).toHaveLength(0);
    });
  });

  describe('_suggestChains', () => {
    it('should suggest test-after-build for build-output', () => {
      const chains = analyzer._suggestChains(
        { name: 'build', output: {} },
        ['build-output'],
      );
      expect(chains.some((c) => c.nextTask === 'test')).toBe(true);
    });

    it('should suggest deploy-after-tests for test-results', () => {
      const chains = analyzer._suggestChains(
        { name: 'test', output: {} },
        ['test-results'],
      );
      expect(chains.some((c) => c.nextTask === 'deploy')).toBe(true);
    });

    it('should suggest format-after-lint for lint-output', () => {
      const chains = analyzer._suggestChains(
        { name: 'lint', output: {} },
        ['lint-output'],
      );
      expect(chains.some((c) => c.nextTask === 'format')).toBe(true);
    });

    it('should return empty for no patterns', () => {
      const chains = analyzer._suggestChains({ name: 'x', output: {} }, []);
      expect(chains).toHaveLength(0);
    });
  });

  describe('registerPattern', () => {
    it('should register a custom pattern', () => {
      analyzer.registerPattern('custom', (result) => !!result.output?.custom);
      expect(analyzer.getPatterns()).toContain('custom');
    });

    it('should throw on non-function pattern', () => {
      expect(() => analyzer.registerPattern('bad', 'not-a-fn')).toThrow('Pattern must be a function');
    });

    it('should use custom pattern in analysis', () => {
      analyzer.registerPattern('custom-marker', (result) => !!result.output?.marker);

      const analysis = analyzer.analyzeTask({
        name: 'custom',
        status: 'success',
        output: { marker: true },
      });

      expect(analysis.detectedPatterns).toContain('custom-marker');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      analyzer.cache.set('key', 'value');
      analyzer.clearCache();
      expect(analyzer.cache.size).toBe(0);
    });
  });
});
