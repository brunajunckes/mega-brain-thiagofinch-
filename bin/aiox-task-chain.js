#!/usr/bin/env node
'use strict';

const path = require('path');
const { TaskChainConfig } = require('../packages/task-chaining/src/task-chain-config');
const { TaskDispatcher } = require('../.aiox-core/core/task-chaining/task-dispatcher');
const { TaskAnalyzer } = require('../.aiox-core/core/task-chaining/task-analyzer');
const { execSync } = require('child_process');

/**
 * CLI: aiox task chain
 * Execute and manage task chains
 *
 * Usage:
 *   aiox task chain --auto           Run all chains automatically
 *   aiox task chain --list           List available chains
 *   aiox task chain <name>           Run a specific chain
 *   aiox task chain <name> --dry-run Preview chain without executing
 *
 * @story 1.2
 */

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  return {
    chainName: args.find((a) => !a.startsWith('--')) || null,
    auto: args.includes('--auto'),
    list: args.includes('--list'),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    configPath: getFlag(args, '--config'),
  };
}

function getFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

function showHelp() {
  console.log(`
aiox task chain -- Execute and manage task chains

Usage:
  aiox task chain --auto              Run all chains automatically
  aiox task chain --list              List available chains
  aiox task chain <name>              Run a specific chain
  aiox task chain <name> --dry-run    Preview chain without executing

Options:
  --auto          Detect and run chains based on task output analysis
  --list          List all configured chains
  --dry-run       Preview execution plan without running tasks
  --verbose, -v   Show detailed output
  --config PATH   Custom config file path
  --help, -h      Show this help message

Examples:
  aiox task chain --list
  aiox task chain build-and-test
  aiox task chain deploy-pipeline --dry-run
  aiox task chain --auto
`);
}

/**
 * List all available chains
 * @param {TaskChainConfig} config Config instance
 */
function listChains(config) {
  const chains = config.getChains();
  const names = Object.keys(chains);

  if (names.length === 0) {
    console.log('No task chains configured.');
    console.log(`Add chains to: ${config.configPath}`);
    return;
  }

  console.log('Available task chains:\n');
  for (const name of names) {
    const chain = chains[name];
    const taskCount = chain.tasks ? chain.tasks.length : 0;
    const desc = chain.description || 'No description';
    console.log(`  ${name}`);
    console.log(`    ${desc} (${taskCount} tasks)`);

    if (chain.tasks) {
      const taskNames = chain.tasks.map((t) => t.name).join(' -> ');
      console.log(`    Flow: ${taskNames}`);
    }
    console.log('');
  }
}

/**
 * Preview a chain execution (dry run)
 * @param {TaskChainConfig} config Config instance
 * @param {string} chainName Chain to preview
 */
function previewChain(config, chainName) {
  const validation = config.validateChain(chainName);
  if (!validation.valid) {
    console.error(`Chain '${chainName}' has validation errors:`);
    validation.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const orderedTasks = config.getOrderedTasks(chainName);
  const chain = config.getChain(chainName);

  console.log(`\nDry run: ${chainName}`);
  console.log(`Description: ${chain.description || 'N/A'}\n`);
  console.log('Execution order:');

  orderedTasks.forEach((task, idx) => {
    const deps = task.depends_on ? ` (after: ${task.depends_on})` : ' (no deps)';
    const timeout = task.timeout ? ` [timeout: ${task.timeout}s]` : '';
    console.log(`  ${idx + 1}. ${task.name}${deps}${timeout}`);
    if (task.task) {
      console.log(`     Command: ${task.task}`);
    }
    if (task.input_mapping) {
      console.log(`     Input mapping: ${JSON.stringify(task.input_mapping)}`);
    }
  });

  console.log('\nValidation: PASSED');
}

/**
 * Execute a specific chain
 * @param {TaskChainConfig} config Config instance
 * @param {string} chainName Chain to execute
 * @param {boolean} verbose Verbose output
 */
async function executeChain(config, chainName, verbose) {
  const validation = config.validateChain(chainName);
  if (!validation.valid) {
    console.error(`Chain '${chainName}' has validation errors:`);
    validation.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const orderedTasks = config.getOrderedTasks(chainName);
  const chain = config.getChain(chainName);
  const dispatcher = new TaskDispatcher({
    onTaskStart: ({ taskName }) => {
      console.log(`  [START] ${taskName}`);
    },
    onTaskEnd: ({ taskName, result }) => {
      const status = result.success ? 'OK' : 'FAIL';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`  [${status}]  ${taskName}${duration}`);
    },
  });

  // Register shell command executors for each task
  for (const task of orderedTasks) {
    if (task.task) {
      dispatcher.registerTask(task.name, async (_input) => {
        const cmd = task.task;
        if (verbose) {
          console.log(`     > ${cmd}`);
        }
        try {
          const output = execSync(cmd, {
            encoding: 'utf8',
            timeout: (task.timeout || 300) * 1000,
            cwd: process.cwd(),
            stdio: verbose ? 'inherit' : 'pipe',
          });
          return { stdout: output, exitCode: 0 };
        } catch (error) {
          throw new Error(error.stderr || error.message);
        }
      });
    }
  }

  console.log(`\nExecuting chain: ${chainName}`);
  console.log(`Description: ${chain.description || 'N/A'}`);
  console.log(`Tasks: ${orderedTasks.length}\n`);

  const startTime = Date.now();
  const result = await dispatcher.executeChain(orderedTasks);
  const totalDuration = Date.now() - startTime;

  console.log('');
  if (result.status === 'success') {
    console.log(`Chain '${chainName}' completed successfully (${totalDuration}ms)`);
  } else {
    console.error(`Chain '${chainName}' failed: ${result.error}`);
    console.error(`Failed at task ${result.failedAt + 1} of ${orderedTasks.length}`);
    process.exit(1);
  }
}

/**
 * Auto-detect and run chains based on recent task output
 * @param {TaskChainConfig} config Config instance
 * @param {boolean} verbose Verbose output
 */
async function autoChain(config, verbose) {
  const analyzer = new TaskAnalyzer();

  console.log('Auto-detecting task chains...\n');

  // Analyze recent task outputs (simulate build output)
  const simulatedResult = {
    name: 'build',
    status: 'success',
    output: {
      artifacts: ['dist/app.js'],
      duration: 45,
    },
  };

  const analysis = analyzer.analyzeTask(simulatedResult);

  if (analysis.suggestedChains.length === 0) {
    console.log('No chains detected from current task state.');
    return;
  }

  console.log(`Detected ${analysis.suggestedChains.length} potential chain(s):\n`);
  for (const suggestion of analysis.suggestedChains) {
    const conf = (suggestion.confidence * 100).toFixed(0);
    console.log(`  ${suggestion.name} (confidence: ${conf}%)`);
    console.log(`    Next task: ${suggestion.nextTask}`);
    console.log(`    Reason: ${suggestion.reason}\n`);
  }

  // Execute highest confidence chain if available in config
  const chainNames = config.listChains();
  const matchedChain = analysis.suggestedChains.find((s) =>
    chainNames.some((c) => c.includes(s.nextTask)),
  );

  if (matchedChain) {
    const chainToRun = chainNames.find((c) => c.includes(matchedChain.nextTask));
    console.log(`Auto-executing chain: ${chainToRun}\n`);
    await executeChain(config, chainToRun, verbose);
  } else {
    console.log('No matching configured chain found for detected patterns.');
    console.log('Configure chains in .aiox/task-chains.yaml');
  }
}

/**
 * Main entry point
 */
async function main() {
  const opts = parseArgs();
  const configPath = opts.configPath || path.join(process.cwd(), '.aiox', 'task-chains.yaml');

  const config = new TaskChainConfig({ configPath });

  try {
    if (opts.list) {
      config.load();
      listChains(config);
      return;
    }

    if (opts.auto) {
      config.load();
      await autoChain(config, opts.verbose);
      return;
    }

    if (opts.chainName) {
      config.load();

      if (opts.dryRun) {
        previewChain(config, opts.chainName);
      } else {
        await executeChain(config, opts.chainName, opts.verbose);
      }
      return;
    }

    // No args -- show help
    showHelp();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
