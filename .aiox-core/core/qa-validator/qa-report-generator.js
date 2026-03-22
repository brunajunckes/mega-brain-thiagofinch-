'use strict';

/**
 * QA Report Generator -- Produces detailed QA validation reports
 *
 * Generates markdown reports with findings, scores, verdicts,
 * and actionable recommendations.
 *
 * @class QAReportGenerator
 * @version 1.0.0
 * @story 1.3
 */
class QAReportGenerator {
  /**
   * Generate a detailed report from validation results
   * @param {Object} result - Validation result from QAValidator
   * @param {Object} [options] - Report options
   * @param {string} [options.format] - Output format: 'markdown' | 'json' | 'text'
   * @param {boolean} [options.verbose] - Include detailed findings
   * @returns {string} Formatted report
   */
  generateReport(result, options = {}) {
    const format = options.format || 'markdown';

    switch (format) {
      case 'json':
        return this._generateJsonReport(result, options);
      case 'text':
        return this._generateTextReport(result, options);
      case 'markdown':
      default:
        return this._generateMarkdownReport(result, options);
    }
  }

  /**
   * Generate markdown report
   * @private
   * @param {Object} result - Validation result
   * @param {Object} options - Report options
   * @returns {string} Markdown report
   */
  _generateMarkdownReport(result, _options) {
    const lines = [];
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    lines.push('# QA Validation Report');
    lines.push('');
    lines.push(`**Generated:** ${timestamp}`);
    lines.push(`**Verdict:** ${result.verdict}`);
    lines.push(`**Score:** ${result.score}/100`);
    lines.push(`**Status:** ${result.status}`);
    lines.push('');

    // Directory report
    if (result.directory) {
      lines.push(`**Directory:** ${result.directory}`);
      lines.push(`**Files Analyzed:** ${result.fileCount}`);
      lines.push(`**Average Score:** ${result.averageScore}/100`);
      lines.push('');

      if (result.summary) {
        lines.push('## Summary');
        lines.push('');
        lines.push('| Metric | Count |');
        lines.push('|--------|-------|');
        lines.push(`| Total Files | ${result.summary.total} |`);
        lines.push(`| Approved | ${result.summary.approved} |`);
        lines.push(`| Needs Work | ${result.summary.needsWork} |`);
        lines.push(`| Blocked | ${result.summary.blocked} |`);
        lines.push(`| Pass Rate | ${result.summary.passRate}% |`);
        lines.push('');
      }

      // Per-file results
      if (result.files && result.files.length > 0) {
        lines.push('## File Results');
        lines.push('');
        lines.push('| File | Score | Verdict |');
        lines.push('|------|-------|---------|');

        for (const file of result.files) {
          lines.push(`| ${file.file} | ${file.score}/100 | ${file.verdict} |`);
        }

        lines.push('');
      }
    } else {
      // Single file report
      lines.push(`**File:** ${result.file}`);
      lines.push('');
    }

    // Criteria breakdown
    if (result.criteria) {
      lines.push('## Criteria Breakdown');
      lines.push('');
      lines.push('| Criterion | Status | Issues |');
      lines.push('|-----------|--------|--------|');

      for (const [name, data] of Object.entries(result.criteria)) {
        const label = name.replace(/([A-Z])/g, ' $1').trim();
        const status = data.pass ? 'PASS' : 'FAIL';
        const issueCount = data.issues ? data.issues.length : 0;
        lines.push(`| ${label} | ${status} | ${issueCount} |`);
      }

      lines.push('');
    }

    // Findings
    if (result.findings && result.findings.length > 0) {
      lines.push('## Findings');
      lines.push('');

      for (const finding of result.findings) {
        lines.push(`### ${finding.criterion}`);
        lines.push('');

        for (const issue of finding.issues) {
          lines.push(`- **[${issue.severity}]** ${issue.message}`);
        }

        lines.push('');
      }
    }

    // Recommendations
    const recommendations = this._generateRecommendations(result);
    if (recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');

      for (const rec of recommendations) {
        lines.push(`- ${rec}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate plain text report
   * @private
   * @param {Object} result - Validation result
   * @returns {string} Text report
   */
  _generateTextReport(result) {
    const lines = [];

    lines.push('=== QA Validation Report ===');
    lines.push('');

    if (result.directory) {
      lines.push(`Directory: ${result.directory}`);
      lines.push(`Files: ${result.fileCount}`);
      lines.push(`Average Score: ${result.averageScore}/100`);
    } else {
      lines.push(`File: ${result.file}`);
      lines.push(`Score: ${result.score}/100`);
    }

    lines.push(`Verdict: ${result.verdict}`);
    lines.push(`Status: ${result.status}`);
    lines.push('');

    if (result.findings && result.findings.length > 0) {
      lines.push('--- Findings ---');

      for (const finding of result.findings) {
        lines.push(`  ${finding.criterion}:`);

        for (const issue of finding.issues) {
          lines.push(`    [${issue.severity}] ${issue.message}`);
        }
      }

      lines.push('');
    }

    const recommendations = this._generateRecommendations(result);
    if (recommendations.length > 0) {
      lines.push('--- Recommendations ---');

      for (const rec of recommendations) {
        lines.push(`  * ${rec}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   * @private
   * @param {Object} result - Validation result
   * @returns {string} JSON report
   */
  _generateJsonReport(result) {
    const report = {
      timestamp: new Date().toISOString(),
      ...result,
      recommendations: this._generateRecommendations(result),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate actionable recommendations based on findings
   * @private
   * @param {Object} result - Validation result
   * @returns {Array<string>} List of recommendations
   */
  _generateRecommendations(result) {
    const recs = [];
    const findings = result.findings || [];

    // Collect all issues from findings or criteria
    const allIssues = [];

    for (const finding of findings) {
      for (const issue of finding.issues) {
        allIssues.push({ criterion: finding.criterion, ...issue });
      }
    }

    // Security recommendations
    const securityIssues = allIssues.filter((i) =>
      i.criterion?.toLowerCase().includes('security') || i.severity === 'CRITICAL',
    );
    if (securityIssues.length > 0) {
      recs.push('Address security findings immediately -- move secrets to environment variables and sanitize inputs');
    }

    // Test coverage recommendations
    const testIssues = allIssues.filter((i) =>
      i.criterion?.toLowerCase().includes('test'),
    );
    if (testIssues.length > 0) {
      recs.push('Add unit tests for uncovered modules -- target >80% coverage');
    }

    // Documentation recommendations
    const docIssues = allIssues.filter((i) =>
      i.criterion?.toLowerCase().includes('documentation'),
    );
    if (docIssues.length > 0) {
      recs.push('Add JSDoc comments to exported functions with @param and @returns annotations');
    }

    // Performance recommendations
    const perfIssues = allIssues.filter((i) =>
      i.criterion?.toLowerCase().includes('performance'),
    );
    if (perfIssues.length > 0) {
      recs.push('Review flagged performance patterns -- prefer async operations and batch queries');
    }

    // Score-based general recommendations
    const score = result.score || result.averageScore || 0;
    if (score < 70) {
      recs.push('Overall quality is below threshold -- prioritize critical and high severity issues before merge');
    } else if (score < 85) {
      recs.push('Quality is acceptable but could be improved -- consider addressing medium severity items');
    }

    return recs;
  }

  /**
   * Generate a one-line summary suitable for CLI output
   * @param {Object} result - Validation result
   * @returns {string} One-line summary
   */
  generateSummaryLine(result) {
    if (result.directory) {
      return `${result.directory}: ${result.averageScore}/100 (${result.fileCount} files) -- ${result.verdict}`;
    }

    return `${result.file}: ${result.score}/100 -- ${result.verdict}`;
  }
}

module.exports = { QAReportGenerator };
