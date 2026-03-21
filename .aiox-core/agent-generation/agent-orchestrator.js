/**
 * Agent Orchestrator
 * Coordinates multiple agents for knowledge-driven decisions
 */

class AgentOrchestrator {
  constructor(agents = []) {
    this.agents = new Map();
    this.taskHistory = [];
    this.agentPerformance = new Map();

    agents.forEach((agent) => {
      this.registerAgent(agent);
    });
  }

  /**
   * Register agent in orchestrator
   */
  registerAgent(agent) {
    this.agents.set(agent.id, agent);
    this.agentPerformance.set(agent.id, {
      tasksCompleted: 0,
      avgConfidence: 0,
      successRate: 1.0,
    });
  }

  /**
   * Find best agent for task
   */
  selectBestAgent(task) {
    let bestAgent = null;
    let bestScore = -1;

    for (const [_id, agent] of this.agents) {
      const score = this.calculateTaskFit(agent, task);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return { agent: bestAgent, score: bestScore };
  }

  /**
   * Assign task to agent
   */
  async assignTask(task, agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const execution = {
      id: `task_${Date.now()}`,
      task,
      agentId,
      agentName: agent.name,
      status: 'assigned',
      timestamp: new Date(),
      appliedSkills: this.selectApplicableSkills(agent, task),
      confidence: this.estimateConfidence(agent, task),
    };

    // Record history
    this.taskHistory.push(execution);
    this.updateAgentPerformance(agentId, execution);

    return execution;
  }

  /**
   * Execute task with agent matching
   */
  async executeTask(task) {
    const { agent, score } = this.selectBestAgent(task);

    if (!agent) {
      return {
        success: false,
        message: 'No suitable agent found for task',
      };
    }

    const execution = await this.assignTask(task, agent.id);

    return {
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.persona.role,
      },
      execution,
      suitabilityScore: score,
      message: `Task assigned to ${agent.name} (${agent.persona.role})`,
    };
  }

  /**
   * Get agent information
   */
  getAgentInfo(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const performance = this.agentPerformance.get(agentId);

    return {
      ...agent,
      performance,
    };
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get task history
   */
  getTaskHistory(limit = 10) {
    return this.taskHistory.slice(-limit).reverse();
  }

  /**
   * Get orchestration statistics
   */
  getStatistics() {
    const totalTasks = this.taskHistory.length;
    const successfulTasks = this.taskHistory.filter((t) => t.status === 'completed')
      .length;
    const avgConfidence =
      this.taskHistory.length > 0
        ? this.taskHistory.reduce((sum, t) => sum + (t.confidence || 0), 0) /
          this.taskHistory.length
        : 0;

    const agentStats = {};
    for (const [agentId, perf] of this.agentPerformance) {
      agentStats[agentId] = {
        ...perf,
      };
    }

    return {
      totalAgents: this.agents.size,
      totalTasks,
      successfulTasks,
      successRate: totalTasks > 0 ? successfulTasks / totalTasks : 0,
      avgConfidence,
      agentStats,
    };
  }

  // Private helpers

  calculateTaskFit(agent, task) {
    let score = 0;

    // Domain match
    if (agent.metadata.knowledge_domain === task.domain) {
      score += 0.4;
    }

    // Skill match
    const applicableSkills = agent.skills.filter((skill) =>
      task.description.toLowerCase().includes(skill.name.toLowerCase())
    );
    const skillMatchRatio = Math.min(applicableSkills.length / 3, 1);
    score += skillMatchRatio * 0.3;

    // Role relevance
    const roleScores = {
      'ml-expert': task.type === 'ai' ? 0.2 : 0,
      'architect': task.type === 'design' ? 0.2 : 0,
      'product-strategist': task.type === 'product' ? 0.2 : 0,
      'growth-specialist': task.type === 'marketing' ? 0.2 : 0,
      'ops-lead': task.type === 'operations' ? 0.2 : 0,
    };
    score += roleScores[agent.persona.role] || 0.1;

    // Performance history
    const performance = this.agentPerformance.get(agent.id);
    score += (performance.successRate || 1) * 0.1;

    return score;
  }

  selectApplicableSkills(agent, task) {
    return agent.skills
      .filter((skill) =>
        skill.description.toLowerCase().includes(task.description.toLowerCase()) ||
        task.description.toLowerCase().includes(skill.name.toLowerCase())
      )
      .slice(0, 3);
  }

  estimateConfidence(agent, task) {
    const applicableSkills = this.selectApplicableSkills(agent, task);
    const avgSkillConfidence =
      applicableSkills.length > 0
        ? applicableSkills.reduce((sum, s) => sum + (s.confidence || 0.5), 0) /
          applicableSkills.length
        : 0.5;

    const performanceConfidence = this.agentPerformance.get(agent.id).successRate || 1;

    return (avgSkillConfidence + performanceConfidence) / 2;
  }

  updateAgentPerformance(agentId, execution) {
    const perf = this.agentPerformance.get(agentId);
    perf.tasksCompleted += 1;
    perf.avgConfidence =
      (perf.avgConfidence * (perf.tasksCompleted - 1) +
        (execution.confidence || 0.5)) /
      perf.tasksCompleted;
  }
}

module.exports = { AgentOrchestrator };
