/**
 * Knowledge Base Manager
 * Manages ingestion, storage, and retrieval of knowledge entries
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  KnowledgeEntry,
  KnowledgeQuery,
  SearchResult,
  IngestionRequest,
  KnowledgeStatistics,
  KnowledgeBaseConfig,
} from './schema';

export class KnowledgeManager {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private config: KnowledgeBaseConfig;
  private storagePath: string;

  constructor(config: KnowledgeBaseConfig) {
    this.config = config;
    this.storagePath = config.storagePath;
    this.ensureStoragePath();
    this.loadFromDisk();
  }

  private ensureStoragePath(): void {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Ingest a new knowledge entry
   */
  async ingest(request: IngestionRequest): Promise<KnowledgeEntry> {
    try {
      const id = this.generateId();
      const embedding = this.generateEmbedding(request.content);

      const entry: KnowledgeEntry = {
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
          expert: request.expert,
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
        `Failed to ingest knowledge entry "${request.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search for knowledge entries
   */
  async search(query: KnowledgeQuery): Promise<SearchResult[]> {
    try {
      const queryEmbedding = this.generateEmbedding(query.text);
      const results: SearchResult[] = [];

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
      throw new Error(
        `Failed to search knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get entry by ID
   */
  async getEntry(id: string): Promise<KnowledgeEntry | null> {
    return this.entries.get(id) || null;
  }

  /**
   * Delete entry by ID
   */
  async deleteEntry(id: string): Promise<boolean> {
    const deleted = this.entries.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  /**
   * Get statistics about knowledge base
   */
  async getStatistics(): Promise<KnowledgeStatistics> {
    const entriesByType: Record<string, number> = {};
    const entriesByDomain: Record<string, number> = {};
    let totalSize = 0;

    for (const entry of this.entries.values()) {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
      entriesByDomain[entry.metadata.domain] = (entriesByDomain[entry.metadata.domain] || 0) + 1;
      totalSize += entry.content.length;
    }

    return {
      totalEntries: this.entries.size,
      entriesByType: entriesByType as Record<string, number>,
      entriesByDomain,
      totalSize,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all entries for a domain
   */
  async getEntriesByDomain(domain: string): Promise<KnowledgeEntry[]> {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.metadata.domain === domain
    );
  }

  /**
   * Get all entries by type
   */
  async getEntriesByType(type: string): Promise<KnowledgeEntry[]> {
    return Array.from(this.entries.values()).filter((entry) => entry.type === type);
  }

  /**
   * Clear all knowledge entries
   */
  async clear(): Promise<void> {
    this.entries.clear();
    this.saveToDisk();
  }

  /**
   * Export all knowledge as JSON
   */
  async export(): Promise<string> {
    return JSON.stringify(Array.from(this.entries.values()), null, 2);
  }

  /**
   * Import knowledge from JSON
   */
  async import(jsonData: string): Promise<number> {
    try {
      const entries = JSON.parse(jsonData) as KnowledgeEntry[];
      for (const entry of entries) {
        this.entries.set(entry.id, entry);
      }
      this.saveToDisk();
      return entries.length;
    } catch (error) {
      throw new Error(
        `Failed to import knowledge: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Private helper methods

  private generateId(): string {
    return `know_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateEmbedding(text: string): number[] {
    // Simple hash-based embedding for local use (no API calls)
    const dimension = Math.min(this.config.maxEmbeddingDimension, 128);
    const embedding: number[] = [];

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

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map((v) => v / magnitude);
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    return dotProduct;
  }

  private extractSummary(content: string, maxLength: number = 200): string {
    const sentences = content.split(/[.!?]+/).slice(0, 3);
    const summary = sentences.join('. ').trim();
    return summary.substring(0, maxLength);
  }

  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];
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

  private extractMatchedText(query: string, content: string, contextLength: number = 100): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index === -1) return content.substring(0, contextLength);

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + query.length + contextLength / 2);

    return content.substring(start, end);
  }

  private saveToDisk(): void {
    try {
      const dataPath = join(this.storagePath, 'knowledge-base.json');
      const data = Array.from(this.entries.values());
      writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(
        `Failed to save knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private loadFromDisk(): void {
    try {
      const dataPath = join(this.storagePath, 'knowledge-base.json');
      if (existsSync(dataPath)) {
        const data = readFileSync(dataPath, 'utf-8');
        const entries = JSON.parse(data) as KnowledgeEntry[];
        for (const entry of entries) {
          this.entries.set(entry.id, entry);
        }
      }
    } catch (error) {
      console.error(
        `Failed to load knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
