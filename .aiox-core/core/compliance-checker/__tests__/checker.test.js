'use strict';

const { ComplianceChecker } = require('../checker');

describe('ComplianceChecker', () => {
  let checker;

  beforeEach(() => {
    checker = new ComplianceChecker();
  });

  it('should check compliance', () => {
    const repo = {
      repository: { name: 'test-repo' },
      metrics: { testCoverage: 85, codeQuality: 8 },
      summary: { totalLoc: 50000 },
      languages: { JavaScript: {}, Python: {} },
      architecture: { pattern: { name: 'Modular' } },
    };

    const result = checker.check(repo);

    expect(result.checks).toBeDefined();
    expect(result.summary.total).toBeGreaterThan(0);
    expect(result.summary.score).toBeGreaterThanOrEqual(0);
  });

  it('should fail coverage check', () => {
    const repo = {
      repository: { name: 'test-repo' },
      metrics: { testCoverage: 50, codeQuality: 8 },
      summary: { totalLoc: 50000 },
      languages: { JavaScript: {} },
      architecture: { pattern: { name: 'Modular' } },
    };

    const result = checker.check(repo);

    expect(result.checks['test-coverage-75'].passed).toBe(false);
  });

  it('should pass all checks for good repo', () => {
    const repo = {
      repository: { name: 'test-repo' },
      metrics: { testCoverage: 90, codeQuality: 9 },
      summary: { totalLoc: 50000 },
      languages: { JavaScript: {}, TypeScript: {} },
      architecture: { pattern: { name: 'Modular' } },
    };

    const result = checker.check(repo);

    expect(result.summary.failed).toBe(0);
    expect(result.summary.score).toBe(100);
  });
});
