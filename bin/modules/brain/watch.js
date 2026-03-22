#!/usr/bin/env node

const { request } = require('./http-client');

async function addWatch(options) {
  const { channel, clone } = options;

  if (!channel || !clone) {
    console.error('--channel <url> and --clone <slug> are required');
    process.exit(1);
  }

  try {
    await request('POST', '/brain/watch', {
      channel_url: channel,
      slug: clone,
    });
    console.log('Watch configured');
    console.log(`  Channel: ${channel}`);
    console.log(`  Clone: ${clone}`);
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}

async function listWatches() {
  try {
    const { data } = await request('GET', '/brain/watch');

    const watches = data.watches || [];
    if (watches.length === 0) {
      console.log('No watched channels');
      return;
    }

    console.log('Watched Channels:\n');
    for (const watch of watches) {
      const statusLabel = watch.paused === 'True' || watch.paused === true
        ? 'PAUSED' : 'ACTIVE';
      console.log(`  [${statusLabel}] ${watch.slug}`);
      console.log(`     URL: ${watch.channel_url}`);
      if (watch.last_check) {
        console.log(`     Last check: ${watch.last_check}`);
      }
      if (watch.next_check) {
        console.log(`     Next check: ${watch.next_check}`);
      }
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}

async function pauseWatch(options) {
  const { clone } = options;

  if (!clone) {
    console.error('--clone <slug> is required');
    process.exit(1);
  }

  try {
    await request('PATCH', `/brain/watch/${clone}`, {
      action: 'pause',
    });
    console.log(`Watch paused for ${clone}`);
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}

async function resumeWatch(options) {
  const { clone } = options;

  if (!clone) {
    console.error('--clone <slug> is required');
    process.exit(1);
  }

  try {
    await request('PATCH', `/brain/watch/${clone}`, {
      action: 'resume',
    });
    console.log(`Watch resumed for ${clone}`);
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}

async function showHistory(options) {
  const { clone } = options;

  if (!clone) {
    console.error('--clone <slug> is required');
    process.exit(1);
  }

  try {
    const { data } = await request('GET', `/brain/watch/${clone}/history`);

    const history = data.history || [];
    if (history.length === 0) {
      console.log(`No ingestion history for ${clone}`);
      return;
    }

    console.log(`Ingestion History for ${clone}:\n`);
    for (const entry of history) {
      console.log(`  [${entry.timestamp}] ${entry.title}`);
      console.log(`     Video: ${entry.video_id} | Chunks: ${entry.chunks_added}`);
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}

async function showLogs(options) {
  const { clone } = options;

  if (!clone) {
    console.error('--clone <slug> is required');
    process.exit(1);
  }

  try {
    const { data } = await request('GET', `/brain/watch/${clone}/logs`);

    const logs = data.logs || [];
    if (logs.length === 0) {
      console.log(`No watch logs for ${clone}`);
      return;
    }

    console.log(`Watch Logs for ${clone}:\n`);
    for (const log of logs) {
      const statusIcon = log.status === 'success' ? 'OK' : 'ERR';
      console.log(`  [${log.timestamp}] ${statusIcon} ${log.event_type}`);
      if (log.error) {
        console.log(`     Error: ${log.error}`);
      }
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}

async function watch(_args, options) {
  if (options.list) {
    await listWatches();
  } else if (options.pause) {
    await pauseWatch(options);
  } else if (options.resume) {
    await resumeWatch(options);
  } else if (options.history) {
    await showHistory(options);
  } else if (options.logs) {
    await showLogs(options);
  } else if (options.channel) {
    await addWatch(options);
  } else {
    console.error('Use --channel <url> --clone <slug>, --list, --pause, --resume, --history, or --logs');
    process.exit(1);
  }
}

module.exports = { watch, addWatch, listWatches, pauseWatch, resumeWatch, showHistory, showLogs };
