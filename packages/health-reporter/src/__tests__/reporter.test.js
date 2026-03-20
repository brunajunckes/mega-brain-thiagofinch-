'use strict';

const PortfolioManager = require('../portfolio-manager');
const RiskAssessor = require('../risk-assessor');
const ReportGenerator = require('../report-generator');

describe('Health Reporter', () => {
  let portfolio;
  let risk;
  let report;

  beforeEach(() => {
    portfolio = new PortfolioManager();
    risk = new RiskAssessor(portfolio);
    report = new ReportGenerator(portfolio, risk);

    // Add test repositories
    portfolio.addRepository('app1', {
      healthScore: 7.5,
      testCoverage: 80,
      codeQuality: 8,
      debtLevel: 'low',
      totalFiles: 100,
      totalLines: 10000,
    });

    portfolio.addRepository('app2', {
      healthScore: 4.5,
      testCoverage: 45,
      codeQuality: 5,
      debtLevel: 'high',
      totalFiles: 150,
      totalLines: 15000,
    });

    portfolio.addRepository('app3', {
      healthScore: 6,
      testCoverage: 65,
      codeQuality: 6,
      debtLevel: 'moderate',
      totalFiles: 120,
      totalLines: 12000,
    });
  });

  describe('PortfolioManager', () => {
    test('should add repositories to portfolio', () => {
      expect(portfolio.repositories.length).toBe(3);
    });

    test('should get portfolio summary', () => {
      const summary = portfolio.getPortfolioSummary();
      expect(summary.totalRepositories).toBe(3);
      expect(summary.averageHealthScore).toBeGreaterThan(0);
    });

    test('should rank repositories by health', () => {
      const ranked = portfolio.getRankedByHealth();
      expect(ranked[0].healthScore).toBeGreaterThanOrEqual(ranked[1].healthScore);
    });

    test('should identify at-risk repositories', () => {
      const atRisk = portfolio.getAtRiskRepositories();
      expect(atRisk.length).toBeGreaterThan(0);
    });

    test('should filter repositories', () => {
      const filtered = portfolio.filterRepositories({ minHealth: 6 });
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('RiskAssessor', () => {
    test('should assess portfolio risk', () => {
      const assessment = risk.assessPortfolioRisk();
      expect(assessment.overallRisk).toBeDefined();
      expect(assessment.atRiskCount).toBeGreaterThan(0);
    });

    test('should get risk matrix', () => {
      const matrix = risk.getRiskMatrix();
      expect(matrix.matrix).toBeDefined();
      expect(Object.keys(matrix.matrix).length).toBe(3);
    });

    test('should get debt trend', () => {
      const trend = risk.getDebtTrend();
      expect(trend.distribution).toBeDefined();
      expect(trend.averageDebtScore).toBeGreaterThan(0);
    });

    test('should detect regressions', () => {
      const previous = [
        { name: 'app1', healthScore: 8, testCoverage: 85, debtLevel: 'minimal' },
      ];
      const regressions = risk.detectRegressions(previous);
      expect(regressions).toBeDefined();
    });
  });

  describe('ReportGenerator', () => {
    test('should generate executive summary', () => {
      const summary = report.generateExecutiveSummary();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    test('should generate detailed report', () => {
      const detailed = report.generateDetailedReport();
      expect(detailed.summary).toBeDefined();
      expect(detailed.riskAssessment).toBeDefined();
    });

    test('should generate ranked list', () => {
      const list = report.generateRankedList('health');
      expect(typeof list).toBe('string');
      expect(list).toContain('Rank');
    });

    test('should generate trend report', () => {
      const trend = report.generateTrendReport();
      expect(typeof trend).toBe('string');
      expect(trend).toContain('Trend');
    });

    test('should generate action plan', () => {
      const plan = report.generateActionPlan();
      expect(typeof plan).toBe('string');
      expect(plan).toContain('Action Plan');
    });
  });
});
