/**
 * Agent Generator Tests
 */

const { AgentGenerator } = require('../agent-generator');
const { SkillExtractor } = require('../skill-extractor');

describe('AgentGenerator', () => {
  let generator;
  let mockKnowledgeManager;

  beforeAll(() => {
    mockKnowledgeManager = {
      getEntriesByDomain: jest.fn().mockResolvedValue([
        {
          id: 'know_1',
          title: 'AI Fundamentals',
          domain: 'ai',
          content: 'Machine learning is powerful. Best practices for ML include: data preparation, model training, evaluation.',
          summary: 'AI and ML basics',
          keyPoints: ['Data preparation', 'Model training', 'Evaluation'],
          metadata: {
            domain: 'ai',
            expert: 'AI Expert',
            tags: ['ai', 'ml', 'fundamentals'],
          },
        },
      ]),
    };
    generator = new AgentGenerator(mockKnowledgeManager);
  });

  it('should generate agent from entry', async () => {
    const entry = {
      id: 'know_1',
      title: 'System Design Guide',
      domain: 'system-design',
      content: 'Scalability is key. Follow these patterns: sharding, caching, load balancing.',
      summary: 'System design principles',
      keyPoints: ['Sharding', 'Caching', 'Load balancing'],
      metadata: {
        domain: 'system-design',
        expert: 'Architecture Expert',
        tags: ['architecture', 'performance', 'scalability'],
      },
    };

    const agent = await generator.generateFromEntry(entry);

    expect(agent.id).toBeTruthy();
    expect(agent.name).toContain('Architecture Expert');
    expect(agent.persona.role).toBe('architect');
    expect(agent.skills.length).toBeGreaterThan(0);
  });

  it('should generate agents from domain', async () => {
    const agents = await generator.generateFromDomain('ai');

    expect(agents.length).toBeGreaterThan(0);
    expect(agents[agents.length - 1].persona.role).toBe('coordinator');
  });

  it('should extract skills', async () => {
    const entry = {
      id: 'know_2',
      title: 'Testing Guide',
      domain: 'development',
      content: 'Unit testing is essential. Integration testing ensures system cohesion.',
      summary: 'Testing best practices',
      keyPoints: ['Unit testing', 'Integration testing', 'Test coverage'],
      metadata: {
        domain: 'development',
        expert: 'Test Expert',
        tags: ['testing', 'quality'],
      },
    };

    const skills = generator.extractSkills(entry);

    expect(skills.length).toBeGreaterThan(0);
    expect(skills[0]).toHaveProperty('name');
    expect(skills[0]).toHaveProperty('confidence');
  });

  it('should get all generated agents', async () => {
    await generator.generateFromEntry({
      id: 'test_1',
      title: 'Test Entry',
      domain: 'general',
      content: 'Test content',
      summary: 'Test',
      keyPoints: ['Test'],
      metadata: { domain: 'general', expert: 'Tester', tags: [] },
    });

    const allAgents = generator.getAllAgents();
    expect(allAgents.length).toBeGreaterThan(0);
  });
});

describe('SkillExtractor', () => {
  let extractor;

  beforeAll(() => {
    extractor = new SkillExtractor();
  });

  it('should classify skill correctly', () => {
    const category = extractor.classifySkill('API architecture design');
    expect(['system-design', 'development', 'general']).toContain(category);
  });

  it('should assess maturity level', () => {
    const content =
      'performance optimization performance optimization performance optimization system design system design';
    const maturity = extractor.assessMaturity('performance optimization', content);

    expect(['foundational', 'intermediate', 'advanced', 'expert']).toContain(maturity);
  });

  it('should extract skills from entry', () => {
    const entry = {
      id: 'know_3',
      title: 'DevOps Guide',
      content: 'Deployment best practice: CI/CD automation. Infrastructure as Code principle: use Terraform.',
      summary: 'DevOps essentials',
      keyPoints: ['CI/CD automation', 'Infrastructure as Code', 'Terraform'],
      metadata: {
        domain: 'operations',
        expert: 'DevOps Engineer',
        tags: ['devops', 'automation', 'infrastructure'],
      },
    };

    const skills = extractor.extractSkills(entry);

    expect(skills.length).toBeGreaterThan(0);
    expect(skills.some((s) => s.category === 'operations')).toBe(true);
  });
});
