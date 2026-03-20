#!/usr/bin/env node

const axios = require('axios');
const { spinner, colors } = require('../../utils');

async function addWatch(options) {
  const { channel, clone } = options;

  if (!channel || !clone) {
    console.error('❌ --channel <url> and --clone <slug> are required');
    process.exit(1);
  }

  const sp = spinner(`📺 Setting up watch for ${clone}`);

  try {
    const response = await axios.post('http://localhost:8000/brain/watch', {
      channel_url: channel,
      slug: clone
    });
    sp.succeed('✅ Watch configured');
    console.log(`  Channel: ${channel}`);
    console.log(`  Clone: ${clone}`);
  } catch (error) {
    sp.fail(`❌ Failed: ${error.message}`);
    process.exit(1);
  }
}

async function listWatches() {
  const sp = spinner('📋 Loading watched channels...');

  try {
    const response = await axios.get('http://localhost:8000/brain/watch');
    sp.succeed('✅ Watches loaded');

    const watches = response.data.watches || [];
    if (watches.length === 0) {
      console.log('\n📺 No watched channels');
      return;
    }

    console.log('\n📺 Watched Channels:\n');
    for (const watch of watches) {
      const status = watch.paused ? '⏸️  PAUSED' : '▶️  ACTIVE';
      console.log(`  ${status} ${watch.slug}`);
      console.log(`     URL: ${watch.channel_url}`);
      if (watch.last_check) {
        console.log(`     Last check: ${watch.last_check}`);
      }
    }
  } catch (error) {
    sp.fail(`❌ Failed: ${error.message}`);
    process.exit(1);
  }
}

async function pauseWatch(options) {
  const { clone } = options;

  if (!clone) {
    console.error('❌ --clone <slug> is required');
    process.exit(1);
  }

  const sp = spinner(`⏸️  Pausing ${clone}...`);

  try {
    await axios.patch(`http://localhost:8000/brain/watch/${clone}`, {
      action: 'pause'
    });
    sp.succeed('✅ Watch paused');
  } catch (error) {
    sp.fail(`❌ Failed: ${error.message}`);
    process.exit(1);
  }
}

async function execute(args, options) {
  if (options.list) {
    await listWatches();
  } else if (options.pause) {
    await pauseWatch(options);
  } else if (options.resume) {
    // resume logic
  } else if (options.channel) {
    await addWatch(options);
  } else {
    console.error('❌ Use --channel <url> --clone <slug>, --list, or --pause');
    process.exit(1);
  }
}

module.exports = { execute };
