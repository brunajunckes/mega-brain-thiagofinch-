/**
 * Orchestrate Task Command
 * Route tasks to best-suited agents
 */

const path = require('path');
const { KnowledgeManager } = require('../knowledge/manager');
const { AgentGenerator } = require('../agent-generation/agent-generator');
const { AgentOrchestrator } = require('../agent-generation/agent-orchestrator');

/**
 * Orchestrate task to best agent
 */
async function orchestrateTask(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const manager = new KnowledgeManager(config);
    const generator = new AgentGenerator(manager);

    // Generate agents from domain if specified
    let agents = [];
    if (input.domain) {
      agents = await generator.generateFromDomain(input.domain);
    }

    // Create orchestrator
    const orchestrator = new AgentOrchestrator(agents);

    // Execute task
    const result = await orchestrator.executeTask({
      type: input.type || 'general',
      description: input.description,
      domain: input.domain,
    });

    return {
      success: result.success,
      assignment: result.agent,
      execution: result.execution,
      suitabilityScore: result.suitabilityScore,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Orchestration failed: ${error.message}`,
    };
  }
}

/**
 * Get orchestration statistics
 */
async function getOrchestrationStats(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const manager = new KnowledgeManager(config);
    const generator = new AgentGenerator(manager);

    // Generate agents from domain
    const agents = await generator.generateFromDomain(input.domain);
    const orchestrator = new AgentOrchestrator(agents);

    const stats = orchestrator.getStatistics();

    return {
      success: true,
      statistics: stats,
      message: `📊 Orchestration statistics for "${input.domain}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to get stats: ${error.message}`,
    };
  }
}

module.exports = {
  orchestrateTask,
  getOrchestrationStats,
};
