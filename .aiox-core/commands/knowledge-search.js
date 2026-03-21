/**
 * Knowledge Search Command
 * Search the knowledge base with RAG
 */

const path = require('path');
const { KnowledgeManager } = require('../knowledge/manager');
const { RAGSearchEngine } = require('../rag/search-engine');

async function searchKnowledgeCommand(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
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
      confidence: response.confidence.toFixed(1) + '%',
      message: `🔍 Found ${response.results.length} relevant knowledge entries`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Search failed: ${error.message}`,
    };
  }
}

/**
 * Search knowledge by domain
 */
async function searchByDomainCommand(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
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
      message: `❌ Domain search failed: ${error.message}`,
    };
  }
}

/**
 * Compare perspectives across domains
 */
async function compareDomainsCommand(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
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
    const comparison = await ragEngine.compareAcrossDomains(
      input.query,
      input.domains
    );

    const formattedResults = {};
    for (const [domain, response] of comparison.results) {
      formattedResults[domain] = {
        summary: response.summary,
        confidence: response.confidence.toFixed(1) + '%',
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
      message: `❌ Comparison failed: ${error.message}`,
    };
  }
}

module.exports = {
  searchKnowledgeCommand,
  searchByDomainCommand,
  compareDomainsCommand,
};
