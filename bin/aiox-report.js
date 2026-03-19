#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ReportScheduler, ReportTypes, ReportExporter } = require('../.aiox-core/core/scheduled-reports');

/**
 * CLI: aiox report
 * Manage and generate scheduled reports
 */

const CONFIG_FILE = path.join(process.cwd(), '.aiox-reports.json');
let scheduler = new ReportScheduler();

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    try {
      const config = JSON.parse(data);
      scheduler.import(config);
    } catch (error) {
      console.error(`Error loading config: ${error.message}`);
    }
  }
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(scheduler.export(), null, 2));
}

function printHelp() {
  console.log(`
aiox report — Manage scheduled reports

Usage:
  aiox report add <name> <cron> <type>
  aiox report list [--format json|markdown]
  aiox report get <schedule-id>
  aiox report delete <schedule-id>
  aiox report run <schedule-id> [--format fmt] [--repos file]
  aiox report stats

Report types: portfolio, trends, insights, compliance

Examples:
  aiox report add "Daily" "0 9 * * *" portfolio
  aiox report list --format markdown
  aiox report run sch_abc123 --format markdown
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }
  return args;
}

function add(args) {
  const [, name, cron, type] = args;
  if (!name || !cron || !type) {
    console.error('Error: name, cron, and type required');
    process.exit(1);
  }
  try {
    const schedule = scheduler.addSchedule(name, cron, type);
    saveConfig();
    console.log(`✓ Added: ${schedule.id}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function list(args) {
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'json';
  const schedules = scheduler.listSchedules();
  
  if (format === 'markdown') {
    console.log('# Scheduled Reports\n');
    for (const s of schedules) {
      console.log(`## ${s.name}`);
      console.log(`- ID: ${s.id}`);
      console.log(`- Cron: ${s.cronExpr}`);
      console.log(`- Type: ${s.reportType}`);
      console.log(`- Active: ${s.active}\n`);
    }
  } else {
    console.log(JSON.stringify(schedules, null, 2));
  }
}

function get(args) {
  const schedule = scheduler.getSchedule(args[1]);
  if (!schedule) {
    console.error('Error: Schedule not found');
    process.exit(1);
  }
  console.log(JSON.stringify(schedule, null, 2));
}

function del(args) {
  if (scheduler.deleteSchedule(args[1])) {
    saveConfig();
    console.log('✓ Deleted');
  } else {
    console.error('Error: Schedule not found');
    process.exit(1);
  }
}

function run(args) {
  const schedule = scheduler.getSchedule(args[1]);
  if (!schedule) {
    console.error('Error: Schedule not found');
    process.exit(1);
  }

  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'json';
  const reposFile = args.includes('--repos') ? args[args.indexOf('--repos') + 1] : null;

  let repos = [];
  if (reposFile) {
    try {
      const full = path.isAbsolute(reposFile) ? reposFile : path.resolve(process.cwd(), reposFile);
      repos = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  let report;
  switch (schedule.reportType) {
    case 'portfolio':
      report = ReportTypes.generatePortfolioReport(repos);
      break;
    case 'trends':
      report = ReportTypes.generateTrendsReport(repos);
      break;
    case 'insights':
      report = ReportTypes.generateInsightsReport(repos);
      break;
    case 'compliance':
      report = ReportTypes.generateComplianceReport(repos, []);
      break;
    default:
      console.error(`Error: Unknown type: ${schedule.reportType}`);
      process.exit(1);
  }

  const output = format === 'json' ? ReportExporter.toJSON(report) :
                 format === 'markdown' ? ReportExporter.toMarkdown(report) :
                 ReportExporter.toCSV(report);

  console.log(output);
  scheduler.markExecuted(args[1], true);
  saveConfig();
}

function stats() {
  console.log(JSON.stringify(scheduler.getStats(), null, 2));
}

function main() {
  try {
    loadConfig();
    const args = parseArgs();
    switch (args[0]) {
      case 'add': add(args); break;
      case 'list': list(args); break;
      case 'get': get(args); break;
      case 'delete': del(args); break;
      case 'run': run(args); break;
      case 'stats': stats(); break;
      default:
        console.error(`Unknown command: ${args[0]}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
