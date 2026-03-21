/**
 * Knowledge Feedback Loop System
 * Tracks decision outcomes and updates knowledge base continuously
 * Phase 3: Knowledge Feedback Loops
 */

const path = require('path');
const fs = require('fs');

class KnowledgeFeedbackLoop {
  constructor(storagePath = path.join(process.cwd(), '.aiox-core', 'data')) {
    this.storagePath = storagePath;
    this.feedbackPath = path.join(storagePath, 'feedback');
    this.learnedPatternsPath = path.join(storagePath, 'learned-patterns');

    // Ensure directories exist
    if (!fs.existsSync(this.feedbackPath)) {
      fs.mkdirSync(this.feedbackPath, { recursive: true });
    }
    if (!fs.existsSync(this.learnedPatternsPath)) {
      fs.mkdirSync(this.learnedPatternsPath, { recursive: true });
    }

    this.feedbackEntries = [];
    this.learnedPatterns = {};
  }

  /**
   * Record decision feedback
   */
  recordFeedback(decisionId, feedback) {
    const entry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      decision_id: decisionId,
      recorded_at: new Date().toISOString(),
      status: feedback.status || 'PENDING', // PENDING, SUCCESS, PARTIAL, FAILURE
      expected_outcome: feedback.expectedOutcome || null,
      actual_outcome: feedback.actualOutcome || null,
      value_generated: feedback.valueGenerated || 0,
      time_to_value: feedback.timeToValue || null, // seconds/hours
      stakeholder_satisfaction: feedback.stakeholderSatisfaction || 0, // 0-1
      quality_metrics: feedback.qualityMetrics || {},
      lessons_learned: feedback.lessonsLearned || [],
      recommendations: feedback.recommendations || [],
    };

    this.feedbackEntries.push(entry);
    this._saveFeedback(entry);

    return entry;
  }

  /**
   * Analyze patterns from decision feedback
   */
  analyzePatterns(domain = 'all') {
    const relevantFeedback =
      domain === 'all'
        ? this.feedbackEntries
        : this.feedbackEntries.filter((f) => {
            // Load decision and check domain
            try {
              const decisions = this._loadJSONFile(path.join(this.storagePath, 'decisions.json')) || [];
              const decision = decisions.find((d) => d.id === f.decision_id);
              return decision && decision.domain === domain;
            } catch {
              return true;
            }
          });

    if (!relevantFeedback.length) {
      return {
        domain,
        feedback_count: 0,
        analysis: 'Insufficient feedback data',
      };
    }

    const successCount = relevantFeedback.filter((f) => f.status === 'SUCCESS').length;
    const failureCount = relevantFeedback.filter((f) => f.status === 'FAILURE').length;
    const successRate = (successCount / relevantFeedback.length) * 100;

    const avgSatisfaction =
      relevantFeedback.reduce((sum, f) => sum + (f.stakeholder_satisfaction || 0), 0) /
      relevantFeedback.length;
    const avgValue = relevantFeedback.reduce((sum, f) => sum + (f.value_generated || 0), 0) / relevantFeedback.length;

    // Extract common lessons
    const lessonCounts = {};
    relevantFeedback.forEach((f) => {
      if (f.lessons_learned && Array.isArray(f.lessons_learned)) {
        f.lessons_learned.forEach((lesson) => {
          lessonCounts[lesson] = (lessonCounts[lesson] || 0) + 1;
        });
      }
    });

    const topLessons = Object.entries(lessonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lesson, count]) => ({ lesson, frequency: count }));

    return {
      domain,
      feedback_count: relevantFeedback.length,
      success_rate: successRate.toFixed(1) + '%',
      average_satisfaction: (avgSatisfaction * 100).toFixed(1) + '%',
      average_value_generated: avgValue.toFixed(2),
      top_lessons: topLessons,
      improvement_trajectory: this._calculateTrend(relevantFeedback),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract learnable patterns
   */
  extractPatterns(domain = 'all') {
    const patterns = {
      domain,
      timing_patterns: this._extractTimingPatterns(domain),
      success_factors: this._extractSuccessFactors(domain),
      risk_patterns: this._extractRiskPatterns(domain),
      decision_types: this._extractDecisionTypePatterns(domain),
      timestamp: new Date().toISOString(),
    };

    this.learnedPatterns[domain] = patterns;
    this._saveLearned(domain, patterns);

    return patterns;
  }

  /**
   * Get improvement recommendations
   */
  getImprovementRecommendations(domain = 'all') {
    const analysis = this.analyzePatterns(domain);
    const patterns = this.extractPatterns(domain);

    const recommendations = [];

    // Check success rate
    const successRate = parseFloat(analysis.success_rate);
    if (successRate < 70) {
      recommendations.push({
        type: 'QUALITY',
        priority: 'HIGH',
        message: `Decision success rate is ${successRate}%. Consider improving decision criteria.`,
      });
    }

    // Check satisfaction
    const satisfaction = parseFloat(analysis.average_satisfaction);
    if (satisfaction < 70) {
      recommendations.push({
        type: 'STAKEHOLDER',
        priority: 'HIGH',
        message: `Stakeholder satisfaction is ${satisfaction}%. Improve stakeholder engagement.`,
      });
    }

    // Check for patterns
    if (patterns.success_factors.length === 0) {
      recommendations.push({
        type: 'LEARNING',
        priority: 'MEDIUM',
        message: 'Insufficient data to extract success patterns. Continue collecting feedback.',
      });
    } else {
      recommendations.push({
        type: 'LEARNING',
        priority: 'LOW',
        message: `Identified ${patterns.success_factors.length} success factors. Leverage in future decisions.`,
      });
    }

    return {
      domain,
      recommendations,
      estimated_improvement_potential: this._estimateImprovement(recommendations),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update knowledge base based on feedback
   */
  updateKnowledgeBase(knowledgeManager, domain = 'all') {
    const patterns = this.extractPatterns(domain);
    const recommendations = this.getImprovementRecommendations(domain);

    const updates = {
      success_factors: [],
      learned_lessons: [],
      risk_updates: [],
    };

    // Convert success factors to knowledge entries
    if (patterns.success_factors.length > 0) {
      patterns.success_factors.forEach((factor) => {
        updates.success_factors.push({
          title: `Success Factor: ${factor}`,
          summary: `Pattern identified as contributing to successful decisions in ${domain}`,
          domain,
          type: 'success-pattern',
          confidence: 0.8,
        });
      });
    }

    // Convert recommendations to knowledge
    recommendations.recommendations.forEach((rec) => {
      updates.learned_lessons.push({
        title: `Improvement Insight: ${rec.message}`,
        summary: `${rec.type} improvement recommendation`,
        domain,
        type: 'improvement',
        priority: rec.priority,
      });
    });

    return {
      domain,
      updates_available: updates.success_factors.length + updates.learned_lessons.length,
      updates,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Private helper: Calculate trend
   */
  _calculateTrend(feedback) {
    if (feedback.length < 2) return 'INSUFFICIENT_DATA';

    const recent = feedback.slice(-5); // Last 5
    const older = feedback.slice(0, Math.max(1, feedback.length - 5));

    const recentSuccess = recent.filter((f) => f.status === 'SUCCESS').length / recent.length;
    const olderSuccess = older.filter((f) => f.status === 'SUCCESS').length / older.length;

    if (recentSuccess > olderSuccess) return 'IMPROVING';
    if (recentSuccess < olderSuccess) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Private helper: Extract timing patterns
   */
  _extractTimingPatterns(domain) {
    const patterns = [];
    const relevant = this.feedbackEntries.filter(
      (f) => f.status === 'SUCCESS' && f.time_to_value !== null
    );

    if (relevant.length > 0) {
      const avgTime =
        relevant.reduce((sum, f) => sum + (f.time_to_value || 0), 0) / relevant.length;
      patterns.push(`Average time to value: ${avgTime.toFixed(1)} hours`);
    }

    return patterns;
  }

  /**
   * Private helper: Extract success factors
   */
  _extractSuccessFactors(domain) {
    const successful = this.feedbackEntries.filter((f) => f.status === 'SUCCESS');
    const factors = new Set();

    successful.forEach((f) => {
      if (f.lessons_learned && Array.isArray(f.lessons_learned)) {
        f.lessons_learned.forEach((l) => factors.add(l));
      }
    });

    return Array.from(factors);
  }

  /**
   * Private helper: Extract risk patterns
   */
  _extractRiskPatterns(domain) {
    const failures = this.feedbackEntries.filter((f) => f.status === 'FAILURE');
    const riskFactors = {};

    failures.forEach((f) => {
      if (f.quality_metrics && typeof f.quality_metrics === 'object') {
        Object.entries(f.quality_metrics).forEach(([key, value]) => {
          if (value < 0.5) {
            riskFactors[key] = (riskFactors[key] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(riskFactors)
      .map(([factor, count]) => `${factor} (${count} failures)`)
      .slice(0, 5);
  }

  /**
   * Private helper: Extract decision type patterns
   */
  _extractDecisionTypePatterns(domain) {
    const typePerformance = {};

    this.feedbackEntries.forEach((f) => {
      const type = f.status;
      if (!typePerformance[type]) {
        typePerformance[type] = { count: 0, successes: 0 };
      }
      typePerformance[type].count++;
      if (f.status === 'SUCCESS') {
        typePerformance[type].successes++;
      }
    });

    return Object.entries(typePerformance).map(([type, data]) => ({
      type,
      success_rate: ((data.successes / data.count) * 100).toFixed(1) + '%',
      count: data.count,
    }));
  }

  /**
   * Private helper: Estimate improvement potential
   */
  _estimateImprovement(recommendations) {
    const highPriority = recommendations.filter((r) => r.priority === 'HIGH').length;
    const potential = Math.min(highPriority * 10, 30); // Max 30% potential
    return potential + '%';
  }

  /**
   * Private helper: Save feedback to file
   */
  _saveFeedback(entry) {
    const filepath = path.join(this.feedbackPath, `feedback_${entry.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
  }

  /**
   * Private helper: Save learned patterns
   */
  _saveLearned(domain, patterns) {
    const filepath = path.join(this.learnedPatternsPath, `patterns_${domain}.json`);
    fs.writeFileSync(filepath, JSON.stringify(patterns, null, 2));
  }

  /**
   * Private helper: Load JSON file
   */
  _loadJSONFile(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Export feedback data for analysis
   */
  exportFeedbackData(domain = 'all', format = 'json') {
    const relevant =
      domain === 'all'
        ? this.feedbackEntries
        : this.feedbackEntries.filter((f) => f.domain === domain);

    return {
      format,
      domain,
      count: relevant.length,
      data: relevant,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { KnowledgeFeedbackLoop };
