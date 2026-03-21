/**
 * Agent Orchestrator Tests
 */

const { AgentOrchestrator } = require('../agent-orchestrator');

describe('AgentOrchestrator', () => {
  let orchestrator;
  const mockAgents = [
    {
      id: 'agent_ai_123',
      name: 'AI Expert',
      persona: {
        role: 'ml-expert',
        expertise: ['ai', 'ml'],
      },
      metadata: {
        knowledge_domain: 'ai',
      },
      skills: [
        {
          id: 'skill_1',
          name: 'Machine Learning',
          description: 'Model training and optimization',
          confidence: 0.95,
        },
        {
          id: 'skill_2',
          name: 'Neural Networks',
          description: 'Deep learning architectures',
          confidence: 0.9,
        },
      ],
    },
    {
      id: 'agent_design_456',
      name: 'Architecture Expert',
      persona: {
        role: 'architect',
        expertise: ['system-design', 'architecture'],
      },
      metadata: {
        knowledge_domain: 'system-design',
      },
      skills: [
        {
          id: 'skill_3',
          name: 'System Architecture',
          description: 'Scalable system design',
          confidence: 0.92,
        },
        {
          id: 'skill_4',
          name: 'Performance Optimization',
          description: 'System optimization techniques',
          confidence: 0.88,
        },
      ],
    },
  ];

  beforeEach(() => {
    orchestrator = new AgentOrchestrator(mockAgents);
  });

  it('should register agents', () => {
    const agents = orchestrator.getAllAgents();
    expect(agents.length).toBe(2);
    expect(agents[0].id).toBe('agent_ai_123');
  });

  it('should select best agent for task', () => {
    const task = {
      type: 'ai',
      description: 'Implement machine learning model',
      domain: 'ai',
    };

    const { agent, score } = orchestrator.selectBestAgent(task);

    expect(agent).toBeTruthy();
    expect(agent.persona.role).toBe('ml-expert');
    expect(score).toBeGreaterThan(0);
  });

  it('should assign task to agent', async () => {
    const task = {
      type: 'design',
      description: 'System architecture optimization for scalability',
      domain: 'system-design',
    };

    const execution = await orchestrator.assignTask(task, 'agent_design_456');

    expect(execution.id).toBeTruthy();
    expect(execution.agentId).toBe('agent_design_456');
    expect(execution.status).toBe('assigned');
    expect(execution.confidence).toBeGreaterThan(0);
  });

  it('should execute task with auto-matching', async () => {
    const task = {
      type: 'ai',
      description: 'Train neural network for image classification',
      domain: 'ai',
    };

    const result = await orchestrator.executeTask(task);

    expect(result.success).toBe(true);
    expect(result.agent.role).toBe('ml-expert');
    expect(result.suitabilityScore).toBeGreaterThan(0);
  });

  it('should get agent info with performance', () => {
    const info = orchestrator.getAgentInfo('agent_ai_123');

    expect(info).toBeTruthy();
    expect(info.performance).toHaveProperty('tasksCompleted');
    expect(info.performance).toHaveProperty('avgConfidence');
  });

  it('should track task history', async () => {
    const task1 = {
      type: 'ai',
      description: 'ML task 1',
      domain: 'ai',
    };
    const task2 = {
      type: 'design',
      description: 'Design task',
      domain: 'system-design',
    };

    await orchestrator.executeTask(task1);
    await orchestrator.executeTask(task2);

    const history = orchestrator.getTaskHistory();
    expect(history.length).toBe(2);
  });

  it('should provide orchestration statistics', async () => {
    const task = {
      type: 'ai',
      description: 'Train model',
      domain: 'ai',
    };

    await orchestrator.executeTask(task);

    const stats = orchestrator.getStatistics();

    expect(stats.totalAgents).toBe(2);
    expect(stats.totalTasks).toBe(1);
    expect(stats.avgConfidence).toBeGreaterThan(0);
    expect(stats.agentStats).toBeTruthy();
  });
});
