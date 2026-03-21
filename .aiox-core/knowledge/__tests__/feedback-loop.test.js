/**
 * Knowledge Feedback Loop Tests
 */

const { KnowledgeFeedbackLoop } = require('../feedback-loop');
const path = require('path');
const fs = require('fs');

describe('KnowledgeFeedbackLoop', () => {
  let loop;
  let testStoragePath;

  beforeEach(() => {
    testStoragePath = path.join(__dirname, '..', '__temp_test');
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true });
    }
    loop = new KnowledgeFeedbackLoop(testStoragePath);
  });

  afterEach(() => {
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true });
    }
  });

  describe('Record Feedback', () => {
    it('should record decision feedback', () => {
      const feedback = loop.recordFeedback('decision_123', {
        status: 'SUCCESS',
        actualOutcome: 'Feature implemented on time',
        valueGenerated: 5000,
        timeToValue: 48,
        stakeholderSatisfaction: 0.95,
      });

      expect(feedback.id).toBeTruthy();
      expect(feedback.decision_id).toBe('decision_123');
      expect(feedback.status).toBe('SUCCESS');
      expect(feedback.value_generated).toBe(5000);
    });

    it('should update feedback entries list', () => {
      expect(loop.feedbackEntries.length).toBe(0);

      loop.recordFeedback('dec_1', { status: 'SUCCESS' });
      expect(loop.feedbackEntries.length).toBe(1);

      loop.recordFeedback('dec_2', { status: 'FAILURE' });
      expect(loop.feedbackEntries.length).toBe(2);
    });

    it('should save feedback to disk', () => {
      const feedback = loop.recordFeedback('decision_999', {
        status: 'PARTIAL',
      });

      const feedbackPath = path.join(testStoragePath, 'feedback', `feedback_${feedback.id}.json`);
      expect(fs.existsSync(feedbackPath)).toBe(true);
    });
  });

  describe('Analyze Patterns', () => {
    it('should calculate success rate', () => {
      loop.recordFeedback('dec_1', { status: 'SUCCESS' });
      loop.recordFeedback('dec_2', { status: 'SUCCESS' });
      loop.recordFeedback('dec_3', { status: 'FAILURE' });

      const analysis = loop.analyzePatterns('all');

      expect(analysis.feedback_count).toBe(3);
      expect(parseFloat(analysis.success_rate)).toBeCloseTo(66.7, 1);
    });

    it('should extract top lessons', () => {
      loop.recordFeedback('dec_1', {
        status: 'SUCCESS',
        lessonsLearned: ['Communicate early', 'Plan ahead'],
      });
      loop.recordFeedback('dec_2', {
        status: 'SUCCESS',
        lessonsLearned: ['Communicate early', 'Team alignment'],
      });

      const analysis = loop.analyzePatterns('all');

      expect(analysis.top_lessons.length).toBeGreaterThan(0);
      expect(analysis.top_lessons[0].lesson).toBe('Communicate early');
    });

    it('should calculate improvement trend', () => {
      // Add 5 earlier failures
      for (let i = 0; i < 5; i++) {
        loop.recordFeedback(`old_dec_${i}`, { status: 'FAILURE' });
      }

      // Add 5 recent successes
      for (let i = 0; i < 5; i++) {
        loop.recordFeedback(`new_dec_${i}`, { status: 'SUCCESS' });
      }

      const analysis = loop.analyzePatterns('all');

      expect(analysis.improvement_trajectory).toBe('IMPROVING');
    });

    it('should handle insufficient data', () => {
      const analysis = loop.analyzePatterns('nonexistent');

      expect(analysis.feedback_count).toBe(0);
      expect(analysis.analysis).toContain('Insufficient');
    });
  });

  describe('Extract Patterns', () => {
    it('should extract patterns from feedback', () => {
      loop.recordFeedback('dec_1', {
        status: 'SUCCESS',
        timeToValue: 24,
        lessonsLearned: ['Plan ahead'],
      });
      loop.recordFeedback('dec_2', {
        status: 'SUCCESS',
        timeToValue: 36,
        lessonsLearned: ['Plan ahead'],
      });

      const patterns = loop.extractPatterns('all');

      expect(patterns.timing_patterns).toBeTruthy();
      expect(patterns.success_factors).toBeTruthy();
      expect(patterns.risk_patterns).toBeTruthy();
    });

    it('should save patterns to disk', () => {
      loop.recordFeedback('dec_1', { status: 'SUCCESS' });
      loop.extractPatterns('test-domain');

      const patternsPath = path.join(testStoragePath, 'learned-patterns', 'patterns_test-domain.json');
      expect(fs.existsSync(patternsPath)).toBe(true);
    });
  });

  describe('Improvement Recommendations', () => {
    it('should recommend quality improvements', () => {
      // Add 10 failures
      for (let i = 0; i < 10; i++) {
        loop.recordFeedback(`dec_${i}`, { status: 'FAILURE' });
      }
      // Add 3 successes
      for (let i = 0; i < 3; i++) {
        loop.recordFeedback(`dec_success_${i}`, { status: 'SUCCESS' });
      }

      const recommendations = loop.getImprovementRecommendations('all');

      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      const qualityRec = recommendations.recommendations.find((r) => r.type === 'QUALITY');
      expect(qualityRec).toBeTruthy();
      expect(qualityRec.priority).toBe('HIGH');
    });

    it('should recommend stakeholder engagement', () => {
      loop.recordFeedback('dec_1', {
        status: 'SUCCESS',
        stakeholderSatisfaction: 0.4,
      });

      const recommendations = loop.getImprovementRecommendations('all');

      const stakeholderRec = recommendations.recommendations.find((r) => r.type === 'STAKEHOLDER');
      expect(stakeholderRec).toBeTruthy();
    });

    it('should estimate improvement potential', () => {
      loop.recordFeedback('dec_1', { status: 'FAILURE' });

      const recommendations = loop.getImprovementRecommendations('all');

      const potential = recommendations.estimated_improvement_potential;
      expect(potential).toMatch(/\d+%/);
    });
  });

  describe('Knowledge Base Updates', () => {
    it('should prepare knowledge updates', () => {
      loop.recordFeedback('dec_1', {
        status: 'SUCCESS',
        lessonsLearned: ['Success factor 1', 'Success factor 2'],
      });

      const mockKnowledgeManager = {
        ingest: jest.fn().mockResolvedValue({ id: 'entry_1' }),
      };

      const updates = loop.updateKnowledgeBase(mockKnowledgeManager, 'test');

      expect(updates.domain).toBe('test');
      expect(updates.updates_available).toBeGreaterThanOrEqual(0);
      expect(updates.updates).toHaveProperty('success_factors');
      expect(updates.updates).toHaveProperty('learned_lessons');
    });
  });

  describe('Data Export', () => {
    it('should export feedback data', () => {
      loop.recordFeedback('dec_1', { status: 'SUCCESS' });
      loop.recordFeedback('dec_2', { status: 'FAILURE' });

      const exported = loop.exportFeedbackData('all', 'json');

      expect(exported.format).toBe('json');
      expect(exported.count).toBe(2);
      expect(Array.isArray(exported.data)).toBe(true);
    });

    it('should filter by domain', () => {
      loop.feedbackEntries.push({
        domain: 'domain-a',
      });
      loop.feedbackEntries.push({
        domain: 'domain-b',
      });

      const exported = loop.exportFeedbackData('domain-a');

      expect(exported.domain).toBe('domain-a');
    });
  });
});
