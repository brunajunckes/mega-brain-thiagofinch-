'use strict';

const { DecisionAnalyzer, RecommendationGenerator, DecisionFormatter } = require('../index');

describe('Decision Engine Integration', () => {
  it('should complete full decision pipeline', async () => {
    const repo = {
      repository: { name: 'test-repo', scannedAt: '2024-01-01T00:00:00Z' },
      summary: { totalFiles: 100, totalLoc: 50000 },
      languages: { JavaScript: {}, Python: {} },
      dependencies: { production: [{ name: 'express' }], development: [] },
      architecture: { pattern: { name: 'Monolithic', score: 0.6 } },
      metrics: { testCoverage: 50, codeQuality: 6 },
    };

    // Analyze
    const analyzer = new DecisionAnalyzer();
    const analysis = await analyzer.analyze(repo);

    expect(analysis.success).toBe(true);
    expect(analysis.analysis.healthScores).toBeDefined();
    expect(analysis.analysis.opportunities.length).toBeGreaterThan(0);

    // Generate recommendations
    const generator = new RecommendationGenerator();
    const recResult = await generator.generate(analysis.analysis);

    expect(recResult.success).toBe(true);
    expect(recResult.recommendations.length).toBeGreaterThan(0);

    // Format reports
    const formatter = new DecisionFormatter();
    const reportResult = await formatter.format(analysis.analysis, recResult.recommendations);

    expect(reportResult.success).toBe(true);
    expect(reportResult.reports.json).toBeDefined();
    expect(reportResult.reports.markdown).toBeDefined();
    expect(reportResult.reports.markdown).toContain('# Decision Report');
  });
});
