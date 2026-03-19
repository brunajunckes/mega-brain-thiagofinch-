'use strict';

const fs = require('fs');
const path = require('path');
const { DecisionAnalyzer, RecommendationGenerator, DecisionFormatter } = require('../../core/decision-engine');

async function handleDecideCommand(args) {
  try {
    const repoPath = args.repo || args['repo-path'] || process.cwd();
    const diffPath = args.diff;
    const outputPath = args.output || process.cwd();
    const format = args.format || 'markdown';
    const verbose = args.verbose || false;

    if (!fs.existsSync(repoPath)) {
      console.error(`❌ Repository file not found: ${repoPath}`);
      process.exit(1);
    }

    if (verbose) console.log(`📊 Generating decisions for repository`);

    // Load repo data
    if (verbose) console.log('  ├─ Loading repository analysis...');
    const repoData = JSON.parse(fs.readFileSync(repoPath, 'utf8'));

    // Load diff if provided
    let diffData = null;
    if (diffPath && fs.existsSync(diffPath)) {
      if (verbose) console.log('  ├─ Loading diff report...');
      diffData = JSON.parse(fs.readFileSync(diffPath, 'utf8'));
    }

    // Analyze
    if (verbose) console.log('  ├─ Analyzing repository state...');
    const analyzer = new DecisionAnalyzer();
    const analysis = await analyzer.analyze(repoData, diffData);

    // Generate recommendations
    if (verbose) console.log('  ├─ Generating recommendations...');
    const generator = new RecommendationGenerator();
    const recResult = await generator.generate(analysis.analysis);

    // Format reports
    if (verbose) console.log('  └─ Formatting reports...');
    const formatter = new DecisionFormatter();
    const reportResult = await formatter.format(analysis.analysis, recResult.recommendations);

    // Output
    if (format === 'json') {
      console.log(JSON.stringify(reportResult.reports.json, null, 2));
    } else {
      const scores = analysis.analysis.healthScores || {};
      console.log(`✅ Decision analysis complete!\n`);
      console.log(`📊 Repository Health:`);
      console.log(`  - Overall Score: ${scores.overall?.toFixed(1) || '0'}/10`);
      console.log(`  - Debt Level:    ${scores.debtLevel || 'unknown'}`);
      console.log(`  - Architecture:  ${scores.architecture?.toFixed(1) || '0'}/10`);
      console.log(`  - Testing:       ${scores.testing?.toFixed(1) || '0'}/10`);

      if (recResult.recommendations.length > 0) {
        console.log(`\n💡 Top Recommendations:`);
        recResult.recommendations.slice(0, 3).forEach((rec, idx) => {
          console.log(`  ${idx + 1}. ${rec.title}`);
        });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const mdFile = path.join(outputPath, `DECISION-REPORT-${timestamp}.md`);
      const jsonFile = path.join(outputPath, `decision-${timestamp}.json`);

      fs.writeFileSync(mdFile, reportResult.reports.markdown);
      fs.writeFileSync(jsonFile, JSON.stringify(reportResult.reports.json, null, 2));

      console.log(`\n📄 Generated reports:`);
      console.log(`  - Markdown: ${mdFile}`);
      console.log(`  - JSON:     ${jsonFile}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Decision analysis failed: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { handleDecideCommand };
