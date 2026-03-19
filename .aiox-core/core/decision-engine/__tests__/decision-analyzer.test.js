'use strict';

const { DecisionAnalyzer } = require('../decision-analyzer');

describe('DecisionAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new DecisionAnalyzer();
  });

  describe('initialization', () => {
    it('should create analyzer instance', () => {
      expect(analyzer).toBeDefined();
    });
  });

  describe('current state analysis', () => {
    it('should analyze repository metadata', async () => {
      const repo = {
        repository: { name: 'test-repo', scannedAt: '2024-01-01T00:00:00Z' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: { JavaScript: {}, Python: {} },
        dependencies: { production: [{ name: 'express' }], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.7 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.success).toBe(true);
      expect(result.analysis.currentState).toBeDefined();
      expect(result.analysis.currentState.repository).toBe('test-repo');
      expect(result.analysis.currentState.summary.totalFiles).toBe(100);
    });

    it('should identify languages and frameworks', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: { JavaScript: {}, Go: {}, Python: {} },
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: {},
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.currentState.languages).toEqual(['JavaScript', 'Go', 'Python']);
      expect(result.analysis.currentState.summary.languages).toBe(3);
    });
  });

  describe('health scoring', () => {
    it('should calculate overall health score', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: { JavaScript: {} },
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: { testCoverage: 80, codeQuality: 9 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.healthScores).toBeDefined();
      expect(result.analysis.healthScores.overall).toBeGreaterThan(0);
      expect(result.analysis.healthScores.overall).toBeLessThanOrEqual(10);
    });

    it('should assess low test coverage', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: { testCoverage: 40, codeQuality: 6 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.healthScores.testing).toBeLessThan(5);
    });

    it('should identify critical debt level', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.3 } },
        metrics: { testCoverage: 20, codeQuality: 2 },
      };

      const result = await analyzer.analyze(repo);

      expect(['critical', 'significant']).toContain(result.analysis.healthScores.debtLevel);
    });

    it('should identify low debt level', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.95 } },
        metrics: { testCoverage: 95, codeQuality: 9 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.healthScores.debtLevel).toBe('low');
    });
  });

  describe('opportunity detection', () => {
    it('should detect architecture improvement opportunity', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: { JavaScript: {} },
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.6 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.opportunities.length).toBeGreaterThan(0);
      expect(result.analysis.opportunities.some((o) => o.category === 'architecture')).toBe(true);
    });

    it('should detect testing improvement opportunity', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 50, codeQuality: 8 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.opportunities.some((o) => o.category === 'testing')).toBe(true);
    });

    it('should detect language consolidation opportunity', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: { totalFiles: 100, totalLoc: 50000, languages: 5 },
        languages: { JavaScript: {}, Go: {}, Python: {}, Rust: {}, Java: {} },
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.opportunities.some((o) => o.category === 'languages')).toBe(true);
    });

    it('should prioritize opportunities by impact and effort', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: { JavaScript: {}, Go: {}, Python: {} },
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.5 } },
        metrics: { testCoverage: 40, codeQuality: 5 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.context.topOpportunities).toBeDefined();
      expect(result.analysis.context.topOpportunities.length).toBeGreaterThan(0);
    });
  });

  describe('risk assessment', () => {
    it('should detect architecture change risk', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: {},
      };

      const diff = {
        changes: {
          architecture: {
            changed: true,
            before: 'Monolithic',
            after: 'Modular',
            impact: 'major',
          },
          dependencies: {},
          metrics: {},
        },
      };

      const result = await analyzer.analyze(repo, diff);

      expect(result.analysis.risks.some((r) => r.id === 'arch-change-risk')).toBe(true);
    });

    it('should detect dependency upgrade risk', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: {},
      };

      const diff = {
        changes: {
          architecture: { changed: false },
          dependencies: {
            upgraded: [
              { name: 'pkg1', from: '1.0', to: '2.0' },
              { name: 'pkg2', from: '1.0', to: '2.0' },
              { name: 'pkg3', from: '1.0', to: '2.0' },
              { name: 'pkg4', from: '1.0', to: '2.0' },
              { name: 'pkg5', from: '1.0', to: '2.0' },
              { name: 'pkg6', from: '1.0', to: '2.0' },
            ],
          },
          metrics: {},
        },
      };

      const result = await analyzer.analyze(repo, diff);

      expect(result.analysis.risks.some((r) => r.id === 'dep-upgrade-risk')).toBe(true);
    });

    it('should detect test coverage regression risk', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: { testCoverage: 80, codeQuality: 8 },
      };

      const diff = {
        changes: {
          architecture: { changed: false },
          dependencies: {},
          metrics: { testCoverage: { change: -10 } },
        },
      };

      const result = await analyzer.analyze(repo, diff);

      expect(result.analysis.risks.some((r) => r.id === 'test-coverage-risk')).toBe(true);
    });
  });

  describe('decision context', () => {
    it('should generate decision context', async () => {
      const repo = {
        repository: { name: 'test-repo' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: { JavaScript: {}, Python: {} },
        dependencies: { production: [{ name: 'express' }], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.85 } },
        metrics: { testCoverage: 80, codeQuality: 8 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.context.repositoryName).toBe('test-repo');
      expect(result.analysis.context.healthScore).toBeDefined();
      expect(result.analysis.context.debtLevel).toBeDefined();
      expect(result.analysis.context.topOpportunities).toBeDefined();
    });

    it('should include technology stack in context', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: { JavaScript: {}, Go: {} },
        dependencies: { production: [{ name: 'express' }, { name: 'axios' }], development: [] },
        architecture: { pattern: { name: 'Modular', score: 0.8 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      const result = await analyzer.analyze(repo);

      expect(result.analysis.context.technicalStack).toBeDefined();
      expect(result.analysis.context.technicalStack.languages.length).toBe(2);
      expect(result.analysis.context.technicalStack.totalDependencies).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should throw on missing repository', async () => {
      await expect(analyzer.analyze(null)).rejects.toThrow();
    });

    it('should handle missing optional diff parameter', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: {},
      };

      const result = await analyzer.analyze(repo);
      expect(result.success).toBe(true);
    });
  });

  describe('getter methods', () => {
    it('getAnalysis should return full analysis', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: { JavaScript: {} },
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      await analyzer.analyze(repo);
      const analysis = analyzer.getAnalysis();

      expect(analysis).toBeDefined();
      expect(analysis.currentState).toBeDefined();
      expect(analysis.healthScores).toBeDefined();
    });

    it('getOpportunities should return opportunities list', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: { totalFiles: 100, totalLoc: 50000 },
        languages: { JavaScript: {} },
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.6 } },
        metrics: { testCoverage: 50, codeQuality: 8 },
      };

      await analyzer.analyze(repo);
      const opportunities = analyzer.getOpportunities();

      expect(Array.isArray(opportunities)).toBe(true);
    });

    it('getHealthScores should return scores', async () => {
      const repo = {
        repository: { name: 'repo' },
        summary: {},
        languages: {},
        dependencies: { production: [], development: [] },
        architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
        metrics: { testCoverage: 75, codeQuality: 8 },
      };

      await analyzer.analyze(repo);
      const scores = analyzer.getHealthScores();

      expect(scores.overall).toBeDefined();
      expect(scores.debtLevel).toBeDefined();
    });
  });
});
