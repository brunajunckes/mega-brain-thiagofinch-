/**
 * Agent Learning System Tests
 */

const { AgentLearning } = require('../agent-learning');
const path = require('path');
const fs = require('fs');

describe('AgentLearning', () => {
  let learning;
  let testStoragePath;

  beforeEach(() => {
    testStoragePath = path.join(__dirname, '..', '__temp_test');
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true });
    }
    learning = new AgentLearning(testStoragePath);
  });

  afterEach(() => {
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true });
    }
  });

  describe('Record Performance', () => {
    it('should record agent task performance', () => {
      const performance = learning.recordPerformance('agent_ai_123', {
        taskId: 'task_1',
        taskType: 'ml-training',
        domain: 'ai',
        success: true,
        completionTime: 120,
        qualityScore: 0.92,
        skillsUsed: ['Machine Learning', 'Neural Networks'],
        confidence: 0.85,
      });

      expect(performance.agent_id).toBe('agent_ai_123');
      expect(performance.success).toBe(true);
      expect(performance.quality_score).toBe(0.92);
      expect(performance.skills_used).toContain('Machine Learning');
    });

    it('should update agent performance metrics', () => {
      learning.recordPerformance('agent_1', {
        success: true,
        qualityScore: 0.8,
        confidence: 0.9,
        skillsUsed: ['Skill A'],
        domain: 'test',
      });

      learning.recordPerformance('agent_1', {
        success: false,
        qualityScore: 0.6,
        confidence: 0.7,
        skillsUsed: ['Skill A'],
        domain: 'test',
      });

      const perf = learning.agentPerformance['agent_1'];

      expect(perf.tasks_completed).toBe(2);
      expect(perf.successful_tasks).toBe(1);
      expect(perf.average_quality).toBeCloseTo(0.7, 1);
    });

    it('should track skill mastery across tasks', () => {
      learning.recordPerformance('agent_1', {
        success: true,
        qualityScore: 0.9,
        skillsUsed: ['Machine Learning'],
        domain: 'ai',
      });

      learning.recordPerformance('agent_1', {
        success: true,
        qualityScore: 0.85,
        skillsUsed: ['Machine Learning'],
        domain: 'ai',
      });

      const skillKey = 'agent_1_Machine Learning';
      const skillData = learning.skillMastery[skillKey];

      expect(skillData.times_used).toBe(2);
      expect(skillData.success_rate).toBe(1.0);
      expect(skillData.proficiency_level).toBe('EXPERT');
    });
  });

  describe('Learning Profile', () => {
    it('should generate learning profile for agent', () => {
      for (let i = 0; i < 5; i++) {
        learning.recordPerformance('agent_123', {
          success: i < 4,
          qualityScore: 0.85,
          confidence: 0.8,
          skillsUsed: ['Skill A'],
          domain: 'domain-1',
        });
      }

      const profile = learning.getAgentLearningProfile('agent_123');

      expect(profile.agent_id).toBe('agent_123');
      expect(profile.tasks_completed).toBe(5);
      expect(profile.success_rate).toBe('80.0%');
      expect(profile.learning_stage).toBeTruthy();
    });

    it('should identify strengths and weaknesses', () => {
      // Record successes with SkillA
      for (let i = 0; i < 3; i++) {
        learning.recordPerformance('agent_x', {
          success: true,
          skillsUsed: ['SkillA'],
          domain: 'ai',
        });
      }

      // Record failures with SkillB
      for (let i = 0; i < 2; i++) {
        learning.recordPerformance('agent_x', {
          success: false,
          skillsUsed: ['SkillB'],
          domain: 'ai',
        });
      }

      const profile = learning.getAgentLearningProfile('agent_x');

      expect(profile.strengths).toContain('SkillA');
      expect(profile.development_areas).toContain('SkillB');
    });

    it('should return NO_PERFORMANCE_DATA for new agents', () => {
      const profile = learning.getAgentLearningProfile('unknown_agent');

      expect(profile.status).toBe('NO_PERFORMANCE_DATA');
    });
  });

  describe('Skill Mastery', () => {
    it('should calculate proficiency levels', () => {
      // Create expert-level skill (90%+ success)
      for (let i = 0; i < 10; i++) {
        learning.recordPerformance('agent_pro', {
          success: true,
          qualityScore: 0.95,
          skillsUsed: ['Expert Skill'],
          domain: 'ai',
        });
      }

      // Create novice-level skill (40% success)
      for (let i = 0; i < 5; i++) {
        learning.recordPerformance('agent_pro', {
          success: i < 2,
          qualityScore: 0.5,
          skillsUsed: ['Novice Skill'],
          domain: 'ai',
        });
      }

      const mastery = learning.getSkillMastery('agent_pro');

      const expertSkill = mastery.skills.find((s) => s.skill === 'Expert Skill');
      const noviceSkill = mastery.skills.find((s) => s.skill === 'Novice Skill');

      expect(expertSkill.proficiency_level).toBe('EXPERT');
      expect(noviceSkill.proficiency_level).toBe('NOVICE');
    });

    it('should return NO_SKILL_DATA for agents with no skills', () => {
      const mastery = learning.getSkillMastery('unknown_agent');

      expect(mastery.status).toBe('NO_SKILL_DATA');
    });
  });

  describe('Learning Recommendations', () => {
    it('should recommend quality improvements for struggling agents', () => {
      // Record low success rate
      for (let i = 0; i < 10; i++) {
        learning.recordPerformance('agent_struggle', {
          success: i < 2,
          qualityScore: 0.5,
          skillsUsed: ['Skill X'],
          domain: 'test',
        });
      }

      const recommendations = learning.recommendLearning('agent_struggle');

      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      const qualityRec = recommendations.recommendations.find((r) => r.type === 'QUALITY_IMPROVEMENT');
      expect(qualityRec).toBeTruthy();
      expect(qualityRec.priority).toBe('HIGH');
    });

    it('should recommend skill development for novice skills', () => {
      // Add novice skill
      for (let i = 0; i < 3; i++) {
        learning.recordPerformance('agent_dev', {
          success: false,
          qualityScore: 0.4,
          skillsUsed: ['Novice Skill'],
          domain: 'test',
        });
      }

      const recommendations = learning.recommendLearning('agent_dev');

      const skillRec = recommendations.recommendations.find((r) => r.type === 'SKILL_DEVELOPMENT');
      expect(skillRec).toBeTruthy();
    });

    it('should recommend domain expansion for narrow specialists', () => {
      // Only work in one domain
      for (let i = 0; i < 5; i++) {
        learning.recordPerformance('agent_narrow', {
          success: true,
          skillsUsed: ['Skill A'],
          domain: 'only-one-domain',
        });
      }

      const recommendations = learning.recommendLearning('agent_narrow');

      const domainRec = recommendations.recommendations.find((r) => r.type === 'DOMAIN_EXPANSION');
      expect(domainRec).toBeTruthy();
    });
  });

  describe('Capability Updates', () => {
    it('should generate capability updates for agent', () => {
      // Build up performance
      for (let i = 0; i < 20; i++) {
        learning.recordPerformance('agent_grow', {
          success: true,
          qualityScore: 0.88,
          skillsUsed: ['Growth Skill'],
          domain: 'growth-domain',
        });
      }

      const mockAgent = { id: 'agent_grow', name: 'Growing Agent' };
      const updates = learning.updateAgentCapabilities(mockAgent, 'agent_grow');

      expect(updates.agent_id).toBe('agent_grow');
      expect(updates.updates_applied).toBeGreaterThan(0);
      expect(updates.updated_agent).toBeTruthy();
      expect(updates.updated_agent.certified_expertise).toBeTruthy();
    });

    it('should return NO_UPDATES_AVAILABLE for new agents', () => {
      const mockAgent = { id: 'new_agent' };
      const updates = learning.updateAgentCapabilities(mockAgent, 'new_agent');

      expect(updates.status).toBe('NO_UPDATES_AVAILABLE');
    });
  });

  describe('Learning Dashboard', () => {
    it('should generate learning dashboard', () => {
      // Setup 3 agents with different performance levels
      const agents = ['agent_good', 'agent_average', 'agent_poor'];

      // Good agent - 90% success
      for (let i = 0; i < 10; i++) {
        learning.recordPerformance('agent_good', {
          success: true,
          qualityScore: 0.9,
          skillsUsed: ['Skill'],
          domain: 'test',
        });
      }

      // Average agent - 60% success
      for (let i = 0; i < 5; i++) {
        learning.recordPerformance('agent_average', {
          success: i < 3,
          qualityScore: 0.7,
          skillsUsed: ['Skill'],
          domain: 'test',
        });
      }

      // Poor agent - 30% success
      for (let i = 0; i < 3; i++) {
        learning.recordPerformance('agent_poor', {
          success: i < 1,
          qualityScore: 0.4,
          skillsUsed: ['Skill'],
          domain: 'test',
        });
      }

      const dashboard = learning.getLearningDashboard(agents);

      expect(dashboard.total_agents_tracked).toBe(3);
      expect(dashboard.agents_with_data).toBe(3);
      expect(dashboard.top_performers.length).toBeGreaterThan(0);
      expect(dashboard.development_needed).toContain('agent_poor');
    });

    it('should track system improvement potential', () => {
      for (let i = 0; i < 3; i++) {
        learning.recordPerformance(`agent_${i}`, {
          success: true,
          qualityScore: 0.8,
          skillsUsed: ['Skill'],
          domain: 'test',
        });
      }

      const dashboard = learning.getLearningDashboard([]);

      expect(dashboard.system_improvement_potential).toMatch(/\d+%/);
    });
  });
});
