/**
 * Squad Orchestrator
 * Coordinates parallel execution of multiple agents within squads
 * Supports both Claude and Ollama backends via LLMFactory
 */

const LLMFactory = require('../llm/llm-factory');
const path = require('path');
const fs = require('fs').promises;

class SquadOrchestrator {
  constructor(config = {}) {
    this.squads = config.squads || {};
    this.backendType = config.backendType || 'claude'; // 'claude' or 'ollama'
    this.backends = new Map(); // agent -> backend instance
    this.executionLog = [];
    this.results = new Map();
  }

  /**
   * Register a squad configuration
   */
  registerSquad(squadId, agents) {
    this.squads[squadId] = agents;
  }

  /**
   * Execute a squad in parallel
   * @param {string} squadId - Squad identifier
   * @param {Object} context - Shared context for all agents in squad
   * @returns {Promise<Map>} Results keyed by agent ID
   */
  async executeSquad(squadId, context = {}) {
    const agents = this.squads[squadId];
    if (!agents) {
      throw new Error(`Squad not found: ${squadId}`);
    }

    console.log(`[Squad:${squadId}] Starting parallel execution of ${agents.length} agents...`);

    const startTime = Date.now();
    const tasks = agents.map((agentId) =>
      this._executeAgent(agentId, context[agentId] || {}, context)
    );

    try {
      const results = await Promise.all(tasks);
      const duration = Date.now() - startTime;

      // Store results
      results.forEach((result, idx) => {
        const agentId = agents[idx];
        this.results.set(agentId, result);
      });

      this.executionLog.push({
        squadId,
        timestamp: new Date().toISOString(),
        agents: agents.length,
        duration,
        status: 'completed',
      });

      console.log(
        `[Squad:${squadId}] ✓ Completed in ${duration}ms (${agents.length} agents)`
      );

      return this.results;
    } catch (error) {
      this.executionLog.push({
        squadId,
        timestamp: new Date().toISOString(),
        agents: agents.length,
        error: error.message,
        status: 'failed',
      });

      throw new Error(`Squad execution failed for ${squadId}: ${error.message}`);
    }
  }

  /**
   * Execute multiple squads sequentially (squad 1 → squad 2 → squad 3)
   * @param {Array} squadIds - Ordered list of squad IDs
   * @param {Object} globalContext - Context shared across all squads
   * @returns {Promise<Object>} All results
   */
  async executeSequence(squadIds, globalContext = {}) {
    console.log(`[Sequence] Starting ${squadIds.length} squad sequence...`);

    const allResults = {};
    let sequenceContext = { ...globalContext };

    for (const squadId of squadIds) {
      try {
        // Execute squad and pass results to next squad
        const squadResults = await this.executeSquad(squadId, sequenceContext);

        allResults[squadId] = Object.fromEntries(squadResults);
        sequenceContext = { ...sequenceContext, ...allResults[squadId] };

        console.log(`[Sequence] → Squad ${squadId} output fed to next squads`);
      } catch (error) {
        console.error(`[Sequence] ✗ Failed at squad ${squadId}: ${error.message}`);
        throw error;
      }
    }

    return allResults;
  }

  /**
   * Get results for a specific agent
   */
  getResult(agentId) {
    return this.results.get(agentId);
  }

  /**
   * Get execution log
   */
  getLog() {
    return this.executionLog;
  }

  /**
   * PRIVATE: Execute single agent with appropriate backend
   */
  async _executeAgent(agentId, agentContext, globalContext) {
    // Get or create backend for this agent
    if (!this.backends.has(agentId)) {
      const backend = LLMFactory.create(this.backendType);
      this.backends.set(agentId, backend);
    }

    const backend = this.backends.get(agentId);

    const task = this._buildTask(agentId, agentContext);
    const mergedContext = { ...globalContext, ...agentContext };

    try {
      const result = await backend.executeAgent(agentId, task, mergedContext);

      return {
        agentId,
        status: 'success',
        response: result.response,
        model: result.model,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        agentId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Build task prompt for agent
   */
  _buildTask(agentId, context) {
    const instructions = this._getAgentInstructions(agentId);
    const promptData = context.prompt || `Execute task for ${agentId}`;

    return `${instructions}\n\nContext:\n${JSON.stringify(context, null, 2)}\n\nTask:\n${promptData}`;
  }

  /**
   * Get agent-specific instructions from .aiox-core/agents/
   */
  _getAgentInstructions(agentId) {
    // Simplified agent instructions (in production, load from YAML)
    const instructions = {
      '@pm': 'You are the Product Manager. Focus on requirements and epic planning.',
      '@po': 'You are the Product Owner. Validate stories and manage backlog.',
      '@sm': 'You are the Scrum Master. Create stories from epics.',
      '@dev': 'You are the Senior Developer. Implement features according to spec.',
      '@architect': 'You are the Software Architect. Design systems and APIs.',
      '@data-engineer': 'You are the Data Engineer. Design databases and optimize queries.',
      '@qa': 'You are the QA Engineer. Test and validate quality.',
      '@ux-design-expert': 'You are the UX Designer. Design user interfaces.',
      '@analyst': 'You are the Business Analyst. Conduct research and analysis.',
      '@devops': 'You are the DevOps Engineer. Manage CI/CD and infrastructure.',
    };

    return instructions[agentId] || 'You are an AI Assistant.';
  }
}

module.exports = SquadOrchestrator;
