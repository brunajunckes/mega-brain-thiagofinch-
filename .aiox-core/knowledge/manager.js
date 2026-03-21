/**
 * Knowledge Base Manager
 * Manages ingestion, storage, and retrieval of knowledge entries
 */

const fs = require('fs');
const path = require('path');

class KnowledgeManager {
  constructor(config) {
    this.config = config;
    this.storagePath = config.storagePath;
    this.entries = new Map();
    this.ensureStoragePath();
    this.loadFromDisk();
  }

  ensureStoragePath() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Ingest a new knowledge entry
   */
  async ingest(request) {
    try {
      const id = this.generateId();
      const embedding = this.generateEmbedding(request.content);

      const entry = {
        id,
        type: request.type,
        title: request.title,
        source: request.source,
        content: request.content,
        embedding,
        summary: this.extractSummary(request.content),
        keyPoints: this.extractKeyPoints(request.content),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          domain: request.domain,
          expert: request.expert || 'Unknown',
          tags: request.tags || [],
          language: 'pt-BR',
          sourceUrl: request.metadata?.sourceUrl,
        },
      };

      this.entries.set(id, entry);
      this.saveToDisk();
      return entry;
    } catch (error) {
      throw new Error(
        `Failed to ingest knowledge entry "${request.title}": ${error.message}`
      );
    }
  }

  /**
   * Search for knowledge entries
   */
  async search(query) {
    try {
      const queryEmbedding = this.generateEmbedding(query.text);
      const results = [];

      for (const entry of this.entries.values()) {
        if (query.domain && entry.metadata.domain !== query.domain) {
          continue;
        }

        const relevance = this.cosineSimilarity(queryEmbedding, entry.embedding);
        const minRelevance = query.minRelevance || 0.6;

        if (relevance >= minRelevance) {
          results.push({
            entry,
            relevance,
            matchedText: this.extractMatchedText(query.text, entry.content),
          });
        }
      }

      results.sort((a, b) => b.relevance - a.relevance);
      const limit = query.limit || 5;
      return results.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to search knowledge base: ${error.message}`);
    }
  }

  /**
   * Get entry by ID
   */
  async getEntry(id) {
    return this.entries.get(id) || null;
  }

  /**
   * Delete entry by ID
   */
  async deleteEntry(id) {
    const deleted = this.entries.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  /**
   * Get statistics about knowledge base
   */
  async getStatistics() {
    const entriesByType = {};
    const entriesByDomain = {};
    let totalSize = 0;

    for (const entry of this.entries.values()) {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
      entriesByDomain[entry.metadata.domain] =
        (entriesByDomain[entry.metadata.domain] || 0) + 1;
      totalSize += entry.content.length;
    }

    return {
      totalEntries: this.entries.size,
      entriesByType,
      entriesByDomain,
      totalSize,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all entries for a domain
   */
  async getEntriesByDomain(domain) {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.metadata.domain === domain
    );
  }

  /**
   * Get all entries by type
   */
  async getEntriesByType(type) {
    return Array.from(this.entries.values()).filter((entry) => entry.type === type);
  }

  /**
   * Clear all knowledge entries
   */
  async clear() {
    this.entries.clear();
    this.saveToDisk();
  }

  /**
   * Export all knowledge as JSON
   */
  async export() {
    return JSON.stringify(Array.from(this.entries.values()), null, 2);
  }

  /**
   * Import knowledge from JSON
   */
  async import(jsonData) {
    try {
      const entries = JSON.parse(jsonData);
      for (const entry of entries) {
        this.entries.set(entry.id, entry);
      }
      this.saveToDisk();
      return entries.length;
    } catch (error) {
      throw new Error(`Failed to import knowledge: ${error.message}`);
    }
  }

  // Private helper methods

  generateId() {
    return `know_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  generateEmbedding(text) {
    const dimension = Math.min(this.config.maxEmbeddingDimension || 256, 128);
    const embedding = [];

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    for (let i = 0; i < dimension; i++) {
      const value = Math.sin((hash + i) * 12.9898) * 43758.5453;
      embedding.push(value - Math.floor(value));
    }

    return this.normalizeVector(embedding);
  }

  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map((v) => v / magnitude);
  }

  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    return dotProduct;
  }

  extractSummary(content, maxLength = 200) {
    const sentences = content.split(/[.!?]+/).slice(0, 3);
    const summary = sentences.join('. ').trim();
    return summary.substring(0, maxLength);
  }

  extractKeyPoints(content) {
    const points = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/)) {
        const point = line.replace(/^[-•*\d.]\s+/, '').trim();
        if (point.length > 10) {
          points.push(point);
        }
      }
    }

    return points.slice(0, 5);
  }

  extractMatchedText(query, content, contextLength = 100) {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index === -1) return content.substring(0, contextLength);

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + query.length + contextLength / 2);

    return content.substring(start, end);
  }

  saveToDisk() {
    try {
      const dataPath = path.join(this.storagePath, 'knowledge-base.json');
      const data = Array.from(this.entries.values());
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save knowledge base: ${error.message}`);
    }
  }

  loadFromDisk() {
    try {
      const dataPath = path.join(this.storagePath, 'knowledge-base.json');
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        const entries = JSON.parse(data);
        for (const entry of entries) {
          this.entries.set(entry.id, entry);
        }
      }
    } catch (error) {
      console.error(`Failed to load knowledge base: ${error.message}`);
    }
  }
}

module.exports = { KnowledgeManager };
