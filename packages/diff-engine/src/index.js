'use strict';

const { DiffAnalyzer } = require('./diff-analyzer');
const { ImpactCalculator } = require('./impact-calculator');
const { DiffReporter } = require('./diff-reporter');

/**
 * Diff Engine — Complete repository diff analysis pipeline
 *
 * Phase 1: DiffAnalyzer — Compare two repo.json files
 * Phase 2: ImpactCalculator — Score impact of changes
 * Phase 3: DiffReporter — Generate reports
 *
 * @version 1.0.0
 * @story 2.2
 */

module.exports = {
  DiffAnalyzer,
  ImpactCalculator,
  DiffReporter,

  /**
   * Quick analyze function (all phases in one call)
   */
  async analyzeDiff(baseline, current, options = {}) {
    const analyzer = new DiffAnalyzer(options);
    const calculator = new ImpactCalculator(options);
    const reporter = new DiffReporter(options);

    const diff = await analyzer.generateDiff(baseline, current);
    const impact = calculator.calculateImpact(diff);
    const reports = await reporter.generateReports(diff, impact);

    return {
      diff,
      impact,
      reports,
    };
  },
};
