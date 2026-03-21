'use strict';

const { InsightGenerator } = require('../insight-generator');

describe('InsightGenerator', () => {
  it('should generate insights', () => {
    const repos = [
      { repository: 'repo1', healthScore: 8, testCoverage: 85, loc: 50000, languages: 2, dependencies: 20, files: 500 },
      { repository: 'repo2', healthScore: 5, testCoverage: 50, loc: 100000, languages: 4, dependencies: 40, files: 1000 },
      { repository: 'repo3', healthScore: 7, testCoverage: 75, loc: 60000, languages: 3, dependencies: 25, files: 600 },
    ];

    const result = InsightGenerator.generate(repos);

    expect(result.status).toBe('ok');
    expect(result.insights).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should detect improvements', () => {
    const repos = [
      { repository: 'repo1', healthScore: 9, testCoverage: 90, loc: 50000, languages: 2, dependencies: 20, files: 500 },
      { repository: 'repo2', healthScore: 5, testCoverage: 50, loc: 100000, languages: 4, dependencies: 40, files: 1000 },
    ];

    const result = InsightGenerator.generate(repos);

    expect(result.insights.some((i) => i.type === 'improvement')).toBe(true);
  });

  it('should detect regressions', () => {
    const repos = [
      { repository: 'repo1', healthScore: 8, testCoverage: 85, loc: 50000, languages: 2, dependencies: 20, files: 500 },
      { repository: 'repo2', healthScore: 5, testCoverage: 30, loc: 100000, languages: 4, dependencies: 40, files: 1000 },
    ];

    const result = InsightGenerator.generate(repos);

    expect(result.insights.some((i) => i.type === 'regression')).toBe(true);
  });
});
