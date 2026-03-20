'use strict';

const path = require('path');
const fs = require('fs-extra');
const { HandoffArtifact } = require('../handoff');
const { HandoffStore } = require('../handoff-store');

describe('HandoffArtifact', () => {
  let handoff;

  beforeEach(() => {
    handoff = new HandoffArtifact({
      from_agent: 'dev',
      to_agent: 'qa',
      story_context: {
        story_id: '8.1',
        current_task: 'Task 1.1',
        branch: 'feature/8.1-foundation',
      },
      next_action: '*run-tests',
    });
  });

  describe('initialization', () => {
    it('should create handoff with required fields', () => {
      expect(handoff.id).toBeDefined();
      expect(handoff.from_agent).toBe('dev');
      expect(handoff.to_agent).toBe('qa');
      expect(handoff.created_at).toBeDefined();
      expect(handoff.consumed).toBe(false);
    });

    it('should generate unique IDs', () => {
      const handoff2 = new HandoffArtifact({
        from_agent: 'qa',
        to_agent: 'architect',
      });
      expect(handoff.id).not.toBe(handoff2.id);
    });

    it('should initialize empty arrays and objects', () => {
      const h = new HandoffArtifact({ from_agent: 'dev', to_agent: 'qa' });
      expect(h.decisions).toEqual([]);
      expect(h.files_modified).toEqual([]);
      expect(h.blockers).toEqual([]);
      expect(h.metadata).toEqual({});
    });
  });

  describe('addDecision', () => {
    it('should add a decision with timestamp', () => {
      handoff.addDecision('Use JWT for auth', 'Industry standard');
      expect(handoff.decisions).toHaveLength(1);
      expect(handoff.decisions[0].decision).toBe('Use JWT for auth');
      expect(handoff.decisions[0].rationale).toBe('Industry standard');
      expect(handoff.decisions[0].timestamp).toBeDefined();
    });

    it('should allow multiple decisions', () => {
      handoff.addDecision('Decision 1', 'Reason 1');
      handoff.addDecision('Decision 2', 'Reason 2');
      expect(handoff.decisions).toHaveLength(2);
    });
  });

  describe('addFileModified', () => {
    it('should add file modification record', () => {
      handoff.addFileModified('src/auth.js', 'created', 50, 0);
      expect(handoff.files_modified).toHaveLength(1);
      expect(handoff.files_modified[0].path).toBe('src/auth.js');
      expect(handoff.files_modified[0].status).toBe('created');
      expect(handoff.files_modified[0].lines_added).toBe(50);
    });

    it('should track multiple file modifications', () => {
      handoff.addFileModified('file1.js', 'created', 100, 0);
      handoff.addFileModified('file2.js', 'modified', 20, 5);
      handoff.addFileModified('file3.js', 'deleted', 0, 30);
      expect(handoff.files_modified).toHaveLength(3);
    });
  });

  describe('addBlocker', () => {
    it('should add blocker with severity', () => {
      handoff.addBlocker('Database migration pending', 'HIGH', 'Wait for DBA approval');
      expect(handoff.blockers).toHaveLength(1);
      expect(handoff.blockers[0].blocker).toBe('Database migration pending');
      expect(handoff.blockers[0].severity).toBe('HIGH');
    });

    it('should default severity to MEDIUM', () => {
      handoff.addBlocker('Minor issue');
      expect(handoff.blockers[0].severity).toBe('MEDIUM');
    });
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      const invalid = new HandoffArtifact({ from_agent: '', to_agent: '' });
      const result = invalid.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should enforce field length limits', () => {
      const invalid = new HandoffArtifact({
        from_agent: 'a'.repeat(51),
        to_agent: 'qa',
      });
      const result = invalid.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('from_agent'))).toBe(true);
    });

    it('should enforce array limits', () => {
      const h = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });

      for (let i = 0; i < 6; i++) {
        h.addDecision(`Decision ${i}`, 'Reason');
      }

      const result = h.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('decisions'))).toBe(true);
    });

    it('should validate context_summary length', () => {
      handoff.context_summary = 'x'.repeat(501);
      const result = handoff.validate();
      expect(result.valid).toBe(false);
    });

    it('should pass valid handoff', () => {
      const result = handoff.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      handoff.addDecision('Auth implementation', 'JWT selected');
      const json = handoff.toJSON();

      expect(json.id).toBe(handoff.id);
      expect(json.from_agent).toBe('dev');
      expect(json.decisions).toHaveLength(1);
      expect(json.created_at).toBeDefined();
    });

    it('should deserialize from JSON', () => {
      handoff.addDecision('Decision 1', 'Reason');
      const json = handoff.toJSON();

      const restored = HandoffArtifact.fromJSON(json);
      expect(restored.id).toBe(handoff.id);
      expect(restored.from_agent).toBe(handoff.from_agent);
      expect(restored.decisions).toEqual(handoff.decisions);
      expect(restored.created_at).toBe(handoff.created_at);
    });

    it('should preserve consumed state', () => {
      handoff.markConsumed();
      const json = handoff.toJSON();
      const restored = HandoffArtifact.fromJSON(json);

      expect(restored.consumed).toBe(true);
      expect(restored.consumed_at).toBeDefined();
    });
  });

  describe('markConsumed', () => {
    it('should set consumed flag and timestamp', () => {
      expect(handoff.consumed).toBe(false);
      const before = new Date();

      handoff.markConsumed();

      const after = new Date();
      expect(handoff.consumed).toBe(true);
      expect(handoff.consumed_at).toBeDefined();

      const consumed = new Date(handoff.consumed_at);
      expect(consumed.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(consumed.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getSummary', () => {
    it('should return formatted summary', () => {
      handoff.context_summary = 'Work in progress on authentication';
      const summary = handoff.getSummary();

      expect(summary).toContain('dev');
      expect(summary).toContain('qa');
      expect(summary).toContain('8.1');
      expect(summary).toContain('Work in progress');
    });
  });
});

describe('HandoffStore', () => {
  let store;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-handoffs');
    await fs.ensureDir(testDir);
    store = new HandoffStore({ baseDir: testDir });
    await store.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create directory if not exists', async () => {
      const newDir = path.join(testDir, 'nested', 'handoffs');
      const newStore = new HandoffStore({ baseDir: newDir });
      await newStore.initialize();

      const exists = await fs.pathExists(newDir);
      expect(exists).toBe(true);
    });
  });

  describe('save and load', () => {
    it('should save handoff to disk', async () => {
      const handoff = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });

      const id = await store.save(handoff);
      expect(id).toBe(handoff.id);

      const files = await fs.readdir(testDir);
      expect(files).toHaveLength(1);
    });

    it('should load handoff by ID', async () => {
      const original = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
        next_action: '*run-tests',
      });

      await store.save(original);
      const loaded = await store.load(original.id);

      expect(loaded.id).toBe(original.id);
      expect(loaded.next_action).toBe('*run-tests');
    });

    it('should use cache for repeated loads', async () => {
      const handoff = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });

      await store.save(handoff);
      await store.load(handoff.id); // First load (from disk)
      await store.load(handoff.id); // Second load (from cache)

      expect(store.in_memory_cache.has(handoff.id)).toBe(true);
    });

    it('should throw on invalid handoff', async () => {
      const invalid = new HandoffArtifact({ from_agent: '', to_agent: '' });
      await expect(store.save(invalid)).rejects.toThrow('Invalid handoff');
    });

    it('should throw on non-existent handoff', async () => {
      await expect(store.load('nonexistent-id')).rejects.toThrow('not found');
    });
  });

  describe('getLatestUnconsumed', () => {
    it('should return null when no handoffs exist', async () => {
      const result = await store.getLatestUnconsumed();
      expect(result).toBeNull();
    });

    it('should return latest unconsumed handoff', async () => {
      const h1 = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });
      await store.save(h1);

      // Add delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const h2 = new HandoffArtifact({
        from_agent: 'qa',
        to_agent: 'architect',
      });
      await store.save(h2);

      const latest = await store.getLatestUnconsumed();
      expect(latest.id).toBe(h2.id);
    });

    it('should skip consumed handoffs', async () => {
      const h1 = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });
      await store.save(h1);
      await store.markConsumed(h1.id);

      await new Promise(resolve => setTimeout(resolve, 10));

      const h2 = new HandoffArtifact({
        from_agent: 'qa',
        to_agent: 'architect',
      });
      await store.save(h2);

      const latest = await store.getLatestUnconsumed();
      expect(latest.id).toBe(h2.id);
    });
  });

  describe('markConsumed', () => {
    it('should mark handoff as consumed', async () => {
      const handoff = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });

      await store.save(handoff);
      expect(handoff.consumed).toBe(false);

      await store.markConsumed(handoff.id);
      const loaded = await store.load(handoff.id);

      expect(loaded.consumed).toBe(true);
      expect(loaded.consumed_at).toBeDefined();
    });
  });

  describe('getHandoffsFrom', () => {
    it('should get all handoffs from specific agent', async () => {
      const h1 = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });
      const h2 = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'architect',
      });
      const h3 = new HandoffArtifact({
        from_agent: 'qa',
        to_agent: 'architect',
      });

      await store.save(h1);
      await store.save(h2);
      await store.save(h3);

      const devHandoffs = await store.getHandoffsFrom('dev');
      expect(devHandoffs).toHaveLength(2);
      expect(devHandoffs.every(h => h.from_agent === 'dev')).toBe(true);
    });
  });

  describe('getAllUnconsumed', () => {
    it('should get all unconsumed handoffs', async () => {
      const h1 = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });
      const h2 = new HandoffArtifact({
        from_agent: 'qa',
        to_agent: 'architect',
      });

      await store.save(h1);
      await store.save(h2);
      await store.markConsumed(h1.id);

      const unconsumed = await store.getAllUnconsumed();
      expect(unconsumed).toHaveLength(1);
      expect(unconsumed[0].id).toBe(h2.id);
    });
  });

  describe('cleanup', () => {
    it('should remove consumed handoffs older than cutoff', async () => {
      const h1 = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });
      await store.save(h1);
      await store.markConsumed(h1.id);

      // Cleanup with 0 days to keep (removes all old consumed)
      const result = await store.cleanup(0);
      expect(result.deleted_count).toBe(1);

      const remaining = await store.listAll();
      expect(remaining).toHaveLength(0);
    });

    it('should keep unconsumed handoffs', async () => {
      const h1 = new HandoffArtifact({
        from_agent: 'dev',
        to_agent: 'qa',
      });
      await store.save(h1);

      const result = await store.cleanup(0);
      expect(result.deleted_count).toBe(0);

      const remaining = await store.listAll();
      expect(remaining).toHaveLength(1);
    });
  });

  describe('listAll', () => {
    it('should list all handoffs sorted by creation time', async () => {
      const h1 = new HandoffArtifact({ from_agent: 'dev', to_agent: 'qa' });
      await store.save(h1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const h2 = new HandoffArtifact({ from_agent: 'qa', to_agent: 'architect' });
      await store.save(h2);

      const all = await store.listAll();
      expect(all).toHaveLength(2);
      expect(all[0].id).toBe(h2.id); // Newest first
      expect(all[1].id).toBe(h1.id);
    });
  });

  describe('clearAll', () => {
    it('should delete all handoffs', async () => {
      const h1 = new HandoffArtifact({ from_agent: 'dev', to_agent: 'qa' });
      const h2 = new HandoffArtifact({ from_agent: 'qa', to_agent: 'architect' });

      await store.save(h1);
      await store.save(h2);

      const result = await store.clearAll();
      expect(result.cleared_count).toBe(2);

      const remaining = await store.listAll();
      expect(remaining).toHaveLength(0);
    });
  });
});
