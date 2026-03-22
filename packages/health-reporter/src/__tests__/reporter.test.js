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

    test('should return error for empty portfolio summary', () => {
      const emptyPortfolio = new PortfolioManager();
      const summary = emptyPortfolio.getPortfolioSummary();
      expect(summary.error).toBeDefined();
    });

    test('should rank repositories by debt', () => {
      const ranked = portfolio.getRankedByDebt();
      expect(ranked.length).toBe(3);
      expect(ranked[0].rank).toBe(1);
      // High debt should be ranked first (lower debtScore = higher debt)
      expect(ranked[0].debtLevel).toBe('high');
    });

    test('should limit ranked results', () => {
      const ranked = portfolio.getRankedByHealth(2);
      expect(ranked.length).toBe(2);
    });

    test('should get portfolio statistics with std deviation', () => {
      const stats = portfolio.getStatistics();
      expect(stats.count).toBe(3);
      expect(stats.healthScore.stdDev).toBeGreaterThan(0);
      expect(stats.totalFiles).toBe(370);
      expect(stats.totalLines).toBe(37000);
    });

    test('should filter by debt level', () => {
      const filtered = portfolio.filterRepositories({ debtLevel: 'high' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('app2');
    });

    test('should filter by minimum coverage', () => {
      const filtered = portfolio.filterRepositories({ minCoverage: 70 });
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('app1');
    });

    test('should filter by maximum health', () => {
      const filtered = portfolio.filterRepositories({ maxHealth: 5 });
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('app2');
    });

    test('should handle combined filters', () => {
      const filtered = portfolio.filterRepositories({
        minHealth: 5,
        maxHealth: 8,
      });
      expect(filtered.length).toBe(2);
    });

    test('should use default metrics when adding repo with empty metrics', () => {
      const pm = new PortfolioManager();
      pm.addRepository('empty-repo', {});
      expect(pm.repositories[0].healthScore).toBe(5);
      expect(pm.repositories[0].testCoverage).toBe(0);
      expect(pm.repositories[0].debtLevel).toBe('moderate');
    });

    test('should get debt distribution in summary', () => {
      const summary = portfolio.getPortfolioSummary();
      expect(summary.debtDistribution).toBeDefined();
      expect(summary.debtDistribution.high).toBe(1);
      expect(summary.debtDistribution.moderate).toBe(1);
      expect(summary.debtDistribution.low).toBe(1);
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

    test('should detect health decline regression', () => {
      const previous = [
        { name: 'app1', healthScore: 9, testCoverage: 80, debtLevel: 'low' },
      ];
      const regressions = risk.detectRegressions(previous);
      expect(regressions.detected).toBeGreaterThan(0);
      expect(regressions.regressions[0].type).toBe('health_decline');
    });

    test('should detect critical health decline', () => {
      const previous = [
        { name: 'app2', healthScore: 8, testCoverage: 45, debtLevel: 'high' },
      ];
      const regressions = risk.detectRegressions(previous);
      const healthDecline = regressions.regressions.find(
        (r) => r.type === 'health_decline'
      );
      expect(healthDecline).toBeDefined();
      expect(healthDecline.severity).toBe('critical');
    });

    test('should detect coverage decline', () => {
      const previous = [
        { name: 'app2', healthScore: 4.5, testCoverage: 60, debtLevel: 'high' },
      ];
      const regressions = risk.detectRegressions(previous);
      const coverageDecline = regressions.regressions.find(
        (r) => r.type === 'coverage_decline'
      );
      expect(coverageDecline).toBeDefined();
      expect(coverageDecline.severity).toBe('medium');
    });

    test('should detect debt increase', () => {
      const previous = [
        { name: 'app2', healthScore: 4.5, testCoverage: 45, debtLevel: 'moderate' },
      ];
      const regressions = risk.detectRegressions(previous);
      const debtIncrease = regressions.regressions.find(
        (r) => r.type === 'debt_increase'
      );
      expect(debtIncrease).toBeDefined();
    });

    test('should calculate risk scores in matrix', () => {
      const matrix = risk.getRiskMatrix();
      const app2Risk = matrix.matrix['app2'];
      expect(app2Risk.riskScore).toBeGreaterThan(0);
      expect(app2Risk.riskFactors).toContain('low_health');
      expect(app2Risk.riskFactors).toContain('low_coverage');
    });

    test('should provide debt reduction actions', () => {
      const trend = risk.getDebtTrend();
      expect(trend.recommendedActions.length).toBeGreaterThan(0);
    });

    test('should calculate portfolio risk level correctly', () => {
      // Add many critical repos to test critical threshold
      const criticalPortfolio = new PortfolioManager();
      for (let i = 0; i < 5; i++) {
        criticalPortfolio.addRepository(`critical-${i}`, {
          healthScore: 2,
          testCoverage: 20,
          codeQuality: 2,
          debtLevel: 'critical',
          totalFiles: 50,
          totalLines: 5000,
        });
      }
      const criticalRisk = new RiskAssessor(criticalPortfolio);
      const assessment = criticalRisk.assessPortfolioRisk();
      expect(assessment.overallRisk).toBe('critical');
    });

    test('should generate recommendations for at-risk repos', () => {
      const assessment = risk.assessPortfolioRisk();
      expect(assessment.recommendations.length).toBeGreaterThan(0);
      expect(assessment.recommendations[0].priority).toBe('high');
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

    test('should generate ranked list by debt', () => {
      const list = report.generateRankedList('debt');
      expect(typeof list).toBe('string');
      expect(list).toContain('Debt');
    });

    test('should include health metrics in executive summary', () => {
      const summary = report.generateExecutiveSummary();
      expect(summary).toContain('Health Metrics');
      expect(summary).toContain('Average Health Score');
      expect(summary).toContain('Average Test Coverage');
    });

    test('should include risk assessment in executive summary', () => {
      const summary = report.generateExecutiveSummary();
      expect(summary).toContain('Risk Assessment');
    });

    test('should include detailed report fields', () => {
      const detailed = report.generateDetailedReport();
      expect(detailed.statistics).toBeDefined();
      expect(detailed.riskMatrix).toBeDefined();
      expect(detailed.debtTrend).toBeDefined();
      expect(detailed.rankedByHealth).toBeDefined();
      expect(detailed.rankedByDebt).toBeDefined();
      expect(detailed.atRiskRepositories).toBeDefined();
    });

    test('should include action plan for critical repos', () => {
      portfolio.addRepository('critical-app', {
        healthScore: 2,
        testCoverage: 10,
        codeQuality: 2,
        debtLevel: 'critical',
        totalFiles: 500,
        totalLines: 50000,
      });
      const plan = report.generateActionPlan();
      expect(plan).toContain('critical-app');
    });
  });
});
