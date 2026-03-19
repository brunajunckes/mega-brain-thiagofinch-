#!/usr/bin/env node

/**
 * AIOX Repository Analyzer CLI
 * Standalone command for repository analysis (Story 2.1)
 */

const path = require('path');
const { handleAnalyzeCommand } = require('../.aiox-core/cli/commands/analyze.js');

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {};

// Simple flag parser
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--repo-path' && args[i + 1]) {
    options['repo-path'] = args[++i];
  } else if (args[i] === '--output' && args[i + 1]) {
    options.output = args[++i];
  } else if (args[i] === '--format' && args[i + 1]) {
    options.format = args[++i];
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    options.verbose = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
aiox analyze [options]

Analyzes a repository and generates comprehensive reports

OPTIONS:
  --repo-path <path>    Repository path (default: current directory)
  --output <path>       Output directory for reports (default: repo-path)
  --format <format>     Output format: json, markdown, md (default: markdown)
  --verbose, -v         Show detailed progress
  --help, -h            Show this help message

EXAMPLES:
  aiox analyze                              # Analyze current repository
  aiox analyze --repo-path=/srv/myproject   # Analyze specific repository
  aiox analyze --output=/tmp --format=json  # Output as JSON to /tmp
  aiox analyze --verbose                    # Show detailed progress
`);
    process.exit(0);
  }
}

// Run the analyze command
handleAnalyzeCommand(options).catch((error) => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
});
