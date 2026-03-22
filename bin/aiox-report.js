#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ReportScheduler, ReportTypes, ReportExporter } = require('../.aiox-core/core/scheduled-reports');

/**
 * CLI: aiox report
 * Manage and generate scheduled reports
 *
 * @story 3.6
 * @commands add, list, delete, run, history, view
 */

const CONFIG_DIR = path.join(process.cwd(), '.aiox-reports');
const CONFIG_FILE = path.join(CONFIG_DIR, 'schedules.json');
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json');
const REPORTS_DIR = path.join(CONFIG_DIR, 'generated');

const scheduler = new ReportScheduler();

/**
 * Ensure the reports directory structure exists
 */
function ensureDirs() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Load scheduler configuration from disk
 */
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      scheduler.import(config);
    } catch (error) {
      console.error(`Error loading config: ${error.message}`);
    }
  }
}

/**
 * Save scheduler configuration to disk
 */
function saveConfig() {
  ensureDirs();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(scheduler.export(), null, 2));
}

/**
 * Load execution history
 * @returns {Array} History entries
 */
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Save a history entry and persist the generated report
 * @param {Object} schedule - Schedule that was executed
 * @param {Object} report - Generated report data
 * @param {string} format - Export format used
 * @returns {Object} History entry
 */
function saveHistoryEntry(schedule, report, format) {
  ensureDirs();

  const history = loadHistory();
  const entry = {
    id: report.id,
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    reportType: schedule.reportType,
    format,
    generatedAt: new Date().toISOString(),
    status: report.status || 'ok',
  };

  history.unshift(entry);

  // Retain last 100 entries (30 days worth at ~3/day)
  const trimmed = history.slice(0, 100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));

  // Save the full report content
  const reportFile = path.join(REPORTS_DIR, `${report.id}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  return entry;
}

/**
 * Print CLI help text
 */
function printHelp() {
  console.log(`
aiox report -- Manage scheduled reports

Usage:
  aiox report add <name> <cron> <type> [--format fmt]
  aiox report list [--format json|markdown]
  aiox report delete <schedule-id>
  aiox report run <schedule-id> [--format json|markdown|csv] [--repos file]
  aiox report history [--limit N]
  aiox report view <report-id> [--format json|markdown|csv]

Report types: portfolio, trends, insights, compliance

Options:
  --format <fmt>   Output format (json, markdown, csv). Default: json
  --repos <file>   Path to JSON file with repository data
  --limit <N>      Limit history entries. Default: 10
  --help           Show this help

Examples:
  aiox report add "Daily Health" "0 9 * * *" portfolio
  aiox report list --format markdown
  aiox report run sch_abc123 --format markdown
  aiox report history --limit 5
  aiox report view report_abc123 --format markdown
`);
}

/**
 * Parse CLI arguments
 * @returns {Array} Raw argument array
 */
function parseArgs() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  return rawArgs;
}

/**
 * Extract a flag value from args (e.g., --format json)
 * @param {Array} args - Argument array
 * @param {string} flag - Flag name (without --)
 * @param {string} defaultValue - Default if not found
 * @returns {string} Flag value
 */
function getFlag(args, flag, defaultValue) {
  const flagStr = `--${flag}`;
  const idx = args.indexOf(flagStr);
  if (idx === -1 || idx + 1 >= args.length) {
    return defaultValue;
  }
  return args[idx + 1];
}

// ─── Command Handlers ──────────────────────────────────────────────────

/**
 * Add a new report schedule
 * aiox report add <name> <cron> <type> [--format fmt]
 */
function cmdAdd(args) {
  // args[0] = 'add', then positional: name, cron, type
  const name = args[1];
  const cron = args[2];
  const type = args[3];

  if (!name || !cron || !type) {
    console.error('Error: name, cron expression, and report type are required');
    console.error('Usage: aiox report add <name> <cron> <type>');
    process.exit(1);
  }

  const format = getFlag(args, 'format', 'json');

  try {
    const schedule = scheduler.addSchedule(name, cron, type, { defaultFormat: format });
    saveConfig();
    console.log(`Schedule added: ${schedule.id}`);
    console.log(`  Name: ${schedule.name}`);
    console.log(`  Cron: ${schedule.cronExpr}`);
    console.log(`  Type: ${schedule.reportType}`);
    console.log(`  Next run: ${schedule.nextRunAt}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * List all report schedules
 * aiox report list [--format json|markdown]
 */
function cmdList(args) {
  const format = getFlag(args, 'format', 'json');
  const schedules = scheduler.listSchedules();

  if (schedules.length === 0) {
    console.log('No schedules configured.');
    return;
  }

  if (format === 'markdown') {
    console.log('# Scheduled Reports\n');
    console.log('| Name | ID | Cron | Type | Active | Next Run |');
    console.log('|---|---|---|---|---|---|');
    for (const s of schedules) {
      const nextRun = s.nextRunAt ? new Date(s.nextRunAt).toLocaleString() : 'N/A';
      console.log(`| ${s.name} | ${s.id} | \`${s.cronExpr}\` | ${s.reportType} | ${s.active} | ${nextRun} |`);
    }
  } else {
    console.log(JSON.stringify(schedules, null, 2));
  }
}

/**
 * Delete a report schedule
 * aiox report delete <schedule-id>
 */
function cmdDelete(args) {
  const id = args[1];
  if (!id) {
    console.error('Error: schedule ID is required');
    console.error('Usage: aiox report delete <schedule-id>');
    process.exit(1);
  }

  if (scheduler.deleteSchedule(id)) {
    saveConfig();
    console.log(`Schedule deleted: ${id}`);
  } else {
    console.error(`Error: Schedule not found: ${id}`);
    process.exit(1);
  }
}

/**
 * Run a report manually
 * aiox report run <schedule-id> [--format json|markdown|csv] [--repos file]
 */
function cmdRun(args) {
  const id = args[1];
  if (!id) {
    console.error('Error: schedule ID is required');
    console.error('Usage: aiox report run <schedule-id> [--format fmt] [--repos file]');
    process.exit(1);
  }

  const schedule = scheduler.getSchedule(id);
  if (!schedule) {
    console.error(`Error: Schedule not found: ${id}`);
    process.exit(1);
  }

  const format = getFlag(args, 'format', 'json');
  const reposFile = getFlag(args, 'repos', null);

  let data = [];
  if (reposFile) {
    try {
      const full = path.isAbsolute(reposFile) ? reposFile : path.resolve(process.cwd(), reposFile);
      data = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (error) {
      console.error(`Error reading repos file: ${error.message}`);
      process.exit(1);
    }
  }

  const report = generateReport(schedule.reportType, data);

  // Save to history
  saveHistoryEntry(schedule, report, format);

  // Mark executed
  scheduler.markExecuted(id, true);
  saveConfig();

  // Output formatted report
  const output = formatReport(report, format);
  console.log(output);
}

/**
 * Show execution history
 * aiox report history [--limit N]
 */
function cmdHistory(args) {
  const limit = parseInt(getFlag(args, 'limit', '10'), 10);
  const format = getFlag(args, 'format', 'json');
  const history = loadHistory();

  if (history.length === 0) {
    console.log('No report history found.');
    return;
  }

  const entries = history.slice(0, limit);

  if (format === 'markdown') {
    console.log('# Report History\n');
    console.log('| Report ID | Schedule | Type | Format | Generated | Status |');
    console.log('|---|---|---|---|---|---|');
    for (const entry of entries) {
      const date = new Date(entry.generatedAt).toLocaleString();
      console.log(`| ${entry.id} | ${entry.scheduleName} | ${entry.reportType} | ${entry.format} | ${date} | ${entry.status} |`);
    }
  } else {
    console.log(JSON.stringify(entries, null, 2));
  }
}

/**
 * View a previously generated report
 * aiox report view <report-id> [--format json|markdown|csv]
 */
function cmdView(args) {
  const reportId = args[1];
  if (!reportId) {
    console.error('Error: report ID is required');
    console.error('Usage: aiox report view <report-id> [--format fmt]');
    process.exit(1);
  }

  const reportFile = path.join(REPORTS_DIR, `${reportId}.json`);
  if (!fs.existsSync(reportFile)) {
    console.error(`Error: Report not found: ${reportId}`);
    console.error('Use "aiox report history" to list available reports.');
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  } catch (error) {
    console.error(`Error reading report: ${error.message}`);
    process.exit(1);
  }

  const format = getFlag(args, 'format', 'json');
  const output = formatReport(report, format);
  console.log(output);
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a report by type
 * @param {string} reportType - One of portfolio, trends, insights, compliance
 * @param {Array} data - Input data (repos, history, insights, etc.)
 * @returns {Object} Generated report
 */
function generateReport(reportType, data) {
  switch (reportType) {
    case 'portfolio':
      return ReportTypes.generatePortfolioReport(data);
    case 'trends':
      return ReportTypes.generateTrendsReport(data);
    case 'insights':
      return ReportTypes.generateInsightsReport(data);
    case 'compliance':
      return ReportTypes.generateComplianceReport(data, []);
    default:
      console.error(`Error: Unknown report type: ${reportType}`);
      process.exit(1);
  }
}

/**
 * Format a report for output
 * @param {Object} report - Report data
 * @param {string} format - Output format
 * @returns {string} Formatted output
 */
function formatReport(report, format) {
  switch (format) {
    case 'markdown':
      return ReportExporter.toMarkdown(report);
    case 'csv':
      return ReportExporter.toCSV(report);
    case 'json':
    default:
      return ReportExporter.toJSON(report);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  try {
    loadConfig();
    const args = parseArgs();

    switch (args[0]) {
      case 'add':
        cmdAdd(args);
        break;
      case 'list':
        cmdList(args);
        break;
      case 'delete':
        cmdDelete(args);
        break;
      case 'run':
        cmdRun(args);
        break;
      case 'history':
        cmdHistory(args);
        break;
      case 'view':
        cmdView(args);
        break;
      default:
        console.error(`Unknown command: ${args[0]}`);
        console.error('Run "aiox report --help" for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  loadConfig,
  saveConfig,
  loadHistory,
  saveHistoryEntry,
  generateReport,
  formatReport,
  printHelp,
  getFlag,
  cmdAdd,
  cmdList,
  cmdDelete,
  cmdRun,
  cmdHistory,
  cmdView,
  // Expose internals for test setup
  _getScheduler: () => scheduler,
  _getPaths: () => ({ CONFIG_DIR, CONFIG_FILE, HISTORY_FILE, REPORTS_DIR }),
};

// Run main only when executed directly
if (require.main === module) {
  main();
}
