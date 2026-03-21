/**
 * Decision Patterns System
 * Advanced decision-making patterns for complex scenarios
 * Phase 3: Advanced Decision Patterns
 */

class DecisionPatterns {
  /**
   * Risk Assessment Pattern
   * Evaluates risk factors and confidence levels
   */
  static analyzeRisk(decision, context = {}) {
    const {
      potentialLoss = 0,
      potentialGain = 0,
      confidenceScore = 0.5,
      reversibilityScore = 0.5, // 0-1: 0=irreversible, 1=fully reversible
    } = context;

    const riskLevel = potentialLoss > potentialGain ? 'HIGH' : 'MEDIUM';
    const riskScore = (potentialLoss / Math.max(potentialLoss + potentialGain, 1)) * 100;
    const reversibilityRating = reversibilityScore > 0.7 ? 'LOW_COMMITMENT' : 'HIGH_COMMITMENT';

    return {
      decision_id: decision.id,
      risk_level: riskLevel,
      risk_score: riskScore.toFixed(1),
      confidence: (confidenceScore * 100).toFixed(1) + '%',
      expected_value: (potentialGain - potentialLoss).toFixed(2),
      reversibility: reversibilityRating,
      recommendation: confidenceScore > 0.7 && riskScore < 50 ? 'PROCEED' : 'RECONSIDER',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Multi-Stakeholder Pattern
   * Synthesizes decisions considering multiple stakeholder perspectives
   */
  static synthesizeStakeholders(decision, stakeholders = []) {
    if (!stakeholders.length) {
      return {
        synthesis: 'No stakeholders provided',
        conflicts: 0,
        alignment: 100,
      };
    }

    const positions = stakeholders.map((s) => s.position || 'NEUTRAL');
    const supportCount = positions.filter((p) => p === 'SUPPORT').length;
    const oppositionCount = positions.filter((p) => p === 'OPPOSE').length;
    const neutralCount = positions.filter((p) => p === 'NEUTRAL').length;

    const totalStakeholders = stakeholders.length;
    const supportPercent = (supportCount / totalStakeholders) * 100;
    const oppositionPercent = (oppositionCount / totalStakeholders) * 100;

    const conflicts = Math.min(supportCount, oppositionCount);
    const alignment = Math.max(supportPercent, oppositionPercent);

    return {
      decision_id: decision.id,
      total_stakeholders: totalStakeholders,
      support: {
        count: supportCount,
        percentage: supportPercent.toFixed(1) + '%',
      },
      opposition: {
        count: oppositionCount,
        percentage: oppositionPercent.toFixed(1) + '%',
      },
      neutral: {
        count: neutralCount,
        percentage: (neutralCount / totalStakeholders * 100).toFixed(1) + '%',
      },
      consensus_score: (alignment / 100).toFixed(2),
      conflict_count: conflicts,
      recommendation: alignment > 66 ? 'STRONG_CONSENSUS' : alignment > 50 ? 'MAJORITY' : 'DIVIDED',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Time-Sensitive Decision Pattern
   * Factors urgency and time constraints into decision quality
   */
  static analyzeTimeConstraints(decision, constraints = {}) {
    const {
      deadline = null,
      executionTime = 0, // hours
      decisionComplexity = 0.5, // 0-1
      learningPotential = 0.5, // 0-1
    } = constraints;

    const now = new Date();
    let hoursUntilDeadline = Infinity;

    if (deadline) {
      const deadlineDate = new Date(deadline);
      hoursUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60);
    }

    const rawTimeAvailability = hoursUntilDeadline - executionTime;
    const timeAvailability = Math.max(0, rawTimeAvailability);
    const pressureLevel =
      hoursUntilDeadline === Infinity
        ? 'NONE'
        : rawTimeAvailability < 0
          ? 'CRITICAL'
          : rawTimeAvailability < executionTime
            ? 'HIGH'
            : 'MODERATE';

    const recommendedApproach =
      pressureLevel === 'CRITICAL' || pressureLevel === 'HIGH' ? 'QUICK_DECISION' : 'DELIBERATE';

    return {
      decision_id: decision.id,
      hours_until_deadline: hoursUntilDeadline === Infinity ? 'No deadline' : hoursUntilDeadline.toFixed(1),
      execution_time_hours: executionTime,
      time_buffer_hours: Math.max(0, timeAvailability).toFixed(1),
      pressure_level: pressureLevel,
      complexity: (decisionComplexity * 100).toFixed(0) + '%',
      learning_potential: (learningPotential * 100).toFixed(0) + '%',
      recommended_approach: recommendedApproach,
      decision_quality_impact: pressureLevel === 'CRITICAL' ? 'DEGRADED' : 'NORMAL',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Scenario Comparison Pattern
   * Compares multiple decision scenarios
   */
  static compareScenarios(scenarios = []) {
    if (scenarios.length < 2) {
      return { error: 'At least 2 scenarios required for comparison' };
    }

    const comparison = scenarios.map((scenario, index) => ({
      scenario_id: index + 1,
      name: scenario.name || `Scenario ${index + 1}`,
      expected_value: scenario.expectedValue || 0,
      risk_level: scenario.riskLevel || 'UNKNOWN',
      confidence: scenario.confidence || 0.5,
      reversibility: scenario.reversibility || 0.5,
      key_risks: scenario.risks || [],
      key_benefits: scenario.benefits || [],
      timeline_days: scenario.timelineDays || 0,
    }));

    // Rank scenarios by expected value
    const ranked = comparison.sort((a, b) => b.expected_value - a.expected_value);

    return {
      scenarios: ranked,
      recommended_scenario: ranked[0].name,
      recommendation_confidence: 'HIGH',
      trade_offs: {
        best_value: ranked[0].name,
        lowest_risk: ranked.reduce((min, s) => (s.risk_level === 'LOW' ? s : min)).name || 'N/A',
        fastest_timeline: ranked.reduce((min, s) => (s.timeline_days > 0 && s.timeline_days < min.timeline_days ? s : min)).name || 'N/A',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Feedback Loop Pattern
   * Tracks decision outcomes and learns from them
   */
  static updateFeedback(decisionId, outcome) {
    const {
      actualValue = 0,
      actualRiskLevel = 'UNKNOWN',
      lessonsLearned = [],
      successFactors = [],
      failureFactors = [],
    } = outcome;

    return {
      decision_id: decisionId,
      feedback_timestamp: new Date().toISOString(),
      outcome: {
        actual_value: actualValue,
        actual_risk_level: actualRiskLevel,
      },
      learning: {
        success_factors: successFactors,
        failure_factors: failureFactors,
        lessons_learned: lessonsLearned,
      },
      confidence_adjustment: successFactors.length > failureFactors.length ? 'INCREASE' : 'MAINTAIN',
      recommendation_for_similar_decisions: DecisionPatterns._generateRecommendation(successFactors, failureFactors),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate recommendation based on feedback factors
   */
  static _generateRecommendation(successFactors, failureFactors) {
    if (successFactors.length > failureFactors.length) {
      return 'SIMILAR_DECISIONS_LIKELY_SUCCESSFUL';
    } else if (failureFactors.length > successFactors.length) {
      return 'SIMILAR_DECISIONS_REQUIRE_CAUTION';
    }
    return 'MONITOR_FOR_PATTERN';
  }

  /**
   * Get all available patterns
   */
  static getAllPatterns() {
    return [
      {
        name: 'Risk Assessment',
        description: 'Evaluate potential risks vs. gains',
        method: 'analyzeRisk',
      },
      {
        name: 'Multi-Stakeholder Synthesis',
        description: 'Synthesize positions from multiple stakeholders',
        method: 'synthesizeStakeholders',
      },
      {
        name: 'Time-Sensitive Analysis',
        description: 'Factor urgency and time constraints',
        method: 'analyzeTimeConstraints',
      },
      {
        name: 'Scenario Comparison',
        description: 'Compare multiple decision scenarios',
        method: 'compareScenarios',
      },
      {
        name: 'Outcome Feedback',
        description: 'Track outcomes and learn from decisions',
        method: 'updateFeedback',
      },
    ];
  }
}

module.exports = { DecisionPatterns };
