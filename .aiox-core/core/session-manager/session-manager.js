'use strict';

const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

/**
 * Generate a simple UUID v4
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * SessionManager — Persistent Agent Session Storage
 *
 * Handles creation, loading, saving, and retrieval of agent sessions.
 * Sessions persist conversation history, agent state, and context across process restarts.
 *
 * @class SessionManager
 * @version 1.0.0
 * @story 1.1
 */
class SessionManager {
  /**
   * Initialize SessionManager with base directory
   * @param {string} baseDir - Base directory for sessions (default: .aiox/sessions)
   */
  constructor(baseDir = null) {
    this.baseDir = baseDir || path.join(process.cwd(), '.aiox', 'sessions');
    this.sessionIndexFile = path.join(this.baseDir, 'index.json');
    this.initialized = false;
  }

  /**
   * Initialize session directory structure
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    await fs.ensureDir(this.baseDir);

    // Create or load index
    if (!(await fs.pathExists(this.sessionIndexFile))) {
      await fs.writeJson(this.sessionIndexFile, { sessions: {} }, { spaces: 2 });
    }

    this.initialized = true;
  }

  /**
   * Create a new session for an agent
   * @param {string} agentId - Agent ID (e.g., 'dev', 'qa', 'architect')
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Created session object
   */
  async createSession(agentId, metadata = {}) {
    await this.initialize();

    const sessionId = generateUUID();
    const sessionDir = path.join(this.baseDir, agentId, sessionId);

    const session = {
      sessionId,
      agentId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'active',
      conversationLength: 0,
      contextTokens: 0,
      metadata: {
        ...metadata,
        currentStory: metadata.currentStory || null,
        currentTask: metadata.currentTask || null,
        branch: metadata.branch || 'main',
      },
    };

    // Create session directory structure
    await fs.ensureDir(sessionDir);
    await fs.ensureDir(path.join(sessionDir, 'snapshots'));

    // Save metadata
    const metadataFile = path.join(sessionDir, 'metadata.json');
    await fs.writeJson(metadataFile, session, { spaces: 2 });

    // Create empty conversation file
    const conversationFile = path.join(sessionDir, 'conversation.jsonl');
    await fs.writeFile(conversationFile, '');

    // Create empty state file
    const stateFile = path.join(sessionDir, 'state.json');
    await fs.writeJson(stateFile, { contextMemory: null, currentTask: null }, { spaces: 2 });

    // Update index
    await this._updateIndex(sessionId, agentId, session);

    return session;
  }

  /**
   * Get all active sessions for an agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Array>} Array of session objects
   */
  async getAgentSessions(agentId) {
    await this.initialize();

    const agentDir = path.join(this.baseDir, agentId);
    if (!(await fs.pathExists(agentDir))) {
      return [];
    }

    const sessions = [];
    const sessionDirs = await fs.readdir(agentDir);

    for (const sessionDir of sessionDirs) {
      const metadataFile = path.join(agentDir, sessionDir, 'metadata.json');
      if (await fs.pathExists(metadataFile)) {
        const metadata = await fs.readJson(metadataFile);
        if (metadata.status === 'active') {
          sessions.push(metadata);
        }
      }
    }

    return sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }

  /**
   * Get all active sessions across all agents
   * @returns {Promise<Array>} Array of all active sessions
   */
  async getAllActiveSessions() {
    await this.initialize();

    if (!(await fs.pathExists(this.baseDir))) {
      return [];
    }

    const allSessions = [];
    const agents = await fs.readdir(this.baseDir);

    for (const agent of agents) {
      if (agent === 'index.json') continue;

      const agentSessions = await this.getAgentSessions(agent);
      allSessions.push(...agentSessions);
    }

    return allSessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }

  /**
   * Load an existing session
   * @param {string} agentId - Agent ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session object with metadata, conversation, and state
   */
  async loadSession(agentId, sessionId) {
    await this.initialize();

    const sessionDir = path.join(this.baseDir, agentId, sessionId);
    if (!(await fs.pathExists(sessionDir))) {
      throw new Error(`Session not found: ${agentId}/${sessionId}`);
    }

    const metadataFile = path.join(sessionDir, 'metadata.json');
    const conversationFile = path.join(sessionDir, 'conversation.jsonl');
    const stateFile = path.join(sessionDir, 'state.json');

    const metadata = await fs.readJson(metadataFile);
    const conversation = await this._loadConversation(conversationFile);
    const state = await fs.readJson(stateFile);

    return {
      ...metadata,
      conversation,
      state,
      sessionDir,
    };
  }

  /**
   * Get the most recent session for an agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object|null>} Most recent session or null
   */
  async getMostRecentSession(agentId) {
    const sessions = await this.getAgentSessions(agentId);
    if (sessions.length === 0) return null;
    return await this.loadSession(agentId, sessions[0].sessionId);
  }

  /**
   * Add message to session conversation
   * @param {string} agentId - Agent ID
   * @param {string} sessionId - Session ID
   * @param {string} role - Message role ('user' | 'assistant')
   * @param {string} content - Message content
   * @returns {Promise<void>}
   */
  async addMessage(agentId, sessionId, role, content) {
    await this.initialize();

    const sessionDir = path.join(this.baseDir, agentId, sessionId);
    const conversationFile = path.join(sessionDir, 'conversation.jsonl');

    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    // Append to conversation file
    await fs.appendFile(conversationFile, JSON.stringify(message) + '\n');

    // Update session metadata
    const metadataFile = path.join(sessionDir, 'metadata.json');
    const metadata = await fs.readJson(metadataFile);
    metadata.conversationLength = (metadata.conversationLength || 0) + 1;
    metadata.lastActivity = new Date().toISOString();
    await fs.writeJson(metadataFile, metadata, { spaces: 2 });
  }

  /**
   * Update session state (context memory, current task, etc.)
   * @param {string} agentId - Agent ID
   * @param {string} sessionId - Session ID
   * @param {Object} stateUpdate - State object to merge
   * @returns {Promise<void>}
   */
  async updateSessionState(agentId, sessionId, stateUpdate) {
    await this.initialize();

    const sessionDir = path.join(this.baseDir, agentId, sessionId);
    const stateFile = path.join(sessionDir, 'state.json');

    const currentState = await fs.readJson(stateFile);
    const newState = { ...currentState, ...stateUpdate };
    await fs.writeJson(stateFile, newState, { spaces: 2 });

    // Update session metadata
    const metadataFile = path.join(sessionDir, 'metadata.json');
    const metadata = await fs.readJson(metadataFile);
    metadata.lastActivity = new Date().toISOString();
    if (stateUpdate.contextTokens) {
      metadata.contextTokens = stateUpdate.contextTokens;
    }
    await fs.writeJson(metadataFile, metadata, { spaces: 2 });
  }

  /**
   * Archive a session (mark as inactive)
   * @param {string} agentId - Agent ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async archiveSession(agentId, sessionId) {
    await this.initialize();

    const sessionDir = path.join(this.baseDir, agentId, sessionId);
    const metadataFile = path.join(sessionDir, 'metadata.json');

    const metadata = await fs.readJson(metadataFile);
    metadata.status = 'archived';
    metadata.archivedAt = new Date().toISOString();
    await fs.writeJson(metadataFile, metadata, { spaces: 2 });
  }

  /**
   * Delete a session completely
   * @param {string} agentId - Agent ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async deleteSession(agentId, sessionId) {
    await this.initialize();

    const sessionDir = path.join(this.baseDir, agentId, sessionId);
    await fs.remove(sessionDir);

    // Update index
    const index = await fs.readJson(this.sessionIndexFile);
    delete index.sessions[sessionId];
    await fs.writeJson(this.sessionIndexFile, index, { spaces: 2 });
  }

  /**
   * Create a session snapshot for rollback
   * @param {string} agentId - Agent ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<string>} Snapshot filename
   */
  async createSnapshot(agentId, sessionId) {
    await this.initialize();

    const sessionDir = path.join(this.baseDir, agentId, sessionId);
    const snapshotsDir = path.join(sessionDir, 'snapshots');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = path.join(snapshotsDir, `${timestamp}.json`);

    const session = await this.loadSession(agentId, sessionId);
    await fs.writeJson(snapshotFile, session, { spaces: 2 });

    return snapshotFile;
  }

  /**
   * Restore session from snapshot
   * @param {string} agentId - Agent ID
   * @param {string} sessionId - Session ID
   * @param {string} snapshotFile - Path to snapshot file
   * @returns {Promise<void>}
   */
  async restoreFromSnapshot(agentId, sessionId, snapshotFile) {
    await this.initialize();

    const sessionDir = path.join(this.baseDir, agentId, sessionId);
    const snapshot = await fs.readJson(snapshotFile);

    // Restore conversation
    const conversationFile = path.join(sessionDir, 'conversation.jsonl');
    const conversationContent = snapshot.conversation
      .map((msg) => JSON.stringify({ role: msg.role, content: msg.content, timestamp: msg.timestamp }))
      .join('\n');
    await fs.writeFile(conversationFile, conversationContent + '\n');

    // Restore state
    const stateFile = path.join(sessionDir, 'state.json');
    await fs.writeJson(stateFile, snapshot.state, { spaces: 2 });

    // Update metadata
    const metadataFile = path.join(sessionDir, 'metadata.json');
    const metadata = await fs.readJson(metadataFile);
    metadata.conversationLength = snapshot.conversationLength;
    metadata.lastActivity = new Date().toISOString();
    await fs.writeJson(metadataFile, metadata, { spaces: 2 });
  }

  /**
   * Clean up old sessions (>30 days)
   * @returns {Promise<number>} Number of archived sessions
   */
  async cleanupOldSessions(daysOld = 30) {
    await this.initialize();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let archivedCount = 0;
    const allSessions = await this.getAllActiveSessions();

    for (const session of allSessions) {
      const createdAt = new Date(session.createdAt);
      if (createdAt < cutoffDate) {
        await this.archiveSession(session.agentId, session.sessionId);
        archivedCount++;
      }
    }

    return archivedCount;
  }

  /**
   * Load conversation from JSONL file
   * @private
   * @param {string} conversationFile - Path to conversation file
   * @returns {Promise<Array>} Array of messages
   */
  async _loadConversation(conversationFile) {
    if (!(await fs.pathExists(conversationFile))) {
      return [];
    }

    const content = await fs.readFile(conversationFile, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }

  /**
   * Update session index
   * @private
   * @param {string} sessionId - Session ID
   * @param {string} agentId - Agent ID
   * @param {Object} sessionData - Session data
   * @returns {Promise<void>}
   */
  async _updateIndex(sessionId, agentId, sessionData) {
    const index = await fs.readJson(this.sessionIndexFile);
    index.sessions[sessionId] = {
      agentId,
      createdAt: sessionData.createdAt,
      status: sessionData.status,
    };
    await fs.writeJson(this.sessionIndexFile, index, { spaces: 2 });
  }
}

module.exports = { SessionManager };
