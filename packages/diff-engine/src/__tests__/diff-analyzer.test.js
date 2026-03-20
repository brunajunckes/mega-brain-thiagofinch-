'use strict';

const { DiffAnalyzer } = require('../diff-analyzer');

describe('DiffAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new DiffAnalyzer({ verbose: false });
  });

  describe('generateDiff', () => {
    it('should compare identical repositories with no changes', async () => {
      const repo = {
        metadata: { repository: { name: 'test' }, generatedAt: '2026-01-01' },
        summary: { totalFiles: 100, totalLoc: 5000, languages: 2, frameworks: 1 },
        languages: { JavaScript: { files: 80, loc: 4000, percentage: 80 } },
        frameworks: ['React'],
        dependencies: { totalDependencies: 10, production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 80, codeQuality: 8, documentationRatio: 0.25 },
      };

      const diff = await analyzer.generateDiff(repo, repo);

      expect(diff.baseline.files).toBe(100);
      expect(diff.current.files).toBe(100);
      expect(diff.changes.metadata.fileChange).toBe(0);
      expect(diff.changes.languages.added).toEqual([]);
      expect(diff.changes.languages.removed).toEqual([]);
    });

    it('should detect added languages', async () => {
      const baseline = {
        metadata: { repository: { name: 'test' } },
        summary: { totalFiles: 100, totalLoc: 5000, languages: 1, frameworks: 1 },
        languages: { JavaScript: { files: 100, loc: 5000, percentage: 100 } },
        frameworks: ['React'],
        dependencies: { totalDependencies: 0, production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 80, codeQuality: 8, documentationRatio: 0.25 },
      };

      const current = JSON.parse(JSON.stringify(baseline));
      current.languages.Python = { files: 20, loc: 1000, percentage: 17 };
      current.summary.languages = 2;

      const diff = await analyzer.generateDiff(baseline, current);

      expect(diff.changes.languages.added).toContainEqual(
        expect.objectContaining({
          language: 'Python',
          files: 20,
          loc: 1000,
        }),
      );
    });

    it('should detect removed languages', async () => {
      const baseline = {
        metadata: { repository: { name: 'test' } },
        summary: { totalFiles: 100, totalLoc: 5000, languages: 2, frameworks: 1 },
        languages: {
          JavaScript: { files: 80, loc: 4000, percentage: 80 },
          Python: { files: 20, loc: 1000, percentage: 20 },
        },
        frameworks: ['React'],
        dependencies: { totalDependencies: 0, production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 80, codeQuality: 8, documentationRatio: 0.25 },
      };

      const current = JSON.parse(JSON.stringify(baseline));
      delete current.languages.Python;
      current.summary.languages = 1;

      const diff = await analyzer.generateDiff(baseline, current);

      expect(diff.changes.languages.removed).toContainEqual(
        expect.objectContaining({
          language: 'Python',
          files: 20,
        }),
      );
    });

    it('should detect dependency additions', async () => {
      const baseline = {
        metadata: { repository: { name: 'test' } },
        summary: { totalFiles: 100, totalLoc: 5000, languages: 1, frameworks: 1 },
        languages: { JavaScript: { files: 100, loc: 5000, percentage: 100 } },
        frameworks: ['React'],
        dependencies: {
          totalDependencies: 1,
          production: ['express@4.17.0'],
          development: [],
        },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 80, codeQuality: 8, documentationRatio: 0.25 },
      };

      const current = JSON.parse(JSON.stringify(baseline));
      current.dependencies.production.push('axios@0.27.0');
      current.dependencies.totalDependencies = 2;

      const diff = await analyzer.generateDiff(baseline, current);

      expect(diff.changes.dependencies.production.added).toContain('axios@0.27.0');
    });

    it('should detect architecture changes', async () => {
      const baseline = {
        metadata: { repository: { name: 'test' } },
        summary: { totalFiles: 100, totalLoc: 5000, languages: 1, frameworks: 1 },
        languages: { JavaScript: { files: 100, loc: 5000, percentage: 100 } },
        frameworks: ['React'],
        dependencies: { totalDependencies: 0, production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.9 } },
        metrics: { testCoverage: 80, codeQuality: 8, documentationRatio: 0.25 },
      };

      const current = JSON.parse(JSON.stringify(baseline));
      current.architecture.pattern.name = 'Modular';

      const diff = await analyzer.generateDiff(baseline, current);

      expect(diff.changes.architecture.changed).toBe(true);
      expect(diff.changes.architecture.change.from).toBe('Monolithic');
      expect(diff.changes.architecture.change.to).toBe('Modular');
    });

    it('should detect metric regressions', async () => {
      const baseline = {
        metadata: { repository: { name: 'test' } },
        summary: { totalFiles: 100, totalLoc: 5000, languages: 1, frameworks: 1 },
        languages: { JavaScript: { files: 100, loc: 5000, percentage: 100 } },
        frameworks: ['React'],
        dependencies: { totalDependencies: 0, production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 85, codeQuality: 8, documentationRatio: 0.3 },
      };

      const current = JSON.parse(JSON.stringify(baseline));
      current.metrics.testCoverage = 65;

      const diff = await analyzer.generateDiff(baseline, current);

      expect(diff.changes.metrics.testCoverage.before).toBe(85);
      expect(diff.changes.metrics.testCoverage.after).toBe(65);
      expect(diff.changes.metrics.testCoverage.change).toBe(-20);
      expect(diff.changes.metrics.testCoverage.status).toBe('regressed');
    });

    it('should throw error if baseline is missing', async () => {
      await expect(analyzer.generateDiff(null, {})).rejects.toThrow('Both baseline and current repositories required');
    });

    it('should throw error if current is missing', async () => {
      await expect(analyzer.generateDiff({}, null)).rejects.toThrow('Both baseline and current repositories required');
    });
  });
});
