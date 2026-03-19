#!/usr/bin/env node
'use strict';

const { handleReportCommand } = require('../.aiox-core/cli/commands/report');

function parseArgs() {
  const args = { _: [] };
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args[key] = value || true;
    } else {
      args._.push(arg);
    }
  });
  return args;
}

const args = parseArgs();
if (args.help) {
  console.log(`
aiox report — Generate health reports

Usage:
  aiox report [type] [options]

Types:
  health   - Portfolio health report (default)

Options:
  --format=<format>  json or markdown (default: markdown)
  --verbose          Detailed output
  --help             Show this help
`);
  process.exit(0);
}

handleReportCommand(args);
