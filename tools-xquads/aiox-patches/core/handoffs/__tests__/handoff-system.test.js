/**
 * Tests for the Handoff System (writer, consumer, cleanup)
 *
 * @story 9.2 — Cross-Session Handoff System
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock home dir to avoid touching real ~/.aiox/
const MOCK_HOME = path.join(os.tmpdir(), `aiox-handoff-test-${Date.now()}`);

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => MOCK_HOME,
}));

// Must require AFTER mocking os
const writer = require('../handoff-writer');
const consumer = require('../handoff-consumer');
const cleanup = require('../handoff-cleanup');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

const PROJECT = 'test-project';

/** Minimal valid handoff data */
function makeHandoff(overrides = {}) {
  return {
    from_agent: 'sm',
    to_agent: 'dev',
    story_id: '9.2',
    story_path: 'docs/stories/9.2.story.md',
    branch: 'feature/handoffs',
    next_action: 'implement',
    decisions: ['Use YAML format', 'Atomic rename for safety'],
    files_modified: ['src/index.js'],
    blockers: [],
    ...overrides,
  };
}

beforeEach(() => {
  rmrf(MOCK_HOME);
});

afterEach(() => {
  rmrf(MOCK_HOME);
});

// ---------------------------------------------------------------------------
// handoff-writer: validateHandoff
// ---------------------------------------------------------------------------

describe('validateHandoff', () => {
  test('throws if required field missing', () => {
    expect(() => writer.validateHandoff({ from_agent: 'sm' })).toThrow('missing required field: to_agent');
  });

  test('truncates decisions to max 5', () => {
    const data = makeHandoff({ decisions: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
    const result = writer.validateHandoff(data);
    expect(result.decisions).toHaveLength(5);
  });

  test('truncates files_modified to max 10', () => {
    const files = Array.from({ length: 15 }, (_, i) => `file${i}.js`);
    const data = makeHandoff({ files_modified: files });
    const result = writer.validateHandoff(data);
    expect(result.files_modified).toHaveLength(10);
  });

  test('truncates blockers to max 3', () => {
    const data = makeHandoff({ blockers: ['b1', 'b2', 'b3', 'b4', 'b5'] });
    const result = writer.validateHandoff(data);
    expect(result.blockers).toHaveLength(3);
  });

  test('generates id if not provided', () => {
    const result = writer.validateHandoff(makeHandoff());
    expect(result.id).toMatch(/^handoff-sm-to-dev-\d+$/);
  });

  test('sets status to ready', () => {
    const result = writer.validateHandoff(makeHandoff());
    expect(result.status).toBe('ready');
  });

  test('normalizes null arrays to empty', () => {
    const data = makeHandoff({ decisions: null, blockers: undefined });
    const result = writer.validateHandoff(data);
    expect(result.decisions).toEqual([]);
    expect(result.blockers).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// handoff-writer: writeHandoff
// ---------------------------------------------------------------------------

describe('writeHandoff', () => {
  test('writes file to ready/ dir', async () => {
    const { id, filePath } = await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('ready');
    expect(path.basename(filePath)).toBe(`${id}.yaml`);
  });

  test('creates queue dirs if they do not exist', async () => {
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    for (const dir of writer.QUEUE_DIRS) {
      const dirPath = writer.getQueuePath(PROJECT, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    }
  });

  test('written file is valid YAML with required fields', async () => {
    const yaml = require('js-yaml');
    const { filePath } = await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.load(raw);

    expect(parsed.from_agent).toBe('sm');
    expect(parsed.to_agent).toBe('dev');
    expect(parsed.story_id).toBe('9.2');
    expect(parsed.status).toBe('ready');
  });

  test('throws without projectName when no local config', async () => {
    await expect(writer.writeHandoff(makeHandoff())).rejects.toThrow('projectName is required');
  });
});

// ---------------------------------------------------------------------------
// handoff-consumer: getNext
// ---------------------------------------------------------------------------

describe('getNext', () => {
  test('returns null when queue is empty', async () => {
    await writer.ensureQueueDirs(PROJECT);
    const result = await consumer.getNext({ projectName: PROJECT });
    expect(result).toBeNull();
  });

  test('consumes next handoff and moves to in-progress', async () => {
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    const handoff = await consumer.getNext({ projectName: PROJECT });

    expect(handoff).not.toBeNull();
    expect(handoff.from_agent).toBe('sm');
    expect(handoff.status).toBe('in-progress');

    // File should be in in-progress/, not ready/
    const readyFiles = consumer.listQueue(PROJECT, 'ready');
    const inProgressFiles = consumer.listQueue(PROJECT, 'in-progress');

    expect(readyFiles).toHaveLength(0);
    expect(inProgressFiles).toHaveLength(1);
  });

  test('filters by toAgent', async () => {
    await writer.writeHandoff(makeHandoff({ to_agent: 'qa' }), { projectName: PROJECT });
    await writer.writeHandoff(makeHandoff({ to_agent: 'dev' }), { projectName: PROJECT });

    const handoff = await consumer.getNext({ projectName: PROJECT, toAgent: 'qa' });
    expect(handoff.to_agent).toBe('qa');
  });

  test('returns null when no handoff matches toAgent filter', async () => {
    await writer.writeHandoff(makeHandoff({ to_agent: 'dev' }), { projectName: PROJECT });

    const handoff = await consumer.getNext({ projectName: PROJECT, toAgent: 'qa' });
    expect(handoff).toBeNull();
  });

  test('race condition: two consumers, only one gets the handoff', async () => {
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    // Simulate concurrent consumption
    const [result1, result2] = await Promise.all([
      consumer.getNext({ projectName: PROJECT }),
      consumer.getNext({ projectName: PROJECT }),
    ]);

    // Exactly one should win, the other gets null
    const winners = [result1, result2].filter(Boolean);
    expect(winners).toHaveLength(1);

    // Only one file in in-progress
    const inProgress = consumer.listQueue(PROJECT, 'in-progress');
    expect(inProgress).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// handoff-consumer: complete
// ---------------------------------------------------------------------------

describe('complete', () => {
  test('moves handoff from in-progress to done', async () => {
    const { id } = await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await consumer.getNext({ projectName: PROJECT }); // moves to in-progress

    const result = await consumer.complete(id, { projectName: PROJECT });
    expect(result).toBe(true);

    expect(consumer.listQueue(PROJECT, 'in-progress')).toHaveLength(0);
    expect(consumer.listQueue(PROJECT, 'done')).toHaveLength(1);
  });

  test('returns false if handoff not in in-progress', async () => {
    await writer.ensureQueueDirs(PROJECT);
    const result = await consumer.complete('nonexistent-id', { projectName: PROJECT });
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// handoff-consumer: fail
// ---------------------------------------------------------------------------

describe('fail', () => {
  test('moves handoff from in-progress to failed with reason', async () => {
    const yaml = require('js-yaml');
    const { id } = await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await consumer.getNext({ projectName: PROJECT });

    const result = await consumer.fail(id, 'Compilation error', { projectName: PROJECT });
    expect(result).toBe(true);

    const failedFiles = consumer.listQueue(PROJECT, 'failed');
    expect(failedFiles).toHaveLength(1);

    const parsed = yaml.load(fs.readFileSync(failedFiles[0].filePath, 'utf8'));
    expect(parsed.status).toBe('failed');
    expect(parsed.failure_reason).toBe('Compilation error');
    expect(parsed.failed_at).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// handoff-consumer: peekNext
// ---------------------------------------------------------------------------

describe('peekNext', () => {
  test('returns handoff without moving it', async () => {
    await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });

    const peeked = consumer.peekNext({ projectName: PROJECT });
    expect(peeked).not.toBeNull();
    expect(peeked.from_agent).toBe('sm');

    // File still in ready
    expect(consumer.listQueue(PROJECT, 'ready')).toHaveLength(1);
  });

  test('returns null when queue is empty', async () => {
    await writer.ensureQueueDirs(PROJECT);
    expect(consumer.peekNext({ projectName: PROJECT })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// handoff-cleanup: cleanupHandoffs
// ---------------------------------------------------------------------------

describe('cleanupHandoffs', () => {
  test('dry run lists files to remove without deleting', async () => {
    const { id } = await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await consumer.getNext({ projectName: PROJECT });
    await consumer.complete(id, { projectName: PROJECT });

    // Backdate the file to simulate old age
    const doneFiles = consumer.listQueue(PROJECT, 'done');
    const oldTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    fs.utimesSync(doneFiles[0].filePath, oldTime, oldTime);

    const result = await cleanup.cleanupHandoffs({ projectName: PROJECT, retentionDays: 7, dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.removed).toHaveLength(1);
    // File still exists (dry run)
    expect(fs.existsSync(doneFiles[0].filePath)).toBe(true);
  });

  test('removes done files older than retentionDays', async () => {
    const { id } = await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await consumer.getNext({ projectName: PROJECT });
    await consumer.complete(id, { projectName: PROJECT });

    const doneFiles = consumer.listQueue(PROJECT, 'done');
    const oldTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    fs.utimesSync(doneFiles[0].filePath, oldTime, oldTime);

    const result = await cleanup.cleanupHandoffs({ projectName: PROJECT, retentionDays: 7 });
    expect(result.removed).toHaveLength(1);
    expect(fs.existsSync(doneFiles[0].filePath)).toBe(false);
  });

  test('keeps files newer than retentionDays', async () => {
    const { id } = await writer.writeHandoff(makeHandoff(), { projectName: PROJECT });
    await consumer.getNext({ projectName: PROJECT });
    await consumer.complete(id, { projectName: PROJECT });

    // File was just created — should be kept
    const result = await cleanup.cleanupHandoffs({ projectName: PROJECT, retentionDays: 7 });
    expect(result.removed).toHaveLength(0);
    expect(result.kept).toBe(1);
  });

  test('formatCleanupResult returns correct messages', () => {
    expect(cleanup.formatCleanupResult({ removed: [], kept: 5, dryRun: false })).toContain('No handoffs to clean');
    expect(cleanup.formatCleanupResult({ removed: ['a', 'b'], kept: 3, dryRun: false })).toContain('Removed 2');
    expect(cleanup.formatCleanupResult({ removed: ['a'], kept: 0, dryRun: true })).toContain('[DRY RUN]');
  });
});

// ---------------------------------------------------------------------------
// listAll
// ---------------------------------------------------------------------------

describe('listAll', () => {
  test('returns counts across all statuses', async () => {
    const { id: id1 } = await writer.writeHandoff(makeHandoff({ to_agent: 'dev' }), { projectName: PROJECT });
    const { id: id2 } = await writer.writeHandoff(makeHandoff({ to_agent: 'qa' }), { projectName: PROJECT });

    await consumer.getNext({ projectName: PROJECT, toAgent: 'dev' }); // moves id1 to in-progress
    await consumer.complete(id1, { projectName: PROJECT }); // moves to done

    const all = consumer.listAll(PROJECT);
    expect(all.ready).toHaveLength(1); // id2 still ready
    expect(all['in-progress']).toHaveLength(0);
    expect(all.done).toHaveLength(1); // id1
    expect(all.failed).toHaveLength(0);
  });
});
