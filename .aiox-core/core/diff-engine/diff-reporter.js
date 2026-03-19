'use strict';

/**
 * Diff Reporter — Generates diff reports in multiple formats
 *
 * Outputs:
 * - diff.json: Structured machine-readable format
 * - DIFF-REPORT.md: Human-readable markdown report
 * - Integration with impact assessment for severity/recommendations
 *
 * @class DiffReporter
 * @version 1.0.0
 * @story 2.2
 */
class DiffReporter {
  constructor(options = {}) {
    this.diff = null;
    this.impact = null;
    this.baseline = null;
    this.current = null;
  }

  /**
   * Generate reports from diff and impact data
   * @param {Object} diff Diff report from DiffAnalyzer
   * @param {Object} impact Impact assessment from ImpactCalculator
   * @param {Object} options Output options
   * @returns {Promise<Object>} Generated reports
   */
  async generate(diff, impact, options = {}) {
    try {
      if (!diff || !impact) {
        throw new Error('Diff and impact data are required');
      }

      this.diff = diff;
      this.impact = impact;
      this.baseline = diff.baseline || {};
      this.current = diff.current || {};

      const reports = {
        json: this._generateJsonReport(),
        markdown: this._generateMarkdownReport(),
      };

      return {
        success: true,
        reports,
        summary: {
          severity: impact.severity,
          breaking: impact.breaking,
          overallScore: impact.overallScore,
          changeCount: this._countChanges(),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate machine-readable JSON report
   * @private
   */
  _generateJsonReport() {
    const changes = this.diff.changes || {};

    return {
      metadata: {
        baselineRepo: this.baseline.name || 'unknown',
        baselineTime: this.baseline.scannedAt || 'unknown',
        currentRepo: this.current.name || 'unknown',
        currentTime: this.current.scannedAt || 'unknown',
        generatedAt: new Date().toISOString(),
      },
      impact: {
        severity: this.impact.severity,
        score: this.impact.overallScore,
        breaking: this.impact.breaking,
        recommendations: this.impact.recommendations || [],
      },
      changes: {
        languages: {
          added: changes.languages?.added || [],
          removed: changes.languages?.removed || [],
          modified: changes.languages?.modified || [],
        },
        dependencies: {
          added: changes.dependencies?.added || [],
          removed: changes.dependencies?.removed || [],
          upgraded: changes.dependencies?.upgraded || [],
          downgraded: changes.dependencies?.downgraded || [],
        },
        architecture: {
          changed: changes.architecture?.changed || false,
          before: changes.architecture?.before || 'unknown',
          after: changes.architecture?.after || 'unknown',
          impact: changes.architecture?.impact || 'none',
        },
        metrics: {
          testCoverage: changes.metrics?.testCoverage || null,
          codeQuality: changes.metrics?.codeQuality || null,
          complexity: changes.metrics?.complexity || null,
          documentation: changes.metrics?.documentation || null,
        },
        summary: {
          totalFiles: changes.metadata?.fileDelta || {},
          totalLoc: changes.metadata?.locDelta || {},
        },
      },
    };
  }

  /**
   * Generate human-readable markdown report
   * @private
   */
  _generateMarkdownReport() {
    const changes = this.diff.changes || {};
    const impact = this.impact;

    let report = `# Diff Report\n\n`;

    // Header
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Severity:** ${impact.severity.toUpperCase()}\n`;
    report += `**Impact Score:** ${impact.overallScore}/10\n`;
    report += `**Breaking Changes:** ${impact.breaking ? 'Yes ⚠️' : 'No'}\n\n`;

    // Repository comparison
    report += `## Repository Comparison\n\n`;
    report += `| Property | Baseline | Current |\n`;
    report += `|----------|----------|----------|\n`;
    report += `| Repository | ${this.baseline.name || 'unknown'} | ${this.current.name || 'unknown'} |\n`;
    report += `| Scanned | ${this.baseline.scannedAt || 'unknown'} | ${this.current.scannedAt || 'unknown'} |\n`;
    if (changes.metadata) {
      report += `| Total Files | ${changes.metadata.fileDelta?.before || 0} | ${changes.metadata.fileDelta?.after || 0} |\n`;
      report += `| Total LOC | ${changes.metadata.locDelta?.before || 0} | ${changes.metadata.locDelta?.after || 0} |\n`;
    }
    report += `\n`;

    // Language changes
    if (changes.languages) {
      report += `## Language Changes\n\n`;
      const added = changes.languages.added || [];
      const removed = changes.languages.removed || [];
      const modified = changes.languages.modified || [];

      if (added.length > 0) {
        report += `### Added Languages\n\n`;
        report += `| Language | Files | LOC |\n`;
        report += `|----------|-------|-----|\n`;
        added.forEach((lang) => {
          report += `| ${lang.language} | ${lang.files || 0} | ${lang.loc || 0} |\n`;
        });
        report += `\n`;
      }

      if (removed.length > 0) {
        report += `### Removed Languages\n\n`;
        report += `| Language | Files | LOC |\n`;
        report += `|----------|-------|-----|\n`;
        removed.forEach((lang) => {
          report += `| ${lang.language} | ${lang.files || 0} | ${lang.loc || 0} |\n`;
        });
        report += `\n`;
      }

      if (modified.length > 0) {
        report += `### Modified Languages\n\n`;
        report += `| Language | Files Δ | LOC Δ |\n`;
        report += `|----------|---------|-------|\n`;
        modified.forEach((lang) => {
          const fileStr = lang.fileDelta >= 0 ? `+${lang.fileDelta}` : `${lang.fileDelta}`;
          const locStr = lang.locDelta >= 0 ? `+${lang.locDelta}` : `${lang.locDelta}`;
          report += `| ${lang.language} | ${fileStr} | ${locStr} |\n`;
        });
        report += `\n`;
      }
    }

    // Dependency changes
    if (changes.dependencies) {
      report += `## Dependency Changes\n\n`;
      const added = changes.dependencies.added || [];
      const removed = changes.dependencies.removed || [];
      const upgraded = changes.dependencies.upgraded || [];
      const downgraded = changes.dependencies.downgraded || [];

      if (added.length > 0) {
        report += `### Added Dependencies\n\n`;
        report += `| Package | Version |\n`;
        report += `|---------|----------|\n`;
        added.forEach((dep) => {
          report += `| ${dep.name} | ${dep.version} |\n`;
        });
        report += `\n`;
      }

      if (removed.length > 0) {
        report += `### Removed Dependencies\n\n`;
        report += `| Package | Version |\n`;
        report += `|---------|----------|\n`;
        removed.forEach((dep) => {
          report += `| ${dep.name} | ${dep.version} |\n`;
        });
        report += `\n`;
      }

      if (upgraded.length > 0) {
        report += `### Upgraded Dependencies\n\n`;
        report += `| Package | From | To |\n`;
        report += `|---------|------|----|\n`;
        upgraded.forEach((dep) => {
          report += `| ${dep.name} | ${dep.from} | ${dep.to} |\n`;
        });
        report += `\n`;
      }

      if (downgraded.length > 0) {
        report += `### Downgraded Dependencies\n\n`;
        report += `| Package | From | To |\n`;
        report += `|---------|------|----|\n`;
        downgraded.forEach((dep) => {
          report += `| ${dep.name} | ${dep.from} | ${dep.to} |\n`;
        });
        report += `\n`;
      }
    }

    // Architecture changes
    if (changes.architecture?.changed) {
      report += `## Architecture Changes\n\n`;
      report += `**Pattern Change:** ${changes.architecture.before} → ${changes.architecture.after}\n`;
      report += `**Impact:** ${changes.architecture.impact.toUpperCase()}\n\n`;
    }

    // Metric changes
    if (changes.metrics) {
      report += `## Metric Changes\n\n`;
      const metrics = changes.metrics;

      if (metrics.testCoverage) {
        const status = metrics.testCoverage.status;
        const symbol = status === 'improved' ? '✅' : status === 'regressed' ? '⚠️' : '→';
        report += `**Test Coverage:** ${symbol} ${metrics.testCoverage.before}% → ${metrics.testCoverage.after}% (${metrics.testCoverage.change > 0 ? '+' : ''}${metrics.testCoverage.change}%)\n`;
      }

      if (metrics.codeQuality) {
        const status = metrics.codeQuality.status;
        const symbol = status === 'improved' ? '✅' : status === 'regressed' ? '⚠️' : '→';
        report += `**Code Quality:** ${symbol} ${metrics.codeQuality.before} → ${metrics.codeQuality.after} (${metrics.codeQuality.change > 0 ? '+' : ''}${metrics.codeQuality.change})\n`;
      }

      report += `\n`;
    }

    // Recommendations
    if (impact.recommendations && impact.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      impact.recommendations.forEach((rec) => {
        report += `- ${rec}\n`;
      });
      report += `\n`;
    }

    return report;
  }

  /**
   * Count total changes
   * @private
   */
  _countChanges() {
    const changes = this.diff.changes || {};
    let count = 0;

    if (changes.languages) {
      count += (changes.languages.added || []).length;
      count += (changes.languages.removed || []).length;
      count += (changes.languages.modified || []).length;
    }

    if (changes.dependencies) {
      count += (changes.dependencies.added || []).length;
      count += (changes.dependencies.removed || []).length;
      count += (changes.dependencies.upgraded || []).length;
      count += (changes.dependencies.downgraded || []).length;
    }

    if (changes.architecture?.changed) {
      count += 1;
    }

    return count;
  }

  /**
   * Get JSON report
   */
  getJsonReport() {
    return this._generateJsonReport();
  }

  /**
   * Get markdown report
   */
  getMarkdownReport() {
    return this._generateMarkdownReport();
  }
}

module.exports = { DiffReporter };
