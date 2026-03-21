/**
 * Decision Engine
 * Makes intelligent decisions using knowledge, deliberation, and orchestration
 */

class DecisionEngine {
  constructor(knowledgeManager, deliberationCouncil, agentOrchestrator) {
    this.knowledge = knowledgeManager;
    this.council = deliberationCouncil;
    this.orchestrator = agentOrchestrator;
    this.decisions = [];
    this.decisionMetrics = {
      totalDecisions: 0,
      consensusAchieved: 0,
      agentExecutions: 0,
      avgConfidence: 0,
    };
  }

  /**
   * Make decision using full pipeline
   */
  async makeDecision(input) {
    try {
      const decisionId = this.generateId();
      const startTime = Date.now();

      // Step 1: Gather knowledge
      const context = await this.gatherContext(input.question, input.domains);

      // Step 2: Get council deliberation
      const deliberation = await this.council.deliberate(
        input.question,
        input.domains
      );

      // Step 3: Find best agent for execution
      const agentAssignment = await this.orchestrator.executeTask({
        type: input.type || 'decision',
        description: input.question,
        domain: input.domains?.[0],
      });

      // Step 4: Synthesize decision
      const decision = this.synthesizeDecision({
        id: decisionId,
        question: input.question,
        context,
        deliberation,
        agentAssignment,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      });

      this.decisions.push(decision);
      this.updateMetrics(decision);

      return decision;
    } catch (error) {
      throw new Error(`Decision failed: ${error.message}`);
    }
  }

  /**
   * Make decision with explanation
   */
  async makeDecisionWithExplanation(input) {
    const decision = await this.makeDecision(input);

    return {
      decision: decision.recommendation,
      confidence: decision.confidence,
      reasoning: {
        knowledge: decision.context.summary,
        council_consensus: decision.deliberation.consensus.reasoning,
        agent_expertise: decision.agentAssignment.agent,
      },
      alternatives: decision.deliberation.consensus.alternativePerspectives,
      action_plan: decision.action_plan,
      timeline: decision.duration,
    };
  }

  /**
   * Get decision history
   */
  getDecisionHistory(limit = 10) {
    return this.decisions.slice(-limit).reverse();
  }

  /**
   * Get decision by ID
   */
  getDecision(id) {
    return this.decisions.find((d) => d.id === id);
  }

  /**
   * Get decision metrics
   */
  getMetrics() {
    return {
      ...this.decisionMetrics,
      avgConfidenceScore:
        this.decisionMetrics.totalDecisions > 0
          ? this.decisionMetrics.avgConfidence / this.decisionMetrics.totalDecisions
          : 0,
      consensusRate:
        this.decisionMetrics.totalDecisions > 0
          ? this.decisionMetrics.consensusAchieved /
            this.decisionMetrics.totalDecisions
          : 0,
    };
  }

  // Private helpers

  async gatherContext(question, domains) {
    try {
      const context = await this.knowledge.search({
        text: question,
        domain: domains?.[0],
        limit: 5,
        minRelevance: 0.6,
      });

      return {
        relevantEntries: context.length,
        summary: context
          .map((c) => c.entry.summary)
          .join(' | ')
          .substring(0, 500),
        sources: context.map((c) => ({
          title: c.entry.title,
          expert: c.entry.metadata.expert,
          relevance: c.relevance,
        })),
      };
    } catch (error) {
      console.error('Context gathering failed:', error);
      return {
        relevantEntries: 0,
        summary: 'Unable to gather knowledge context',
        sources: [],
      };
    }
  }

  synthesizeDecision(params) {
    const { id, question, context, deliberation, agentAssignment, timestamp, duration } = params;

    const confidence = (deliberation.consensus.confidence +
      agentAssignment.suitabilityScore) /
      2;

    const actionPlan = [
      {
        step: 1,
        action: 'Council Deliberation',
        owner: 'Deliberation Council',
        status: 'completed',
        output: deliberation.consensus.position,
      },
      {
        step: 2,
        action: 'Execute Decision',
        owner: agentAssignment.agent.name,
        role: agentAssignment.agent.role,
        status: 'assigned',
        skills: agentAssignment.execution.appliedSkills.map((s) => s.name),
      },
      {
        step: 3,
        action: 'Monitor Results',
        owner: 'Orchestrator',
        status: 'pending',
        metrics: ['success', 'confidence', 'time_taken'],
      },
    ];

    return {
      id,
      question,
      context,
      deliberation: {
        council_size: deliberation.members.length,
        consensus: deliberation.consensus.position,
        reasoning: deliberation.consensus.reasoning,
        confidence: deliberation.consensus.confidence,
        evidence_count: deliberation.evidence.length,
      },
      agentAssignment: {
        agent_id: agentAssignment.agent.id,
        agent_name: agentAssignment.agent.name,
        agent_role: agentAssignment.agent.role,
        suitability_score: agentAssignment.suitabilityScore,
      },
      recommendation: {
        position: deliberation.consensus.position,
        confidence,
        rationale: `${deliberation.members.length}-member council decided with ${(deliberation.consensus.confidence * 100).toFixed(1)}% confidence. Assigned to ${agentAssignment.agent.name} (${agentAssignment.agent.role}).`,
      },
      action_plan: actionPlan,
      alternatives: deliberation.consensus.alternativePerspectives,
      caveats: deliberation.consensus.caveats,
      timestamp,
      duration,
    };
  }

  updateMetrics(decision) {
    this.decisionMetrics.totalDecisions += 1;
    this.decisionMetrics.avgConfidence += decision.recommendation.confidence;

    if (decision.deliberation.consensus === 'YES' ||
        decision.deliberation.consensus === 'NO') {
      this.decisionMetrics.consensusAchieved += 1;
    }

    this.decisionMetrics.agentExecutions += 1;
  }

  generateId() {
    return `decision_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

module.exports = { DecisionEngine };
