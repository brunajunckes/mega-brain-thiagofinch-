/**
 * Integration + Concurrency Tests for HandoffOrchestrator + HandoffWatcher
 *
 * @story 9.3 — Handoff-Triggered Orchestration
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock home dir
const MOCK_HOME = path.join(os.tmpdir(), `aiox-orch-test-${Date.now()}`);

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => MOCK_HOME,
}));

// Mock terminal-spawner — we don't want real spawning in tests
jest.mock('../../orchestration/terminal-spawner', () => ({
  spawnAgent: jest.fn().mockResolvedValue({ success: true, output: 'done', duration: 100 }),
  createContextFile: jest.fn().mockResolvedValue('/tmp/ctx.json'),
}));

// Mock chalk used by parallel-executor
jest.mock('chalk', () => ({
  yellow: (s) => s,
  red: (s) => s,
  gray: (s) => s,
}));

const writer = require('../handoff-writer');
const consumer = require('../handoff-consumer');
const HandoffWatcher = require('../handoff-watcher');
const HandoffOrchestrator = require('../../orchestration/handoff-orchestrator');
const spawner = require('../../orchestration/terminal-spawner');

const PROJECT = 'orch-test';

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function makeHandoff(overrides = {}) {
  return {
    from_agent: 'sm',
    to_agent: 'dev',
    story_id: '9.3',
    story_path: 'docs/stories/9.3.story.md',
    branch: 'feature/test',
    next_action: 'implement',
    decisions: ['use yaml'],
    files_modified: [],
    blockers: [],
    ...overrides,
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

beforeEach(() => {
  rmrf(MOCK_HOME);
  jest.clearAllMocks();
});

afterEach(() => {
  rmrf(MOCK_HOME);
});

// ---------------------------------------------------------------------------
// HandoffWatcher Unit Tests (Task 7)
// ---------------------------------------------------------------------------

describe('HandoffWatcher', () => {
  test('emits handoff event when file appears in ready/', async () => {
    await writer.ensureQueueDirs(PROJECT);
    const readyDir = writer.getQueuePath(PROJECT, 'ready');

    const watcher = new HandoffWatcher({ projectName: PROJECT, pollInterval: 100 });

    const events = [];
    watcher.on('handoff', (ev) => events.push(ev));

    await watcher.start();

    // Write file after watcher started
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    // Wait for poll
    await sleep(350);
    watcher.stop();

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].filename).toMatch(/^handoff-sm-to-dev-\d+\.yaml$/);
    expect(fs.existsSync(events[0].filePath)).toBe(true);
  });

  test('does not re-emit for files present before start', async () => {
    // Write file BEFORE watcher starts
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    const watcher = new HandoffWatcher({ projectName: PROJECT, pollInterval: 100 });
    const events = [];
    watcher.on('handoff', (ev) => events.push(ev));

    await watcher.start();
    await sleep(350);
    watcher.stop();

    expect(events).toHaveLength(0); // pre-existing file seeded, not re-emitted
  });

  test('stop() prevents further events', async () => {
    await writer.ensureQueueDirs(PROJECT);

    const watcher = new HandoffWatcher({ projectName: PROJECT, pollInterval: 100 });
    const events = [];
    watcher.on('handoff', (ev) => events.push(ev));

    await watcher.start();
    watcher.stop();

    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await sleep(300);

    expect(events).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// HandoffOrchestrator — Integration (Task 7)
// ---------------------------------------------------------------------------

describe('HandoffOrchestrator integration', () => {
  test('detects handoff, spawns agent, moves to done', async () => {
    const orch = new HandoffOrchestrator({
      projectName: PROJECT,
      maxConcurrency: 3,
      pollInterval: 100,
    });

    const doneEvents = [];
    orch.on('handoffDone', (ev) => doneEvents.push(ev));

    await orch.start();

    // Write handoff after watcher started
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    // Wait for orchestrator to process
    await sleep(500);
    orch.stop();

    expect(spawner.spawnAgent).toHaveBeenCalledTimes(1);
    expect(spawner.spawnAgent).toHaveBeenCalledWith(
      'dev',
      'implement',
      expect.objectContaining({ context: expect.any(Object) }),
    );
    expect(doneEvents).toHaveLength(1);

    // Verify handoff moved to done/
    expect(consumer.listQueue(PROJECT, 'done')).toHaveLength(1);
    expect(consumer.listQueue(PROJECT, 'ready')).toHaveLength(0);
  });

  test('marks handoff failed when spawnAgent throws', async () => {
    spawner.spawnAgent.mockRejectedValueOnce(new Error('spawn failed'));

    const orch = new HandoffOrchestrator({
      projectName: PROJECT,
      maxConcurrency: 3,
      pollInterval: 100,
    });

    const failedEvents = [];
    orch.on('handoffFailed', (ev) => failedEvents.push(ev));

    await orch.start();
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await sleep(500);
    orch.stop();

    expect(failedEvents).toHaveLength(1);
    expect(failedEvents[0].error).toBe('spawn failed');
    expect(consumer.listQueue(PROJECT, 'failed')).toHaveLength(1);
  });

  test('dry-run does not call spawnAgent', async () => {
    const orch = new HandoffOrchestrator({
      projectName: PROJECT,
      maxConcurrency: 3,
      pollInterval: 100,
      dryRun: true,
    });

    await orch.start();
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await sleep(500);
    orch.stop();

    expect(spawner.spawnAgent).not.toHaveBeenCalled();
    expect(consumer.listQueue(PROJECT, 'done')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Concurrency Tests (Task 8) — 5 handoffs, maxConcurrency=3
// ---------------------------------------------------------------------------

describe('HandoffOrchestrator concurrency', () => {
  test('processes 5 handoffs respecting maxConcurrency=3', async () => {
    // Track peak concurrency
    let peakActive = 0;
    let currentActive = 0;

    spawner.spawnAgent.mockImplementation(async () => {
      currentActive++;
      if (currentActive > peakActive) peakActive = currentActive;
      await sleep(150); // simulate work
      currentActive--;
      return { success: true, output: 'ok', duration: 150 };
    });

    const orch = new HandoffOrchestrator({
      projectName: PROJECT,
      maxConcurrency: 3,
      pollInterval: 50,
    });

    const doneEvents = [];
    orch.on('handoffDone', (ev) => doneEvents.push(ev));

    await orch.start();

    // Write 5 handoffs
    for (let i = 0; i < 5; i++) {
      await writer.writeHandoff(makeHandoff({ story_id: `9.3-${i}` }), { projectName: PROJECT });
      await sleep(20); // slight stagger to ensure watcher sees them
    }

    // Wait enough for all to complete (5 * 150ms / 3 slots ≈ 300ms, plus overhead)
    await sleep(1200);
    orch.stop();

    expect(doneEvents.length).toBe(5);
    expect(spawner.spawnAgent).toHaveBeenCalledTimes(5);
    // Peak active should never exceed maxConcurrency
    expect(peakActive).toBeLessThanOrEqual(3);
  });

  test('getStatus() reflects queue counts accurately', async () => {
    await writer.ensureQueueDirs(PROJECT);
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await writer.writeHandoff(makeHandoff({ to_agent: 'qa' }), { projectName: PROJECT });

    const orch = new HandoffOrchestrator({ projectName: PROJECT, maxConcurrency: 3 });
    const status = orch.getStatus();

    expect(status.queue.ready).toBe(2);
    expect(status.queue.inProgress).toBe(0);
    expect(status.maxConcurrency).toBe(3);
    expect(status.running).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Context Builder (Task 3)
// ---------------------------------------------------------------------------

describe('HandoffOrchestrator._buildContext', () => {
  test('maps handoff fields to AgentContext correctly', () => {
    const orch = new HandoffOrchestrator({ projectName: PROJECT });
    const handoff = {
      id: 'handoff-sm-to-dev-123',
      from_agent: 'sm',
      to_agent: 'dev',
      story_id: '9.3',
      story_path: 'docs/stories/9.3.story.md',
      branch: 'feature/handoffs',
      next_action: 'implement',
      decisions: ['Use YAML', 'Atomic rename'],
      files_modified: ['src/writer.js'],
      blockers: ['waiting for QA'],
      created_at: new Date().toISOString(),
    };

    const ctx = orch._buildContext(handoff);

    expect(ctx.story).toBe('docs/stories/9.3.story.md');
    expect(ctx.files).toEqual(['src/writer.js']);
    expect(ctx.instructions).toContain('feature/handoffs');
    expect(ctx.instructions).toContain('implement');
    expect(ctx.instructions).toContain('Use YAML');
    expect(ctx.instructions).toContain('waiting for QA');
    expect(ctx.metadata.handoffId).toBe('handoff-sm-to-dev-123');
    expect(ctx.metadata.fromAgent).toBe('sm');
    expect(ctx.metadata.storyId).toBe('9.3');
  });
});
