/**
 * Decision Engine Tests
 */

const { DecisionEngine } = require('../decision-engine');

describe('DecisionEngine', () => {
  let engine;

  const mockKnowledge = {
    search: jest.fn().mockResolvedValue([
      {
        entry: {
          title: 'AI Best Practices',
          summary: 'Essential practices for AI development',
          metadata: { expert: 'AI Expert' },
        },
        relevance: 0.85,
      },
    ]),
  };

  const mockCouncil = {
    deliberate: jest.fn().mockResolvedValue({
      members: Array(11).fill({}),
      consensus: { position: 'YES', confidence: 0.75, reasoning: 'Consensus reached', alternativePerspectives: [], caveats: [] },
      evidence: [{ source: 'test' }],
    }),
  };

  const mockOrchestrator = {
    executeTask: jest.fn().mockResolvedValue({
      success: true,
      agent: {
        id: 'agent_1',
        name: 'AI Expert',
        role: 'ml-expert',
      },
      suitabilityScore: 0.85,
      execution: {
        appliedSkills: [{ name: 'Machine Learning' }],
      },
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new DecisionEngine(mockKnowledge, mockCouncil, mockOrchestrator);
  });

  it('should make decision using full pipeline', async () => {
    const decision = await engine.makeDecision({
      question: 'Should we implement AI feature?',
      domains: ['ai'],
      type: 'strategic',
    });

    expect(decision.id).toBeTruthy();
    expect(decision.question).toContain('Should we implement');
    expect(decision.recommendation).toBeTruthy();
    expect(decision.agentAssignment.agent_name).toBe('AI Expert');
  });

  it('should provide decision with explanation', async () => {
    const result = await engine.makeDecisionWithExplanation({
      question: 'How to optimize system performance?',
      domains: ['system-design'],
    });

    expect(result.decision).toBeTruthy();
    expect(result).toHaveProperty('confidence');
    expect(result.reasoning).toBeTruthy();
    expect(result.reasoning).toHaveProperty('knowledge');
    expect(result.reasoning).toHaveProperty('council_consensus');
    expect(result.reasoning).toHaveProperty('agent_expertise');
  });

  it('should track decision history', async () => {
    await engine.makeDecision({
      question: 'Decision 1',
      domains: ['ai'],
    });
    await engine.makeDecision({
      question: 'Decision 2',
      domains: ['system-design'],
    });

    const history = engine.getDecisionHistory();
    expect(history.length).toBe(2);
    expect(history[0].question).toBe('Decision 2');
  });

  it('should generate action plan', async () => {
    const decision = await engine.makeDecision({
      question: 'What should we do?',
      domains: ['ai'],
    });

    expect(decision.action_plan).toBeTruthy();
    expect(decision.action_plan.length).toBe(3);
    expect(decision.action_plan[0].step).toBe(1);
    expect(decision.action_plan[1].owner).toBe('AI Expert');
  });

  it('should calculate metrics correctly', async () => {
    await engine.makeDecision({
      question: 'Test decision 1',
      domains: ['ai'],
    });
    await engine.makeDecision({
      question: 'Test decision 2',
      domains: ['system-design'],
    });

    const metrics = engine.getMetrics();

    expect(metrics.totalDecisions).toBe(2);
    expect(metrics.consensusRate).toBeGreaterThan(0);
    expect(metrics.avgConfidenceScore).toBeGreaterThan(0);
  });

  it('should retrieve decision by ID', async () => {
    const decision = await engine.makeDecision({
      question: 'Find this decision',
      domains: ['ai'],
    });

    const retrieved = engine.getDecision(decision.id);
    expect(retrieved).toEqual(decision);
  });
});
