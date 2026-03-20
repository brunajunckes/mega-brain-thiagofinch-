const { request } = require('./http-client');
const ora = require('ora');
const chalk = require('chalk');

async function watch(options) {
  const { channel, clone, list, pause, resume, history } = options;

  try {
    if (list) {
      const spinner = ora('Loading watches...').start();
      const { data: response } = await request('GET', '/brain/watch');
      spinner.stop();

      console.log(chalk.blue(`\n👁️  Active Channel Watches\n`));
      if (response.watches.length === 0) {
        console.log('No channels being watched');
        process.exit(0);
      }

      response.watches.forEach((w) => {
        const status = w.active ? '✓' : '✗';
        console.log(`${status} ${w.slug}: ${w.channel_url}`);
        console.log(`  Last check: ${w.last_check || 'never'}`);
      });
      process.exit(0);
    }

    if (history) {
      if (!clone) {
        console.error(chalk.red('--clone required for --history'));
        process.exit(1);
      }

      const spinner = ora('Loading history...').start();
      const { data: response } = await request('GET', `/brain/watch/${clone}/history`);
      spinner.stop();

      console.log(chalk.blue(`\n📜 Watch History for ${clone}\n`));
      response.history.forEach((entry, idx) => {
        console.log(`${idx + 1}. ${entry.title} (${entry.chunks_added} chunks)`);
        console.log(`   ${new Date(entry.timestamp).toLocaleString()}`);
      });
      process.exit(0);
    }

    if (pause) {
      const spinner = ora(`Pausing ${clone}...`).start();
      await request('PATCH', `/brain/watch/${clone}`, { action: 'pause' });
      spinner.succeed(`Paused watching ${clone}`);
      process.exit(0);
    }

    if (resume) {
      const spinner = ora(`Resuming ${clone}...`).start();
      await request('PATCH', `/brain/watch/${clone}`, { action: 'resume' });
      spinner.succeed(`Resumed watching ${clone}`);
      process.exit(0);
    }

    if (!channel || !clone) {
      console.error(chalk.red('--channel and --clone required'));
      process.exit(1);
    }

    const spinner = ora('Setting up watch...').start();
    await request('POST', '/brain/watch', { channel_url: channel, slug: clone });
    spinner.succeed(`Now watching ${channel} for ${clone}`);
    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

module.exports = { watch };
