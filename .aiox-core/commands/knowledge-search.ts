/**
 * Knowledge Search Command
 * Search the knowledge base with RAG
 */

import { KnowledgeManager } from '../knowledge/manager';
import { RAGSearchEngine } from '../rag/search-engine';
import { KnowledgeBaseConfig } from '../knowledge/schema';
import { join } from 'path';

export async function searchKnowledgeCommand(input: {
  query: string;
  domain?: string;
  limit?: number;
  minRelevance?: number;
}): Promise<{
  success: boolean;
  results?: any;
  citations?: any;
  summary?: string;
  confidence?: string;
  message: string;
}> {
  try {
    const config: KnowledgeBaseConfig = {
      storagePath: join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const knowledgeManager = new KnowledgeManager(config);
    const ragEngine = new RAGSearchEngine({
      knowledgeManager,
      minRelevance: input.minRelevance || 0.6,
      maxResults: input.limit || 5,
    });

    // Perform RAG search
    const response = await ragEngine.search(input.query, input.domain);

    // Format results
    const formattedResults = response.results.map((result, index) => ({
      rank: index + 1,
      title: result.entry.title,
      type: result.entry.type,
      domain: result.entry.metadata.domain,
      relevance: (result.relevance * 100).toFixed(1) + '%',
      summary: result.entry.summary,
      matchedText: result.matchedText || 'N/A',
      expert: result.entry.metadata.expert,
    }));

    const formattedCitations = response.citations.map((citation, index) => ({
      rank: index + 1,
      title: citation.title,
      source: citation.source,
      quote: citation.quote,
      relevance: (citation.relevance * 100).toFixed(1) + '%',
      domain: citation.domain,
      expert: citation.expert || 'Unknown',
    }));

    return {
      success: true,
      results: formattedResults,
      citations: formattedCitations,
      summary: response.summary,
      confidence: (response.confidence).toFixed(1) + '%',
      message: `🔍 Found ${response.results.length} relevant knowledge entries`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Search knowledge by domain
 */
export async function searchByDomainCommand(input: {
  domain: string;
}): Promise<{
  success: boolean;
  entries?: any;
  count?: number;
  message: string;
}> {
  try {
    const config: KnowledgeBaseConfig = {
      storagePath: join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const knowledgeManager = new KnowledgeManager(config);
    const entries = await knowledgeManager.getEntriesByDomain(input.domain);

    const formattedEntries = entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      type: entry.type,
      source: entry.source,
      expert: entry.metadata.expert,
      tags: entry.metadata.tags,
      createdAt: entry.metadata.createdAt,
    }));

    return {
      success: true,
      entries: formattedEntries,
      count: entries.length,
      message: `📚 Found ${entries.length} entries in domain "${input.domain}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Domain search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Compare perspectives across domains
 */
export async function compareDomainsCommand(input: {
  query: string;
  domains: string[];
}): Promise<{
  success: boolean;
  results?: any;
  synthesis?: string;
  message: string;
}> {
  try {
    const config: KnowledgeBaseConfig = {
      storagePath: join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const knowledgeManager = new KnowledgeManager(config);
    const ragEngine = new RAGSearchEngine({
      knowledgeManager,
      minRelevance: 0.6,
      maxResults: 5,
    });

    // Compare perspectives across domains
    const comparison = await ragEngine.compareAcrossDomains(input.query, input.domains);

    const formattedResults: Record<string, any> = {};
    for (const [domain, response] of comparison.results) {
      formattedResults[domain] = {
        summary: response.summary,
        confidence: (response.confidence).toFixed(1) + '%',
        resultCount: response.results.length,
        citations: response.citations.length,
      };
    }

    return {
      success: true,
      results: formattedResults,
      synthesis: comparison.synthesis,
      message: `🔀 Compared perspectives across ${input.domains.length} domains`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
