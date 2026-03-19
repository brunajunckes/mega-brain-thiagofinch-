'use strict';

const { DiffAnalyzer, ImpactCalculator, DiffReporter } = require('../index');

describe('Diff Engine Integration', () => {
  describe('Full pipeline: analyze → assess → report', () => {
    it('should complete full diff pipeline successfully', async () => {
      const baseline = {
        repository: { name: 'test-repo', scannedAt: '2024-01-01T00:00:00Z' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: {
          JavaScript: { files: 80, loc: 40000, percentage: 80 },
          Python: { files: 20, loc: 10000, percentage: 20 },
        },
        dependencies: {
          production: [
            { name: 'express', version: '^4.17.0' },
            { name: 'lodash', version: '^4.17.0' },
          ],
        },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      const current = {
        repository: { name: 'test-repo', scannedAt: '2024-01-15T00:00:00Z' },
        summary: { totalFiles: 120, totalLoc: 60000 },
        languages: {
          JavaScript: { files: 90, loc: 45000, percentage: 75 },
          Python: { files: 20, loc: 10000, percentage: 16.7 },
          Go: { files: 10, loc: 5000, percentage: 8.3 },
        },
        dependencies: {
          production: [
            { name: 'express', version: '^4.18.0' },
            { name: 'lodash', version: '^4.17.0' },
            { name: 'axios', version: '^0.27.0' },
          ],
        },
        architecture: { pattern: { name: 'Modular', score: 0.85 } },
        metrics: { testCoverage: 85, codeQuality: 9 },
      };

      // Step 1: Analyze differences
      const analyzer = new DiffAnalyzer();
      const diff = await analyzer.compare(baseline, current);

      expect(diff).toBeDefined();
      expect(diff.changes).toBeDefined();

      // Validate diff structure
      expect(diff.changes.languages.added.length).toBe(1); // Go
      expect(diff.changes.dependencies.upgraded.length).toBe(1); // express
      expect(diff.changes.dependencies.added.length).toBe(1); // axios
      expect(diff.changes.architecture.changed).toBe(true);

      // Step 2: Calculate impact
      const calculator = new ImpactCalculator();
      const impact = calculator.assess(diff);

      expect(impact).toBeDefined();
      expect(impact.severity).toBeDefined();
      expect(impact.overallScore).toBeGreaterThan(0);
      expect(impact.breaking).toBe(true); // Major architecture change

      // Step 3: Generate reports
      const reporter = new DiffReporter();
      const reports = await reporter.generate(diff, impact);

      expect(reports).toBeDefined();
      expect(reports.success).toBe(true);
      expect(reports.reports.json).toBeDefined();
      expect(reports.reports.markdown).toBeDefined();
      expect(reports.summary).toBeDefined();

      // Validate report content
      expect(reports.reports.json.metadata).toBeDefined();
      expect(reports.reports.json.impact).toBeDefined();
      expect(reports.reports.json.changes).toBeDefined();

      expect(reports.reports.markdown).toContain('# Diff Report');
      expect(reports.reports.markdown).toContain('Go');
      expect(reports.reports.markdown).toContain('express');
    });

    it('should handle simple changes (single language update)', async () => {
      const baseline = {
        repository: { name: 'repo', scannedAt: '2024-01-01T00:00:00Z' },
        summary: { totalFiles: 50, totalLoc: 25000 },
        languages: { JavaScript: { files: 50, loc: 25000, percentage: 100 } },
        dependencies: { production: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.7 } },
        metrics: { testCoverage: 70, codeQuality: 7 },
      };

      const current = {
        repository: { name: 'repo', scannedAt: '2024-01-15T00:00:00Z' },
        summary: { totalFiles: 55, totalLoc: 27500 },
        languages: { JavaScript: { files: 55, loc: 27500, percentage: 100 } },
        dependencies: { production: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.7 } },
        metrics: { testCoverage: 72, codeQuality: 7 },
      };

      const analyzer = new DiffAnalyzer();
      const diff = await analyzer.compare(baseline, current);

      expect(diff.changes.languages.modified.length).toBe(1);
      expect(diff.changes.languages.modified[0].fileDelta).toBe(5);
      expect(diff.changes.languages.modified[0].locDelta).toBe(2500);

      const calculator = new ImpactCalculator();
      const impact = calculator.assess(diff);

      expect(impact.severity).toBe('low');
      expect(impact.breaking).toBe(false);
    });

    it('should handle no changes (identical snapshots)', async () => {
      const baseline = {
        repository: { name: 'repo', scannedAt: '2024-01-01T00:00:00Z' },
        summary: { totalFiles: 50, totalLoc: 25000 },
        languages: { JavaScript: { files: 50, loc: 25000, percentage: 100 } },
        dependencies: { production: [{ name: 'express', version: '^4.18.0' }] },
        architecture: { pattern: { name: 'Monolithic', score: 0.7 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      const current = { ...baseline };

      const analyzer = new DiffAnalyzer();
      const diff = await analyzer.compare(baseline, current);

      expect(diff.changes.languages.added.length).toBe(0);
      expect(diff.changes.languages.removed.length).toBe(0);
      expect(diff.changes.languages.modified.length).toBe(0);
      expect(diff.changes.dependencies.added.length).toBe(0);
      expect(diff.changes.architecture.changed).toBe(false);

      const calculator = new ImpactCalculator();
      const impact = calculator.assess(diff);

      expect(impact.severity).toBe('low');
      expect(impact.overallScore).toBe(0);
    });

    it('should handle major refactoring (multiple changes)', async () => {
      const baseline = {
        repository: { name: 'repo', scannedAt: '2024-01-01T00:00:00Z' },
        summary: { totalFiles: 50, totalLoc: 25000 },
        languages: {
          JavaScript: { files: 40, loc: 20000, percentage: 80 },
          Python: { files: 10, loc: 5000, percentage: 20 },
        },
        dependencies: {
          production: [
            { name: 'express', version: '^4.17.0' },
            { name: 'mongoose', version: '^5.0.0' },
          ],
        },
        architecture: { pattern: { name: 'Monolithic', score: 0.6 } },
        metrics: { testCoverage: 60, codeQuality: 6 },
      };

      const current = {
        repository: { name: 'repo', scannedAt: '2024-02-01T00:00:00Z' },
        summary: { totalFiles: 80, totalLoc: 40000 },
        languages: {
          JavaScript: { files: 50, loc: 25000, percentage: 62.5 },
          TypeScript: { files: 20, loc: 10000, percentage: 25 },
          Go: { files: 10, loc: 5000, percentage: 12.5 },
        },
        dependencies: {
          production: [
            { name: 'express', version: '^4.18.0' },
            { name: 'prisma', version: '^4.0.0' },
            { name: 'axios', version: '^0.27.0' },
          ],
        },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 85, codeQuality: 9 },
      };

      const analyzer = new DiffAnalyzer();
      const diff = await analyzer.compare(baseline, current);

      // Validate all changes detected
      expect(diff.changes.languages.added.length).toBeGreaterThan(0);
      expect(diff.changes.languages.removed.length).toBeGreaterThan(0);
      expect(diff.changes.dependencies.removed.length).toBeGreaterThan(0);
      expect(diff.changes.architecture.changed).toBe(true);

      const calculator = new ImpactCalculator();
      const impact = calculator.assess(diff);

      expect(impact.severity).not.toBe('low');
      expect(impact.overallScore).toBeGreaterThan(3);

      const reporter = new DiffReporter();
      const reports = await reporter.generate(diff, impact);

      expect(reports.summary.changeCount).toBeGreaterThan(5);
    });

    it('should track version changes correctly', async () => {
      const baseline = {
        repository: { name: 'repo' },
        summary: { totalFiles: 50, totalLoc: 25000 },
        languages: {},
        dependencies: {
          production: [
            { name: 'react', version: '^17.0.0' },
            { name: 'react-dom', version: '^17.0.0' },
          ],
        },
        architecture: { pattern: {} },
        metrics: {},
      };

      const current = {
        repository: { name: 'repo' },
        summary: { totalFiles: 50, totalLoc: 25000 },
        languages: {},
        dependencies: {
          production: [
            { name: 'react', version: '^18.0.0' },
            { name: 'react-dom', version: '^18.0.0' },
          ],
        },
        architecture: { pattern: {} },
        metrics: {},
      };

      const analyzer = new DiffAnalyzer();
      const diff = await analyzer.compare(baseline, current);

      expect(diff.changes.dependencies.upgraded.length).toBe(2);
      expect(diff.changes.dependencies.upgraded[0].from).toBe('^17.0.0');
      expect(diff.changes.dependencies.upgraded[0].to).toBe('^18.0.0');

      const calculator = new ImpactCalculator();
      const impact = calculator.assess(diff);

      expect(impact.overallScore).toBeGreaterThan(0);
    });
  });
});
