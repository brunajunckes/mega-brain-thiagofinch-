'use strict';

/**
 * Report CLI Command — Generates health reports for repository portfolios
 *
 * Usage:
 *   aiox report health                    # Full executive summary
 *   aiox report health --format json      # JSON output
 *   aiox report health --filter-health 7  # Only repos with health >= 7
 *   aiox report health --filter-debt high # Only repos with debt level = high
 *   aiox report health --verbose          # Verbose output
 *
 * @module cli/commands/report
 * @version 2.0.0
 * @story 3.1
 */

const VALID_DEBT_LEVELS = ['critical', 'high', 'moderate', 'low', 'minimal'];

/**
 * Parse filter arguments from CLI args
 * @param {Object} args CLI arguments
 * @returns {Object} Parsed filter criteria
 */
function parseFilters(args) {
  const filters = {};

  const healthFilter = args['filter-health'];
  if (healthFilter !== undefined && healthFilter !== null) {
    const value = parseFloat(healthFilter);
    if (!isNaN(value)) {
      filters.minHealth = value;
    }
  }

  const debtFilter = args['filter-debt'];
  if (debtFilter !== undefined && debtFilter !== null) {
    if (VALID_DEBT_LEVELS.includes(debtFilter)) {
      filters.debtLevel = debtFilter;
    }
  }

  return filters;
}

/**
 * Apply filters to repository list
 * @param {Array} repositories Repository metrics
 * @param {Object} filters Filter criteria
 * @returns {Array} Filtered repositories
 */
function applyFilters(repositories, filters) {
  let filtered = repositories;

  if (filters.minHealth !== undefined) {
    filtered = filtered.filter((r) => r.healthScore >= filters.minHealth);
  }

  if (filters.debtLevel !== undefined) {
    filtered = filtered.filter((r) => r.debtLevel === filters.debtLevel);
  }

  return filtered;
}

/**
 * Handle report CLI command
 * @param {Object} args Parsed CLI arguments
 */
async function handleReportCommand(args) {
  try {
    const type = args.type || args._?.[0] || 'health';
    const verbose = args.verbose || false;
    const format = args.format || 'markdown';
    const filters = parseFilters(args);
    const hasFilters = Object.keys(filters).length > 0;

    if (verbose) {
      console.log(`Generating ${type} report...`);
      if (hasFilters) {
        console.log(`Filters: ${JSON.stringify(filters)}`);
      }
    }

    if (type === 'health') {
      const { PortfolioManager, RiskAssessment, ReportGenerator } = require('../../core/health-reporter');
      const manager = new PortfolioManager();
      const portfolio = await manager.getPortfolioMetrics();

      if (portfolio.status === 'no_data') {
        console.log('No repository data available. Run "aiox analyze" first.');
        process.exit(0);
      }

      // Apply filters
      const filteredRepos = hasFilters
        ? applyFilters(portfolio.repositories, filters)
        : portfolio.repositories;

      const filteredPortfolio = hasFilters
        ? { ...portfolio, repositories: filteredRepos }
        : portfolio;

      const risks = RiskAssessment.assess(filteredRepos);
      const reports = ReportGenerator.generate(filteredPortfolio, risks);

      if (format === 'json') {
        const jsonOutput = reports.json;
        if (hasFilters) {
          jsonOutput.appliedFilters = filters;
          jsonOutput.filteredCount = filteredRepos.length;
          jsonOutput.totalCount = portfolio.repositories.length;
        }
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        console.log(reports.markdown);

        if (hasFilters) {
          console.log(`\nFiltered: ${filteredRepos.length} of ${portfolio.repositories.length} repositories`);
        }

        if (risks.summary && risks.summary.critical > 0) {
          console.log(`\n${risks.summary.critical} critical repositories require attention!`);
        }

        if (risks.summary && risks.summary.high > 0) {
          console.log(`${risks.summary.high} high-risk repositories need review.`);
        }

        console.log(`\nReport generated at ${portfolio.timestamp}`);
      }
    } else {
      console.error(`Unknown report type: ${type}`);
      console.log('Available types: health');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Report generation failed: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

module.exports = { handleReportCommand, parseFilters, applyFilters };
