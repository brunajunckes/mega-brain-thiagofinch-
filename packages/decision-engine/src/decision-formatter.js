'use strict';

/**
 * DecisionFormatter — Formats decision data into multiple output formats
 *
 * Produces:
 * - JSON structured decisions
 * - Markdown human-readable reports
 * - Executive summaries
 * - Implementation roadmaps
 *
 * Formats support:
 * - JSON (structured)
 * - Markdown (human-readable)
 * - Plain text (summaries)
 *
 * @class DecisionFormatter
 * @version 1.0.0
 * @story 2.3 Phase 3
 */
class DecisionFormatter {
  /**
   * Create decision formatter
   * @param {Object} options Configuration
   */
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Format decisions into JSON structure
   * @param {Object} analysis Decision analysis from DecisionAnalyzer
   * @param {Array} recommendations Recommendations from RecommendationGenerator
   * @returns {Object} Structured JSON decision document
   */
  formatJSON(analysis, recommendations = []) {
    try {
      return {
        metadata: {
          repo: analysis.repository,
          analyzedAt: new Date().toISOString(),
          context: 'modernization',
          healthScore: analysis.healthScore,
          version: '1.0.0',
        },
        currentState: {
          ...analysis.currentState,
          debtLevel: analysis.debtLevel,
        },
        analysis: {
          risks: analysis.risks || [],
          opportunities: analysis.opportunities || [],
        },
        recommendations: this._formatRecommendationsJSON(recommendations),
        summary: this._generateSummary(analysis, recommendations),
        roadmap: this._generateRoadmap(recommendations),
      };
    } catch (error) {
      throw new Error(`JSON formatting failed: ${error.message}`);
    }
  }

  /**
   * Format decisions into Markdown report
   * @param {Object} analysis Decision analysis
   * @param {Array} recommendations Recommendations
   * @returns {string} Markdown report
   */
  formatMarkdown(analysis, recommendations = []) {
    try {
      const lines = [];

      lines.push('# Evolution Decision Report');
      lines.push('');
      lines.push(`**Repository:** ${analysis.repository}`);
      lines.push(`**Generated:** ${new Date().toLocaleDateString()}`);
      lines.push(`**Health Score:** ${analysis.healthScore}/10 (${this._getHealthLevel(analysis.healthScore)})`);
      lines.push('');

      // Executive Summary
      lines.push('## Executive Summary');
      lines.push('');
      lines.push(this._generateExecutiveSummary(analysis, recommendations));
      lines.push('');

      // Current State
      lines.push('## Current State');
      lines.push('');
      lines.push('### Architecture & Metrics');
      lines.push('');
      lines.push(`- **Files:** ${analysis.currentState.files || 0}`);
      lines.push(`- **Lines of Code:** ${this._formatLOC(analysis.currentState.loc || 0)}`);
      lines.push(`- **Languages:** ${analysis.currentState.languages || 0}`);
      lines.push(`- **Frameworks:** ${analysis.currentState.frameworks || 0}`);
      lines.push(`- **Dependencies:** ${analysis.currentState.dependencies || 0}`);
      lines.push(`- **Test Coverage:** ${analysis.currentState.testCoverage || 'unknown'}`);
      lines.push('');

      lines.push('### Health Assessment');
      lines.push('');
      lines.push(`- **Overall Health:** ${analysis.healthScore}/10`);
      lines.push(`- **Technical Debt:** ${analysis.debtLevel}`);
      lines.push('');

      // Key Findings
      lines.push('## Key Findings');
      lines.push('');
      if (analysis.opportunities && analysis.opportunities.length > 0) {
        lines.push('### Opportunities');
        lines.push('');
        analysis.opportunities.slice(0, 5).forEach((opp, idx) => {
          lines.push(`${idx + 1}. **${opp.title}** — ${opp.description}`);
        });
        lines.push('');
      }

      // Recommendations
      lines.push('## Top Recommendations');
      lines.push('');
      recommendations.slice(0, 10).forEach((rec, idx) => {
        lines.push(`### ${idx + 1}. ${rec.title}`);
        lines.push('');
        lines.push(`**Impact:** ${rec.impact.toUpperCase()}`);
        lines.push(`**Effort:** ${rec.effort.toUpperCase()}`);
        lines.push(`**Confidence:** ${rec.confidence}%`);
        lines.push(`**Estimated Days:** ${rec.estimatedDays}`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
        lines.push('**Rationale:**');
        lines.push(`${rec.rationale}`);
        lines.push('');
        if (rec.implementationSteps && rec.implementationSteps.length > 0) {
          lines.push('**Implementation Steps:**');
          lines.push('');
          rec.implementationSteps.forEach((step, i) => {
            lines.push(`${i + 1}. ${step}`);
          });
          lines.push('');
        }
        if (rec.blockers && rec.blockers.length > 0) {
          lines.push('**Blockers:**');
          lines.push('');
          rec.blockers.forEach((blocker) => {
            lines.push(`- ${blocker}`);
          });
          lines.push('');
        }
      });

      // Implementation Roadmap
      lines.push('## Implementation Roadmap');
      lines.push('');
      const roadmap = this._generateRoadmap(recommendations);
      roadmap.phases.forEach((phase, idx) => {
        lines.push(`### Phase ${idx + 1}: ${phase.name}`);
        lines.push('');
        lines.push(`**Duration:** ${phase.estimatedDays} days`);
        lines.push('**Items:**');
        lines.push('');
        phase.items.forEach((item) => {
          lines.push(`- ${item.title} (${item.effort})`);
        });
        lines.push('');
      });

      // Risks & Considerations
      if (analysis.risks && analysis.risks.length > 0) {
        lines.push('## Risks & Considerations');
        lines.push('');
        analysis.risks.forEach((risk) => {
          lines.push(`- **${risk.category}:** ${risk.description}`);
        });
        lines.push('');
      }

      return lines.join('\n');
    } catch (error) {
      throw new Error(`Markdown formatting failed: ${error.message}`);
    }
  }

  /**
   * Format as executive summary
   * @param {Object} analysis Decision analysis
   * @param {Array} recommendations Recommendations
   * @returns {string} Executive summary
   */
  formatExecutive(analysis, recommendations = []) {
    const lines = [];

    lines.push('='.repeat(60));
    lines.push('EVOLUTION DECISION — EXECUTIVE SUMMARY');
    lines.push('='.repeat(60));
    lines.push('');

    lines.push(`Repository: ${analysis.repository}`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Health Score: ${analysis.healthScore}/10`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push('-'.repeat(60));
    lines.push(this._generateExecutiveSummary(analysis, recommendations));
    lines.push('');

    lines.push('KEY RECOMMENDATIONS');
    lines.push('-'.repeat(60));
    recommendations.slice(0, 5).forEach((rec, idx) => {
      lines.push(`${idx + 1}. ${rec.title}`);
      lines.push(`   Impact: ${rec.impact} | Effort: ${rec.effort} | Confidence: ${rec.confidence}%`);
      lines.push(`   Days: ${rec.estimatedDays} | Category: ${rec.category}`);
      lines.push('');
    });

    lines.push('INVESTMENT REQUIRED');
    lines.push('-'.repeat(60));
    const totalDays = recommendations.reduce((sum, r) => sum + r.estimatedDays, 0);
    const highImpact = recommendations.filter((r) => r.impact === 'high').length;
    lines.push(`Total Estimated Effort: ${totalDays} days`);
    lines.push(`High-Impact Items: ${highImpact}`);
    lines.push('');

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  /**
   * Generate implementation roadmap
   * @private
   */
  _generateRoadmap(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return { phases: [] };
    }

    const phases = [];
    let currentPhase = { name: '', items: [], estimatedDays: 0 };

    // Group by effort level and priority
    const highPriority = recommendations
      .filter((r) => r.priority <= 2)
      .sort((a, b) => (a.estimatedDays || 0) - (b.estimatedDays || 0));

    const mediumPriority = recommendations
      .filter((r) => r.priority > 2 && r.priority <= 4)
      .sort((a, b) => (a.estimatedDays || 0) - (b.estimatedDays || 0));

    // Phase 1: Critical items
    if (highPriority.length > 0) {
      currentPhase = {
        name: 'Critical Improvements',
        items: highPriority.slice(0, 3),
        estimatedDays: highPriority.slice(0, 3).reduce((sum, r) => sum + (r.estimatedDays || 0), 0),
      };
      phases.push(currentPhase);
    }

    // Phase 2: Medium-priority items
    if (mediumPriority.length > 0) {
      currentPhase = {
        name: 'Secondary Enhancements',
        items: mediumPriority.slice(0, 3),
        estimatedDays: mediumPriority.slice(0, 3).reduce((sum, r) => sum + (r.estimatedDays || 0), 0),
      };
      phases.push(currentPhase);
    }

    // Phase 3: Remaining items
    const remaining = recommendations.slice(6);
    if (remaining.length > 0) {
      currentPhase = {
        name: 'Optimization & Polish',
        items: remaining,
        estimatedDays: remaining.reduce((sum, r) => sum + (r.estimatedDays || 0), 0),
      };
      phases.push(currentPhase);
    }

    return { phases };
  }

  /**
   * Format recommendations for JSON output
   * @private
   */
  _formatRecommendationsJSON(recommendations) {
    return recommendations.map((rec) => ({
      id: rec.id,
      category: rec.category,
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      confidence: rec.confidence,
      effort: rec.effort,
      estimatedDays: rec.estimatedDays,
      priority: rec.priority,
      rationale: rec.rationale,
      implementationSteps: rec.implementationSteps || [],
      blockers: rec.blockers || [],
      risks: rec.risks || [],
    }));
  }

  /**
   * Generate executive summary
   * @private
   */
  _generateExecutiveSummary(analysis, recommendations) {
    const healthLevel = this._getHealthLevel(analysis.healthScore);
    const topRecs = recommendations.slice(0, 3);
    const totalDays = recommendations.reduce((sum, r) => sum + r.estimatedDays, 0);

    return `Repository is in ${healthLevel} health (${analysis.healthScore}/10) with ${analysis.debtLevel} technical debt. ` +
      `Recommend focusing on ${topRecs.length} high-impact areas requiring approximately ${totalDays} days of effort. ` +
      'Following this roadmap will improve code quality, reduce maintenance burden, and accelerate feature delivery.';
  }

  /**
   * Get health level description
   * @private
   */
  _getHealthLevel(score) {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  }

  /**
   * Generate summary object
   * @private
   */
  _generateSummary(analysis, recommendations) {
    return {
      healthScore: analysis.healthScore,
      debtLevel: analysis.debtLevel,
      totalRecommendations: recommendations.length,
      highImpactCount: recommendations.filter((r) => r.impact === 'high').length,
      estimatedTotalDays: recommendations.reduce((sum, r) => sum + r.estimatedDays, 0),
      topThreePriorities: recommendations.slice(0, 3).map((r) => r.title),
      riskFactors: analysis.risks ? analysis.risks.length : 0,
      opportunities: analysis.opportunities ? analysis.opportunities.length : 0,
    };
  }

  /**
   * Format LOC for display
   * @private
   */
  _formatLOC(loc) {
    if (loc >= 1000000) return `${(loc / 1000000).toFixed(1)}M`;
    if (loc >= 1000) return `${(loc / 1000).toFixed(1)}K`;
    return loc.toString();
  }
}

module.exports = DecisionFormatter;
