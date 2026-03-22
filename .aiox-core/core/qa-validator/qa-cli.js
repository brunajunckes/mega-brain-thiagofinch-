'use strict';

const path = require('path');
const fs = require('fs');
const { QAValidator } = require('./qa-validator');
const { QARulesEngine } = require('./qa-rules-engine');
const { QAReportGenerator } = require('./qa-report-generator');

/**
 * QA CLI Handler -- Implements `aiox qa validate` command
 *
 * Integrates QAValidator, QARulesEngine, and QAReportGenerator
 * into a CLI-friendly interface.
 *
 * @class QACli
 * @version 1.0.0
 * @story 1.3
 */
class QACli {
  /**
   * @param {Object} [options]
   * @param {string} [options.projectRoot] - Project root directory
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.rulesEngine = new QARulesEngine({ projectRoot: this.projectRoot });
    this.validator = new QAValidator({ rules: this.rulesEngine.toConfig() });
    this.reportGenerator = new QAReportGenerator();
  }

  /**
   * Execute QA validation from CLI arguments
   * @param {Array<string>} args - CLI arguments after 'qa validate'
   * @returns {Promise<Object>} Result with exit code and output
   */
  async execute(args) {
    const parsed = this._parseArgs(args);

    if (parsed.help) {
      return { exitCode: 0, output: this._showHelp() };
    }

    const targetPath = parsed.target
      ? path.resolve(this.projectRoot, parsed.target)
      : this.projectRoot;

    // Validate target exists
    if (!fs.existsSync(targetPath)) {
      return {
        exitCode: 1,
        output: `Error: Path not found: ${targetPath}`,
      };
    }

    try {
      const result = await this.validator.validatePath(targetPath);

      if (result.status === 'error') {
        return {
          exitCode: 1,
          output: `Validation error: ${result.error}`,
        };
      }

      const report = this.reportGenerator.generateReport(result, {
        format: parsed.format,
        verbose: parsed.verbose,
      });

      // Save report if output path specified
      if (parsed.output) {
        const outputPath = path.resolve(this.projectRoot, parsed.output);
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, report, 'utf-8');
      }

      // Determine exit code based on verdict
      const exitCode = this._getExitCode(result.verdict);

      // For CLI, show summary line plus optional full report
      let output = '';

      if (!parsed.output || parsed.verbose) {
        output = report;
      } else {
        output = this.reportGenerator.generateSummaryLine(result);

        if (parsed.output) {
          output += `\nReport saved to: ${parsed.output}`;
        }
      }

      return { exitCode, output, result };
    } catch (error) {
      return {
        exitCode: 2,
        output: `Error during validation: ${error.message}`,
      };
    }
  }

  /**
   * Parse CLI arguments
   * @private
   * @param {Array<string>} args - Raw CLI arguments
   * @returns {Object} Parsed arguments
   */
  _parseArgs(args) {
    const parsed = {
      target: null,
      format: 'text',
      output: null,
      verbose: false,
      help: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        parsed.help = true;
      } else if (arg === '--format' || arg === '-f') {
        parsed.format = args[++i] || 'text';
      } else if (arg === '--output' || arg === '-o') {
        parsed.output = args[++i] || null;
      } else if (arg === '--verbose' || arg === '-v') {
        parsed.verbose = true;
      } else if (arg === '--json') {
        parsed.format = 'json';
      } else if (arg === '--markdown' || arg === '--md') {
        parsed.format = 'markdown';
      } else if (!arg.startsWith('-')) {
        parsed.target = arg;
      }
    }

    return parsed;
  }

  /**
   * Get exit code from verdict
   * @private
   * @param {string} verdict - Validation verdict
   * @returns {number} Exit code
   */
  _getExitCode(verdict) {
    switch (verdict) {
      case 'APPROVED':
        return 0;
      case 'NEEDS_MINOR_WORK':
        return 0;
      case 'NEEDS_WORK':
        return 1;
      case 'BLOCKED':
        return 2;
      default:
        return 1;
    }
  }

  /**
   * Show CLI help text
   * @private
   * @returns {string} Help text
   */
  _showHelp() {
    return `
AIOX QA Validator -- Automated Code Quality Validation

USAGE:
  aiox qa validate [path] [options]

ARGUMENTS:
  path                   File or directory to validate (default: current directory)

OPTIONS:
  -f, --format <type>    Output format: text, markdown, json (default: text)
  -o, --output <file>    Save report to file
  -v, --verbose          Show detailed output
  --json                 Shorthand for --format json
  --md, --markdown       Shorthand for --format markdown
  -h, --help             Show this help

EXAMPLES:
  aiox qa validate src/
  aiox qa validate src/index.js --json
  aiox qa validate packages/ -o docs/qa/report.md --md
  aiox qa validate . --verbose

CRITERIA:
  1. Code Style          Indentation, naming, formatting
  2. Test Coverage       Test file presence
  3. Documentation       JSDoc, comments
  4. Performance         Nested loops, sync in async, N+1
  5. Security            Hardcoded secrets, eval, exec
  6. Type Safety         Type annotations, any usage
  7. Integration         Exports, imports, dependencies

CONFIGURATION:
  Rules are configurable via .aiox/qa-rules.yaml
  See docs for custom rule examples.
`.trim();
  }
}

module.exports = { QACli };
