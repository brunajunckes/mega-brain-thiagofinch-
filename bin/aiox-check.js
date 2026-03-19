#!/usr/bin/env node
'use strict';

const { handleCheckCommand } = require('../.aiox-core/cli/commands/check');

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

const args = parseArgs();
if (args.help) {
  console.log(`
aiox check — Validate repository compliance

Usage:
  aiox check --repo=<path> [options]

Options:
  --format=<format>  json or text (default: text)
  --verbose          Detailed output
  --help             Show this help
`);
  process.exit(0);
}

handleCheckCommand(args);
