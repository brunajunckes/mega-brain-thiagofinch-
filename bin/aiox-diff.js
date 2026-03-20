#!/usr/bin/env node

/**
 * AIOX Diff Engine CLI
 * Compare two repo.json snapshots and generate change reports
 * Story 2.2 Phase 4: CLI Integration
 */

const path = require('path');
const fs = require('fs-extra');
const { DiffAnalyzer, ImpactCalculator, DiffReporter } = require('../packages/diff-engine/src/index.js');

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  baseline: null,
  current: null,
  output: process.cwd(),
  format: 'markdown',
  verbose: false,
};

// Simple argument parser
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--baseline' || args[i] === '-b') && args[i + 1]) {
    options.baseline = args[++i];
  } else if ((args[i] === '--current' || args[i] === '-c') && args[i + 1]) {
    options.current = args[++i];
  } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    options.output = args[++i];
  } else if ((args[i] === '--format' || args[i] === '-f') && args[i + 1]) {
    options.format = args[++i];
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    options.verbose = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
aiox diff [options]

Compare two repository analysis files (repo.json) and generate change reports.

OPTIONS:
  --baseline, -b <path>    Baseline repo.json file (required)
  --current, -c <path>     Current repo.json file (required)
  --output, -o <path>      Output directory for reports (default: current directory)
  --format, -f <format>    Report format: markdown, json (default: markdown)
  --verbose, -v            Show detailed progress
  --help, -h              Show this help message

EXAMPLES:
  aiox diff --baseline baseline.json --current current.json
  aiox diff -b v1.json -c v2.json --output /tmp --verbose

OUTPUTS:
  - diff.json              Structured diff report
  - DIFF-REPORT.md        Human-readable change summary
  - impact.json           Impact assessment scores
    `);
    process.exit(0);
  } else if (i < 2) {
    // Positional arguments
    if (!options.baseline) {
      options.baseline = args[i];
    } else if (!options.current) {
      options.current = args[i];
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Validate inputs
    if (!options.baseline || !options.current) {
      console.error('❌ Error: Both --baseline and --current files are required\n');
      console.error('Usage: aiox diff --baseline <file> --current <file> [options]');
      process.exit(1);
    }

    // Read files
    if (options.verbose) {
      console.log('📖 Reading baseline:', options.baseline);
    }
    const baseline = await fs.readJson(options.baseline);

    if (options.verbose) {
      console.log('📖 Reading current:', options.current);
    }
    const current = await fs.readJson(options.current);

    // Phase 1: Analyze
    if (options.verbose) {
      console.log('📊 Analyzing differences...');
    }
    const analyzer = new DiffAnalyzer({ verbose: options.verbose });
    const diff = await analyzer.generateDiff(baseline, current);

    // Phase 2: Calculate impact
    if (options.verbose) {
      console.log('⚖️  Calculating impact...');
    }
    const calculator = new ImpactCalculator({ verbose: options.verbose });
    const impact = calculator.calculateImpact(diff);

    // Phase 3: Generate reports
    if (options.verbose) {
      console.log('📝 Generating reports...');
    }
    const reporter = new DiffReporter({
      outputPath: options.output,
      verbose: options.verbose,
    });
    const reports = await reporter.generateReports(diff, impact);

    // Output summary
    console.log('\n✅ Analysis complete!\n');
    console.log('📊 Change Summary:');
    console.log(`  Baseline: ${baseline.metadata?.repository?.name || 'unknown'} (${baseline.summary?.totalFiles || 0} files)`);
    console.log(`  Current:  ${current.metadata?.repository?.name || 'unknown'} (${current.summary?.totalFiles || 0} files)`);
    console.log('\n🎯 Impact Assessment:');
    console.log(`  Overall Score:  ${impact.overallScore}/10`);
    console.log(`  Severity:       ${impact.severity.toUpperCase()}`);
    console.log(`  Breaking:       ${impact.breaking ? 'YES ⚠️' : 'NO ✅'}`);

    if (diff.changes.languages?.added?.length > 0) {
      console.log(`\n🌐 Languages Added: ${diff.changes.languages.added.map((l) => l.language).join(', ')}`);
    }
    if (diff.changes.languages?.removed?.length > 0) {
      console.log(`🌐 Languages Removed: ${diff.changes.languages.removed.map((l) => l.language).join(', ')}`);
    }

    if (diff.changes.dependencies?.production?.added?.length > 0) {
      console.log(`📦 Dependencies Added: ${diff.changes.dependencies.production.added.length}`);
    }

    if (diff.changes.architecture?.changed) {
      console.log(`🏗️  Architecture: ${diff.changes.architecture.before.name} → ${diff.changes.architecture.after.name}`);
    }

    console.log('\n📄 Reports Generated:');
    console.log(`  - ${path.relative(process.cwd(), reports.json)}`);
    console.log(`  - ${path.relative(process.cwd(), reports.markdown)}`);
    console.log(`  - ${path.relative(process.cwd(), reports.impact)}`);

    if (impact.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      impact.recommendations.slice(0, 3).forEach((rec, idx) => {
        const icon = rec.priority === 'critical' ? '🔴' :
          rec.priority === 'high' ? '🟠' : '🟡';
        console.log(`  ${idx + 1}. ${icon} [${rec.category}] ${rec.message}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
