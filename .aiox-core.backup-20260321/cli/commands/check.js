'use strict';

const fs = require('fs');
const { ComplianceChecker } = require('../../core/compliance-checker');

async function handleCheckCommand(args) {
  try {
    const repoPath = args.repo || args['repo-path'] || process.cwd();

    if (!fs.existsSync(repoPath)) {
      console.error(`❌ Repository file not found: ${repoPath}`);
      process.exit(1);
    }

    const repoData = JSON.parse(fs.readFileSync(repoPath, 'utf8'));
    const checker = new ComplianceChecker();
    const result = checker.check(repoData);

    if (args.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n✅ Compliance Check for ${result.repository}\n`);
      console.log(`Score: ${result.summary.score}% (${result.summary.passed}/${result.summary.total} passed)\n`);

      for (const [ruleId, check] of Object.entries(result.checks)) {
        const icon = check.passed ? '✅' : '❌';
        console.log(`${icon} ${check.name}`);
        if (!check.passed) {
          console.log(`   └─ ${check.message}`);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Check failed: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { handleCheckCommand };
