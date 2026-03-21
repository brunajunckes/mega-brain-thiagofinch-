/**
 * Generate Agents Command
 * Creates specialized agents from knowledge base
 */

const path = require('path');
const { KnowledgeManager } = require('../knowledge/manager');
const { AgentGenerator } = require('../agent-generation/agent-generator');
const { SkillExtractor } = require('../agent-generation/skill-extractor');

/**
 * Generate agents from knowledge domain
 */
async function generateAgentsFromDomain(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const manager = new KnowledgeManager(config);
    const generator = new AgentGenerator(manager);
    const extractor = new SkillExtractor();

    // Generate agents from domain
    const agents = await generator.generateFromDomain(input.domain);

    // Enhance with skills
    const enhancedAgents = agents.map((agent) => ({
      ...agent,
      skills: agent.skills.map((skill) => ({
        ...skill,
        maturity: extractor.assessMaturity(skill.name, ''),
      })),
    }));

    return {
      success: true,
      agents: enhancedAgents,
      count: enhancedAgents.length,
      message: `✅ Generated ${enhancedAgents.length} agents from domain "${input.domain}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Agent generation failed: ${error.message}`,
    };
  }
}

/**
 * Generate specialist agent for task
 */
async function generateTaskSpecialist(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const manager = new KnowledgeManager(config);
    const generator = new AgentGenerator(manager);

    // Search for related knowledge
    const related = await manager.search({
      text: input.task,
      limit: 10,
      minRelevance: 0.5,
    });

    // Generate specialist
    const agent = await generator.generateTaskSpecialist(
      input.task,
      related.map((r) => r.entry)
    );

    return {
      success: true,
      agent,
      relatedKnowledge: related.length,
      message: `🎯 Generated task specialist for "${input.task}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Task specialist generation failed: ${error.message}`,
    };
  }
}

/**
 * Export agents as AIOX YAML
 */
async function exportAgentsAsYAML(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const manager = new KnowledgeManager(config);
    const generator = new AgentGenerator(manager);

    // Generate all agents if domain specified
    if (input.domain) {
      await generator.generateFromDomain(input.domain);
    }

    // Export
    const outputDir = input.outputDir || path.join(process.cwd(), '.aiox-core', 'development', 'agents');
    const results = await generator.exportAsAIOXAgents(outputDir);

    return {
      success: true,
      exported: results,
      count: results.length,
      outputDir,
      message: `📁 Exported ${results.length} agents to ${outputDir}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Export failed: ${error.message}`,
    };
  }
}

module.exports = {
  generateAgentsFromDomain,
  generateTaskSpecialist,
  exportAgentsAsYAML,
};
