/**
 * Mega-Brain System Initializer
 * Sets up knowledge base, RAG engine, and deliberation council
 */

const path = require('path');
const { KnowledgeManager } = require('../knowledge/manager');
const { RAGSearchEngine } = require('../rag/search-engine');
const { DeliberationCouncil } = require('../deliberation/council');

let knowledgeManager = null;
let ragEngine = null;
let deliberationCouncil = null;

/**
 * Initialize mega-brain system
 */
function initializeMegaBrain() {
  if (knowledgeManager && ragEngine && deliberationCouncil) {
    return { knowledge: knowledgeManager, rag: ragEngine, council: deliberationCouncil };
  }

  // Initialize knowledge manager
  const config = {
    storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
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
function getSystem() {
  if (!knowledgeManager || !ragEngine || !deliberationCouncil) {
    return initializeMegaBrain();
  }
  return { knowledge: knowledgeManager, rag: ragEngine, council: deliberationCouncil };
}

module.exports = { initializeMegaBrain, getSystem };
