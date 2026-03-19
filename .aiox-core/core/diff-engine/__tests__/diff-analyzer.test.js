'use strict';

const { DiffAnalyzer } = require('../diff-analyzer');

describe('DiffAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new DiffAnalyzer();
  });

  describe('initialization', () => {
    it('should create analyzer instance', () => {
      expect(analyzer).toBeDefined();
    });
  });

  describe('language changes', () => {
    it('should detect added languages', async () => {
      const baseline = {
        repository: { name: 'test' },
        languages: { JavaScript: { files: 10, loc: 1000, percentage: 100 } },
      };

      const current = {
        repository: { name: 'test' },
        languages: {
          JavaScript: { files: 10, loc: 1000, percentage: 90 },
          Python: { files: 2, loc: 100, percentage: 10 },
        },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.languages.added.length).toBeGreaterThan(0);
      expect(result.changes.languages.added.some((l) => l.language === 'Python')).toBe(true);
    });

    it('should detect removed languages', async () => {
      const baseline = {
        repository: { name: 'test' },
        languages: {
          JavaScript: { files: 10, loc: 1000 },
          Ruby: { files: 5, loc: 500 },
        },
      };

      const current = {
        repository: { name: 'test' },
        languages: { JavaScript: { files: 10, loc: 1000 } },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.languages.removed.length).toBeGreaterThan(0);
      expect(result.changes.languages.removed.some((l) => l.language === 'Ruby')).toBe(true);
    });

    it('should detect modified languages', async () => {
      const baseline = {
        repository: { name: 'test' },
        languages: { JavaScript: { files: 100, loc: 5000, percentage: 100 } },
      };

      const current = {
        repository: { name: 'test' },
        languages: { JavaScript: { files: 120, loc: 6000, percentage: 100 } },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.languages.modified.length).toBeGreaterThan(0);
      expect(result.changes.languages.modified[0].fileDelta).toBe(20);
      expect(result.changes.languages.modified[0].locDelta).toBe(1000);
    });
  });

  describe('dependency changes', () => {
    it('should detect added dependencies', async () => {
      const baseline = {
        repository: { name: 'test' },
        dependencies: { production: [{ name: 'express', version: '^4.18.0' }] },
      };

      const current = {
        repository: { name: 'test' },
        dependencies: {
          production: [
            { name: 'express', version: '^4.18.0' },
            { name: 'lodash', version: '^4.17.0' },
          ],
        },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.dependencies.added.length).toBeGreaterThan(0);
      expect(result.changes.dependencies.added.some((d) => d.name === 'lodash')).toBe(true);
    });

    it('should detect removed dependencies', async () => {
      const baseline = {
        repository: { name: 'test' },
        dependencies: {
          production: [
            { name: 'express', version: '^4.18.0' },
            { name: 'lodash', version: '^4.17.0' },
          ],
        },
      };

      const current = {
        repository: { name: 'test' },
        dependencies: { production: [{ name: 'express', version: '^4.18.0' }] },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.dependencies.removed.length).toBeGreaterThan(0);
      expect(result.changes.dependencies.removed.some((d) => d.name === 'lodash')).toBe(true);
    });

    it('should detect upgraded dependencies', async () => {
      const baseline = {
        repository: { name: 'test' },
        dependencies: { production: [{ name: 'express', version: '^4.17.0' }] },
      };

      const current = {
        repository: { name: 'test' },
        dependencies: { production: [{ name: 'express', version: '^4.18.0' }] },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.dependencies.upgraded.length).toBeGreaterThan(0);
      expect(result.changes.dependencies.upgraded.some((d) => d.name === 'express')).toBe(true);
    });
  });

  describe('architecture changes', () => {
    it('should detect architecture pattern change', async () => {
      const baseline = {
        repository: { name: 'test' },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
      };

      const current = {
        repository: { name: 'test' },
        architecture: { pattern: { name: 'Modular', score: 0.85 } },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.architecture.before).toBe('Monolithic');
      expect(result.changes.architecture.after).toBe('Modular');
      expect(result.changes.architecture.changed).toBe(true);
    });

    it('should detect major architecture impact', async () => {
      const baseline = {
        repository: { name: 'test' },
        architecture: { pattern: { name: 'Monolithic' } },
      };

      const current = {
        repository: { name: 'test' },
        architecture: { pattern: { name: 'Modular' } },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.architecture.impact).toBe('major');
    });
  });

  describe('metrics changes', () => {
    it('should detect test coverage improvement', async () => {
      const baseline = {
        repository: { name: 'test' },
        metrics: { testCoverage: 65, codeQuality: 6 },
      };

      const current = {
        repository: { name: 'test' },
        metrics: { testCoverage: 82, codeQuality: 8 },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.metrics.testCoverage.change).toBe(17);
      expect(result.changes.metrics.testCoverage.status).toBe('improved');
      expect(result.changes.metrics.codeQuality.status).toBe('improved');
    });

    it('should detect test coverage regression', async () => {
      const baseline = {
        repository: { name: 'test' },
        metrics: { testCoverage: 85 },
      };

      const current = {
        repository: { name: 'test' },
        metrics: { testCoverage: 70 },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.metrics.testCoverage.status).toBe('regressed');
    });
  });

  describe('summary changes', () => {
    it('should track file count changes', async () => {
      const baseline = {
        repository: { name: 'test' },
        summary: { totalFiles: 100 },
      };

      const current = {
        repository: { name: 'test' },
        summary: { totalFiles: 120 },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.metadata.fileDelta.change).toBe(20);
    });

    it('should track LOC changes', async () => {
      const baseline = {
        repository: { name: 'test' },
        summary: { totalLoc: 50000 },
      };

      const current = {
        repository: { name: 'test' },
        summary: { totalLoc: 60000 },
      };

      const result = await analyzer.compare(baseline, current);

      expect(result.changes.metadata.locDelta.change).toBe(10000);
    });
  });

  describe('error handling', () => {
    it('should throw on missing baseline', async () => {
      const current = { repository: { name: 'test' }, summary: {} };
      await expect(analyzer.compare(null, current)).rejects.toThrow();
    });

    it('should throw on missing current', async () => {
      const baseline = { repository: { name: 'test' }, summary: {} };
      await expect(analyzer.compare(baseline, null)).rejects.toThrow();
    });
  });

  describe('getter methods', () => {
    it('getChanges should return all changes', async () => {
      const baseline = {
        repository: { name: 'test' },
        summary: {},
        languages: { JavaScript: { files: 10, loc: 1000 } },
        dependencies: { production: [] },
        architecture: { pattern: {} },
        metrics: {},
      };

      const current = {
        repository: { name: 'test' },
        summary: {},
        languages: { JavaScript: { files: 10, loc: 1000 } },
        dependencies: { production: [] },
        architecture: { pattern: {} },
        metrics: {},
      };

      await analyzer.compare(baseline, current);
      const changes = analyzer.getChanges();

      expect(changes.languages).toBeDefined();
      expect(changes.dependencies).toBeDefined();
      expect(changes.architecture).toBeDefined();
    });
  });
});
