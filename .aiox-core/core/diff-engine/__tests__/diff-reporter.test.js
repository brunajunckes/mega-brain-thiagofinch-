'use strict';

const { DiffReporter } = require('../diff-reporter');

describe('DiffReporter', () => {
  let reporter;

  beforeEach(() => {
    reporter = new DiffReporter();
  });

  describe('initialization', () => {
    it('should create reporter instance', () => {
      expect(reporter).toBeDefined();
    });
  });

  describe('JSON report generation', () => {
    it('should generate valid JSON report structure', async () => {
      const diff = {
        baseline: { name: 'repo-v1', scannedAt: '2024-01-01T00:00:00Z' },
        current: { name: 'repo-v1', scannedAt: '2024-01-15T00:00:00Z' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = {
        severity: 'low',
        overallScore: 2,
        breaking: false,
        recommendations: [],
      };

      const result = await reporter.generate(diff, impact);

      expect(result.success).toBe(true);
      expect(result.reports.json).toBeDefined();
      expect(result.reports.json.metadata).toBeDefined();
      expect(result.reports.json.impact).toBeDefined();
      expect(result.reports.json.changes).toBeDefined();
    });

    it('should include all metadata fields in JSON report', async () => {
      const diff = {
        baseline: { name: 'baseline-repo', scannedAt: '2024-01-01T00:00:00Z' },
        current: { name: 'current-repo', scannedAt: '2024-01-15T00:00:00Z' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = {
        severity: 'moderate',
        overallScore: 5,
        breaking: true,
        recommendations: ['Test thoroughly'],
      };

      const result = await reporter.generate(diff, impact);
      const json = result.reports.json;

      expect(json.metadata.baselineRepo).toBe('baseline-repo');
      expect(json.metadata.currentRepo).toBe('current-repo');
      expect(json.impact.severity).toBe('moderate');
      expect(json.impact.breaking).toBe(true);
    });

    it('should include language changes in JSON report', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: {
            added: [{ language: 'Python', files: 5, loc: 500 }],
            removed: [{ language: 'Ruby', files: 3, loc: 300 }],
            modified: [],
          },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 1, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);
      const json = result.reports.json;

      expect(json.changes.languages.added.length).toBe(1);
      expect(json.changes.languages.added[0].language).toBe('Python');
      expect(json.changes.languages.removed.length).toBe(1);
    });

    it('should include dependency changes in JSON report', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: {
            added: [{ name: 'lodash', version: '^4.17.0' }],
            removed: [{ name: 'underscore', version: '^1.8.0' }],
            upgraded: [{ name: 'express', from: '^4.17.0', to: '^4.18.0' }],
            downgraded: [],
          },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 1, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);
      const json = result.reports.json;

      expect(json.changes.dependencies.added.length).toBe(1);
      expect(json.changes.dependencies.removed.length).toBe(1);
      expect(json.changes.dependencies.upgraded.length).toBe(1);
    });

    it('should include architecture changes in JSON report', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: true, before: 'Monolithic', after: 'Modular', impact: 'major' },
          metrics: {},
        },
      };

      const impact = { severity: 'high', overallScore: 7, breaking: true, recommendations: [] };

      const result = await reporter.generate(diff, impact);
      const json = result.reports.json;

      expect(json.changes.architecture.changed).toBe(true);
      expect(json.changes.architecture.before).toBe('Monolithic');
      expect(json.changes.architecture.after).toBe('Modular');
      expect(json.changes.architecture.impact).toBe('major');
    });

    it('should include metric changes in JSON report', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {
            testCoverage: { before: 70, after: 85, change: 15, status: 'improved' },
            codeQuality: { before: 6, after: 8, change: 2, status: 'improved' },
          },
        },
      };

      const impact = { severity: 'low', overallScore: 1, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);
      const json = result.reports.json;

      expect(json.changes.metrics.testCoverage).toBeDefined();
      expect(json.changes.metrics.codeQuality).toBeDefined();
    });
  });

  describe('Markdown report generation', () => {
    it('should generate valid markdown report', async () => {
      const diff = {
        baseline: { name: 'repo-v1', scannedAt: '2024-01-01T00:00:00Z' },
        current: { name: 'repo-v1', scannedAt: '2024-01-15T00:00:00Z' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 2, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);

      expect(result.reports.markdown).toBeDefined();
      expect(result.reports.markdown).toContain('# Diff Report');
      expect(result.reports.markdown).toContain('Severity:');
    });

    it('should include language section in markdown when languages changed', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: {
            added: [{ language: 'Go', files: 2, loc: 200 }],
            removed: [],
            modified: [],
          },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 1, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);

      expect(result.reports.markdown).toContain('## Language Changes');
      expect(result.reports.markdown).toContain('Go');
    });

    it('should include dependency section in markdown when dependencies changed', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: {
            added: [{ name: 'axios', version: '^0.27.0' }],
            removed: [],
            upgraded: [],
            downgraded: [],
          },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 1, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);

      expect(result.reports.markdown).toContain('## Dependency Changes');
      expect(result.reports.markdown).toContain('axios');
    });

    it('should include architecture section when architecture changed', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: true, before: 'Monolithic', after: 'Modular', impact: 'major' },
          metrics: {},
        },
      };

      const impact = { severity: 'high', overallScore: 7, breaking: true, recommendations: [] };

      const result = await reporter.generate(diff, impact);

      expect(result.reports.markdown).toContain('## Architecture Changes');
      expect(result.reports.markdown).toContain('Monolithic');
      expect(result.reports.markdown).toContain('Modular');
    });

    it('should include metrics section in markdown when metrics changed', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {
            testCoverage: { before: 75, after: 85, change: 10, status: 'improved' },
          },
        },
      };

      const impact = { severity: 'low', overallScore: 1, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);

      expect(result.reports.markdown).toContain('## Metric Changes');
      expect(result.reports.markdown).toContain('Test Coverage');
    });

    it('should include recommendations section when recommendations exist', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = {
        severity: 'high',
        overallScore: 6,
        breaking: false,
        recommendations: ['Add more tests', 'Review architecture'],
      };

      const result = await reporter.generate(diff, impact);

      expect(result.reports.markdown).toContain('## Recommendations');
      expect(result.reports.markdown).toContain('Add more tests');
    });

    it('should show breaking changes indicator', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = {
        severity: 'critical',
        overallScore: 9,
        breaking: true,
        recommendations: [],
      };

      const result = await reporter.generate(diff, impact);

      expect(result.reports.markdown).toContain('Breaking Changes:');
      expect(result.reports.markdown).toContain('Yes');
    });
  });

  describe('Summary generation', () => {
    it('should include severity in summary', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'moderate', overallScore: 5, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);

      expect(result.summary.severity).toBe('moderate');
    });

    it('should include change count in summary', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: {
            added: [{ language: 'Go', files: 2, loc: 200 }],
            removed: [],
            modified: [],
          },
          dependencies: { added: [{ name: 'lodash', version: '4.0' }], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 1, breaking: false, recommendations: [] };

      const result = await reporter.generate(diff, impact);

      expect(result.summary.changeCount).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should throw on missing diff', async () => {
      const impact = { severity: 'low', overallScore: 0, breaking: false, recommendations: [] };
      await expect(reporter.generate(null, impact)).rejects.toThrow();
    });

    it('should throw on missing impact', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      await expect(reporter.generate(diff, null)).rejects.toThrow();
    });
  });

  describe('getter methods', () => {
    it('getJsonReport should return JSON report', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 0, breaking: false, recommendations: [] };

      await reporter.generate(diff, impact);
      const json = reporter.getJsonReport();

      expect(json).toBeDefined();
      expect(json.metadata).toBeDefined();
    });

    it('getMarkdownReport should return markdown report', async () => {
      const diff = {
        baseline: { name: 'repo' },
        current: { name: 'repo' },
        changes: {
          languages: { added: [], removed: [], modified: [] },
          dependencies: { added: [], removed: [], upgraded: [], downgraded: [] },
          architecture: { changed: false },
          metrics: {},
        },
      };

      const impact = { severity: 'low', overallScore: 0, breaking: false, recommendations: [] };

      await reporter.generate(diff, impact);
      const md = reporter.getMarkdownReport();

      expect(md).toBeDefined();
      expect(md).toContain('# Diff Report');
    });
  });
});
