#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ActionExecutor } = require('../.aiox-core/core/automation-engine');

/**
 * CLI: aiox automate
 * Executes automated actions based on insights
 *
 * Usage:
 *   aiox automate <insights-file> [--format json|markdown] [--dry-run]
 *
 * Examples:
 *   aiox automate insights.json
 *   aiox automate insights.json --dry-run
 *   aiox automate insights.json --format markdown
 */

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
aiox automate — Execute actions based on insights

Usage:
  aiox automate <insights-file> [options]

Options:
  --format FORMAT    Output format: json (default), markdown
  --dry-run         Simulate actions without executing
  --help, -h        Show this help message

Examples:
  aiox automate insights.json
  aiox automate insights.json --dry-run
  aiox automate insights.json --format markdown

Description:
  Executes automated actions based on insights:
  - alert_team: Send alerts to team channels
  - celebrate: Log achievements and milestones
  - schedule_review: Schedule architecture reviews
  - create_task: Create improvement tasks

Available actions are mapped from insight types:
  - regression → alert_team
  - improvement → celebrate
  - outlier → schedule_review
  - recommendation → create_task
`);
    process.exit(0);
  }

  const insightsFile = args[0];
  let format = 'json';
  let dryRun = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--format' && i + 1 < args.length) {
      format = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { insightsFile, format, dryRun };
}

function loadInsights(insightsFile) {
  try {
    const fullPath = path.isAbsolute(insightsFile) ? insightsFile : path.resolve(process.cwd(), insightsFile);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(content);

    // Extract insights array
    return Array.isArray(data) ? data : data.insights || [];
  } catch (error) {
    console.error(`Error loading insights file: ${error.message}`);
    process.exit(1);
  }
}

function main() {
  try {
    const { insightsFile, format, dryRun } = parseArgs();

    // Load insights
    const insights = loadInsights(insightsFile);

    if (insights.length === 0) {
      console.error('Error: No insights found in file');
      process.exit(1);
    }

    let result;
    if (dryRun) {
      result = simulateActions(insights);
    } else {
      result = ActionExecutor.executeActions(insights);
    }

    // Output results
    if (format === 'markdown') {
      console.log(generateMarkdownReport(result, dryRun));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.status === 'ok' || result.status === 'no_actions' ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function simulateActions(insights) {
  if (!insights || insights.length === 0) {
    return { status: 'no_actions', executed: [] };
  }

  const executed = [];
  const actions = ActionExecutor.getAvailableActions();

  for (const insight of insights) {
    const action = mapInsightToAction(insight);
    if (action && actions[action.name]) {
      executed.push({
        insight: insight.title,
        action: action.name,
        status: 'simulated',
        priority: insight.priority,
        description: action.description,
      });
    }
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    executed: executed.sort((a, b) => b.priority - a.priority),
    summary: {
      total: executed.length,
      simulated: executed.filter((a) => a.status === 'simulated').length,
    },
  };
}

function mapInsightToAction(insight) {
  const actionMap = {
    regression: { name: 'alert_team', description: 'Send alert to team about regression' },
    improvement: { name: 'celebrate', description: 'Log improvement milestone' },
    outlier: { name: 'schedule_review', description: 'Schedule architecture review' },
    recommendation: { name: 'create_task', description: 'Create improvement task' },
  };

  return actionMap[insight.type] || null;
}

function generateMarkdownReport(result, dryRun) {
  const lines = [];

  lines.push('# Automation Execution Report');
  lines.push('');
  lines.push(`**Generated:** ${result.timestamp || new Date().toISOString()}`);
  if (dryRun) {
    lines.push('**Mode:** DRY RUN (simulated)');
  }
  lines.push('');

  if (result.status === 'ok') {
    lines.push('## Execution Summary');
    if (result.summary) {
      lines.push(`- **Total Actions:** ${result.summary.total || 0}`);
      lines.push(`- **Queued:** ${result.summary.queued || 0}`);
      if (result.summary.simulated !== undefined) {
        lines.push(`- **Simulated:** ${result.summary.simulated}`);
      }
    }
    lines.push('');

    if (result.executed && result.executed.length > 0) {
      lines.push('## Executed Actions');
      lines.push('');

      for (const item of result.executed) {
        lines.push(`### ${item.action}`);
        lines.push(`- **Insight:** ${item.insight}`);
        lines.push(`- **Priority:** ${item.priority}`);
        lines.push(`- **Status:** ${item.status}`);
        lines.push(`- **Description:** ${item.description}`);
        lines.push('');
      }
    }
  } else if (result.status === 'no_actions') {
    lines.push('**Status:** No actions to execute');
  } else {
    lines.push(`**Status:** ${result.status}`);
    if (result.message) {
      lines.push(`**Message:** ${result.message}`);
    }
  }

  return lines.join('\n');
}

main();
