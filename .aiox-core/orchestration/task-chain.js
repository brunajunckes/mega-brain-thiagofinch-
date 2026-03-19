/**
 * Task Chain Manager
 * Orchestrates sequential execution of task chains
 * Chains multiple squads together (planning → design → development → qa)
 */

const fs = require('fs').promises;
const path = require('path');
const SquadOrchestrator = require('./squad-orchestrator');

class TaskChain {
  constructor(chainId, config = {}) {
    this.chainId = chainId;
    this.steps = []; // Array of { squad, agents, context }
    this.backendType = config.backendType || 'claude';
    this.orchestrator = new SquadOrchestrator({ backendType: this.backendType });
    this.progress = {};
    this.chainResults = {};
    this.config = config;
  }

  /**
   * Add a step to the chain
   * @param {string} squadId - Squad identifier
   * @param {Array} agents - Agent IDs in squad
   * @param {string} description - Step description
   */
  addStep(squadId, agents, description = '') {
    this.steps.push({
      squadId,
      agents,
      description,
      status: 'pending',
      startTime: null,
      endTime: null,
      results: null,
      error: null,
    });

    this.orchestrator.registerSquad(squadId, agents);
  }

  /**
   * Execute the entire chain
   * @param {Object} initialContext - Initial context for first squad
   * @returns {Promise<Object>} All results
   */
  async execute(initialContext = {}) {
    console.log(`[Chain:${this.chainId}] Starting task chain with ${this.steps.length} steps`);

    let chainContext = { ...initialContext };
    let currentStep = 0;

    for (const step of this.steps) {
      currentStep++;
      console.log(
        `[Chain:${this.chainId}] Step ${currentStep}/${this.steps.length}: ${step.description}`
      );

      try {
        step.status = 'in-progress';
        step.startTime = Date.now();

        // Build context for this squad (previous results + initial context)
        const squadContext = {};
        for (const agentId of step.agents) {
          squadContext[agentId] = {
            ...chainContext,
            previousResults: this.chainResults,
          };
        }

        // Execute squad
        const results = await this.orchestrator.executeSquad(step.squadId, squadContext);

        // Store results
        step.results = Object.fromEntries(results);
        step.status = 'completed';
        step.endTime = Date.now();

        // Feed results to next step
        this.chainResults[step.squadId] = step.results;
        chainContext = { ...chainContext, ...step.results };

        this.progress[step.squadId] = {
          status: 'completed',
          duration: step.endTime - step.startTime,
          timestamp: new Date().toISOString(),
        };

        console.log(
          `[Chain:${this.chainId}] ✓ Step ${currentStep} completed (${step.endTime - step.startTime}ms)`
        );
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.endTime = Date.now();

        this.progress[step.squadId] = {
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        console.error(`[Chain:${this.chainId}] ✗ Step ${currentStep} failed: ${error.message}`);

        if (this.config.stopOnError) {
          throw new Error(
            `Task chain failed at step ${currentStep} (${step.squadId}): ${error.message}`
          );
        }
      }
    }

    console.log(`[Chain:${this.chainId}] ✓ Task chain completed`);
    return this.chainResults;
  }

  /**
   * Get current progress
   */
  getProgress() {
    return {
      chainId: this.chainId,
      totalSteps: this.steps.length,
      completedSteps: this.steps.filter((s) => s.status === 'completed').length,
      failedSteps: this.steps.filter((s) => s.status === 'failed').length,
      progress: this.progress,
      steps: this.steps.map((s) => ({
        squadId: s.squadId,
        description: s.description,
        status: s.status,
        duration: s.endTime && s.startTime ? s.endTime - s.startTime : null,
      })),
    };
  }

  /**
   * Get results for specific squad
   */
  getSquadResults(squadId) {
    return this.chainResults[squadId];
  }

  /**
   * Save progress to memory
   */
  async saveProgress() {
    const memoryDir = path.join(process.cwd(), 'memory');
    const progressFile = path.join(memoryDir, `chain-${this.chainId}-progress.json`);

    try {
      await fs.mkdir(memoryDir, { recursive: true });
      await fs.writeFile(progressFile, JSON.stringify(this.getProgress(), null, 2));
      console.log(`[Chain:${this.chainId}] Progress saved to ${progressFile}`);
    } catch (error) {
      console.error(`Failed to save progress: ${error.message}`);
    }
  }
}

module.exports = TaskChain;
