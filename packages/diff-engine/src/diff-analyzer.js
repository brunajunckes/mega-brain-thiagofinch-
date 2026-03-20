'use strict';

/**
 * DiffAnalyzer — Compares two repo.json snapshots and generates structured diffs
 *
 * Compares:
 * - Repository metadata
 * - Language composition
 * - Dependencies (added, removed, upgraded)
 * - Architecture patterns
 * - Code quality metrics
 *
 * @class DiffAnalyzer
 * @version 1.0.0
 * @story 2.2
 */
class DiffAnalyzer {
  /**
   * Create diff analyzer
   * @param {Object} options Configuration
   */
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Generate diff between two repo.json snapshots
   * @param {Object} baseline Baseline repo.json
   * @param {Object} current Current repo.json
   * @returns {Promise<Object>} Structured diff
   */
  async generateDiff(baseline, current) {
    try {
      if (!baseline || !current) {
        throw new Error('Both baseline and current repositories required');
      }

      const diff = {
        timestamp: new Date().toISOString(),
        baseline: {
          repository: baseline.metadata?.repository?.name || 'unknown',
          timestamp: baseline.metadata?.generatedAt || baseline.timestamp,
          files: baseline.summary?.totalFiles || 0,
          loc: baseline.summary?.totalLoc || 0,
        },
        current: {
          repository: current.metadata?.repository?.name || 'unknown',
          timestamp: current.metadata?.generatedAt || current.timestamp,
          files: current.summary?.totalFiles || 0,
          loc: current.summary?.totalLoc || 0,
        },
        changes: {
          metadata: this._diffMetadata(baseline, current),
          languages: this._diffLanguages(baseline, current),
          frameworks: this._diffFrameworks(baseline, current),
          dependencies: this._diffDependencies(baseline, current),
          architecture: this._diffArchitecture(baseline, current),
          metrics: this._diffMetrics(baseline, current),
        },
      };

      return diff;
    } catch (error) {
      throw new Error(`Diff generation failed: ${error.message}`);
    }
  }

  /**
   * Compare metadata
   * @private
   */
  _diffMetadata(baseline, current) {
    return {
      fileChange: (current.summary?.totalFiles || 0) - (baseline.summary?.totalFiles || 0),
      locChange: (current.summary?.totalLoc || 0) - (baseline.summary?.totalLoc || 0),
      languagesCount: {
        before: baseline.summary?.languages || 0,
        after: current.summary?.languages || 0,
        change: (current.summary?.languages || 0) - (baseline.summary?.languages || 0),
      },
      frameworksCount: {
        before: baseline.summary?.frameworks || 0,
        after: current.summary?.frameworks || 0,
        change: (current.summary?.frameworks || 0) - (baseline.summary?.frameworks || 0),
      },
    };
  }

  /**
   * Compare language composition
   * @private
   */
  _diffLanguages(baseline, current) {
    const baseLanguages = baseline.languages || {};
    const currentLanguages = current.languages || {};

    const added = [];
    const removed = [];
    const modified = [];

    // Detect additions
    for (const lang in currentLanguages) {
      if (!baseLanguages[lang]) {
        added.push({
          language: lang,
          files: currentLanguages[lang].files,
          loc: currentLanguages[lang].loc,
          percentage: currentLanguages[lang].percentage,
        });
      }
    }

    // Detect removals
    for (const lang in baseLanguages) {
      if (!currentLanguages[lang]) {
        removed.push({
          language: lang,
          files: baseLanguages[lang].files,
          loc: baseLanguages[lang].loc,
        });
      }
    }

    // Detect modifications
    for (const lang in baseLanguages) {
      if (currentLanguages[lang]) {
        const fileDiff = currentLanguages[lang].files - baseLanguages[lang].files;
        const locDiff = currentLanguages[lang].loc - baseLanguages[lang].loc;

        if (fileDiff !== 0 || locDiff !== 0) {
          modified.push({
            language: lang,
            before: {
              files: baseLanguages[lang].files,
              loc: baseLanguages[lang].loc,
              percentage: baseLanguages[lang].percentage,
            },
            after: {
              files: currentLanguages[lang].files,
              loc: currentLanguages[lang].loc,
              percentage: currentLanguages[lang].percentage,
            },
            fileChange: fileDiff,
            locChange: locDiff,
          });
        }
      }
    }

    return { added, removed, modified };
  }

  /**
   * Compare frameworks
   * @private
   */
  _diffFrameworks(baseline, current) {
    const baseFrameworks = baseline.frameworks || [];
    const currentFrameworks = current.frameworks || [];

    const added = currentFrameworks.filter((f) => !baseFrameworks.includes(f));
    const removed = baseFrameworks.filter((f) => !currentFrameworks.includes(f));

    return { added, removed };
  }

  /**
   * Compare dependencies
   * @private
   */
  _diffDependencies(baseline, current) {
    const baseProd = baseline.dependencies?.production || [];
    const currentProd = current.dependencies?.production || [];
    const baseDev = baseline.dependencies?.development || [];
    const currentDev = current.dependencies?.development || [];

    return {
      production: this._diffDepList(baseProd, currentProd),
      development: this._diffDepList(baseDev, currentDev),
      total: {
        before: (baseline.dependencies?.totalDependencies || 0),
        after: (current.dependencies?.totalDependencies || 0),
        change: (current.dependencies?.totalDependencies || 0) -
                (baseline.dependencies?.totalDependencies || 0),
      },
    };
  }

  /**
   * Diff dependency lists
   * @private
   */
  _diffDepList(baseline, current) {
    const added = [];
    const removed = [];
    const upgraded = [];

    // Create maps for easier lookup
    const baseMap = {};
    const currentMap = {};

    baseline.forEach((dep) => {
      if (typeof dep !== 'string') return;
      const name = dep.replace(/@[^@]*$/, '');
      baseMap[name] = dep;
    });

    current.forEach((dep) => {
      if (typeof dep !== 'string') return;
      const name = dep.replace(/@[^@]*$/, '');
      currentMap[name] = dep;
    });

    // Detect additions
    for (const dep in currentMap) {
      if (!baseMap[dep]) {
        added.push(currentMap[dep]);
      }
    }

    // Detect removals
    for (const dep in baseMap) {
      if (!currentMap[dep]) {
        removed.push(baseMap[dep]);
      }
    }

    // Detect upgrades
    for (const dep in baseMap) {
      if (currentMap[dep] && baseMap[dep] !== currentMap[dep]) {
        upgraded.push({
          name: dep,
          from: baseMap[dep],
          to: currentMap[dep],
        });
      }
    }

    return { added, removed, upgraded };
  }

  /**
   * Compare architecture patterns
   * @private
   */
  _diffArchitecture(baseline, current) {
    const baseArch = baseline.architecture?.pattern || {};
    const currentArch = current.architecture?.pattern || {};

    return {
      before: {
        name: baseArch.name || 'Unknown',
        confidence: baseArch.score || 0,
        evidence: baseArch.evidence || [],
      },
      after: {
        name: currentArch.name || 'Unknown',
        confidence: currentArch.score || 0,
        evidence: currentArch.evidence || [],
      },
      changed: baseArch.name !== currentArch.name,
      change: baseArch.name !== currentArch.name
        ? {
          from: baseArch.name || 'Unknown',
          to: currentArch.name || 'Unknown',
        }
        : null,
    };
  }

  /**
   * Compare metrics
   * @private
   */
  _diffMetrics(baseline, current) {
    const baseMetrics = baseline.metrics || {};
    const currentMetrics = current.metrics || {};

    const metrics = {};

    // Test coverage
    metrics.testCoverage = {
      before: baseMetrics.testCoverage || 0,
      after: currentMetrics.testCoverage || 0,
      change: (currentMetrics.testCoverage || 0) - (baseMetrics.testCoverage || 0),
      status: this._getMetricStatus('testCoverage', baseMetrics, currentMetrics),
    };

    // Code quality
    metrics.codeQuality = {
      before: baseMetrics.codeQuality || 0,
      after: currentMetrics.codeQuality || 0,
      change: (currentMetrics.codeQuality || 0) - (baseMetrics.codeQuality || 0),
      status: this._getMetricStatus('codeQuality', baseMetrics, currentMetrics),
    };

    // Complexity
    metrics.complexity = {
      before: baseMetrics.complexityScore || 'unknown',
      after: currentMetrics.complexityScore || 'unknown',
      status: this._getMetricStatus('complexityScore', baseMetrics, currentMetrics),
    };

    // Documentation
    metrics.documentation = {
      before: Math.round((baseMetrics.documentationRatio || 0) * 100),
      after: Math.round((currentMetrics.documentationRatio || 0) * 100),
      change: Math.round((currentMetrics.documentationRatio || 0) * 100) -
              Math.round((baseMetrics.documentationRatio || 0) * 100),
      status: this._getMetricStatus('documentationRatio', baseMetrics, currentMetrics),
    };

    return metrics;
  }

  /**
   * Determine metric status (improved/same/regressed)
   * @private
   */
  _getMetricStatus(metric, before, after) {
    const beforeVal = before[metric] || 0;
    const afterVal = after[metric] || 0;

    if (metric === 'complexityScore') {
      const complexityMap = { low: 3, medium: 2, high: 1 };
      const beforeScore = complexityMap[beforeVal] || 0;
      const afterScore = complexityMap[afterVal] || 0;
      if (afterScore > beforeScore) return 'improved';
      if (afterScore < beforeScore) return 'regressed';
      return 'same';
    }

    if (afterVal > beforeVal) return 'improved';
    if (afterVal < beforeVal) return 'regressed';
    return 'same';
  }
}

module.exports = { DiffAnalyzer };
