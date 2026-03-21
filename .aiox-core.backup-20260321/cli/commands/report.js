'use strict';

const { PortfolioManager, RiskAssessment, ReportGenerator } = require('../../core/health-reporter');

async function handleReportCommand(args) {
  try {
    const type = args.type || args._?.[0] || 'health';
    const verbose = args.verbose || false;

    if (verbose) console.log(`📊 Generating ${type} report`);

    if (type === 'health') {
      const manager = new PortfolioManager();
      const portfolio = await manager.getPortfolioMetrics();

      if (portfolio.status === 'no_data') {
        console.log('No repository data available. Run "aiox analyze" first.');
        process.exit(0);
      }

      const risks = RiskAssessment.assess(portfolio.repositories);
      const reports = ReportGenerator.generate(portfolio, risks);

      const format = args.format || 'markdown';

      if (format === 'json') {
        console.log(JSON.stringify(reports.json, null, 2));
      } else {
        console.log(reports.markdown);

        if (risks.summary.critical > 0) {
          console.log(`\n🚨 ${risks.summary.critical} critical repositories require attention!`);
        }

        if (risks.summary.high > 0) {
          console.log(`⚠️ ${risks.summary.high} high-risk repositories need review.`);
        }

        console.log(`\n✅ Report generated at ${portfolio.timestamp}`);
      }
    } else {
      console.error(`Unknown report type: ${type}`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Report generation failed: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { handleReportCommand };
