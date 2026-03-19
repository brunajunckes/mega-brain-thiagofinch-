'use strict';

const { RecommendationGenerator } = require('../recommendation-generator');

describe('RecommendationGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new RecommendationGenerator();
  });

  describe('initialization', () => {
    it('should create generator instance', () => {
      expect(generator).toBeDefined();
    });
  });

  describe('recommendation generation', () => {
    it('should generate recommendations from analysis', async () => {
      const analysis = {
        currentState: {
          repository: 'repo',
          testCoverage: 50,
          architectureScore: 6,
          summary: { languages: 4, totalLoc: 200000 },
          architecturePattern: 'Monolithic',
        },
        healthScores: { architecture: 6, testing: 5, overall: 5.5 },
        changes: {
          dependencies: { upgraded: 3 },
          metrics: { testCoverageChange: 0 },
          languages: { added: 0 },
        },
      };

      const result = await generator.generate(analysis);

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should recommend testing improvements when coverage is low', async () => {
      const analysis = {
        currentState: {
          repository: 'repo',
          testCoverage: 40,
          architectureScore: 8,
          summary: { languages: 2, totalLoc: 50000 },
        },
        healthScores: { architecture: 8, testing: 4, overall: 6 },
        changes: { dependencies: {}, metrics: {}, languages: {} },
      };

      const result = await generator.generate(analysis);

      expect(result.recommendations.some((r) => r.category === 'testing')).toBe(true);
    });

    it('should recommend architecture improvements when score is low', async () => {
      const analysis = {
        currentState: {
          repository: 'repo',
          testCoverage: 80,
          architectureScore: 5,
          summary: { languages: 2, totalLoc: 50000 },
        },
        healthScores: { architecture: 5, testing: 8, overall: 6.5 },
        changes: { dependencies: {}, metrics: {}, languages: {} },
      };

      const result = await generator.generate(analysis);

      expect(result.recommendations.some((r) => r.category === 'architecture')).toBe(true);
    });

    it('should recommend dependency modernization', async () => {
      const analysis = {
        currentState: {
          repository: 'repo',
          testCoverage: 80,
          architectureScore: 8,
          summary: { languages: 2, totalLoc: 50000 },
        },
        healthScores: { architecture: 8, testing: 8, overall: 8 },
        changes: {
          dependencies: { upgraded: 5 },
          metrics: {},
          languages: {},
        },
      };

      const result = await generator.generate(analysis);

      expect(result.recommendations.some((r) => r.category === 'dependencies')).toBe(true);
    });

    it('should recommend language consolidation when multiple languages', async () => {
      const analysis = {
        currentState: {
          repository: 'repo',
          testCoverage: 80,
          architectureScore: 8,
          summary: { languages: 5, totalLoc: 50000 },
        },
        healthScores: { architecture: 8, testing: 8, overall: 8 },
        changes: { dependencies: {}, metrics: {}, languages: {} },
      };

      const result = await generator.generate(analysis);

      expect(result.recommendations.some((r) => r.category === 'languages')).toBe(true);
    });

    it('should prioritize recommendations by impact and effort', async () => {
      const analysis = {
        currentState: {
          repository: 'repo',
          testCoverage: 50,
          architectureScore: 5,
          summary: { languages: 5, totalLoc: 200000 },
          architecturePattern: 'Monolithic',
        },
        healthScores: { architecture: 5, testing: 5, overall: 5 },
        changes: {
          dependencies: { upgraded: 5 },
          metrics: { testCoverageChange: -10 },
          languages: { added: 1 },
        },
      };

      const result = await generator.generate(analysis);

      expect(result.recommendations.length).toBeGreaterThan(0);
      // First recommendation should have highest priority
      const firstPriority = result.recommendations[0].priority;
      result.recommendations.forEach((rec) => {
        expect(rec.priority).toBeLessThanOrEqual(firstPriority);
      });
    });

    it('should include summary statistics', async () => {
      const analysis = {
        currentState: {
          repository: 'repo',
          testCoverage: 60,
          architectureScore: 7,
          summary: { languages: 2, totalLoc: 50000 },
        },
        healthScores: { architecture: 7, testing: 6, overall: 6.5 },
        changes: { dependencies: {}, metrics: {}, languages: {} },
      };

      const result = await generator.generate(analysis);

      expect(result.summary.total).toBeGreaterThanOrEqual(0);
      expect(result.summary.highPriority).toBeDefined();
      expect(result.summary.mediumPriority).toBeDefined();
      expect(result.summary.lowPriority).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw on missing analysis', async () => {
      await expect(generator.generate(null)).rejects.toThrow();
    });
  });
});
