'use strict';

/**
 * Decision Formatter — Generates formatted decision reports
 *
 * @class DecisionFormatter
 * @version 1.0.0
 * @story 2.3
 */
class DecisionFormatter {
  constructor(options = {}) {
    this.analysis = null;
    this.recommendations = null;
  }

  /**
   * Format decision data into reports
   * @param {Object} analysis Analysis from DecisionAnalyzer
   * @param {Array} recommendations Recommendations from RecommendationGenerator
   * @returns {Promise<Object>} Formatted reports
   */
  async format(analysis, recommendations = []) {
    try {
      if (!analysis) {
        throw new Error('Analysis data is required');
      }

      this.analysis = analysis;
      this.recommendations = recommendations;

      return {
        success: true,
        reports: {
          json: this._formatJSON(),
          markdown: this._formatMarkdown(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Formatting failed: ${error.message}`);
    }
  }

  /**
   * Format as JSON
   * @private
   */
  _formatJSON() {
    const context = this.analysis.context || {};
    const state = this.analysis.currentState || {};
    const scores = this.analysis.healthScores || {};

    return {
      metadata: {
        repository: context.repositoryName || state.repository || 'unknown',
        generatedAt: new Date().toISOString(),
        healthScore: scores.overall || 0,
        debtLevel: scores.debtLevel || 'unknown',
      },
      currentState: {
        architecture: {
          pattern: state.architecturePattern,
          score: scores.architecture,
        },
        testing: {
          coverage: state.testCoverage,
          score: scores.testing,
        },
        codeQuality: {
          score: scores.codeQuality,
        },
        dependencies: {
          total: state.dependencies?.total || 0,
          production: state.dependencies?.production || 0,
          development: state.dependencies?.development || 0,
        },
        languages: state.languages || [],
      },
      recommendations: (this.recommendations || []).map((rec) => ({
        id: rec.id,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        impact: rec.impact,
        confidence: rec.confidence,
        effort: rec.effort,
        estimatedDays: rec.estimatedDays,
        priority: rec.priority,
        steps: rec.steps || [],
      })),
      opportunities: (this.analysis.opportunities || []).slice(0, 10),
      risks: (this.analysis.risks || []).slice(0, 5),
    };
  }

  /**
   * Format as Markdown
   * @private
   */
  _formatMarkdown() {
    const context = this.analysis.context || {};
    const scores = this.analysis.healthScores || {};

    let md = `# Decision Report\n\n`;
    md += `**Repository:** ${context.repositoryName || 'unknown'}\n`;
    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Health Score:** ${scores.overall?.toFixed(1) || '0'}/10\n`;
    md += `**Debt Level:** ${scores.debtLevel || 'unknown'}\n\n`;

    md += `## Executive Summary\n\n`;
    md += this._generateSummary();

    md += `\n## Key Metrics\n\n`;
    md += `| Metric | Score | Status |\n`;
    md += `|--------|-------|--------|\n`;
    md += `| Architecture | ${scores.architecture?.toFixed(1) || '0'}/10 | `;
    md += `${this._getStatus(scores.architecture)} |\n`;
    md += `| Code Quality | ${scores.codeQuality?.toFixed(1) || '0'}/10 | `;
    md += `${this._getStatus(scores.codeQuality)} |\n`;
    md += `| Testing | ${scores.testing?.toFixed(1) || '0'}/10 | `;
    md += `${this._getStatus(scores.testing)} |\n\n`;

    if (this.recommendations && this.recommendations.length > 0) {
      md += `## Top Recommendations\n\n`;
      this.recommendations.slice(0, 5).forEach((rec, idx) => {
        md += `### ${idx + 1}. ${rec.title}\n\n`;
        md += `**Impact:** ${rec.impact} | **Confidence:** ${(rec.confidence * 100).toFixed(0)}% | **Effort:** ${rec.effort}\n\n`;
        md += `${rec.description}\n\n`;
        if (rec.steps && rec.steps.length > 0) {
          md += `**Steps:**\n`;
          rec.steps.forEach((step) => {
            md += `- ${step}\n`;
          });
          md += `\n`;
        }
      });
    }

    if (this.analysis.risks && this.analysis.risks.length > 0) {
      md += `## Risks\n\n`;
      this.analysis.risks.slice(0, 3).forEach((risk) => {
        md += `### ${risk.description}\n`;
        md += `**Severity:** ${risk.severity}\n`;
        md += `**Mitigation:** ${risk.mitigation}\n\n`;
      });
    }

    return md;
  }

  /**
   * Generate summary text
   * @private
   */
  _generateSummary() {
    const scores = this.analysis.healthScores || {};
    const overall = scores.overall || 0;

    let summary = '';
    if (overall >= 8) {
      summary = 'Repository is in excellent health. Continue current practices and maintain standards.';
    } else if (overall >= 6) {
      summary = 'Repository shows good health but has areas for improvement. Focus on recommended enhancements.';
    } else if (overall >= 4) {
      summary = 'Repository has moderate technical debt. Prioritize testing and architecture improvements.';
    } else {
      summary = 'Repository needs significant attention. Address critical issues in testing and architecture.';
    }

    return summary + ` Current health score is ${overall.toFixed(1)}/10 with ${scores.debtLevel || 'unknown'} technical debt.`;
  }

  /**
   * Get status emoji
   * @private
   */
  _getStatus(score) {
    if (score >= 8) return '✅ Good';
    if (score >= 6) return '⚠️ Fair';
    if (score >= 4) return '🔴 Poor';
    return '❌ Critical';
  }
}

module.exports = { DecisionFormatter };
