'use strict';

/**
 * Insight Generator — Generates actionable insights from aggregated data
 *
 * @class InsightGenerator
 * @version 1.0.0
 * @story 3.3
 */
class InsightGenerator {
  /**
   * Generate insights from repository data
   * @param {Array} repositories Repository metrics
   * @returns {Object} Generated insights
   */
  static generate(repositories) {
    if (!repositories || repositories.length === 0) {
      return { status: 'no_data', insights: [] };
    }

    const insights = [];

    // Detect improvement patterns
    insights.push(...this._detectImprovements(repositories));

    // Detect regression patterns
    insights.push(...this._detectRegressions(repositories));

    // Detect outliers
    insights.push(...this._detectOutliers(repositories));

    // Generate recommendations
    insights.push(...this._generateRecommendations(repositories));

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      insights: insights.sort((a, b) => b.priority - a.priority),
      summary: {
        total: insights.length,
        critical: insights.filter((i) => i.priority >= 9).length,
        important: insights.filter((i) => i.priority >= 6 && i.priority < 9).length,
        informational: insights.filter((i) => i.priority < 6).length,
      },
    };
  }

  /**
   * Detect improvements
   * @private
   */
  static _detectImprovements(repos) {
    const insights = [];
    const avgHealth = repos.reduce((s, r) => s + r.healthScore, 0) / repos.length;

    const improving = repos.filter((r) => r.healthScore > avgHealth + 1);
    if (improving.length > 0) {
      insights.push({
        type: 'improvement',
        priority: 7,
        title: `${improving.length} repositories improving faster than average`,
        description: `These repos show health scores above portfolio average: ${improving
          .map((r) => r.repository)
          .join(', ')}`,
        action: 'Share best practices from these repositories',
      });
    }

    return insights;
  }

  /**
   * Detect regressions
   * @private
   */
  static _detectRegressions(repos) {
    const insights = [];
    const avgCoverage = repos.reduce((s, r) => s + r.testCoverage, 0) / repos.length;

    const declining = repos.filter((r) => r.testCoverage < avgCoverage - 10);
    if (declining.length > 0) {
      insights.push({
        type: 'regression',
        priority: 9,
        title: `${declining.length} repositories with significantly low test coverage`,
        description: `Coverage below ${(avgCoverage - 10).toFixed(0)}%: ${declining
          .map((r) => r.repository)
          .join(', ')}`,
        action: 'Increase testing efforts in these projects',
      });
    }

    return insights;
  }

  /**
   * Detect outliers
   * @private
   */
  static _detectOutliers(repos) {
    const insights = [];
    const sizes = repos.map((r) => r.loc);
    const avgLoc = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const stdDev = Math.sqrt(sizes.reduce((s, r) => s + Math.pow(r - avgLoc, 2), 0) / sizes.length);

    const largeRepos = repos.filter((r) => r.loc > avgLoc + 2 * stdDev);
    if (largeRepos.length > 0) {
      insights.push({
        type: 'outlier',
        priority: 6,
        title: `${largeRepos.length} exceptionally large repositories detected`,
        description: `These repos significantly exceed size baseline: ${largeRepos
          .map((r) => `${r.repository} (${r.loc.toLocaleString()} LOC)`)
          .join(', ')}`,
        action: 'Consider modularization or decomposition strategies',
      });
    }

    return insights;
  }

  /**
   * Generate recommendations
   * @private
   */
  static _generateRecommendations(repos) {
    const insights = [];
    const langCount = repos.reduce((sum, r) => sum + r.languages, 0) / repos.length;

    if (langCount > 3) {
      insights.push({
        type: 'recommendation',
        priority: 5,
        title: 'Portfolio language standardization opportunity',
        description: `Average ${langCount.toFixed(1)} languages per repo. Consider reducing to 2-3 primary languages.`,
        action: 'Establish language standards policy',
      });
    }

    const depCount = repos.reduce((sum, r) => sum + r.dependencies, 0) / repos.length;
    if (depCount > 30) {
      insights.push({
        type: 'recommendation',
        priority: 5,
        title: 'High dependency burden detected',
        description: `Average ${depCount.toFixed(0)} dependencies per repo. Monitor for security and maintenance issues.`,
        action: 'Implement dependency audit and minimization strategy',
      });
    }

    return insights;
  }
}

module.exports = { InsightGenerator };
