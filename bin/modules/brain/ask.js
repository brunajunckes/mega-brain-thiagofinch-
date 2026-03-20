const { request } = require('./http-client');
const ora = require('ora');
const chalk = require('chalk');

async function ask(question, options) {
  const { clone, session, history, model, rag } = options;

  if (!clone) {
    console.error(chalk.red('❌ Error: --clone <slug> is required'));
    console.error('Usage: aiox brain ask --clone <slug> <question>');
    process.exit(1);
  }

  try {
    const spinner = ora().start();

    if (history) {
      // Show conversation history
      spinner.start('Loading conversation history...');
      const sessionId = session ? `&session_id=${session}` : '';
      const { data: response } = await request(
        'GET',
        `/brain/ask/${clone}/history?last_n=10${sessionId}`
      );

      spinner.stop();

      const data = response;
      console.log(chalk.blue(`\n📖 Conversation History for ${data.slug}`));
      console.log(chalk.gray(`Session: ${data.session_id}`));
      console.log(chalk.gray(`Messages: ${data.count}\n`));

      data.messages.forEach((msg, idx) => {
        const role = msg.role === 'user' ? '👤 You' : '🤖 Clone';
        const color = msg.role === 'user' ? chalk.cyan : chalk.green;
        console.log(color(`${role}:`));
        console.log(`  ${msg.content}`);
        console.log(chalk.gray(`  ${new Date(msg.timestamp).toLocaleTimeString()}`));
        if (idx < data.messages.length - 1) console.log();
      });

      process.exit(0);
    }

    // Ask clone
    spinner.text = 'Querying clone...';

    const { data: response } = await request('POST', '/brain/ask', {
      slug: clone,
      question,
      session_id: session,
      use_rag: rag,
      model,
    });

    spinner.stop();

    const data = response;

    // Display response
    console.log(chalk.blue(`\n🧠 ${chalk.bold(data.slug)}`));
    console.log(chalk.gray(`Session: ${data.session_id}`));
    console.log(chalk.gray(`Model: ${data.model}`));

    if (data.cache_hit) {
      console.log(chalk.yellow('⚡ Cached'));
    }

    console.log();
    console.log(data.response);
    console.log();

    // Metadata
    if (data.chunks_used > 0) {
      console.log(
        chalk.gray(
          `📊 Context: ${data.chunks_used} chunks | Tokens: ${data.input_tokens}→${data.output_tokens}`
        )
      );
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

module.exports = { ask };
