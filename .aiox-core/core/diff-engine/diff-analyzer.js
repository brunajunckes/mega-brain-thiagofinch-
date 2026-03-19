'use strict';

/**
 * Diff Analyzer — Compares two repository analysis snapshots
 *
 * Detects changes in:
 * - Architecture patterns
 * - Languages & frameworks
 * - Dependencies (added, removed, upgraded)
 * - Code quality metrics
 *
 * @class DiffAnalyzer
 * @version 1.0.0
 * @story 2.2
 */
class DiffAnalyzer {
  constructor(options = {}) {
    this.baseline = null;
    this.current = null;
    this.diff = {
      metadata: {},
      languages: {},
      dependencies: {},
      architecture: {},
      metrics: {},
    };
  }

  /**
   * Compare two repository snapshots
   * @param {Object} baseline Previous analysis result
   * @param {Object} current Latest analysis result
   * @returns {Promise<Object>} Diff report
   */
  async compare(baseline, current) {
    try {
      if (!baseline || !current) {
        throw new Error('Both baseline and current analysis required');
      }

      this.baseline = baseline;
      this.current = current;

      // Perform all comparisons
      this._compareSummaries();
      this._compareLanguages();
      this._compareDependencies();
      this._compareArchitecture();
      this._compareMetrics();

      return this._generateDiff();
    } catch (error) {
      throw new Error(`Diff analysis failed: ${error.message}`);
    }
  }

  /**
   * Compare repository summaries
   * @private
   */
  _compareSummaries() {
    const baseSummary = this.baseline.summary || {};
    const currSummary = this.current.summary || {};

    this.diff.metadata = {
      baselineRepo: this.baseline.repository?.name || 'unknown',
      currentRepo: this.current.repository?.name || 'unknown',
      baselineTime: this.baseline.repository?.scannedAt || 'unknown',
      currentTime: this.current.repository?.scannedAt || 'unknown',
      fileDelta: {
        before: baseSummary.totalFiles || 0,
        after: currSummary.totalFiles || 0,
        change: (currSummary.totalFiles || 0) - (baseSummary.totalFiles || 0),
      },
      locDelta: {
        before: baseSummary.totalLoc || 0,
        after: currSummary.totalLoc || 0,
        change: (currSummary.totalLoc || 0) - (baseSummary.totalLoc || 0),
      },
    };
  }

  /**
   * Compare languages
   * @private
   */
  _compareLanguages() {
    const baseLanguages = this.baseline.languages || {};
    const currLanguages = this.current.languages || {};

    const baseNames = new Set(Object.keys(baseLanguages));
    const currNames = new Set(Object.keys(currLanguages));

    const added = [];
    const removed = [];
    const modified = [];

    // Find added languages
    currNames.forEach((lang) => {
      if (!baseNames.has(lang)) {
        added.push({
          language: lang,
          files: currLanguages[lang].files,
          loc: currLanguages[lang].loc,
        });
      }
    });

    // Find removed languages
    baseNames.forEach((lang) => {
      if (!currNames.has(lang)) {
        removed.push({
          language: lang,
          files: baseLanguages[lang].files,
          loc: baseLanguages[lang].loc,
        });
      }
    });

    // Find modified languages
    baseNames.forEach((lang) => {
      if (currNames.has(lang)) {
        const baseLang = baseLanguages[lang];
        const currLang = currLanguages[lang];

        if (baseLang.files !== currLang.files || baseLang.loc !== currLang.loc) {
          modified.push({
            language: lang,
            before: { files: baseLang.files, loc: baseLang.loc, percentage: baseLang.percentage },
            after: { files: currLang.files, loc: currLang.loc, percentage: currLang.percentage },
            fileDelta: currLang.files - baseLang.files,
            locDelta: currLang.loc - baseLang.loc,
          });
        }
      }
    });

    this.diff.languages = { added, removed, modified };
  }

  /**
   * Compare dependencies
   * @private
   */
  _compareDependencies() {
    const baseDeps = this.baseline.dependencies || {};
    const currDeps = this.current.dependencies || {};

    const baseProduction = new Map(
      (baseDeps.production || []).map((d) => [d.name, d.version]),
    );
    const currProduction = new Map(
      (currDeps.production || []).map((d) => [d.name, d.version]),
    );

    const added = [];
    const removed = [];
    const upgraded = [];
    const downgraded = [];

    // Find added dependencies
    currProduction.forEach((version, name) => {
      if (!baseProduction.has(name)) {
        added.push({ name, version });
      }
    });

    // Find removed dependencies
    baseProduction.forEach((version, name) => {
      if (!currProduction.has(name)) {
        removed.push({ name, version });
      }
    });

    // Find upgraded/downgraded
    baseProduction.forEach((baseVersion, name) => {
      if (currProduction.has(name)) {
        const currVersion = currProduction.get(name);
        if (baseVersion !== currVersion) {
          const change = {
            name,
            from: baseVersion,
            to: currVersion,
            type: this._compareVersions(baseVersion, currVersion),
          };

          if (change.type === 'upgraded') {
            upgraded.push(change);
          } else if (change.type === 'downgraded') {
            downgraded.push(change);
          }
        }
      }
    });

    this.diff.dependencies = { added, removed, upgraded, downgraded };
  }

  /**
   * Compare versions (simple heuristic)
   * @private
   */
  _compareVersions(baseVer, currVer) {
    // Extract numeric parts for basic comparison
    const baseNum = parseFloat(baseVer.replace(/^[^0-9]+/, ''));
    const currNum = parseFloat(currVer.replace(/^[^0-9]+/, ''));

    if (isNaN(baseNum) || isNaN(currNum)) {
      return baseVer < currVer ? 'upgraded' : 'downgraded';
    }

    return currNum > baseNum ? 'upgraded' : currNum < baseNum ? 'downgraded' : 'same';
  }

  /**
   * Compare architecture patterns
   * @private
   */
  _compareArchitecture() {
    const baseArch = this.baseline.architecture?.pattern || {};
    const currArch = this.current.architecture?.pattern || {};

    const changed = baseArch.name !== currArch.name;

    this.diff.architecture = {
      before: baseArch.name || 'unknown',
      after: currArch.name || 'unknown',
      changed,
      beforeScore: baseArch.score || 0,
      afterScore: currArch.score || 0,
      impact: this._getArchitectureImpact(baseArch.name, currArch.name),
    };
  }

  /**
   * Get architecture change impact
   * @private
   */
  _getArchitectureImpact(before, after) {
    if (before === after) return 'none';

    // Major changes
    if (
      (before === 'Monolithic' && after === 'Modular') ||
      (before === 'Monolithic' && after === 'Layered')
    ) {
      return 'major';
    }
    if (
      (before === 'Modular' && after === 'Monolithic') ||
      (before === 'Layered' && after === 'Monolithic')
    ) {
      return 'major';
    }

    // Minor changes
    return 'minor';
  }

  /**
   * Compare code quality metrics
   * @private
   */
  _compareMetrics() {
    const baseMetrics = this.baseline.metrics || {};
    const currMetrics = this.current.metrics || {};

    const testCoverageDelta = (currMetrics.testCoverage || 0) - (baseMetrics.testCoverage || 0);
    const qualityDelta = (currMetrics.codeQuality || 0) - (baseMetrics.codeQuality || 0);

    this.diff.metrics = {
      testCoverage: {
        before: baseMetrics.testCoverage || 0,
        after: currMetrics.testCoverage || 0,
        change: testCoverageDelta,
        status: testCoverageDelta > 0 ? 'improved' : testCoverageDelta < 0 ? 'regressed' : 'same',
      },
      codeQuality: {
        before: baseMetrics.codeQuality || 0,
        after: currMetrics.codeQuality || 0,
        change: qualityDelta,
        status: qualityDelta > 0 ? 'improved' : qualityDelta < 0 ? 'regressed' : 'same',
      },
      complexity: {
        before: baseMetrics.complexityScore || 'unknown',
        after: currMetrics.complexityScore || 'unknown',
      },
      documentation: {
        before: baseMetrics.documentationRatio || 0,
        after: currMetrics.documentationRatio || 0,
        change: (currMetrics.documentationRatio || 0) - (baseMetrics.documentationRatio || 0),
      },
    };
  }

  /**
   * Generate diff report
   * @private
   */
  _generateDiff() {
    return {
      baseline: this.baseline.repository || {},
      current: this.current.repository || {},
      changes: this.diff,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detected changes
   */
  getChanges() {
    return this.diff;
  }

  /**
   * Get language changes
   */
  getLanguageChanges() {
    return this.diff.languages;
  }

  /**
   * Get dependency changes
   */
  getDependencyChanges() {
    return this.diff.dependencies;
  }
}

module.exports = { DiffAnalyzer };
