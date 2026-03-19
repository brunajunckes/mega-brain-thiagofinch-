#!/usr/bin/env node
'use strict';

const { handleDashboardCommand } = require('../.aiox-core/cli/commands/dashboard');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args[key] = value || true;
    }
  });
  return args;
}

function showHelp() {
  console.log(`
aiox dashboard — View evolution trends and metrics

Usage:
  aiox dashboard [options]

Options:
  --repo=<name>         Repository name (default: all)
  --days=<number>       Days to display (default: 30)
  --verbose             Detailed output
  --help                Show this help
`);
}

const args = parseArgs();
if (args.help) {
  showHelp();
  process.exit(0);
}

handleDashboardCommand(args);
