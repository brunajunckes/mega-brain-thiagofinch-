'use strict';

const { ReportTypes } = require('../../../.aiox-core/core/scheduled-reports');

describe('ReportTypes', () => {
  describe('generatePortfolioReport', () => {
    it('should generate portfolio report from repos', () => {
      const repos = [
        { repository: 'repo1', healthScore: 8, testCoverage: 85, loc: 50000, dependencies: 20 },
        { repository: 'repo2', healthScore: 5, testCoverage: 50, loc: 100000, dependencies: 40 },
        { repository: 'repo3', healthScore: 9, testCoverage: 90, loc: 60000, dependencies: 25 },
      ];

      const report = ReportTypes.generatePortfolioReport(repos);

      expect(report.type).toBe('portfolio');
      expect(report.status).toBe('ok');
      expect(report.summary.totalRepositories).toBe(3);
      expect(report.summary.healthyCount).toBe(2); // Only 8 and 9 >= 7
      expect(report.summary.atRiskCount).toBe(1);  // 5 is in [5,7)
      expect(report.metrics.averageHealthScore).toBeGreaterThan(0);
    });

    it('should handle empty repository list', () => {
      const report = ReportTypes.generatePortfolioReport([]);

      expect(report.status).toBe('empty');
      expect(report.message).toContain('No repositories');
    });

    it('should categorize repositories by health', () => {
      const repos = [
        { repository: 'healthy', healthScore: 8 },
        { repository: 'atrisk', healthScore: 6 },
        { repository: 'critical', healthScore: 3 },
      ];

      const report = ReportTypes.generatePortfolioReport(repos);

      expect(report.summary.healthyCount).toBe(1); // Only health >= 7
      expect(report.summary.atRiskCount).toBe(1);  // health 5-7
      expect(report.summary.criticalCount).toBe(1); // health < 5
    });
  });

  describe('generateTrendsReport', () => {
    it('should generate trends report from history', () => {
      const history = [
        { avgHealthScore: 6, avgCoverage: 70, timestamp: '2026-03-10T00:00:00Z' },
        { avgHealthScore: 7, avgCoverage: 75, timestamp: '2026-03-15T00:00:00Z' },
        { avgHealthScore: 8, avgCoverage: 80, timestamp: '2026-03-20T00:00:00Z' },
      ];

      const report = ReportTypes.generateTrendsReport(history);

      expect(report.type).toBe('trends');
      expect(report.status).toBe('ok');
      expect(report.trends.healthScore.direction).toBe('up');
      expect(report.trends.testCoverage.direction).toBe('up');
      expect(report.analysis.healthImproving).toBe(true);
    });

    it('should handle empty history', () => {
      const report = ReportTypes.generateTrendsReport([]);

      expect(report.status).toBe('empty');
    });

    it('should detect declining trends', () => {
      const history = [
        { avgHealthScore: 8, avgCoverage: 85, timestamp: '2026-03-10T00:00:00Z' },
        { avgHealthScore: 5, avgCoverage: 60, timestamp: '2026-03-20T00:00:00Z' },
      ];

      const report = ReportTypes.generateTrendsReport(history);

      expect(report.trends.healthScore.direction).toBe('down');
      expect(report.trends.testCoverage.direction).toBe('down');
      expect(report.analysis.healthImproving).toBe(false);
    });
  });

  describe('generateInsightsReport', () => {
    it('should generate insights summary report', () => {
      const insights = [
        {
          type: 'regression',
          title: 'Coverage dropped',
          priority: 9,
          repository: 'repo1',
        },
        {
          type: 'improvement',
          title: 'Health improved',
          priority: 7,
          repository: 'repo2',
        },
        {
          type: 'regression',
          title: 'Tests failing',
          priority: 8,
          repository: 'repo1',
        },
      ];

      const report = ReportTypes.generateInsightsReport(insights);

      expect(report.type).toBe('insights');
      expect(report.status).toBe('ok');
      expect(report.summary.totalInsights).toBe(3);
      expect(report.summary.byType.regression).toBe(2);
      expect(report.summary.byType.improvement).toBe(1);
    });

    it('should handle empty insights', () => {
      const report = ReportTypes.generateInsightsReport([]);

      expect(report.status).toBe('empty');
    });

    it('should rank insights by priority', () => {
      const insights = [
        { type: 'regression', title: 'Low', priority: 3, repository: 'repo1' },
        { type: 'regression', title: 'High', priority: 9, repository: 'repo1' },
        { type: 'regression', title: 'Medium', priority: 5, repository: 'repo1' },
      ];

      const report = ReportTypes.generateInsightsReport(insights);

      expect(report.topInsights[0].title).toBe('High');
      expect(report.topInsights[1].title).toBe('Medium');
      expect(report.topInsights[2].title).toBe('Low');
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report', () => {
      const repos = [
        { repository: 'repo1', testCoverage: 85 },
        { repository: 'repo2', testCoverage: 50 },
      ];

      const rules = [
        { name: 'min_coverage', check: (r) => r.testCoverage >= 80 },
        { name: 'has_tests', check: (r) => r.testCoverage > 0 },
      ];

      const report = ReportTypes.generateComplianceReport(repos, rules);

      expect(report.type).toBe('compliance');
      expect(report.summary.totalRules).toBe(2);
      expect(report.summary.totalRepositories).toBe(2);
      expect(report.summary.passedChecks).toBeGreaterThan(0);
    });

    it('should identify non-compliant repos', () => {
      const repos = [
        { repository: 'repo1', testCoverage: 85 },
        { repository: 'repo2', testCoverage: 50 },
      ];

      const rules = [
        { name: 'min_coverage', check: (r) => r.testCoverage >= 80 },
      ];

      const report = ReportTypes.generateComplianceReport(repos, rules);

      expect(report.violations).toHaveLength(1);
      expect(report.violations[0].repository).toBe('repo2');
    });

    it('should handle empty repos', () => {
      const report = ReportTypes.generateComplianceReport([]);

      expect(report.status).toBe('empty');
    });
  });

  describe('getValidTypes', () => {
    it('should return valid report types', () => {
      const types = ReportTypes.getValidTypes();

      expect(types).toContain('portfolio');
      expect(types).toContain('trends');
      expect(types).toContain('insights');
      expect(types).toContain('compliance');
      expect(types).toContain('custom');
    });
  });
});
