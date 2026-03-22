#!/usr/bin/env node

/**
 * Watch Daemon Manager — CLI for controlling the brain watcher daemon
 *
 * Commands:
 *   aiox brain watch-daemon start   — Start the daemon process
 *   aiox brain watch-daemon stop    — Stop the daemon process
 *   aiox brain watch-daemon status  — Show daemon status
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PID_FILE = path.join(process.cwd(), '.aiox', 'brain-watcher.pid');

function ensurePidDir() {
  const dir = path.dirname(PID_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readPid() {
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
      return isNaN(pid) ? null : pid;
    }
  } catch (_err) {
    // PID file unreadable
  }
  return null;
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (_err) {
    return false;
  }
}

function startDaemon() {
  const existingPid = readPid();
  if (existingPid && isProcessRunning(existingPid)) {
    console.log(`Daemon already running (PID: ${existingPid})`);
    return;
  }

  const daemonScript = path.resolve(__dirname, '../../../aiox-engine/brain/watch/daemon.py');

  if (!fs.existsSync(daemonScript)) {
    console.error(`Daemon script not found: ${daemonScript}`);
    process.exit(1);
  }

  const child = spawn('python3', [daemonScript], {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();

  ensurePidDir();
  fs.writeFileSync(PID_FILE, String(child.pid));

  console.log(`Daemon started (PID: ${child.pid})`);
}

function stopDaemon() {
  const pid = readPid();

  if (!pid) {
    console.log('No daemon PID found');
    return;
  }

  if (!isProcessRunning(pid)) {
    console.log(`Daemon not running (stale PID: ${pid})`);
    try {
      fs.unlinkSync(PID_FILE);
    } catch (_err) {
      // Ignore cleanup error
    }
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Daemon stopped (PID: ${pid})`);
  } catch (error) {
    console.error(`Failed to stop daemon: ${error.message}`);
    process.exit(1);
  }

  try {
    fs.unlinkSync(PID_FILE);
  } catch (_err) {
    // Ignore cleanup error
  }
}

function daemonStatus() {
  const pid = readPid();

  if (!pid) {
    console.log('Daemon: not running (no PID file)');
    return;
  }

  if (isProcessRunning(pid)) {
    console.log(`Daemon: running (PID: ${pid})`);
  } else {
    console.log(`Daemon: not running (stale PID: ${pid})`);
  }
}

function watchDaemon(action) {
  const command = action || 'status';

  switch (command) {
    case 'start':
      startDaemon();
      break;
    case 'stop':
      stopDaemon();
      break;
    case 'status':
      daemonStatus();
      break;
    default:
      console.error(`Unknown command: ${command}. Use start, stop, or status.`);
      process.exit(1);
  }
}

module.exports = { watchDaemon, startDaemon, stopDaemon, daemonStatus };
