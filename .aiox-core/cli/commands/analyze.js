'use strict';

const path = require('path');
const { RepoScanner, DependencyAnalyzer } = require('../../core/repo-analyzer');
const { PatternDetector } = require('../../core/repo-analyzer/pattern-detector');
const { MetricsCollector } = require('../../core/repo-analyzer/metrics-collector');
const { ReportGenerator } = require('../../core/repo-analyzer/report-generator');

/**
 * Handle 'aiox analyze' command
 * Analyzes repository and generates reports
 *
 * Usage:
 *   aiox analyze [options]
 *   aiox analyze --repo-path=/srv/aiox --output=/tmp --format=json
 *
 * @param {Object} args Command arguments
 */
async function handleAnalyzeCommand(args) {
  try {
    const repoPath = args['repo-path'] || process.cwd();
    const outputPath = args.output || repoPath;
    const format = args.format || 'markdown';
    const verbose = args.verbose || false;

    if (verbose) {
      console.log(`📊 Analyzing repository: ${repoPath}`);
    }

    // Phase 1: Scan repository structure
    if (verbose) console.log('  ├─ Scanning repository structure...');
    const scanner = new RepoScanner({ rootPath: repoPath });
    const scanResult = await scanner.scan();

    // Phase 2: Analyze dependencies
    if (verbose) console.log('  ├─ Analyzing dependencies...');
    const depsAnalyzer = new DependencyAnalyzer({ rootPath: repoPath });
    const depsResult = await depsAnalyzer.analyze();

    // Phase 3: Detect patterns
    if (verbose) console.log('  ├─ Detecting patterns...');
    const patternDetector = new PatternDetector({ rootPath: repoPath });
    const patternsResult = await patternDetector.detect();

    // Phase 4: Collect metrics
    if (verbose) console.log('  ├─ Collecting metrics...');
    const metricsCollector = new MetricsCollector({ rootPath: repoPath });
    const metricsResult = await metricsCollector.collect();

    // Combine all analysis data
    const analysisData = {
      scanner: scanResult,
      deps: depsResult,
      patterns: patternsResult.patterns,
      metrics: metricsResult.metrics,
    };

    // Phase 5: Generate reports
    if (verbose) console.log('  └─ Generating reports...');
    const reportGen = new ReportGenerator({ rootPath: repoPath, outputPath });
    const reportResult = await reportGen.generate(analysisData);

    // Output results
    if (format === 'json') {
      console.log(JSON.stringify(analysisData, null, 2));
    } else if (format === 'markdown' || format === 'md') {
      console.log(`✅ Analysis complete!\n`);
      console.log(`📄 Generated reports:`);
      console.log(`  - JSON:         ${reportResult.json}`);
      console.log(`  - Markdown:     ${reportResult.markdown}`);
      console.log(`  - Architecture: ${reportResult.architecture}`);
      console.log(`\n📊 Summary:`);
      console.log(`  - Files:        ${scanResult.summary.totalFiles}`);
      console.log(`  - Languages:    ${scanResult.summary.languages}`);
      console.log(`  - Frameworks:   ${scanResult.summary.frameworks}`);
      console.log(`  - Dependencies: ${depsResult.summary.totalDependencies}`);
      console.log(`  - Architecture: ${patternsResult.patterns.architecture.name}`);
      console.log(`  - Code Quality: ${metricsResult.summary.codeQuality}/10`);
      console.log(`  - Test Coverage: ${metricsResult.metrics.testCoverage}%`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Analysis failed: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

module.exports = { handleAnalyzeCommand };
