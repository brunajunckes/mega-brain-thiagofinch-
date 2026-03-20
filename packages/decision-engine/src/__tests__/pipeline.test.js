'use strict';

const DecisionAnalyzer = require('../decision-analyzer');
const RecommendationGenerator = require('../recommendation-generator');
const DecisionFormatter = require('../decision-formatter');

describe('Decision Engine Pipeline', () => {
  let analyzer;
  let generator;
  let formatter;

  beforeEach(() => {
    analyzer = new DecisionAnalyzer();
    generator = new RecommendationGenerator();
    formatter = new DecisionFormatter();
  });

  describe('Full Pipeline Integration', () => {
    test('should complete analysis → recommendations → formatting', async () => {
      const mockRepo = {
        name: 'test-app',
        stats: { totalFiles: 100, totalLines: 10000 },
        metrics: {
          testCoverage: 65,
          codeQuality: 7,
          architectureScore: 8,
          documentationRatio: 0.4,
          complexityLevel: 'moderate',
        },
      };

      const analysis = await analyzer.analyzeDecision(mockRepo);
      expect(analysis).toBeDefined();
      expect(analysis.healthScore).toBeGreaterThanOrEqual(1);
      expect(analysis.healthScore).toBeLessThanOrEqual(10);
      expect(analysis.debtLevel).toMatch(/minimal|low|moderate|high|critical/);
    });

    test('should generate recommendations from analysis', async () => {
      const mockRepo = {
        name: 'test-app',
        metrics: {
          testCoverage: 50,
          codeQuality: 6,
          architectureScore: 7,
          documentationRatio: 0.3,
          complexityLevel: 'moderate',
        },
      };

      const analysis = await analyzer.analyzeDecision(mockRepo);
      const recommendations = await generator.generateRecommendations(analysis);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should format analysis to JSON', async () => {
      const mockRepo = {
        name: 'test-app',
        metrics: {
          testCoverage: 70,
          codeQuality: 8,
          architectureScore: 8,
          documentationRatio: 0.5,
          complexityLevel: 'low',
        },
      };

      const analysis = await analyzer.analyzeDecision(mockRepo);
      const recommendations = await generator.generateRecommendations(analysis);
      const formatted = formatter.formatJSON(analysis, recommendations);

      expect(formatted).toBeDefined();
      expect(formatted.metadata).toBeDefined();
      expect(formatted.metadata.healthScore).toBeGreaterThanOrEqual(1);
    });

    test('should format analysis to Markdown', async () => {
      const mockRepo = {
        name: 'test-app',
        metrics: {
          testCoverage: 60,
          codeQuality: 6,
          architectureScore: 7,
          documentationRatio: 0.35,
          complexityLevel: 'moderate',
        },
      };

      const analysis = await analyzer.analyzeDecision(mockRepo);
      const recommendations = await generator.generateRecommendations(analysis);
      const formatted = formatter.formatMarkdown(analysis, recommendations);

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    test('should handle low-quality repos', async () => {
      const poorRepo = {
        name: 'legacy-app',
        metrics: {
          testCoverage: 15,
          codeQuality: 3,
          architectureScore: 2,
          documentationRatio: 0.1,
          complexityLevel: 'very-high',
        },
      };

      const analysis = await analyzer.analyzeDecision(poorRepo);
      expect(['moderate', 'high', 'critical']).toContain(analysis.debtLevel);
      expect(analysis.healthScore).toBeLessThan(7);
    });

    test('should handle high-quality repos', async () => {
      const excellentRepo = {
        name: 'modern-app',
        metrics: {
          testCoverage: 95,
          codeQuality: 9.5,
          architectureScore: 9,
          documentationRatio: 0.8,
          complexityLevel: 'low',
        },
      };

      const analysis = await analyzer.analyzeDecision(excellentRepo);
      expect(analysis.debtLevel).toBe('minimal');
      expect(analysis.healthScore).toBeGreaterThan(8);
    });
  });
});
