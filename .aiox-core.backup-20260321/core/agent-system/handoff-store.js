'use strict';

const fs = require('fs').promises;
const path = require('path');
const { HandoffArtifact } = require('./handoff');

/**
 * HandoffStore - Persist and manage agent handoff artifacts
 */
class HandoffStore {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), '.aiox', 'handoffs');
    this.maxHandoffs = options.maxHandoffs || 100;
    this.in_memory_cache = new Map();
  }

  /**
   * Initialize store directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize handoff store: ${error.message}`);
    }
  }

  /**
   * Generate filename for handoff
   */
  _getFilename(handoff) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `handoff-${handoff.from_agent}-to-${handoff.to_agent}-${timestamp}.json`;
  }

  /**
   * Save handoff to disk
   */
  async save(handoff) {
    if (!(handoff instanceof HandoffArtifact)) {
      throw new Error('Expected HandoffArtifact instance');
    }

    const validation = handoff.validate();
    if (!validation.valid) {
      throw new Error(`Invalid handoff: ${validation.errors.join(', ')}`);
    }

    try {
      const filename = this._getFilename(handoff);
      const filepath = path.join(this.baseDir, filename);
      const json = JSON.stringify(handoff.toJSON(), null, 2);

      // Atomic write: write to temp file first, then rename
      const tempPath = filepath + '.tmp';
      await fs.writeFile(tempPath, json, 'utf8');
      await fs.rename(tempPath, filepath);

      // Cache in memory
      this.in_memory_cache.set(handoff.id, handoff);

      return handoff.id;
    } catch (error) {
      throw new Error(`Failed to save handoff: ${error.message}`);
    }
  }

  /**
   * Load handoff by ID
   */
  async load(handoff_id) {
    try {
      // Check cache first
      if (this.in_memory_cache.has(handoff_id)) {
        return this.in_memory_cache.get(handoff_id);
      }

      // Search for file with this ID
      const files = await fs.readdir(this.baseDir);
      for (const file of files) {
        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        if (json.id === handoff_id) {
          const handoff = HandoffArtifact.fromJSON(json);
          this.in_memory_cache.set(handoff_id, handoff);
          return handoff;
        }
      }

      throw new Error(`Handoff not found: ${handoff_id}`);
    } catch (error) {
      throw new Error(`Failed to load handoff: ${error.message}`);
    }
  }

  /**
   * Get most recent unconsumed handoff
   */
  async getLatestUnconsumed() {
    try {
      const files = await fs.readdir(this.baseDir);

      if (files.length === 0) {
        return null;
      }

      // Sort by timestamp (newest first)
      files.sort().reverse();

      for (const file of files) {
        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        if (!json.consumed) {
          return HandoffArtifact.fromJSON(json);
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to get latest unconsumed handoff: ${error.message}`);
    }
  }

  /**
   * Get all handoffs for an agent
   */
  async getHandoffsFrom(agent_id) {
    try {
      const files = await fs.readdir(this.baseDir);
      const handoffs = [];

      for (const file of files) {
        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        if (json.from_agent === agent_id) {
          handoffs.push(HandoffArtifact.fromJSON(json));
        }
      }

      return handoffs;
    } catch (error) {
      throw new Error(`Failed to get handoffs from agent: ${error.message}`);
    }
  }

  /**
   * Get all unconsumed handoffs
   */
  async getAllUnconsumed() {
    try {
      const files = await fs.readdir(this.baseDir);
      const handoffs = [];

      for (const file of files) {
        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);

        if (!json.consumed) {
          handoffs.push(HandoffArtifact.fromJSON(json));
        }
      }

      return handoffs;
    } catch (error) {
      throw new Error(`Failed to get unconsumed handoffs: ${error.message}`);
    }
  }

  /**
   * Mark handoff as consumed
   */
  async markConsumed(handoff_id) {
    try {
      const handoff = await this.load(handoff_id);
      handoff.markConsumed();
      await this.save(handoff);
    } catch (error) {
      throw new Error(`Failed to mark handoff as consumed: ${error.message}`);
    }
  }

  /**
   * Cleanup old consumed handoffs
   */
  async cleanup(days_to_keep = 7) {
    try {
      const files = await fs.readdir(this.baseDir);
      const now = Date.now();
      const msPerDay = 24 * 60 * 60 * 1000;
      const cutoffTime = now - days_to_keep * msPerDay;

      let deleted_count = 0;

      for (const file of files) {
        const filepath = path.join(this.baseDir, file);
        const stats = await fs.stat(filepath);

        // Delete consumed handoffs older than cutoff
        if (stats.mtimeMs < cutoffTime) {
          const content = await fs.readFile(filepath, 'utf8');
          const json = JSON.parse(content);

          if (json.consumed) {
            await fs.unlink(filepath);
            this.in_memory_cache.delete(json.id);
            deleted_count++;
          }
        }
      }

      return { deleted_count };
    } catch (error) {
      throw new Error(`Failed to cleanup handoffs: ${error.message}`);
    }
  }

  /**
   * List all handoffs (for debugging/inspection)
   */
  async listAll() {
    try {
      const files = await fs.readdir(this.baseDir);
      const handoffs = [];

      for (const file of files) {
        const filepath = path.join(this.baseDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const json = JSON.parse(content);
        handoffs.push(HandoffArtifact.fromJSON(json));
      }

      // Sort by creation time (newest first)
      handoffs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return handoffs;
    } catch (error) {
      throw new Error(`Failed to list handoffs: ${error.message}`);
    }
  }

  /**
   * Clear all handoffs (dangerous operation)
   */
  async clearAll() {
    try {
      const files = await fs.readdir(this.baseDir);

      for (const file of files) {
        const filepath = path.join(this.baseDir, file);
        await fs.unlink(filepath);
      }

      this.in_memory_cache.clear();
      return { cleared_count: files.length };
    } catch (error) {
      throw new Error(`Failed to clear handoffs: ${error.message}`);
    }
  }
}

module.exports = { HandoffStore };
