'use strict';

const { TaskAnalyzer } = require('../task-analyzer');

describe('TaskAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new TaskAnalyzer();
  });

  describe('pattern detection', () => {
    it('should detect build output pattern', () => {
      const result = {
        name: 'build',
        status: 'success',
        output: { artifacts: ['dist/app.js', 'dist/app.css'] },
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.detectedPatterns).toContain('build-output');
    });

    it('should detect test results pattern', () => {
      const result = {
        name: 'test',
        status: 'success',
        output: { passed: 24, failed: 0 },
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.detectedPatterns).toContain('test-results');
    });

    it('should detect lint output pattern', () => {
      const result = {
        name: 'lint',
        status: 'success',
        output: { errors: 0, warnings: 2 },
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.detectedPatterns).toContain('lint-output');
    });

    it('should handle task without output', () => {
      const result = {
        name: 'echo',
        status: 'success',
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.detectedPatterns).toEqual([]);
    });
  });

  describe('chain suggestions', () => {
    it('should suggest test after build', () => {
      const result = {
        name: 'build',
        status: 'success',
        output: { artifacts: ['dist/app.js'] },
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.suggestedChains.some((c) => c.nextTask === 'test')).toBe(true);
    });

    it('should suggest deploy after tests', () => {
      const result = {
        name: 'test',
        status: 'success',
        output: { passed: 100, failed: 0 },
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.suggestedChains.some((c) => c.nextTask === 'deploy')).toBe(true);
    });
  });

  describe('output extraction', () => {
    it('should extract flat keys', () => {
      const result = {
        name: 'test',
        status: 'success',
        output: { passed: 10, failed: 0, duration: 30 },
      };

      const keys = analyzer._extractOutputKeys(result);
      expect(keys).toContain('passed');
      expect(keys).toContain('failed');
      expect(keys).toContain('duration');
    });

    it('should extract nested keys', () => {
      const result = {
        name: 'build',
        status: 'success',
        output: {
          artifacts: ['app.js'],
          metadata: { size: 1024, checksum: 'abc123' },
        },
      };

      const keys = analyzer._extractOutputKeys(result);
      expect(keys).toContain('artifacts');
      expect(keys).toContain('metadata.size');
      expect(keys).toContain('metadata.checksum');
    });
  });

  describe('confidence calculation', () => {
    it('should calculate high confidence for successful tasks with patterns', () => {
      const result = {
        name: 'build',
        status: 'success',
        output: { artifacts: ['app.js'] },
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.confidence).toBeGreaterThan(0.6);
    });

    it('should calculate low confidence for failed tasks', () => {
      const result = {
        name: 'build',
        status: 'failed',
        output: { error: 'Build failed' },
      };

      const analysis = analyzer.analyzeTask(result);
      expect(analysis.confidence).toBeLessThan(0.5);
    });
  });

  describe('custom patterns', () => {
    it('should register custom pattern', () => {
      analyzer.registerPattern('custom-pattern', (task) => task.name === 'custom');

      const patterns = analyzer.getPatterns();
      expect(patterns).toContain('custom-pattern');
    });

    it('should use custom pattern for detection', () => {
      analyzer.registerPattern('is-success-task', (task) => task.status === 'success');

      const result = { name: 'test', status: 'success', output: {} };
      const analysis = analyzer.analyzeTask(result);

      expect(analysis.detectedPatterns).toContain('is-success-task');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid task result', () => {
      expect(() => analyzer.analyzeTask(null)).toThrow();
      expect(() => analyzer.analyzeTask({})).toThrow();
    });

    it('should throw on invalid pattern registration', () => {
      expect(() => analyzer.registerPattern('invalid', 'not-a-function')).toThrow();
    });
  });
});
