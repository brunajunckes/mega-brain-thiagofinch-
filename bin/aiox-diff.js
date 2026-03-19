#!/usr/bin/env node
'use strict';

const { handleDiffCommand } = require('../.aiox-core/cli/commands/diff');

/**
 * Parse command-line arguments
 */
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

/**
 * Display help information
 */
function showHelp() {
  console.log(`
aiox diff — Compare two repository analysis snapshots

Usage:
  aiox diff --baseline=<path> --current=<path> [options]

Arguments:
  --baseline=<path>     Path to baseline repo.json (required)
  --current=<path>      Path to current repo.json (required)

Options:
  --output=<path>       Output directory for reports (default: current directory)
  --format=<format>     Output format: json or markdown (default: markdown)
  --verbose             Show detailed progress output
  --help                Show this help message

Examples:
  aiox diff --baseline=repo-v1.json --current=repo-v2.json
  aiox diff --baseline=/tmp/repo-v1.json --current=/tmp/repo-v2.json --format=json
  aiox diff --baseline=repo-v1.json --current=repo-v2.json --output=/tmp --verbose
`);
}

// Main execution
const args = parseArgs();

if (args.help) {
  showHelp();
  process.exit(0);
}

handleDiffCommand(args);
