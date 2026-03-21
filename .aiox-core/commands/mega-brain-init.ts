/**
 * Mega-Brain System Initializer
 * Sets up knowledge base, RAG engine, and deliberation council
 */

import { join } from 'path';
import { KnowledgeManager } from '../knowledge/manager';
import { RAGSearchEngine } from '../rag/search-engine';
import { DeliberationCouncil } from '../deliberation/council';
import { KnowledgeBaseConfig } from '../knowledge/schema';

let knowledgeManager: KnowledgeManager | null = null;
let ragEngine: RAGSearchEngine | null = null;
let deliberationCouncil: DeliberationCouncil | null = null;

/**
 * Initialize mega-brain system
 */
export function initializeMegaBrain(): {
  knowledge: KnowledgeManager;
  rag: RAGSearchEngine;
  council: DeliberationCouncil;
} {
  if (knowledgeManager && ragEngine && deliberationCouncil) {
    return { knowledge: knowledgeManager, rag: ragEngine, council: deliberationCouncil };
  }

  // Initialize knowledge manager
  const config: KnowledgeBaseConfig = {
    storagePath: join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
    maxEmbeddingDimension: 256,
    autoBackup: true,
    backupInterval: 3600000,
  };

  knowledgeManager = new KnowledgeManager(config);

  // Initialize RAG engine
  ragEngine = new RAGSearchEngine({
    knowledgeManager,
    minRelevance: 0.6,
    maxResults: 5,
  });

  // Initialize deliberation council
  deliberationCouncil = new DeliberationCouncil({
    knowledgeManager,
    ragEngine,
    councilSize: 11,
  });

  console.log('✅ Mega-Brain system initialized');
  console.log('   • Knowledge Manager: Ready');
  console.log('   • RAG Engine: Ready');
  console.log('   • Deliberation Council: 11 members assembled');

  return { knowledge: knowledgeManager, rag: ragEngine, council: deliberationCouncil };
}

/**
 * Get initialized systems
 */
export function getSystem() {
  if (!knowledgeManager || !ragEngine || !deliberationCouncil) {
    return initializeMegaBrain();
  }
  return { knowledge: knowledgeManager, rag: ragEngine, council: deliberationCouncil };
}
