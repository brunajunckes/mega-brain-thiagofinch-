/**
 * Knowledge Base Schema
 * Types and interfaces for mega-brain knowledge ingestion system
 */

export type KnowledgeType = 'video' | 'pdf' | 'course' | 'podcast' | 'text' | 'article' | 'transcript';

export interface KnowledgeMetadata {
  createdAt: Date;
  updatedAt: Date;
  domain: string;
  expert?: string;
  tags: string[];
  language?: string;
  duration?: number;
  sourceUrl?: string;
}

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeType;
  title: string;
  source: string;
  content: string;
  embedding: number[];
  summary?: string;
  keyPoints?: string[];
  metadata: KnowledgeMetadata;
}

export interface SearchResult {
  entry: KnowledgeEntry;
  relevance: number;
  matchedText?: string;
}

export interface KnowledgeQuery {
  text: string;
  domain?: string;
  limit?: number;
  minRelevance?: number;
}

export interface IngestionRequest {
  type: KnowledgeType;
  title: string;
  source: string;
  content: string;
  domain: string;
  expert?: string;
  tags?: string[];
  metadata?: Partial<KnowledgeMetadata>;
}

export interface KnowledgeStatistics {
  totalEntries: number;
  entriesByType: Record<KnowledgeType, number>;
  entriesByDomain: Record<string, number>;
  totalSize: number;
  lastUpdated: Date;
}

export interface KnowledgeBaseConfig {
  storagePath: string;
  maxEmbeddingDimension: number;
  autoBackup: boolean;
  backupInterval: number;
}
