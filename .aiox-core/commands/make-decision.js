/**
 * Make Decision Command
 * Intelligent decision-making using knowledge + council + agents
 */

const path = require('path');
const { KnowledgeManager } = require('../knowledge/manager');
const { RAGSearchEngine } = require('../rag/search-engine');
const { DeliberationCouncil } = require('../deliberation/council');
const { AgentGenerator } = require('../agent-generation/agent-generator');
const { AgentOrchestrator } = require('../agent-generation/agent-orchestrator');
const { DecisionEngine } = require('../decision/decision-engine');

/**
 * Make strategic decision
 */
async function makeDecision(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    // Initialize all systems
    const knowledgeManager = new KnowledgeManager(config);
    const ragEngine = new RAGSearchEngine({
      knowledgeManager,
      minRelevance: 0.6,
      maxResults: 5,
    });

    const deliberationCouncil = new DeliberationCouncil({
      knowledgeManager,
      ragEngine,
      councilSize: 11,
    });

    const agentGenerator = new AgentGenerator(knowledgeManager);
    const agents = await agentGenerator.generateFromDomain(input.domains?.[0] || 'general');
    const agentOrchestrator = new AgentOrchestrator(agents);

    // Create decision engine
    const decisionEngine = new DecisionEngine(
      knowledgeManager,
      deliberationCouncil,
      agentOrchestrator
    );

    // Make decision
    const decision = await decisionEngine.makeDecision({
      question: input.question,
      domains: input.domains,
      type: input.type || 'decision',
    });

    return {
      success: true,
      decision: {
        id: decision.id,
        question: decision.question,
        recommendation: decision.recommendation.position,
        confidence: (decision.recommendation.confidence * 100).toFixed(1) + '%',
        reasoning: decision.recommendation.rationale,
      },
      execution_plan: decision.action_plan,
      alternatives: decision.alternatives,
      caveats: decision.caveats,
      duration: decision.duration + 'ms',
      message: `✅ Decision made with ${decision.recommendation.confidence.toFixed(2)} confidence`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Decision failed: ${error.message}`,
    };
  }
}

/**
 * Get decision history
 */
async function getDecisionHistory(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    // Initialize systems
    const knowledgeManager = new KnowledgeManager(config);
    const ragEngine = new RAGSearchEngine({
      knowledgeManager,
      minRelevance: 0.6,
      maxResults: 5,
    });

    const deliberationCouncil = new DeliberationCouncil({
      knowledgeManager,
      ragEngine,
      councilSize: 11,
    });

    const agentGenerator = new AgentGenerator(knowledgeManager);
    const agents = await agentGenerator.generateFromDomain('general');
    const agentOrchestrator = new AgentOrchestrator(agents);

    const decisionEngine = new DecisionEngine(
      knowledgeManager,
      deliberationCouncil,
      agentOrchestrator
    );

    const history = decisionEngine.getDecisionHistory(input.limit || 10);

    return {
      success: true,
      decisions: history,
      count: history.length,
      message: `📋 Retrieved ${history.length} recent decisions`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to get history: ${error.message}`,
    };
  }
}

module.exports = {
  makeDecision,
  getDecisionHistory,
};
