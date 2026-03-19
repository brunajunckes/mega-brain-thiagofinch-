'use strict';

const { TimelineManager, MetricsAggregator } = require('../../core/evolution-dashboard');

async function handleDashboardCommand(args) {
  try {
    const repo = args.repo || args['repo-name'];
    const days = parseInt(args.days || '30', 10);
    const verbose = args.verbose || false;

    if (verbose) console.log(`📊 Loading evolution dashboard for ${repo || 'all repos'}`);

    const manager = new TimelineManager();

    // Get repositories
    let repos = [];
    if (repo) {
      repos = [repo];
    } else {
      repos = await manager.getRepositories();
    }

    if (repos.length === 0) {
      console.log('No repositories found. Run "aiox analyze" to create snapshots.');
      process.exit(0);
    }

    // Display dashboard
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║       Repository Evolution Dashboard                  ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);

    for (const repoName of repos) {
      const snapshots = await manager.getSnapshots(repoName, { days, limit: 50 });

      if (snapshots.length === 0) {
        console.log(`${repoName}: No data`);
        continue;
      }

      const aggregated = MetricsAggregator.aggregate(snapshots);
      const summary = aggregated.summary;

      console.log(`📦 ${repoName}`);
      console.log(`   Snapshots: ${snapshots.length} (last ${days} days)`);

      if (summary.coverage) {
        const trend = summary.coverage.trend === 'improving' ? '📈' : '📉';
        console.log(`   Coverage: ${summary.coverage.current}% ${trend} (avg: ${summary.coverage.avg}%)`);
      }

      if (summary.quality) {
        const trend = summary.quality.trend === 'improving' ? '📈' : '📉';
        console.log(`   Quality: ${summary.quality.current}/10 ${trend} (avg: ${summary.quality.avg}/10)`);
      }

      console.log(`\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Dashboard failed: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { handleDashboardCommand };
