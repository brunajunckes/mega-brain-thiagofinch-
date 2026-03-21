/**
 * Decision Patterns Tests
 */

const { DecisionPatterns } = require('../decision-patterns');

describe('DecisionPatterns', () => {
  const mockDecision = {
    id: 'test_decision_1',
    question: 'Test question',
    recommendation: { position: 'YES', confidence: 0.8 },
  };

  describe('Risk Assessment Pattern', () => {
    it('should analyze risk correctly', () => {
      const analysis = DecisionPatterns.analyzeRisk(mockDecision, {
        potentialLoss: 1000,
        potentialGain: 5000,
        confidenceScore: 0.8,
        reversibilityScore: 0.6,
      });

      expect(analysis.decision_id).toBe(mockDecision.id);
      expect(analysis.risk_level).toMatch(/HIGH|MEDIUM/);
      expect(analysis.recommendation).toMatch(/PROCEED|RECONSIDER/);
      expect(analysis.timestamp).toBeTruthy();
    });

    it('should calculate risk score', () => {
      const analysis = DecisionPatterns.analyzeRisk(mockDecision, {
        potentialLoss: 2000,
        potentialGain: 1000,
      });

      expect(parseFloat(analysis.risk_score)).toBeGreaterThan(0);
      expect(parseFloat(analysis.risk_score)).toBeLessThanOrEqual(100);
    });

    it('should assess reversibility', () => {
      const highReversibility = DecisionPatterns.analyzeRisk(mockDecision, {
        reversibilityScore: 0.9,
      });

      const lowReversibility = DecisionPatterns.analyzeRisk(mockDecision, {
        reversibilityScore: 0.2,
      });

      expect(highReversibility.reversibility).toBe('LOW_COMMITMENT');
      expect(lowReversibility.reversibility).toBe('HIGH_COMMITMENT');
    });
  });

  describe('Multi-Stakeholder Pattern', () => {
    it('should synthesize stakeholder positions', () => {
      const stakeholders = [
        { name: 'A', position: 'SUPPORT' },
        { name: 'B', position: 'SUPPORT' },
        { name: 'C', position: 'OPPOSE' },
        { name: 'D', position: 'NEUTRAL' },
      ];

      const synthesis = DecisionPatterns.synthesizeStakeholders(mockDecision, stakeholders);

      expect(synthesis.total_stakeholders).toBe(4);
      expect(synthesis.support.count).toBe(2);
      expect(synthesis.opposition.count).toBe(1);
      expect(synthesis.neutral.count).toBe(1);
      expect(synthesis.recommendation).toBeTruthy();
    });

    it('should calculate consensus score', () => {
      const allSupport = Array(5)
        .fill(null)
        .map((_, i) => ({ name: `S${i}`, position: 'SUPPORT' }));

      const synthesis = DecisionPatterns.synthesizeStakeholders(mockDecision, allSupport);

      expect(parseFloat(synthesis.consensus_score)).toBeGreaterThan(0.9);
      expect(synthesis.recommendation).toBe('STRONG_CONSENSUS');
    });
  });

  describe('Time-Sensitive Decision Pattern', () => {
    it('should analyze time constraints', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const analysis = DecisionPatterns.analyzeTimeConstraints(mockDecision, {
        deadline: tomorrow.toISOString(),
        executionTime: 2,
        decisionComplexity: 0.5,
      });

      expect(analysis.pressure_level).toMatch(/NONE|HIGH|MODERATE|CRITICAL/);
      expect(analysis.recommended_approach).toMatch(/QUICK_DECISION|DELIBERATE/);
    });

    it('should detect critical deadline pressure', () => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const analysis = DecisionPatterns.analyzeTimeConstraints(mockDecision, {
        deadline: oneHourAgo.toISOString(),
        executionTime: 2,
      });

      expect(analysis.pressure_level).toBe('CRITICAL');
      expect(analysis.decision_quality_impact).toBe('DEGRADED');
    });
  });

  describe('Scenario Comparison Pattern', () => {
    it('should compare multiple scenarios', () => {
      const scenarios = [
        {
          name: 'Conservative',
          expectedValue: 1000,
          riskLevel: 'LOW',
          timelineDays: 30,
          risks: ['Low impact'],
          benefits: ['Safe'],
        },
        {
          name: 'Aggressive',
          expectedValue: 5000,
          riskLevel: 'HIGH',
          timelineDays: 10,
          risks: ['High risk'],
          benefits: ['Quick returns'],
        },
      ];

      const comparison = DecisionPatterns.compareScenarios(scenarios);

      expect(comparison.scenarios.length).toBe(2);
      expect(comparison.recommended_scenario).toBe('Aggressive');
      expect(comparison.trade_offs).toBeTruthy();
    });

    it('should rank scenarios by expected value', () => {
      const scenarios = [
        { name: 'Low', expectedValue: 100 },
        { name: 'High', expectedValue: 500 },
        { name: 'Medium', expectedValue: 300 },
      ];

      const comparison = DecisionPatterns.compareScenarios(scenarios);

      expect(comparison.scenarios[0].name).toBe('High');
      expect(comparison.scenarios[1].name).toBe('Medium');
      expect(comparison.scenarios[2].name).toBe('Low');
    });
  });

  describe('Feedback Loop Pattern', () => {
    it('should update feedback with outcome', () => {
      const outcome = {
        actualValue: 4500,
        actualRiskLevel: 'MEDIUM',
        lessonsLearned: ['Communicate early', 'Have backup plan'],
        successFactors: ['Team alignment', 'Clear goals'],
        failureFactors: ['Resource constraints'],
      };

      const feedback = DecisionPatterns.updateFeedback(mockDecision.id, outcome);

      expect(feedback.decision_id).toBe(mockDecision.id);
      expect(feedback.outcome.actual_value).toBe(4500);
      expect(feedback.learning.lessons_learned.length).toBe(2);
    });

    it('should adjust confidence based on factors', () => {
      const moreSuccessThanFailure = DecisionPatterns.updateFeedback(mockDecision.id, {
        successFactors: ['A', 'B', 'C'],
        failureFactors: ['X'],
      });

      const moreFailureThanSuccess = DecisionPatterns.updateFeedback(mockDecision.id, {
        successFactors: ['A'],
        failureFactors: ['X', 'Y', 'Z'],
      });

      expect(moreSuccessThanFailure.confidence_adjustment).toBe('INCREASE');
      expect(moreFailureThanSuccess.confidence_adjustment).toBe('MAINTAIN');
    });
  });

  describe('Pattern Registry', () => {
    it('should list all available patterns', () => {
      const patterns = DecisionPatterns.getAllPatterns();

      expect(patterns.length).toBe(5);
      expect(patterns.some((p) => p.name === 'Risk Assessment')).toBe(true);
      expect(patterns.some((p) => p.name === 'Multi-Stakeholder Synthesis')).toBe(true);
      expect(patterns.some((p) => p.name === 'Time-Sensitive Analysis')).toBe(true);
      expect(patterns.some((p) => p.name === 'Scenario Comparison')).toBe(true);
      expect(patterns.some((p) => p.name === 'Outcome Feedback')).toBe(true);
    });
  });
});
