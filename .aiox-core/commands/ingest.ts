/**
 * Ingest Command
 * Adds new knowledge to the knowledge base
 */

import { KnowledgeManager } from '../knowledge/manager';
import { KnowledgeBaseConfig, IngestionRequest } from '../knowledge/schema';
import { join } from 'path';

export async function ingestCommand(input: {
  title: string;
  content: string;
  source: string;
  type: 'video' | 'pdf' | 'course' | 'podcast' | 'text' | 'article' | 'transcript';
  domain: string;
  expert?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  id?: string;
  message: string;
  entry?: any;
}> {
  try {
    const config: KnowledgeBaseConfig = {
      storagePath: join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const manager = new KnowledgeManager(config);

    const request: IngestionRequest = {
      type: input.type,
      title: input.title,
      source: input.source,
      content: input.content,
      domain: input.domain,
      expert: input.expert || 'Unknown Expert',
      tags: input.tags || [],
      metadata: input.metadata,
    };

    const entry = await manager.ingest(request);

    return {
      success: true,
      id: entry.id,
      message: `✅ Knowledge ingested successfully: "${input.title}"`,
      entry: {
        id: entry.id,
        title: entry.title,
        type: entry.type,
        domain: entry.metadata.domain,
        summary: entry.summary,
        keyPoints: entry.keyPoints,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get knowledge statistics
 */
export async function getKnowledgeStats(): Promise<{
  success: boolean;
  stats?: any;
  message: string;
}> {
  try {
    const config: KnowledgeBaseConfig = {
      storagePath: join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const manager = new KnowledgeManager(config);
    const stats = await manager.getStatistics();

    return {
      success: true,
      stats: {
        totalEntries: stats.totalEntries,
        entriesByType: stats.entriesByType,
        entriesByDomain: stats.entriesByDomain,
        totalSize: `${(stats.totalSize / 1024).toFixed(2)} KB`,
        lastUpdated: stats.lastUpdated,
      },
      message: `📊 Knowledge base has ${stats.totalEntries} entries`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
