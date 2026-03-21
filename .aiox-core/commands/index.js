/**
 * AIOX Core Commands Index
 * Exports all command modules and routing
 */

// Phase 1: Knowledge & Council
const { ingestCommand, getKnowledgeStats } = require('./ingest');
const { askCouncilCommand, getCouncilComposition } = require('./ask-council');
const {
  searchKnowledgeCommand,
  searchByDomainCommand,
  compareDomainsCommand,
} = require('./knowledge-search');

// Phase 2: Agent Generation & Orchestration
const {
  generateAgentsFromDomain,
  generateTaskSpecialist,
  exportAgentsAsYAML,
} = require('./generate-agents');
const { orchestrateTask, getOrchestrationStats } = require('./orchestrate-task');

// Phase 2: Decision Engine
const { makeDecision, getDecisionHistory } = require('./make-decision');

// Router
const { MegaBrainRouter } = require('./mega-brain-router');

module.exports = {
  // Phase 1
  ingestCommand,
  getKnowledgeStats,
  askCouncilCommand,
  getCouncilComposition,
  searchKnowledgeCommand,
  searchByDomainCommand,
  compareDomainsCommand,

  // Phase 2
  generateAgentsFromDomain,
  generateTaskSpecialist,
  exportAgentsAsYAML,
  orchestrateTask,
  getOrchestrationStats,
  makeDecision,
  getDecisionHistory,

  // Router
  MegaBrainRouter,
};
