'use strict';

/**
 * Report Generator — Generates health reports
 *
 * @class ReportGenerator
 * @version 1.0.0
 * @story 3.1
 */
class ReportGenerator {
  /**
   * Generate health report
   * @param {Object} portfolio Portfolio metrics
   * @param {Object} risks Risk assessment
   * @returns {Object} Generated reports
   */
  static generate(portfolio, risks) {
    if (!portfolio || portfolio.status === 'no_data') {
      return {
        json: { status: 'no_data' },
        markdown: '# Health Report\n\nNo data available.',
      };
    }

    return {
      json: this._generateJSON(portfolio, risks),
      markdown: this._generateMarkdown(portfolio, risks),
    };
  }

  /**
   * Generate JSON report
   * @private
   */
  static _generateJSON(portfolio, risks) {
    return {
      timestamp: portfolio.timestamp,
      portfolio: portfolio.portfolio,
      repositories: portfolio.repositories.map((r) => ({
        name: r.repository,
        health: r.healthScore,
        coverage: r.testCoverage,
        quality: r.codeQuality,
        metrics: {
          files: r.files,
          loc: r.loc,
          languages: r.languages,
          dependencies: r.dependencies,
        },
      })),
      risks: risks.summary,
      atRisk: risks.criticalRepos.concat(risks.highRiskRepos),
    };
  }

  /**
   * Generate Markdown report
   * @private
   */
  static _generateMarkdown(portfolio, risks) {
    const p = portfolio.portfolio;

    let md = `# Repository Health Report\n\n`;
    md += `**Generated:** ${portfolio.timestamp}\n\n`;

    // Executive Summary
    md += `## Executive Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Repositories | ${p.totalRepositories} |\n`;
    md += `| Average Health Score | ${p.averageHealth}/10 |\n`;
    md += `| Average Coverage | ${p.averageCoverage}% |\n`;
    md += `| Healthy Repos | ${p.healthyRepos} ✅ |\n`;
    md += `| At-Risk Repos | ${p.atRiskRepos} ⚠️ |\n`;
    md += `| Total Lines of Code | ${p.totalLoc.toLocaleString()} |\n\n`;

    // At-Risk Repositories
    if (risks.criticalRepos.length > 0) {
      md += `## 🚨 Critical Repositories\n\n`;
      risks.criticalRepos.forEach((repo) => {
        md += `- **${repo.repository}** (Score: ${repo.score}/10)\n`;
        repo.issues.forEach((issue) => {
          md += `  - ${issue}\n`;
        });
      });
      md += `\n`;
    }

    if (risks.highRiskRepos.length > 0) {
      md += `## ⚠️ High-Risk Repositories\n\n`;
      risks.highRiskRepos.forEach((repo) => {
        md += `- **${repo.repository}** (Score: ${repo.score}/10)\n`;
      });
      md += `\n`;
    }

    // Repository Rankings
    md += `## 📊 Repository Rankings\n\n`;
    md += `| Repository | Health | Coverage | Quality |\n`;
    md += `|------------|--------|----------|----------|\n`;
    portfolio.repositories
      .slice(0, 10)
      .reverse()
      .forEach((r) => {
        const healthEmoji = r.healthScore >= 8 ? '✅' : r.healthScore >= 6 ? '⚠️' : '🔴';
        md += `| ${r.repository} | ${r.healthScore}/10 ${healthEmoji} | ${r.testCoverage}% | ${r.codeQuality}/10 |\n`;
      });
    md += `\n`;

    return md;
  }
}

module.exports = { ReportGenerator };
