/**
 * RAG Search Engine
 * Retrieval-Augmented Generation search with citation tracking
 */

import {
  KnowledgeEntry,
  KnowledgeQuery,
  SearchResult,
} from '../knowledge/schema';
import { KnowledgeManager } from '../knowledge/manager';

export interface CitationInfo {
  source: string;
  title: string;
  quote: string;
  relevance: number;
  domain: string;
  expert?: string;
}

export interface RAGResponse {
  query: string;
  results: SearchResult[];
  citations: CitationInfo[];
  summary: string;
  confidence: number;
}

export interface RAGConfig {
  knowledgeManager: KnowledgeManager;
  minRelevance: number;
  maxResults: number;
}

export class RAGSearchEngine {
  private knowledgeManager: KnowledgeManager;
  private minRelevance: number;
  private maxResults: number;

  constructor(config: RAGConfig) {
    this.knowledgeManager = config.knowledgeManager;
    this.minRelevance = config.minRelevance || 0.6;
    this.maxResults = config.maxResults || 5;
  }

  /**
   * Execute RAG search with citations
   */
  async search(query: string, domain?: string): Promise<RAGResponse> {
    try {
      const searchQuery: KnowledgeQuery = {
        text: query,
        domain,
        limit: this.maxResults,
        minRelevance: this.minRelevance,
      };

      const results = await this.knowledgeManager.search(searchQuery);
      const citations = this.buildCitations(results);
      const summary = this.generateSummary(results);
      const confidence = this.calculateConfidence(results);

      return {
        query,
        results,
        citations,
        summary,
        confidence,
      };
    } catch (error) {
      throw new Error(
        `RAG search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search with specific domain
   */
  async searchByDomain(query: string, domain: string): Promise<RAGResponse> {
    return this.search(query, domain);
  }

  /**
   * Get rich context for agent decision-making
   */
  async getContextForDecision(
    question: string,
    domains: string[] = []
  ): Promise<{ context: string; citations: CitationInfo[] }> {
    try {
      const allResults: SearchResult[] = [];

      if (domains.length === 0) {
        const response = await this.search(question);
        allResults.push(...response.results);
      } else {
        for (const domain of domains) {
          const response = await this.search(question, domain);
          allResults.push(...response.results);
        }
      }

      const citations = this.buildCitations(allResults);
      const context = this.buildDecisionContext(allResults, citations);

      return { context, citations };
    } catch (error) {
      throw new Error(
        `Failed to get decision context: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Compare perspectives from different domains
   */
  async compareAcrossDomains(question: string, domains: string[]): Promise<{
    results: Map<string, RAGResponse>;
    synthesis: string;
  }> {
    try {
      const results = new Map<string, RAGResponse>();

      for (const domain of domains) {
        const response = await this.search(question, domain);
        results.set(domain, response);
      }

      const synthesis = this.synthesizePerspectives(results);

      return { results, synthesis };
    } catch (error) {
      throw new Error(
        `Failed to compare perspectives: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build citations from search results
   */
  private buildCitations(results: SearchResult[]): CitationInfo[] {
    return results.map((result) => ({
      source: result.entry.source,
      title: result.entry.title,
      quote: result.matchedText || result.entry.summary || 'See source for details',
      relevance: result.relevance,
      domain: result.entry.metadata.domain,
      expert: result.entry.metadata.expert,
    }));
  }

  /**
   * Generate summary from results
   */
  private generateSummary(results: SearchResult[]): string {
    if (results.length === 0) return 'No relevant knowledge found.';

    const topResults = results.slice(0, 3);
    const summaryParts = topResults.map(
      (r) => `${r.entry.metadata.expert || 'Source'}: ${r.entry.summary || r.entry.content.substring(0, 100)}`
    );

    return summaryParts.join(' | ');
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;

    const topRelevance = results[0].relevance;
    const avgRelevance = results.reduce((sum, r) => sum + r.relevance, 0) / results.length;
    const resultCount = Math.min(results.length / 3, 1);

    return (topRelevance * 0.5 + avgRelevance * 0.3 + resultCount * 0.2) * 100;
  }

  /**
   * Build context string for decision-making
   */
  private buildDecisionContext(
    results: SearchResult[],
    citations: CitationInfo[]
  ): string {
    let context = '';

    citations.forEach((citation, index) => {
      context += `[${index + 1}] ${citation.expert || 'Source'}: ${citation.quote}\n`;
      context += `    Source: ${citation.title} (Relevance: ${(citation.relevance * 100).toFixed(1)}%)\n\n`;
    });

    return context;
  }

  /**
   * Synthesize perspectives from multiple domains
   */
  private synthesizePerspectives(results: Map<string, RAGResponse>): string {
    const synthesis: string[] = [];

    for (const [domain, response] of results) {
      if (response.results.length > 0) {
        synthesis.push(`From ${domain}: ${response.summary}`);
      }
    }

    return synthesis.join(' | ') || 'No perspectives found across domains.';
  }
}
