'use strict';

/**
 * ReportGenerator — Generate executive health reports
 *
 * @class ReportGenerator
 * @version 1.0.0
 * @story 3.1 Phase 3
 */
class ReportGenerator {
  constructor(portfolioManager, riskAssessor) {
    this.portfolio = portfolioManager;
    this.risk = riskAssessor;
  }

  /**
   * Generate executive summary report
   * @returns {string} Executive summary
   */
  generateExecutiveSummary() {
    const summary = this.portfolio.getPortfolioSummary();
    const riskAssessment = this.risk.assessPortfolioRisk();
    const stats = this.portfolio.getStatistics();

    const lines = [];
    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║          Portfolio Health — Executive Summary              ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');

    // Overview
    lines.push(`📊 Portfolio Overview`);
    lines.push(`  Total Repositories: ${summary.totalRepositories}`);
    lines.push(`  At Risk: ${summary.atRisk} (${Math.round((summary.atRisk / summary.totalRepositories) * 100)}%)`);
    lines.push('');

    // Health Metrics
    lines.push(`💚 Health Metrics`);
    lines.push(`  Average Health Score: ${summary.averageHealthScore}/10`);
    lines.push(`  Range: ${summary.minHealthScore} - ${summary.maxHealthScore}`);
    lines.push(`  Average Test Coverage: ${summary.averageTestCoverage}%`);
    lines.push('');

    // Risk Level
    const riskEmoji = { critical: '🚨', high: '🔴', medium: '🟡', low: '🟢' };
    lines.push(`⚠️  Risk Assessment: ${riskEmoji[riskAssessment.overallRisk]} ${riskAssessment.overallRisk.toUpperCase()}`);
    lines.push(`  Critical: ${riskAssessment.riskDistribution.critical}`);
    lines.push(`  High: ${riskAssessment.riskDistribution.high}`);
    lines.push('');

    // Key Recommendations
    if (riskAssessment.recommendations.length > 0) {
      lines.push(`💡 Key Recommendations`);
      riskAssessment.recommendations.slice(0, 3).forEach((rec) => {
        lines.push(`  • [${rec.priority.toUpperCase()}] ${rec.action}`);
      });
    }

    lines.push('');
    lines.push(`Generated: ${new Date().toLocaleString()}`);

    return lines.join('\n');
  }

  /**
   * Generate detailed portfolio report
   * @returns {Object} Detailed report
   */
  generateDetailedReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.portfolio.getPortfolioSummary(),
      statistics: this.portfolio.getStatistics(),
      riskAssessment: this.risk.assessPortfolioRisk(),
      riskMatrix: this.risk.getRiskMatrix(),
      debtTrend: this.risk.getDebtTrend(),
      rankedByHealth: this.portfolio.getRankedByHealth(10),
      rankedByDebt: this.portfolio.getRankedByDebt(10),
      atRiskRepositories: this.portfolio.getAtRiskRepositories(),
    };
  }

  /**
   * Generate ranked list report
   * @param {string} criterion 'health' or 'debt'
   * @returns {string} Formatted list
   */
  generateRankedList(criterion = 'health') {
    const ranked = criterion === 'debt'
      ? this.portfolio.getRankedByDebt()
      : this.portfolio.getRankedByHealth();

    const lines = [];
    const title = criterion === 'debt' ? 'Repositories Ranked by Debt' : 'Repositories Ranked by Health';

    lines.push(`\n${title}\n${'═'.repeat(title.length)}\n`);
    lines.push('Rank | Repository              | Health | Debt       | Coverage');
    lines.push('─'.repeat(65));

    ranked.forEach((repo) => {
      const healthBar = this._buildBar(repo.healthScore / 10, 6);
      lines.push(`${repo.rank.toString().padEnd(4)} | ${repo.name.padEnd(23)} | ${healthBar} | ${repo.debtLevel.padEnd(10)} | ${repo.testCoverage}%`);
    });

    return lines.join('\n');
  }

  /**
   * Generate trend report
   * @returns {string} Trend report
   */
  generateTrendReport() {
    const summary = this.portfolio.getPortfolioSummary();
    const stats = this.portfolio.getStatistics();

    const lines = [];
    lines.push('\n📈 Portfolio Trend Analysis\n');
    lines.push(`Health Score Distribution:`);
    lines.push(`  Average: ${summary.averageHealthScore}/10`);
    lines.push(`  Std Dev: ${stats.healthScore.stdDev}`);
    lines.push(`  Range: ${stats.healthScore.min} - ${stats.healthScore.max}`);
    lines.push('');

    lines.push(`Code Base Statistics:`);
    lines.push(`  Total Files: ${stats.totalFiles.toLocaleString()}`);
    lines.push(`  Total Lines: ${stats.totalLines.toLocaleString()}`);
    lines.push(`  Avg Files/Repo: ${Math.round(stats.totalFiles / stats.count)}`);

    return lines.join('\n');
  }

  /**
   * Generate action plan
   * @returns {string} Action plan
   */
  generateActionPlan() {
    const atRisk = this.portfolio.getAtRiskRepositories();
    const riskAssessment = this.risk.assessPortfolioRisk();

    const lines = [];
    lines.push('\n📋 Recommended Action Plan\n');

    // Immediate actions
    lines.push('Immediate Actions (Next Sprint):');
    const critical = atRisk.filter(r => r.healthScore < 3);
    critical.slice(0, 3).forEach((repo) => {
      lines.push(`  1. Establish emergency remediation for ${repo.name}`);
      lines.push(`     • Current health: ${repo.healthScore}/10`);
      lines.push(`     • Target: 5.0/10`);
    });
    lines.push('');

    // Short-term actions
    lines.push('Short-term Actions (1-2 Months):');
    riskAssessment.recommendations.slice(0, 3).forEach((rec, idx) => {
      lines.push(`  ${idx + 1}. ${rec.action}`);
    });
    lines.push('');

    // Strategic actions
    lines.push('Strategic Actions (Quarterly):');
    lines.push('  • Implement debt reduction program across portfolio');
    lines.push('  • Establish health score targets for all repositories');
    lines.push('  • Schedule quarterly portfolio reviews');

    return lines.join('\n');
  }

  /**
   * Build progress bar
   * @private
   */
  _buildBar(value, width) {
    const filled = Math.round(value * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }
}

module.exports = ReportGenerator;
