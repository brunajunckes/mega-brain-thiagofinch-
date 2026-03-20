const { request } = require('./http-client');
const ora = require('ora');
const chalk = require('chalk');

async function squad(options) {
  const { ask, list, json, synthesize, debate } = options;

  try {
    if (list) {
      const spinner = ora('Loading clones...').start();
      const { data: response } = await request('GET', '/brain/squad/clones');
      spinner.stop();

      console.log(chalk.blue(`\n🤖 Available Clones (${response.count})\n`));
      response.clones.forEach((clone) => {
        console.log(`  • ${clone}`);
      });
      process.exit(0);
    }

    if (!ask) {
      console.error(chalk.red('Error: --ask is required'));
      process.exit(1);
    }

    const spinner = ora('Querying squad...').start();

    const { data: response } = await request('POST', '/brain/squad/ask', {
      question: ask,
      use_rag: true,
      synthesize: synthesize || false,
      debate_rounds: debate ? parseInt(debate) : null,
    });

    spinner.stop();

    if (json) {
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    }

    // Display all responses
    console.log(chalk.blue(`\n📋 Squad Responses\n`));
    console.log(chalk.gray(`Question: ${response.question}\n`));

    for (const [slug, resp] of Object.entries(response.all_responses)) {
      if (resp.error) {
        console.log(chalk.red(`❌ ${slug}: ${resp.error}`));
      } else {
        console.log(chalk.green(`✓ ${slug}:`));
        console.log(`  ${resp.response.substring(0, 200)}...`);
      }
      console.log();
    }

    // Display synthesis if requested
    if (response.synthesis) {
      console.log(chalk.yellow(`\n🔄 Synthesis\n`));
      console.log(response.synthesis);
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

module.exports = { squad };
