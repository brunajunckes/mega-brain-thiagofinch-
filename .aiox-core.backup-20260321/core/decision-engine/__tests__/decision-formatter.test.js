'use strict';

const { DecisionFormatter } = require('../decision-formatter');

describe('DecisionFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new DecisionFormatter();
  });

  it('should format analysis to reports', async () => {
    const analysis = {
      currentState: { repository: 'test-repo', testCoverage: 75 },
      healthScores: { overall: 7.5, architecture: 8, codeQuality: 7, testing: 7, debtLevel: 'moderate' },
      context: { repositoryName: 'test-repo' },
      opportunities: [],
      risks: [],
    };

    const result = await formatter.format(analysis, []);

    expect(result.success).toBe(true);
    expect(result.reports.json).toBeDefined();
    expect(result.reports.markdown).toBeDefined();
  });

  it('should include recommendations in JSON', async () => {
    const analysis = {
      currentState: {},
      healthScores: { overall: 5, debtLevel: 'significant' },
      context: {},
      opportunities: [],
      risks: [],
    };

    const recommendations = [
      {
        id: 'rec-1',
        category: 'testing',
        title: 'Improve coverage',
        description: 'Add more tests',
        impact: 'medium',
        confidence: 0.9,
        effort: 'medium',
        estimatedDays: 10,
        priority: 10,
      },
    ];

    const result = await formatter.format(analysis, recommendations);

    expect(result.reports.json.recommendations.length).toBe(1);
    expect(result.reports.json.recommendations[0].title).toBe('Improve coverage');
  });

  it('should generate health summary', async () => {
    const analysis = {
      currentState: {},
      healthScores: { overall: 8.5, debtLevel: 'low' },
      context: { repositoryName: 'repo' },
      opportunities: [],
      risks: [],
    };

    const result = await formatter.format(analysis);

    expect(result.reports.markdown).toContain('8.5/10');
    expect(result.reports.markdown).toContain('low');
  });

  it('should throw on missing analysis', async () => {
    await expect(formatter.format(null)).rejects.toThrow();
  });
});
