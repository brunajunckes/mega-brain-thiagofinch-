#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { InsightGenerator } = require('../.aiox-core/core/analytics-engine');

/**
 * CLI: aiox insights
 * Generates insights from aggregated portfolio data
 *
 * Usage:
 *   aiox insights <data-file> [--format json|markdown]
 *
 * Examples:
 *   aiox insights portfolio.json
 *   aiox insights portfolio.json --format markdown
 */

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
aiox insights — Generate insights from portfolio data

Usage:
  aiox insights <data-file> [options]

Options:
  --format FORMAT    Output format: json (default), markdown
  --help, -h        Show this help message

Examples:
  aiox insights portfolio.json
  aiox insights portfolio.json --format markdown

Description:
  Analyzes aggregated portfolio data to generate insights about:
  - Improvements: Repositories improving in health/coverage
  - Regressions: Repositories declining in metrics
  - Outliers: Repositories with unusual patterns
  - Recommendations: Actionable next steps
`);
    process.exit(0);
  }

  const dataFile = args[0];
  let format = 'json';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--format' && i + 1 < args.length) {
      format = args[i + 1];
      i++;
    }
  }

  return { dataFile, format };
}

function loadData(dataFile) {
  try {
    const fullPath = path.isAbsolute(dataFile) ? dataFile : path.resolve(process.cwd(), dataFile);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading data file: ${error.message}`);
    process.exit(1);
  }
}

function main() {
  try {
    const { dataFile, format } = parseArgs();

    // Load portfolio data
    const portfolioData = loadData(dataFile);

    // Extract repos array
    const repos = Array.isArray(portfolioData) ? portfolioData : portfolioData.repos || [];

    if (repos.length === 0) {
      console.error('Error: No repositories found in data file');
      process.exit(1);
    }

    // Generate insights
    const result = InsightGenerator.generate(repos);

    // Output results
    if (format === 'markdown') {
      console.log(generateMarkdownReport(result));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.status === 'ok' ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function generateMarkdownReport(result) {
  const lines = [];

  lines.push('# Portfolio Insights Report');
  lines.push('');
  lines.push(`**Generated:** ${result.timestamp || new Date().toISOString()}`);
  lines.push('');

  if (result.status === 'ok') {
    lines.push('## Summary');
    if (result.summary) {
      lines.push(`- **Total Insights:** ${result.summary.total || 0}`);
      lines.push(`- **Improvements:** ${result.summary.improvements || 0}`);
      lines.push(`- **Regressions:** ${result.summary.regressions || 0}`);
      lines.push(`- **Outliers:** ${result.summary.outliers || 0}`);
      lines.push(`- **Recommendations:** ${result.summary.recommendations || 0}`);
    }
    lines.push('');

    if (result.insights && result.insights.length > 0) {
      lines.push('## Insights');
      lines.push('');

      // Group by type
      const byType = {};
      for (const insight of result.insights) {
        if (!byType[insight.type]) {
          byType[insight.type] = [];
        }
        byType[insight.type].push(insight);
      }

      for (const [type, items] of Object.entries(byType)) {
        lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}`);
        lines.push('');
        for (const item of items) {
          lines.push(`#### ${item.title}`);
          lines.push(`- **Repository:** ${item.repository}`);
          lines.push(`- **Priority:** ${item.priority}`);
          lines.push(`- **Description:** ${item.description}`);
          if (item.metrics) {
            lines.push(`- **Metrics:**`);
            for (const [key, value] of Object.entries(item.metrics)) {
              lines.push(`  - ${key}: ${value}`);
            }
          }
          lines.push('');
        }
      }
    }
  } else {
    lines.push(`**Status:** ${result.status}`);
    if (result.message) {
      lines.push(`**Message:** ${result.message}`);
    }
  }

  return lines.join('\n');
}

main();
