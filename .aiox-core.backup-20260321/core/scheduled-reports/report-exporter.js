'use strict';

/**
 * Report Exporter — Export reports to different formats
 *
 * @class ReportExporter
 * @version 1.0.0
 * @story 3.6
 */
class ReportExporter {
  /**
   * Export report to JSON format
   * @param {Object} report - Report object
   * @returns {string} JSON string
   */
  static toJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report to Markdown format
   * @param {Object} report - Report object
   * @returns {string} Markdown string
   */
  static toMarkdown(report) {
    const lines = [];

    lines.push(`# ${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report`);
    lines.push('');
    lines.push(`**Generated:** ${report.timestamp}`);
    lines.push(`**Status:** ${report.status}`);
    lines.push('');

    if (report.status === 'empty') {
      lines.push(report.message);
      return lines.join('\n');
    }

    // Generate format based on report type
    if (report.type === 'portfolio') {
      return this._portfolioMarkdown(lines, report);
    }
    if (report.type === 'trends') {
      return this._trendsMarkdown(lines, report);
    }
    if (report.type === 'insights') {
      return this._insightsMarkdown(lines, report);
    }
    if (report.type === 'compliance') {
      return this._complianceMarkdown(lines, report);
    }

    // Default format
    lines.push('## Data');
    lines.push('```json');
    lines.push(JSON.stringify(report, null, 2));
    lines.push('```');

    return lines.join('\n');
  }

  /**
   * Export report to CSV format
   * @param {Object} report - Report object
   * @returns {string} CSV string
   */
  static toCSV(report) {
    const lines = [];

    if (report.type === 'portfolio') {
      return this._portfolioCSV(lines, report);
    }
    if (report.type === 'compliance') {
      return this._complianceCSV(lines, report);
    }

    // Default: return JSON as fallback
    return this.toJSON(report);
  }

  /**
   * Get supported export formats
   * @returns {Array} Supported formats
   */
  static getSupportedFormats() {
    return ['json', 'markdown', 'csv'];
  }

  /**
   * Export portfolio report as Markdown
   * @private
   */
  static _portfolioMarkdown(lines, report) {
    lines.push('## Summary');
    const summary = report.summary || {};
    lines.push(
      `- **Total Repositories:** ${summary.totalRepositories}`
    );
    lines.push(`- **Healthy:** ${summary.healthyCount}`);
    lines.push(`- **At Risk:** ${summary.atRiskCount}`);
    lines.push(`- **Critical:** ${summary.criticalCount}`);
    lines.push('');

    lines.push('## Metrics');
    const metrics = report.metrics || {};
    lines.push(
      `- **Average Health Score:** ${metrics.averageHealthScore}`
    );
    lines.push(
      `- **Average Test Coverage:** ${metrics.averageTestCoverage}%`
    );
    lines.push(
      `- **Total Lines of Code:** ${metrics.totalLinesOfCode.toLocaleString()}`
    );
    lines.push(
      `- **Total Dependencies:** ${metrics.totalDependencies.toLocaleString()}`
    );
    lines.push('');

    if (report.topHealthy && report.topHealthy.length > 0) {
      lines.push('## Top Healthy Repositories');
      lines.push('');
      lines.push('| Repository | Health Score | Coverage |');
      lines.push('|---|---|---|');
      for (const repo of report.topHealthy) {
        lines.push(
          `| ${repo.repository} | ${repo.healthScore} | ${repo.coverage}% |`
        );
      }
      lines.push('');
    }

    if (report.topAtRisk && report.topAtRisk.length > 0) {
      lines.push('## Repositories at Risk');
      lines.push('');
      lines.push('| Repository | Health Score | Coverage |');
      lines.push('|---|---|---|');
      for (const repo of report.topAtRisk) {
        lines.push(
          `| ${repo.repository} | ${repo.healthScore} | ${repo.coverage}% |`
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Export trends report as Markdown
   * @private
   */
  static _trendsMarkdown(lines, report) {
    lines.push('## Period');
    const period = report.period || {};
    lines.push(`- **From:** ${period.start}`);
    lines.push(`- **To:** ${period.end}`);
    lines.push(`- **Data Points:** ${period.dataPoints}`);
    lines.push('');

    lines.push('## Trends');
    const trends = report.trends || {};
    if (trends.healthScore) {
      lines.push('### Health Score');
      lines.push(
        `- **Change:** ${trends.healthScore.change >= 0 ? '+' : ''}${trends.healthScore.change.toFixed(2)}`
      );
      lines.push(
        `- **Direction:** ${trends.healthScore.direction === 'up' ? '📈 Improving' : '📉 Declining'}`
      );
      lines.push('');
    }

    if (trends.testCoverage) {
      lines.push('### Test Coverage');
      lines.push(
        `- **Change:** ${trends.testCoverage.change >= 0 ? '+' : ''}${trends.testCoverage.change.toFixed(2)}%`
      );
      lines.push(
        `- **Direction:** ${trends.testCoverage.direction === 'up' ? '📈 Improving' : '📉 Declining'}`
      );
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Export insights report as Markdown
   * @private
   */
  static _insightsMarkdown(lines, report) {
    lines.push('## Summary');
    const summary = report.summary || {};
    lines.push(`- **Total Insights:** ${summary.totalInsights}`);
    lines.push('');

    if (summary.byType) {
      lines.push('### By Type');
      for (const [type, count] of Object.entries(summary.byType)) {
        lines.push(`- ${type}: ${count}`);
      }
      lines.push('');
    }

    if (report.topInsights && report.topInsights.length > 0) {
      lines.push('## Top Insights');
      lines.push('');
      for (const insight of report.topInsights) {
        lines.push(`### ${insight.title}`);
        lines.push(`- **Type:** ${insight.type}`);
        lines.push(`- **Priority:** ${insight.priority}/10`);
        lines.push(`- **Repository:** ${insight.repository}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Export compliance report as Markdown
   * @private
   */
  static _complianceMarkdown(lines, report) {
    lines.push('## Summary');
    const summary = report.summary || {};
    lines.push(`- **Compliance Rate:** ${summary.complianceRate}`);
    lines.push(
      `- **Compliant Repositories:** ${summary.compliantRepos}/${summary.totalRepositories}`
    );
    lines.push(`- **Rules:** ${summary.totalRules}`);
    lines.push('');

    if (report.violations && report.violations.length > 0) {
      lines.push('## Violations');
      lines.push('');
      for (const violation of report.violations) {
        lines.push(`### ${violation.repository}`);
        lines.push(`- **Violations:** ${violation.violations.join(', ')}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Export portfolio report as CSV
   * @private
   */
  static _portfolioCSV(lines, report) {
    lines.push('Repository,HealthScore,TestCoverage');

    if (report.detailed && Array.isArray(report.detailed)) {
      for (const repo of report.detailed) {
        lines.push(`"${repo.repository}",${repo.healthScore},${repo.coverage}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Export compliance report as CSV
   * @private
   */
  static _complianceCSV(lines, report) {
    lines.push('Repository,Passed,Failed,Violations');

    if (report.detailed && Array.isArray(report.detailed)) {
      for (const repo of report.detailed) {
        const violations = repo.violations.join(';');
        lines.push(
          `"${repo.repository}",${repo.passed},${repo.failed},"${violations}"`
        );
      }
    }

    return lines.join('\n');
  }
}

module.exports = { ReportExporter };
