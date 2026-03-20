'use strict';

const { DiffAnalyzer, ImpactCalculator, DiffReporter } = require('../index.js');

describe('Diff Engine Integration', () => {
  it('should complete full diff pipeline', async () => {
    const baseline = {
      metadata: { repository: { name: 'my-app' }, generatedAt: '2026-02-01' },
      summary: { totalFiles: 100, totalLoc: 5000, languages: 2, frameworks: 1 },
      languages: {
        JavaScript: { files: 80, loc: 4000, percentage: 80 },
        Python: { files: 20, loc: 1000, percentage: 20 },
      },
      frameworks: ['React'],
      dependencies: {
        totalDependencies: 10,
        production: ['express@4.17.0', 'react@18.0.0'],
        development: ['jest@27.0.0'],
      },
      architecture: { pattern: { name: 'Monolithic', score: 0.7 } },
      metrics: {
        testCoverage: 65,
        codeQuality: 6,
        documentationRatio: 0.15,
        complexityScore: 'medium',
      },
    };

    const current = JSON.parse(JSON.stringify(baseline));
    current.metadata.generatedAt = '2026-03-20';
    current.summary.totalFiles = 120;
    current.summary.totalLoc = 6500;
    current.summary.languages = 3;
    current.languages.Go = { files: 20, loc: 1500, percentage: 23 };
    delete current.languages.Python;
    current.frameworks.push('Express');
    current.dependencies.production.push('axios@0.27.0');
    current.dependencies.totalDependencies = 11;
    current.architecture.pattern.name = 'Modular';
    current.metrics.testCoverage = 82;
    current.metrics.codeQuality = 8;

    // Phase 1: Analyze
    const analyzer = new DiffAnalyzer();
    const diff = await analyzer.generateDiff(baseline, current);

    expect(diff).toBeDefined();
    expect(diff.changes.languages.added).toHaveLength(1);
    expect(diff.changes.languages.removed).toHaveLength(1);
    expect(diff.changes.architecture.changed).toBe(true);

    // Phase 2: Calculate impact
    const calculator = new ImpactCalculator();
    const impact = calculator.calculateImpact(diff);

    expect(impact).toBeDefined();
    expect(impact.overallScore).toBeGreaterThan(0);
    expect(impact.overallScore).toBeLessThanOrEqual(10);
    expect(impact.severity).toBeDefined();
    expect(impact.recommendations).toBeInstanceOf(Array);
    expect(impact.recommendations.length).toBeGreaterThan(0);

    // Phase 3: Generate reports
    const reporter = new DiffReporter({ outputPath: '/tmp' });
    const reports = await reporter.generateReports(diff, impact);

    expect(reports).toBeDefined();
    expect(reports.json).toBeDefined();
    expect(reports.markdown).toBeDefined();
    expect(reports.impact).toBeDefined();
  });

  it('should detect major architecture shift impact', async () => {
    const baseline = {
      metadata: { repository: { name: 'test' } },
      summary: { totalFiles: 100, totalLoc: 5000, languages: 1, frameworks: 1 },
      languages: { JavaScript: { files: 100, loc: 5000, percentage: 100 } },
      frameworks: ['React'],
      dependencies: { totalDependencies: 5, production: [], development: [] },
      architecture: { pattern: { name: 'Monolithic', score: 0.8 } },
      metrics: { testCoverage: 70, codeQuality: 7, documentationRatio: 0.2 },
    };

    const current = JSON.parse(JSON.stringify(baseline));
    current.architecture.pattern.name = 'Modular';
    current.dependencies.production = ['axios@0.27.0', 'lodash@4.17.0'];
    current.dependencies.totalDependencies = 7;

    const analyzer = new DiffAnalyzer();
    const diff = await analyzer.generateDiff(baseline, current);

    const calculator = new ImpactCalculator();
    const impact = calculator.calculateImpact(diff);

    expect(impact.overallScore).toBeGreaterThanOrEqual(5);
    expect(impact.components.architecture).toBeGreaterThanOrEqual(5);
  });

  it('should identify code quality regression', async () => {
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
    current.metrics.testCoverage = 40;
    current.metrics.codeQuality = 4;

    const analyzer = new DiffAnalyzer();
    const diff = await analyzer.generateDiff(baseline, current);

    const calculator = new ImpactCalculator();
    const impact = calculator.calculateImpact(diff);

    const hasQualityRec = impact.recommendations.some(
      (r) => r.category === 'Quality' || r.category === 'Testing',
    );
    expect(hasQualityRec).toBe(true);
  });
});
