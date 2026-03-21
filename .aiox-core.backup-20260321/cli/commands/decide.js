'use strict';

const fs = require('fs');
const path = require('path');
const DecisionAnalyzer = require('../../../packages/decision-engine/src/decision-analyzer');
const RecommendationGenerator = require('../../../packages/decision-engine/src/recommendation-generator');
const DecisionFormatter = require('../../../packages/decision-engine/src/decision-formatter');

/**
 * Handle decide CLI command
 * @async
 * @param {Object} args Parsed command arguments
 */
async function handleDecideCommand(args) {
  try {
    const repoPath = args.repo || args['repo-path'];
    const diffPath = args.diff;
    const outputPath = args.output || process.cwd();
    const format = args.format || 'markdown';
    const verbose = args.verbose || false;

    // Validate repo path
    if (!repoPath) {
      console.error('❌ Repository file required: aiox decide <repo.json>');
      process.exit(1);
    }

    if (!fs.existsSync(repoPath)) {
      console.error(`❌ Repository file not found: ${repoPath}`);
      process.exit(1);
    }

    if (verbose) console.log('📊 Generating evolution decisions...\n');

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
    const analyzer = new DecisionAnalyzer({ verbose });
    const analysis = await analyzer.analyzeDecision(repoData, diffData);

    // Generate recommendations
    if (verbose) console.log('  ├─ Generating recommendations...');
    const generator = new RecommendationGenerator({ verbose });
    const recommendations = await generator.generateRecommendations(analysis);

    // Format reports
    if (verbose) console.log('  └─ Formatting reports...\n');
    const formatter = new DecisionFormatter({ verbose });

    // Output based on format
    if (format === 'json') {
      const jsonReport = formatter.formatJSON(analysis, recommendations);
      console.log(JSON.stringify(jsonReport, null, 2));
    } else if (format === 'executive') {
      const executiveReport = formatter.formatExecutive(analysis, recommendations);
      console.log(executiveReport);
    } else {
      // Markdown format (default)
      const markdownReport = formatter.formatMarkdown(analysis, recommendations);

      // Display summary to console
      console.log('✅ Decision analysis complete!\n');
      console.log('📊 Repository Health:');
      console.log(`  - Overall Score:    ${analysis.healthScore}/10`);
      console.log(`  - Debt Level:       ${analysis.debtLevel}`);
      console.log(`  - Opportunities:    ${analysis.opportunities?.length || 0}`);

      if (recommendations.length > 0) {
        console.log('\n💡 Top Recommendations:');
        recommendations.slice(0, 3).forEach((rec, idx) => {
          console.log(`  ${idx + 1}. ${rec.title} (${rec.impact})`);
        });
      }

      // Write files
      if (outputPath) {
        const timestamp = new Date().toISOString().split('T')[0];
        const mdFile = path.join(outputPath, `DECISION-REPORT-${timestamp}.md`);
        const jsonFile = path.join(outputPath, `decision-${timestamp}.json`);

        fs.writeFileSync(mdFile, markdownReport);
        const jsonReport = formatter.formatJSON(analysis, recommendations);
        fs.writeFileSync(jsonFile, JSON.stringify(jsonReport, null, 2));

        console.log('\n📄 Generated reports:');
        console.log(`  - Markdown: ${mdFile}`);
        console.log(`  - JSON:     ${jsonFile}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Decision analysis failed: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { handleDecideCommand };
