'use strict';

const { PortfolioManager, RiskAssessment, ReportGenerator } = require('../index');

describe('Health Reporter', () => {
  describe('Risk Assessment', () => {
    it('should identify critical repositories', () => {
      const repos = [
        {
          repository: 'repo1',
          healthScore: 3,
          testCoverage: 30,
          codeQuality: 2,
          loc: 600000,
          languages: 5,
          files: 1000,
          dependencies: 50,
        },
      ];

      const result = RiskAssessment.assess(repos);

      expect(result.summary.critical).toBe(1);
      expect(result.criticalRepos.length).toBeGreaterThan(0);
    });

    it('should identify high-risk repositories', () => {
      const repos = [
        {
          repository: 'repo1',
          healthScore: 5,
          testCoverage: 60,
          codeQuality: 5,
          loc: 100000,
          languages: 2,
          files: 200,
          dependencies: 20,
        },
      ];

      const result = RiskAssessment.assess(repos);

      expect(result.status).toBe('ok');
    });
  });

  describe('Report Generation', () => {
    it('should generate JSON report', () => {
      const portfolio = {
        timestamp: new Date().toISOString(),
        status: 'ok',
        portfolio: {
          totalRepositories: 2,
          averageHealth: '7.0',
          averageCoverage: '75',
          averageQuality: '8',
          healthyRepos: 2,
          atRiskRepos: 0,
          totalLoc: 100000,
          totalFiles: 500,
        },
        repositories: [
          {
            repository: 'repo1',
            healthScore: 8,
            testCoverage: 80,
            codeQuality: 8,
            files: 250,
            loc: 50000,
            languages: 2,
            dependencies: 15,
          },
        ],
      };

      const risks = {
        summary: { critical: 0, high: 0 },
        criticalRepos: [],
        highRiskRepos: [],
      };

      const reports = ReportGenerator.generate(portfolio, risks);

      expect(reports.json).toBeDefined();
      expect(reports.markdown).toBeDefined();
      expect(reports.markdown).toContain('Health Report');
    });
  });
});
