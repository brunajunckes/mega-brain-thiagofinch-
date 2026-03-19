'use strict';

const fs = require('fs-extra');
const path = require('path');
const { SessionManager } = require('../session-manager');

describe('SessionManager', () => {
  let sessionManager;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '..', '..', '..', '.test-sessions');
    await fs.remove(testDir); // Clean up from previous runs
    sessionManager = new SessionManager(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initialization', () => {
    it('should create session directory structure', async () => {
      await sessionManager.initialize();
      expect(await fs.pathExists(testDir)).toBe(true);
      expect(await fs.pathExists(sessionManager.sessionIndexFile)).toBe(true);
    });

    it('should create index.json on first initialization', async () => {
      await sessionManager.initialize();
      const index = await fs.readJson(sessionManager.sessionIndexFile);
      expect(index).toHaveProperty('sessions');
      expect(index.sessions).toEqual({});
    });

    it('should be idempotent', async () => {
      await sessionManager.initialize();
      await sessionManager.initialize();
      expect(await fs.pathExists(testDir)).toBe(true);
    });
  });

  describe('session creation', () => {
    it('should create a new session', async () => {
      const session = await sessionManager.createSession('dev', { currentStory: '1.1' });
      expect(session.sessionId).toBeDefined();
      expect(session.agentId).toBe('dev');
      expect(session.status).toBe('active');
      expect(session.metadata.currentStory).toBe('1.1');
    });

    it('should create session file structure', async () => {
      const session = await sessionManager.createSession('dev');
      const sessionDir = path.join(testDir, 'dev', session.sessionId);

      expect(await fs.pathExists(sessionDir)).toBe(true);
      expect(await fs.pathExists(path.join(sessionDir, 'metadata.json'))).toBe(true);
      expect(await fs.pathExists(path.join(sessionDir, 'conversation.jsonl'))).toBe(true);
      expect(await fs.pathExists(path.join(sessionDir, 'state.json'))).toBe(true);
      expect(await fs.pathExists(path.join(sessionDir, 'snapshots'))).toBe(true);
    });

    it('should initialize conversation file as empty', async () => {
      const session = await sessionManager.createSession('dev');
      const conversationFile = path.join(testDir, 'dev', session.sessionId, 'conversation.jsonl');
      const content = await fs.readFile(conversationFile, 'utf-8');
      expect(content).toBe('');
    });

    it('should update session index', async () => {
      const session = await sessionManager.createSession('dev');
      const index = await fs.readJson(sessionManager.sessionIndexFile);
      expect(index.sessions[session.sessionId]).toBeDefined();
      expect(index.sessions[session.sessionId].agentId).toBe('dev');
    });
  });

  describe('session retrieval', () => {
    it('should retrieve sessions for an agent', async () => {
      await sessionManager.createSession('dev', { currentStory: '1.1' });
      await sessionManager.createSession('dev', { currentStory: '1.2' });
      await sessionManager.createSession('qa');

      const devSessions = await sessionManager.getAgentSessions('dev');
      expect(devSessions).toHaveLength(2);
      expect(devSessions.every((s) => s.agentId === 'dev')).toBe(true);
    });

    it('should return empty array for non-existent agent', async () => {
      const sessions = await sessionManager.getAgentSessions('nonexistent');
      expect(sessions).toEqual([]);
    });

    it('should get most recent session', async () => {
      const session1 = await sessionManager.createSession('dev');
      // Wait a bit to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      const session2 = await sessionManager.createSession('dev');

      const recent = await sessionManager.getMostRecentSession('dev');
      expect(recent.sessionId).toBe(session2.sessionId);
    });

    it('should get all active sessions across agents', async () => {
      await sessionManager.createSession('dev');
      await sessionManager.createSession('qa');
      await sessionManager.createSession('architect');

      const allSessions = await sessionManager.getAllActiveSessions();
      expect(allSessions.length).toBe(3);
    });
  });

  describe('message handling', () => {
    it('should add message to conversation', async () => {
      const session = await sessionManager.createSession('dev');
      await sessionManager.addMessage(session.agentId, session.sessionId, 'user', 'Hello');

      const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
      expect(loaded.conversation).toHaveLength(1);
      expect(loaded.conversation[0]).toHaveProperty('role', 'user');
      expect(loaded.conversation[0]).toHaveProperty('content', 'Hello');
    });

    it('should increment conversation length', async () => {
      const session = await sessionManager.createSession('dev');
      await sessionManager.addMessage(session.agentId, session.sessionId, 'user', 'Msg1');
      await sessionManager.addMessage(session.agentId, session.sessionId, 'assistant', 'Reply');

      const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
      expect(loaded.conversationLength).toBe(2);
    });

    it('should preserve timestamps in conversation', async () => {
      const session = await sessionManager.createSession('dev');
      const beforeTime = new Date();
      await sessionManager.addMessage(session.agentId, session.sessionId, 'user', 'Test');
      const afterTime = new Date();

      const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
      const msgTime = new Date(loaded.conversation[0].timestamp);
      expect(msgTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(msgTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('state management', () => {
    it('should update session state', async () => {
      const session = await sessionManager.createSession('dev');
      await sessionManager.updateSessionState(session.agentId, session.sessionId, {
        contextMemory: { data: 'important' },
        contextTokens: 2500,
      });

      const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
      expect(loaded.state.contextMemory).toEqual({ data: 'important' });
      expect(loaded.contextTokens).toBe(2500);
    });

    it('should merge state updates', async () => {
      const session = await sessionManager.createSession('dev');
      await sessionManager.updateSessionState(session.agentId, session.sessionId, {
        contextMemory: { data: 'first' },
      });
      await sessionManager.updateSessionState(session.agentId, session.sessionId, {
        currentTask: 'test-task',
      });

      const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
      expect(loaded.state.contextMemory).toEqual({ data: 'first' });
      expect(loaded.state.currentTask).toBe('test-task');
    });

    it('should update lastActivity on state change', async () => {
      const session = await sessionManager.createSession('dev');
      const originalTime = new Date(session.lastActivity);

      await new Promise((r) => setTimeout(r, 10));
      await sessionManager.updateSessionState(session.agentId, session.sessionId, {
        currentTask: 'test',
      });

      const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
      const newTime = new Date(loaded.lastActivity);
      expect(newTime.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });

  describe('session lifecycle', () => {
    it('should archive a session', async () => {
      const session = await sessionManager.createSession('dev');
      await sessionManager.archiveSession(session.agentId, session.sessionId);

      const sessions = await sessionManager.getAgentSessions('dev');
      expect(sessions).toHaveLength(0); // Archived sessions not returned
    });

    it('should delete a session', async () => {
      const session = await sessionManager.createSession('dev');
      const sessionDir = path.join(testDir, 'dev', session.sessionId);

      expect(await fs.pathExists(sessionDir)).toBe(true);
      await sessionManager.deleteSession(session.agentId, session.sessionId);
      expect(await fs.pathExists(sessionDir)).toBe(false);
    });

    it('should create snapshot', async () => {
      const session = await sessionManager.createSession('dev');
      await sessionManager.addMessage(session.agentId, session.sessionId, 'user', 'Test');

      const snapshotFile = await sessionManager.createSnapshot(session.agentId, session.sessionId);
      expect(await fs.pathExists(snapshotFile)).toBe(true);

      const snapshot = await fs.readJson(snapshotFile);
      expect(snapshot.conversation).toHaveLength(1);
    });

    it('should restore from snapshot', async () => {
      const session = await sessionManager.createSession('dev');
      await sessionManager.addMessage(session.agentId, session.sessionId, 'user', 'Original');
      const snapshotFile = await sessionManager.createSnapshot(session.agentId, session.sessionId);

      // Add more messages
      await sessionManager.addMessage(session.agentId, session.sessionId, 'assistant', 'New message');

      // Restore
      await sessionManager.restoreFromSnapshot(session.agentId, session.sessionId, snapshotFile);

      const restored = await sessionManager.loadSession(session.agentId, session.sessionId);
      expect(restored.conversation).toHaveLength(1);
      expect(restored.conversation[0].content).toBe('Original');
    });
  });

  describe('maintenance', () => {
    it('should cleanup old sessions', async () => {
      const session1 = await sessionManager.createSession('dev');
      // Manually set createdAt to 40 days ago
      const metadataFile = path.join(testDir, 'dev', session1.sessionId, 'metadata.json');
      const metadata = await fs.readJson(metadataFile);
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);
      metadata.createdAt = oldDate.toISOString();
      await fs.writeJson(metadataFile, metadata);

      const archivedCount = await sessionManager.cleanupOldSessions(30);
      expect(archivedCount).toBe(1);

      const sessions = await sessionManager.getAgentSessions('dev');
      expect(sessions).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should throw on loading non-existent session', async () => {
      await expect(
        sessionManager.loadSession('dev', 'nonexistent-id'),
      ).rejects.toThrow(/Session not found/);
    });

    it('should handle empty conversation file', async () => {
      const session = await sessionManager.createSession('dev');
      const loaded = await sessionManager.loadSession(session.agentId, session.sessionId);
      expect(loaded.conversation).toEqual([]);
    });
  });
});
