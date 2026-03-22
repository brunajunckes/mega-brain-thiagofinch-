#!/usr/bin/env node

const { request } = require('./http-client');
const ora = require('ora');
const chalk = require('chalk');

async function askSquad(options) {
  const { ask: question, synthesize, debate, json, showConsensus, clones } = options;

  if (!question) {
    console.error(chalk.red('Error: --ask <question> is required'));
    process.exit(1);
  }

  const payload = {
    question,
    use_rag: true,
    synthesize: synthesize || false,
    debate_rounds: debate ? parseInt(debate, 10) : 0,
  };

  if (clones) {
    payload.clones = clones.split(',').map((c) => c.trim());
  }

  const spinner = ora('Querying squad...').start();

  try {
    const { data } = await request('POST', '/brain/squad/ask', payload);
    spinner.succeed('Squad responses received');

    if (json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    // Display individual responses
    const responses = data.responses || {};
    console.log(chalk.blue('\nSquad Responses:\n'));

    for (const [clone, result] of Object.entries(responses)) {
      console.log(chalk.bold(`  ${clone}:`));
      if (result && result.error) {
        console.log(chalk.red(`    Error: ${result.error}`));
      } else if (result && result.response) {
        console.log(`    ${result.response}`);
      } else {
        console.log(`    ${JSON.stringify(result)}`);
      }
      console.log();
    }

    // Display consensus
    if (data.consensus && (showConsensus || synthesize)) {
      const consensus = data.consensus;
      console.log(chalk.yellow('Consensus:'));
      console.log(`  Agreement: ${consensus.consensus_percentage}% (${consensus.agreement_level})`);
      if (consensus.common_themes && consensus.common_themes.length > 0) {
        console.log(`  Common themes: ${consensus.common_themes.join(', ')}`);
      }
      if (consensus.disagreements && consensus.disagreements.length > 0) {
        console.log('  Disagreements:');
        for (const d of consensus.disagreements) {
          console.log(`    ${d.clone}: ${d.unique_points.join(', ')}`);
        }
      }
      console.log();
    }

    // Display debate
    if (data.debate) {
      console.log(chalk.magenta('Debate:'));
      console.log(`  Debate ID: ${data.debate.debate_id}`);
      const rounds = data.debate.rounds || {};
      for (const [roundKey, roundData] of Object.entries(rounds)) {
        console.log(chalk.magenta(`\n  ${roundKey}:`));
        for (const [clone, result] of Object.entries(roundData)) {
          const resp = result && result.response ? result.response : JSON.stringify(result);
          console.log(`    ${clone}: ${resp}`);
        }
      }
      console.log();
    }

    // Display synthesis
    if (data.synthesis) {
      console.log(chalk.green('Synthesis:'));
      console.log(data.synthesis.text || data.synthesis);
      console.log();
    }

    // Display metrics
    if (data.metrics) {
      console.log(
        chalk.gray(
          `Metrics: ${data.metrics.num_clones} clones, ` +
          `${data.metrics.parallel_queries} queries, ` +
          `${data.metrics.total_tokens} tokens, ` +
          `${data.metrics.query_time}s`,
        ),
      );
    }
  } catch (error) {
    spinner.fail(`Squad error: ${error.message}`);
    process.exit(1);
  }
}

async function listSquad(options) {
  const spinner = ora('Loading available clones...').start();

  try {
    const { data } = await request('GET', '/brain/squad/clones');
    spinner.succeed('Clones loaded');

    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const clones = data.clones || [];
    console.log(chalk.blue('\nAvailable Clones:\n'));

    for (const clone of clones) {
      const status = clone.available ? chalk.green('available') : chalk.red('unavailable');
      console.log(`  ${chalk.bold(clone.name)} [${status}]`);
      if (clone.chunk_count !== undefined) {
        console.log(chalk.gray(`    Chunks: ${clone.chunk_count}`));
      }
      if (clone.source_types && clone.source_types.length > 0) {
        console.log(chalk.gray(`    Sources: ${clone.source_types.join(', ')}`));
      }
    }

    console.log(chalk.gray(`\nTotal: ${data.count} clones`));
  } catch (error) {
    spinner.fail(`Failed to list clones: ${error.message}`);
    process.exit(1);
  }
}

async function squad(options) {
  if (options.list) {
    await listSquad(options);
  } else if (options.ask) {
    await askSquad(options);
  } else {
    console.error(chalk.red('Error: Use --ask <question> or --list'));
    process.exit(1);
  }
}

module.exports = { squad };
