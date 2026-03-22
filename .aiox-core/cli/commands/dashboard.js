'use strict';

const { TimelineManager, MetricsAggregator } = require('../../core/evolution-dashboard');

/**
 * Handle `aiox dashboard` CLI command
 *
 * Subcommands:
 *   aiox dashboard                    -- Show overview for all repos
 *   aiox dashboard --repo <name>      -- Show dashboard for specific repo
 *   aiox dashboard --days <n>         -- Filter to last N days (default 30)
 *   aiox dashboard --report           -- Generate trend report
 *   aiox dashboard --export           -- Export report as JSON
 *   aiox dashboard --prune            -- Prune old snapshots
 *
 * @param {Object} args Parsed arguments
 */
async function handleDashboardCommand(args) {
  try {
    const repo = args.repo || args['repo-name'];
    const days = parseInt(args.days || '30', 10);
    const isReport = args.report || false;
    const isExport = args.export || false;
    const isPrune = args.prune || false;
    const verbose = args.verbose || false;

    const manager = new TimelineManager();

    // Handle prune subcommand
    if (isPrune) {
      const retentionDays = parseInt(args.retention || '90', 10);
      const deleted = manager.pruneOldSnapshots(retentionDays);
      console.log(`Pruned ${deleted} snapshots older than ${retentionDays} days.`);
      return;
    }

    // Get repositories
    let repos = [];
    if (repo) {
      repos = [repo];
    } else {
      repos = manager.getRepositories();
    }

    if (repos.length === 0) {
      console.log('No repositories found. Run "aiox analyze" to create snapshots.');
      return;
    }

    // Handle export
    if (isExport) {
      const aggregator = new MetricsAggregator(manager);
      const exportData = {};
      for (const repoName of repos) {
        exportData[repoName] = aggregator.exportReport(repoName);
      }
      console.log(JSON.stringify(exportData, null, 2));
      return;
    }

    // Handle trend report
    if (isReport) {
      const aggregator = new MetricsAggregator(manager);
      for (const repoName of repos) {
        const report = aggregator.generateTrendReport(repoName);
        console.log(report);
        if (repos.length > 1) {
          console.log('\n' + '-'.repeat(56) + '\n');
        }
      }
      return;
    }

    // Default: overview dashboard
    console.log('');
    console.log('='.repeat(56));
    console.log('       Repository Evolution Dashboard');
    console.log('='.repeat(56));
    console.log('');

    for (const repoName of repos) {
      const snapshots = manager.getSnapshots(repoName, { days, limit: 50 });

      if (snapshots.length === 0) {
        console.log(`${repoName}: No data`);
        continue;
      }

      const aggregated = MetricsAggregator.aggregate(snapshots);
      const summary = aggregated.summary;

      console.log(`Repository: ${repoName}`);
      console.log(`  Snapshots: ${snapshots.length} (last ${days} days)`);

      if (summary.coverage) {
        const trend = summary.coverage.trend === 'improving' ? 'UP' : summary.coverage.trend === 'declining' ? 'DOWN' : 'STABLE';
        console.log(`  Coverage: ${summary.coverage.current}% [${trend}] (avg: ${summary.coverage.avg}%)`);
      }

      if (summary.quality) {
        const trend = summary.quality.trend === 'improving' ? 'UP' : summary.quality.trend === 'declining' ? 'DOWN' : 'STABLE';
        console.log(`  Quality: ${summary.quality.current}/10 [${trend}] (avg: ${summary.quality.avg}/10)`);
      }

      if (summary.files) {
        console.log(`  Files: ${summary.files.current} (range: ${summary.files.min}-${summary.files.max})`);
      }

      if (verbose) {
        // Show chart for health scores
        const healthValues = aggregated.metrics
          .map((m) => m.codeQuality)
          .filter((v) => v > 0);
        if (healthValues.length > 1) {
          console.log('');
          console.log(MetricsAggregator.generateChart(healthValues, {
            title: '  Quality Trend:',
            height: 4,
            width: 30,
          }));
        }
      }

      console.log('');
    }
  } catch (error) {
    console.error(`Dashboard failed: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  }
}

module.exports = { handleDashboardCommand };
