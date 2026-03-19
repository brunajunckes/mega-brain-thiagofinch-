'use strict';

const { ReportExporter } = require('../../../.aiox-core/core/scheduled-reports');

describe('ReportExporter', () => {
  const sampleReport = {
    id: 'report_123',
    type: 'portfolio',
    timestamp: '2026-03-19T10:00:00Z',
    status: 'ok',
    summary: {
      totalRepositories: 5,
      healthyCount: 3,
      atRiskCount: 1,
      criticalCount: 1,
    },
    metrics: {
      averageHealthScore: 6.8,
      averageTestCoverage: 75,
      totalLinesOfCode: 500000,
      totalDependencies: 100,
    },
  };

  describe('toJSON', () => {
    it('should export report as JSON', () => {
      const json = ReportExporter.toJSON(sampleReport);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(sampleReport.id);
      expect(parsed.type).toBe(sampleReport.type);
    });

    it('should format JSON with indentation', () => {
      const json = ReportExporter.toJSON(sampleReport);

      expect(json).toContain('  '); // Check for indentation
      expect(json).toContain('\n');
    });
  });

  describe('toMarkdown', () => {
    it('should export portfolio report as Markdown', () => {
      const markdown = ReportExporter.toMarkdown(sampleReport);

      expect(markdown).toContain('# Portfolio Report');
      expect(markdown).toContain('**Generated:**');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('Total Repositories');
    });

    it('should handle empty report status', () => {
      const emptyReport = {
        ...sampleReport,
        status: 'empty',
        message: 'No data available',
      };

      const markdown = ReportExporter.toMarkdown(emptyReport);

      expect(markdown).toContain('No data available');
    });

    it('should export trends report as Markdown', () => {
      const trendsReport = {
        ...sampleReport,
        type: 'trends',
        trends: {
          healthScore: {
            change: 0.5,
            direction: 'up',
          },
          testCoverage: {
            change: 2.5,
            direction: 'up',
          },
        },
      };

      const markdown = ReportExporter.toMarkdown(trendsReport);

      expect(markdown).toContain('# Trends Report');
      expect(markdown).toContain('Health Score');
      expect(markdown).toContain('📈');
    });

    it('should export insights report as Markdown', () => {
      const insightsReport = {
        ...sampleReport,
        type: 'insights',
        summary: {
          totalInsights: 5,
          byType: {
            regression: 2,
            improvement: 1,
          },
        },
        topInsights: [
          { type: 'regression', title: 'Test failure', priority: 9, repository: 'repo1' },
        ],
      };

      const markdown = ReportExporter.toMarkdown(insightsReport);

      expect(markdown).toContain('# Insights Report');
      expect(markdown).toContain('## Top Insights');
      expect(markdown).toContain('Test failure');
    });

    it('should export compliance report as Markdown', () => {
      const complianceReport = {
        ...sampleReport,
        type: 'compliance',
        summary: {
          compliantRepos: 4,
          totalRepositories: 5,
          complianceRate: '80%',
        },
        violations: [
          { repository: 'repo5', violations: ['min_coverage'] },
        ],
      };

      const markdown = ReportExporter.toMarkdown(complianceReport);

      expect(markdown).toContain('# Compliance Report');
      expect(markdown).toContain('80%');
      expect(markdown).toContain('## Violations');
    });
  });

  describe('toCSV', () => {
    it('should export portfolio report as CSV', () => {
      const portfolioReport = {
        ...sampleReport,
        detailed: [
          { repository: 'repo1', healthScore: 8, coverage: 85 },
          { repository: 'repo2', healthScore: 5, coverage: 50 },
        ],
      };

      const csv = ReportExporter.toCSV(portfolioReport);

      expect(csv).toContain('Repository,HealthScore,TestCoverage');
      expect(csv).toContain('repo1');
      expect(csv).toContain('repo2');
    });

    it('should export compliance report as CSV', () => {
      const complianceReport = {
        ...sampleReport,
        type: 'compliance',
        detailed: [
          { repository: 'repo1', passed: 5, failed: 0, violations: [] },
          { repository: 'repo2', passed: 3, failed: 2, violations: ['rule1', 'rule2'] },
        ],
      };

      const csv = ReportExporter.toCSV(complianceReport);

      expect(csv).toContain('Repository,Passed,Failed,Violations');
      expect(csv).toContain('repo1');
      expect(csv).toContain('repo2');
    });

    it('should fallback to JSON for unsupported types', () => {
      const customReport = {
        ...sampleReport,
        type: 'custom',
      };

      const output = ReportExporter.toCSV(customReport);

      expect(output).toContain('{');
      expect(output).toContain('custom');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return supported export formats', () => {
      const formats = ReportExporter.getSupportedFormats();

      expect(formats).toContain('json');
      expect(formats).toContain('markdown');
      expect(formats).toContain('csv');
    });
  });
});
