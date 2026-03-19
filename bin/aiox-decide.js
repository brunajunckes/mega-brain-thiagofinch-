#!/usr/bin/env node
'use strict';

const { handleDecideCommand } = require('../.aiox-core/cli/commands/decide');

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
aiox decide — Generate intelligent evolution recommendations

Usage:
  aiox decide --repo=<path> [options]

Arguments:
  --repo=<path>         Path to repo.json (required)

Options:
  --diff=<path>         Path to diff.json (optional)
  --output=<path>       Output directory (default: current)
  --format=<format>     Output format: json or markdown (default: markdown)
  --verbose             Show detailed output
  --help                Show this help
`);
}

const args = parseArgs();
if (args.help) {
  showHelp();
  process.exit(0);
}

handleDecideCommand(args);
