'use strict';

const fs = require('fs');
const path = require('path');
const { DiffAnalyzer, ImpactCalculator, DiffReporter } = require('../../core/diff-engine');

/**
 * Handle 'aiox diff' command
 * Compares two repository analysis snapshots
 *
 * Usage:
 *   aiox diff --baseline=/path/to/repo-v1.json --current=/path/to/repo-v2.json
 *   aiox diff --baseline=/path/to/repo-v1.json --current=/path/to/repo-v2.json --format=json
 *
 * @param {Object} args Command arguments
 */
async function handleDiffCommand(args) {
  try {
    const baselinePath = args.baseline;
    const currentPath = args.current;
    const outputPath = args.output || process.cwd();
    const format = args.format || 'markdown';
    const verbose = args.verbose || false;

    // Validate inputs
    if (!baselinePath || !currentPath) {
      console.error('❌ Error: --baseline and --current paths are required');
      console.error('   Usage: aiox diff --baseline=<path> --current=<path>');
      process.exit(1);
    }

    if (!fs.existsSync(baselinePath)) {
      console.error(`❌ Error: Baseline file not found: ${baselinePath}`);
      process.exit(1);
    }

    if (!fs.existsSync(currentPath)) {
      console.error(`❌ Error: Current file not found: ${currentPath}`);
      process.exit(1);
    }

    if (verbose) {
      console.log(`📊 Comparing repository snapshots`);
    }

    // Load baseline and current analysis
    if (verbose) console.log('  ├─ Loading baseline analysis...');
    const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

    if (verbose) console.log('  ├─ Loading current analysis...');
    const currentData = JSON.parse(fs.readFileSync(currentPath, 'utf8'));

    // Phase 1: Analyze differences
    if (verbose) console.log('  ├─ Analyzing differences...');
    const analyzer = new DiffAnalyzer();
    const diffResult = await analyzer.compare(baselineData, currentData);

    // Phase 2: Calculate impact
    if (verbose) console.log('  ├─ Calculating impact...');
    const calculator = new ImpactCalculator();
    const impactResult = calculator.assess(diffResult.changes);

    // Phase 3: Generate reports
    if (verbose) console.log('  └─ Generating reports...');
    const reporter = new DiffReporter();
    const reportResult = await reporter.generate(diffResult, impactResult);

    // Output results
    if (format === 'json') {
      console.log(JSON.stringify(reportResult.reports.json, null, 2));
    } else if (format === 'markdown' || format === 'md') {
      console.log(`✅ Diff analysis complete!\n`);

      // Print summary
      console.log(`📊 Change Summary:`);
      console.log(`  - Severity:       ${impactResult.severity.toUpperCase()}`);
      console.log(`  - Impact Score:   ${impactResult.overallScore}/10`);
      console.log(`  - Breaking:       ${impactResult.breaking ? 'Yes ⚠️' : 'No'}`);
      console.log(`  - Total Changes:  ${reportResult.summary.changeCount}`);

      // Print change breakdown
      const changes = diffResult.changes;
      let changeCount = 0;

      if (changes.languages) {
        const langCount = (changes.languages.added || []).length +
                         (changes.languages.removed || []).length +
                         (changes.languages.modified || []).length;
        if (langCount > 0) {
          console.log(`\n  Languages: ${langCount} change(s)`);
          changeCount += langCount;
        }
      }

      if (changes.dependencies) {
        const depCount = (changes.dependencies.added || []).length +
                        (changes.dependencies.removed || []).length +
                        (changes.dependencies.upgraded || []).length +
                        (changes.dependencies.downgraded || []).length;
        if (depCount > 0) {
          console.log(`  Dependencies: ${depCount} change(s)`);
          changeCount += depCount;
        }
      }

      if (changes.architecture?.changed) {
        console.log(`  Architecture: 1 change (${changes.architecture.before} → ${changes.architecture.after})`);
      }

      if (changes.metrics) {
        if (changes.metrics.testCoverage || changes.metrics.codeQuality) {
          console.log(`  Metrics: Quality metrics changed`);
        }
      }

      // Print recommendations
      if (impactResult.recommendations && impactResult.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        impactResult.recommendations.forEach((rec) => {
          console.log(`  - ${rec}`);
        });
      }

      // Save reports to files
      const baselineFile = path.basename(baselinePath, '.json');
      const currentFile = path.basename(currentPath, '.json');
      const timestamp = new Date().toISOString().split('T')[0];

      const jsonFile = path.join(outputPath, `diff-${baselineFile}-to-${currentFile}-${timestamp}.json`);
      const mdFile = path.join(outputPath, `DIFF-REPORT-${timestamp}.md`);

      fs.writeFileSync(jsonFile, JSON.stringify(reportResult.reports.json, null, 2));
      fs.writeFileSync(mdFile, reportResult.reports.markdown);

      console.log(`\n📄 Generated reports:`);
      console.log(`  - JSON:     ${jsonFile}`);
      console.log(`  - Markdown: ${mdFile}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Diff analysis failed: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

module.exports = { handleDiffCommand };
