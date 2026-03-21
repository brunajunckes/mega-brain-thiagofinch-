/**
 * Handoff Watcher
 *
 * Monitors ~/.aiox/handoffs/{project}/ready/ for new handoff files.
 * Uses fs.watch() with automatic fallback to polling (fs.watch is
 * unreliable on Windows/network drives).
 *
 * Emits:
 *   'handoff'  — {filename, filePath} when a new .yaml appears in ready/
 *   'error'    — {error} on watch failure
 *   'start'    — when watching begins
 *   'stop'     — when watching stops
 *
 * @module core/handoffs/handoff-watcher
 * @story 9.3 — Handoff-Triggered Orchestration
 * @version 1.0.0
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const { getQueuePath, ensureQueueDirs } = require('./handoff-writer');

const DEFAULT_POLL_INTERVAL_MS = 2000;

class HandoffWatcher extends EventEmitter {
  /**
   * @param {Object} options
   * @param {string} options.projectName - Project to watch
   * @param {number} [options.pollInterval=2000] - Polling interval in ms (fallback)
   */
  constructor(options = {}) {
    super();
    this.projectName = options.projectName;
    this.pollInterval = options.pollInterval || DEFAULT_POLL_INTERVAL_MS;

    this._watchDir = null;
    this._watcher = null;       // fs.watch instance
    this._pollTimer = null;     // fallback polling timer
    this._knownFiles = new Set(); // tracks seen filenames to avoid duplicates
    this._running = false;
    this._usingPolling = false;
  }

  // ---------------------------------------------------------------------------
  // Start / Stop
  // ---------------------------------------------------------------------------

  /**
   * Start watching the ready/ directory.
   * Tries fs.watch() first; falls back to polling on error.
   *
   * @returns {Promise<void>}
   */
  async start() {
    if (this._running) return;

    if (!this.projectName) {
      throw new Error('HandoffWatcher requires projectName');
    }

    await ensureQueueDirs(this.projectName);
    this._watchDir = getQueuePath(this.projectName, 'ready');

    // Seed known files (don't emit for files already present)
    this._seedKnownFiles();

    this._running = true;

    // Try fs.watch() — more efficient than polling
    try {
      this._watcher = fs.watch(this._watchDir, (eventType, filename) => {
        if (eventType === 'rename' && filename && filename.endsWith('.yaml')) {
          this._checkFile(filename);
        }
      });

      this._watcher.on('error', (err) => {
        // fs.watch failed — fall back to polling
        this._stopFsWatch();
        this._startPolling();
        this.emit('error', { error: err, fallback: 'polling' });
      });
    } catch {
      // fs.watch() not available — use polling directly
      this._startPolling();
      this._usingPolling = true;
    }

    this.emit('start', {
      projectName: this.projectName,
      watchDir: this._watchDir,
      mode: this._usingPolling ? 'polling' : 'fs.watch',
    });
  }

  /**
   * Stop watching.
   */
  stop() {
    if (!this._running) return;
    this._running = false;
    this._stopFsWatch();
    this._stopPolling();
    this.emit('stop');
  }

  /**
   * @returns {boolean}
   */
  isRunning() {
    return this._running;
  }

  /**
   * @returns {'fs.watch'|'polling'|'stopped'}
   */
  getMode() {
    if (!this._running) return 'stopped';
    return this._usingPolling ? 'polling' : 'fs.watch';
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  _seedKnownFiles() {
    if (!fs.existsSync(this._watchDir)) return;
    try {
      for (const f of fs.readdirSync(this._watchDir)) {
        if (f.endsWith('.yaml')) this._knownFiles.add(f);
      }
    } catch {
      // ignore
    }
  }

  _checkFile(filename) {
    if (!filename.endsWith('.yaml')) return;
    if (this._knownFiles.has(filename)) return;

    const filePath = path.join(this._watchDir, filename);

    // File must exist (rename event fires on both add and delete)
    if (!fs.existsSync(filePath)) return;

    this._knownFiles.add(filename);
    this.emit('handoff', { filename, filePath });
  }

  _startPolling() {
    this._usingPolling = true;
    const poll = () => {
      if (!this._running) return;
      if (fs.existsSync(this._watchDir)) {
        try {
          for (const f of fs.readdirSync(this._watchDir)) {
            this._checkFile(f);
          }
        } catch {
          // ignore read errors during poll
        }
      }
      this._pollTimer = setTimeout(poll, this.pollInterval);
    };
    this._pollTimer = setTimeout(poll, this.pollInterval);
  }

  _stopPolling() {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  }

  _stopFsWatch() {
    if (this._watcher) {
      try { this._watcher.close(); } catch { /* ignore */ }
      this._watcher = null;
    }
  }
}

module.exports = HandoffWatcher;
