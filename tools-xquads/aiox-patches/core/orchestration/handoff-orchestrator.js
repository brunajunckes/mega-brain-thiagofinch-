/**
 * Handoff Orchestrator
 *
 * Closes the loop between the handoff queue and agent execution.
 * Watches ~/.aiox/handoffs/{project}/ready/ and spawns the target
 * agent via terminal-spawner when a handoff arrives, respecting
 * the maxConcurrency limit from parallel-executor.
 *
 * Flow:
 *   HandoffWatcher emits 'handoff'
 *     → check active slots (maxConcurrency)
 *     → consumer.getNext() [atomic]
 *     → build context from handoff
 *     → spawnAgent(toAgent, task, { context })
 *     → consumer.complete() or consumer.fail()
 *
 * @module core/orchestration/handoff-orchestrator
 * @story 9.3 — Handoff-Triggered Orchestration
 * @version 1.0.0
 */

'use strict';

const path = require('path');
const { EventEmitter } = require('events');

const HandoffWatcher = require('../handoffs/handoff-watcher');
const consumer = require('../handoffs/handoff-consumer');
const ParallelExecutor = require('./parallel-executor');

const TERMINAL_SPAWNER_PATH = path.resolve(__dirname, 'terminal-spawner');
const HUB_MANAGER_PATH = path.resolve(__dirname, '..', 'global-hub', 'hub-manager');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSpawner() {
  return require(TERMINAL_SPAWNER_PATH);
}

function loadHubManager() {
  return require(HUB_MANAGER_PATH);
}

/**
 * Reads maxConcurrency for a project from resolved config.
 * Falls back to 3 (parallel-executor default).
 *
 * @param {string} [projectRoot=process.cwd()]
 * @returns {number}
 */
function resolveMaxConcurrency(projectRoot = process.cwd()) {
  try {
    const hub = loadHubManager();
    const config = hub.resolveConfig(projectRoot);
    const val = config.defaultConcurrency || config.maxConcurrency;
    return typeof val === 'number' && val > 0 ? Math.min(val, 10) : 3;
  } catch {
    return 3;
  }
}

// ---------------------------------------------------------------------------
// HandoffOrchestrator
// ---------------------------------------------------------------------------

class HandoffOrchestrator extends EventEmitter {
  /**
   * @param {Object} options
   * @param {string} options.projectName  — Project name
   * @param {number} [options.maxConcurrency]  — Override concurrency (default: from config)
   * @param {string} [options.projectRoot=process.cwd()]
   * @param {number} [options.pollInterval=2000]  — Watcher poll interval ms
   * @param {boolean} [options.dryRun=false]  — Log actions without spawning
   */
  constructor(options = {}) {
    super();
    this.projectName = options.projectName;
    this.projectRoot = options.projectRoot || process.cwd();
    this.dryRun = options.dryRun === true;
    this.pollInterval = options.pollInterval || 2000;

    // Resolve concurrency: option > config > default(3)
    this.maxConcurrency = options.maxConcurrency || resolveMaxConcurrency(this.projectRoot);

    // Track active spawns: handoffId → { handoff, startTime, agentId }
    this._activeSpawns = new Map();

    // ParallelExecutor for concurrency management (AC4 — Task 4)
    this._parallelExecutor = new ParallelExecutor();
    this._parallelExecutor.setMaxConcurrency(this.maxConcurrency);

    // Watcher
    this._watcher = new HandoffWatcher({
      projectName: this.projectName,
      pollInterval: this.pollInterval,
    });

    this._watcher.on('handoff', (ev) => this._onHandoffDetected(ev));
    this._watcher.on('error', (ev) => this.emit('error', ev));
    this._watcher.on('start', (ev) => this.emit('watcherStart', ev));
    this._watcher.on('stop', () => this.emit('watcherStop'));
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Start watching and orchestrating.
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.projectName) {
      throw new Error('HandoffOrchestrator requires projectName');
    }
    this._parallelExecutor.setMaxConcurrency(this.maxConcurrency);
    await this._watcher.start();
    this.emit('start', { projectName: this.projectName, maxConcurrency: this.maxConcurrency });
  }

  /**
   * Stop watching. Does not cancel in-flight spawns.
   */
  stop() {
    this._watcher.stop();
    this.emit('stop', { activeSpawns: this._activeSpawns.size });
  }

  // ---------------------------------------------------------------------------
  // Core — Handoff Detection → Spawn (AC2)
  // ---------------------------------------------------------------------------

  /**
   * Called when watcher detects a new file in ready/.
   * Checks slots, atomically claims handoff, spawns agent.
   *
   * @param {{filename: string, filePath: string}} ev
   */
  async _onHandoffDetected(_ev) {
    await this._tryClaimAndSpawn();
  }

  /**
   * Tries to claim the next ready handoff and spawn an agent if slots available.
   * Called on watcher events AND after each spawn completes (drain pattern).
   */
  async _tryClaimAndSpawn() {
    // Check slots — don't spawn if at capacity (AC7)
    if (this._activeSpawns.size >= this.maxConcurrency) {
      this.emit('slotFull', {
        active: this._activeSpawns.size,
        max: this.maxConcurrency,
      });
      return;
    }

    // Atomically claim the handoff
    const handoff = await consumer.getNext({ projectName: this.projectName });
    if (!handoff) return; // Queue empty or already claimed by another session

    this.emit('handoffClaimed', { id: handoff.id, from: handoff.from_agent, to: handoff.to_agent });

    // Spawn agent (non-blocking — runs in background)
    this._spawnForHandoff(handoff).catch((err) => {
      this.emit('spawnError', { handoffId: handoff.id, error: err.message });
    });
  }

  // ---------------------------------------------------------------------------
  // Spawn (AC2, AC3, AC4, AC5)
  // ---------------------------------------------------------------------------

  /**
   * Spawns the target agent for a handoff, then completes or fails it.
   *
   * @param {Object} handoff
   * @returns {Promise<void>}
   */
  async _spawnForHandoff(handoff) {
    const { id: handoffId, to_agent: toAgent, next_action: task } = handoff;

    this._activeSpawns.set(handoffId, {
      handoff,
      startTime: Date.now(),
      agentId: toAgent,
    });

    this._parallelExecutor.runningTasks.set(handoffId, {
      status: 'running',
      startTime: Date.now(),
    });

    this.emit('spawnStart', { handoffId, toAgent, task });

    try {
      if (this.dryRun) {
        // Dry run — simulate success
        await new Promise((r) => setTimeout(r, 100));
        this.emit('spawnComplete', { handoffId, toAgent, dryRun: true });
      } else {
        const spawner = loadSpawner();
        const context = this._buildContext(handoff);

        // spawnAgent handles VS Code/SSH/CI inline fallback automatically (AC5)
        const result = await spawner.spawnAgent(toAgent, task || 'develop', { context });

        if (result.success) {
          this.emit('spawnComplete', { handoffId, toAgent, duration: result.duration });
        } else {
          throw new Error(result.error || 'spawnAgent returned failure');
        }
      }

      // Mark done (AC4)
      await consumer.complete(handoffId, { projectName: this.projectName });
      this.emit('handoffDone', { handoffId, toAgent });
    } catch (err) {
      // Mark failed (AC4)
      await consumer.fail(handoffId, err.message, { projectName: this.projectName });
      this.emit('handoffFailed', { handoffId, toAgent, error: err.message });
    } finally {
      this._activeSpawns.delete(handoffId);
      this._parallelExecutor.runningTasks.set(handoffId, {
        status: 'completed',
        endTime: Date.now(),
      });

      // Drain: free slot — check if more handoffs waiting (AC7)
      this._tryClaimAndSpawn().catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // Context Builder (AC3)
  // ---------------------------------------------------------------------------

  /**
   * Builds the agent context object from a handoff.
   * Maps handoff fields → AgentContext schema expected by terminal-spawner.
   *
   * @param {Object} handoff
   * @returns {Object} AgentContext
   */
  _buildContext(handoff) {
    return {
      story: handoff.story_path,
      files: handoff.files_modified || [],
      instructions: [
        `Branch: ${handoff.branch || 'main'}`,
        `Next action: ${handoff.next_action}`,
        handoff.decisions && handoff.decisions.length > 0
          ? `Decisions already made:\n${handoff.decisions.map((d) => `  - ${d}`).join('\n')}`
          : null,
        handoff.blockers && handoff.blockers.length > 0
          ? `Active blockers:\n${handoff.blockers.map((b) => `  - ${b}`).join('\n')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
      metadata: {
        handoffId: handoff.id,
        fromAgent: handoff.from_agent,
        toAgent: handoff.to_agent,
        storyId: handoff.story_id,
        branch: handoff.branch,
        createdAt: handoff.created_at,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Status (AC8)
  // ---------------------------------------------------------------------------

  /**
   * Returns the current orchestrator status.
   *
   * @returns {Object}
   */
  getStatus() {
    const queueSnapshot = consumer.listAll(this.projectName);
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Filter done in last hour
    const recentDone = queueSnapshot.done.filter((f) => f.mtime && f.mtime.getTime() > oneHourAgo);

    const activeAgents = Array.from(this._activeSpawns.entries()).map(([id, info]) => ({
      handoffId: id,
      agentId: info.agentId,
      runningMs: now - info.startTime,
      story: info.handoff.story_id,
    }));

    return {
      running: this._watcher.isRunning(),
      mode: this._watcher.getMode(),
      projectName: this.projectName,
      maxConcurrency: this.maxConcurrency,
      activeSpawns: this._activeSpawns.size,
      agents: activeAgents,
      queue: {
        ready: queueSnapshot.ready.length,
        inProgress: queueSnapshot['in-progress'].length,
        doneLastHour: recentDone.length,
        failed: queueSnapshot.failed.length,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = HandoffOrchestrator;
