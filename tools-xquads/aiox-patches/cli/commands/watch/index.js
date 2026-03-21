/**
 * Watch Command Module
 *
 * CLI for the Handoff-Triggered Orchestration system.
 *
 *   aiox watch                         — Foreground watcher (Ctrl+C to stop)
 *   aiox watch --project <name>        — Specify project
 *   aiox watch --concurrency <n>       — Override maxConcurrency
 *   aiox watch --dry-run               — Log actions without spawning
 *   aiox watch --daemon                — Start as background daemon
 *   aiox watch --stop                  — Stop daemon
 *   aiox watch --status                — Show queue/agent status
 *
 * @module cli/commands/watch
 * @story 9.3 — Handoff-Triggered Orchestration
 * @version 1.0.0
 */

'use strict';

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ORCHESTRATOR_PATH = path.resolve(__dirname, '..', '..', '..', 'core', 'orchestration', 'handoff-orchestrator');
const HUB_MANAGER_PATH = path.resolve(__dirname, '..', '..', '..', 'core', 'global-hub', 'hub-manager');
const CONSUMER_PATH = path.resolve(__dirname, '..', '..', '..', 'core', 'handoffs', 'handoff-consumer');

const PID_FILE = path.join(os.homedir(), '.aiox', 'watch.pid');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveProjectName(optProject) {
  if (optProject) return optProject;
  const hub = require(HUB_MANAGER_PATH);
  return hub.loadLocalConfig(process.cwd())?.name || null;
}

function writePid(pid) {
  const dir = path.dirname(PID_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PID_FILE, String(pid), 'utf8');
}

function readPid() {
  if (!fs.existsSync(PID_FILE)) return null;
  try {
    return parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
  } catch {
    return null;
  }
}

function clearPid() {
  try { fs.unlinkSync(PID_FILE); } catch { /* ignore */ }
}

function isDaemonRunning() {
  const pid = readPid();
  if (!pid) return false;
  try {
    process.kill(pid, 0); // check if process exists
    return true;
  } catch {
    clearPid();
    return false;
  }
}

// ---------------------------------------------------------------------------
// aiox watch --status (AC8)
// ---------------------------------------------------------------------------

function statusAction(options) {
  const projectName = resolveProjectName(options.project);

  if (!projectName) {
    console.log('⚠️  No project detected. Pass --project <name> or run `aiox hub init`.');
    return;
  }

  const consumer = require(CONSUMER_PATH);
  const queueAll = consumer.listAll(projectName);
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  const recentDone = queueAll.done.filter((f) => f.mtime && f.mtime.getTime() > oneHourAgo);

  console.log(`\n📊 Handoff Watch Status — ${projectName}\n`);

  // Daemon status
  if (isDaemonRunning()) {
    console.log(`  🟢 Daemon: running (PID ${readPid()})`);
  } else {
    console.log(`  ⚫ Daemon: not running`);
  }

  console.log('\n  Queue:');
  console.log(`    🟡 ready:       ${queueAll.ready.length}`);
  console.log(`    🔵 in-progress: ${queueAll['in-progress'].length}`);
  console.log(`    ✅ done (1h):   ${recentDone.length}`);
  console.log(`    ❌ failed:      ${queueAll.failed.length}`);

  // Show in-progress details
  if (queueAll['in-progress'].length > 0) {
    console.log('\n  Active agents:');
    for (const item of queueAll['in-progress']) {
      try {
        const yaml = require('js-yaml');
        const parsed = yaml.load(fs.readFileSync(item.filePath, 'utf8'));
        const ageMin = Math.round((now - item.mtime) / 60000);
        console.log(`    • @${parsed.to_agent}  [${parsed.story_id}]  running ${ageMin}m`);
      } catch {
        console.log(`    • ${item.filename}`);
      }
    }
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// aiox watch --stop
// ---------------------------------------------------------------------------

function stopAction() {
  const pid = readPid();
  if (!pid) {
    console.log('⚫ No daemon running (no PID file found).');
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    clearPid();
    console.log(`✅ Daemon stopped (PID ${pid}).`);
  } catch (err) {
    if (err.code === 'ESRCH') {
      console.log(`⚠️  Process ${pid} not found — cleaning up stale PID file.`);
      clearPid();
    } else {
      console.error(`❌ Failed to stop daemon: ${err.message}`);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// aiox watch --daemon
// ---------------------------------------------------------------------------

function startDaemon(options) {
  if (isDaemonRunning()) {
    console.log(`⚠️  Daemon already running (PID ${readPid()}). Use \`aiox watch --stop\` first.`);
    process.exit(1);
  }

  const { spawn } = require('child_process');

  // Build args for the detached child (same command without --daemon)
  const args = [process.argv[1], 'watch'];
  if (options.project) args.push('--project', options.project);
  if (options.concurrency) args.push('--concurrency', String(options.concurrency));
  if (options.dryRun) args.push('--dry-run');

  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, AIOX_WATCH_DAEMON: '1' },
  });

  child.unref();
  writePid(child.pid);

  console.log(`✅ Watch daemon started (PID ${child.pid}).`);
  console.log(`   Monitoring: ~/.aiox/handoffs/${resolveProjectName(options.project) || '<project>'}/ready/`);
  console.log(`   Stop with: aiox watch --stop`);
  console.log(`   Status:    aiox watch --status\n`);
}

// ---------------------------------------------------------------------------
// Foreground watch (default)
// ---------------------------------------------------------------------------

async function watchAction(options) {
  // Route to special modes
  if (options.status) return statusAction(options);
  if (options.stop) return stopAction();
  if (options.daemon) return startDaemon(options);

  const projectName = resolveProjectName(options.project);

  if (!projectName) {
    console.error('❌ No project name. Run `aiox hub init` or pass --project <name>.');
    process.exit(1);
  }

  const HandoffOrchestrator = require(ORCHESTRATOR_PATH);

  const maxConcurrency = options.concurrency ? parseInt(options.concurrency, 10) : undefined;
  const isDaemon = process.env.AIOX_WATCH_DAEMON === '1';

  const orchestrator = new HandoffOrchestrator({
    projectName,
    projectRoot: process.cwd(),
    maxConcurrency,
    dryRun: options.dryRun === true,
  });

  // Event logging
  if (!isDaemon) {
    console.log(`\n👀 AIOX Watch — ${projectName}`);
    console.log(`   Concurrency: ${orchestrator.maxConcurrency}  |  Mode: ${options.dryRun ? 'dry-run' : 'live'}`);
    console.log(`   Monitoring: ~/.aiox/handoffs/${projectName}/ready/`);
    console.log('   Press Ctrl+C to stop.\n');
  }

  orchestrator.on('watcherStart', (ev) => {
    if (!isDaemon) console.log(`🟢 Watching [${ev.mode}]: ${ev.watchDir}`);
  });

  orchestrator.on('handoffClaimed', (ev) => {
    console.log(`📨 Handoff claimed: @${ev.from} → @${ev.to}  [${ev.id}]`);
  });

  orchestrator.on('spawnStart', (ev) => {
    console.log(`🚀 Spawning @${ev.toAgent} for task "${ev.task}"  [${ev.handoffId}]`);
  });

  orchestrator.on('spawnComplete', (ev) => {
    const tag = ev.dryRun ? ' [dry-run]' : ` (${Math.round(ev.duration / 1000)}s)`;
    console.log(`✅ @${ev.toAgent} completed${tag}  [${ev.handoffId}]`);
  });

  orchestrator.on('handoffDone', (ev) => {
    console.log(`   → moved to done/  [${ev.handoffId}]`);
  });

  orchestrator.on('handoffFailed', (ev) => {
    console.log(`❌ @${ev.toAgent} failed: ${ev.error}  [${ev.handoffId}]`);
  });

  orchestrator.on('slotFull', (ev) => {
    console.log(`⏳ Slots full (${ev.active}/${ev.max}) — ${ev.pending} queued`);
  });

  orchestrator.on('error', (ev) => {
    console.error(`⚠️  Watch error: ${ev.error?.message}  (fallback: ${ev.fallback || 'none'})`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n⏹  Stopping watch...');
    orchestrator.stop();
    clearPid();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await orchestrator.start();

  // Keep process alive
  await new Promise(() => {}); // eslint-disable-line no-new
}

// ---------------------------------------------------------------------------
// Command Builder
// ---------------------------------------------------------------------------

/**
 * Create the `aiox watch` command.
 * @returns {Command}
 */
function createWatchCommand() {
  return new Command('watch')
    .description('Watch handoff queue and auto-spawn agents (~/.aiox/handoffs/{project}/ready/)')
    .option('-p, --project <name>', 'Project name (auto-detected if omitted)')
    .option('-c, --concurrency <n>', 'Max concurrent agent spawns (overrides config)')
    .option('--dry-run', 'Log actions without actually spawning agents')
    .option('--daemon', 'Start as background daemon')
    .option('--stop', 'Stop the background daemon')
    .option('--status', 'Show current queue and agent status')
    .action(watchAction);
}

module.exports = {
  createWatchCommand,
};
