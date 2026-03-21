/**
 * Agent Learning System
 * Enables agents to improve performance over time based on outcomes
 * Phase 3: Agent Learning & Continuous Improvement
 */

const path = require('path');
const fs = require('fs');

class AgentLearning {
  constructor(storagePath = path.join(process.cwd(), '.aiox-core', 'data')) {
    this.storagePath = storagePath;
    this.learningPath = path.join(storagePath, 'agent-learning');

    if (!fs.existsSync(this.learningPath)) {
      fs.mkdirSync(this.learningPath, { recursive: true });
    }

    this.agentPerformance = {};
    this.skillMastery = {};
    this.learningHistory = [];
  }

  /**
   * Record agent task performance
   */
  recordPerformance(agentId, taskResult) {
    const {
      taskId,
      taskType,
      domain,
      success = false,
      completionTime = 0,
      qualityScore = 0.5, // 0-1
      skillsUsed = [],
      feedback = null,
      confidence = 0.5,
    } = taskResult;

    const entry = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      agent_id: agentId,
      task_id: taskId,
      task_type: taskType,
      domain,
      success,
      completion_time: completionTime,
      quality_score: qualityScore,
      skills_used: skillsUsed,
      feedback,
      confidence,
      recorded_at: new Date().toISOString(),
    };

    // Update agent performance tracking
    if (!this.agentPerformance[agentId]) {
      this.agentPerformance[agentId] = {
        tasks_completed: 0,
        successful_tasks: 0,
        average_quality: 0,
        average_confidence: 0,
        domains: new Set(),
        last_updated: new Date(),
      };
    }

    const perf = this.agentPerformance[agentId];
    const previousTotalQuality = perf.average_quality * perf.tasks_completed;
    const previousTotalConfidence = perf.average_confidence * perf.tasks_completed;

    perf.tasks_completed++;
    if (success) perf.successful_tasks++;
    perf.average_quality = (previousTotalQuality + qualityScore) / perf.tasks_completed;
    perf.average_confidence = (previousTotalConfidence + confidence) / perf.tasks_completed;
    perf.domains.add(domain);
    perf.last_updated = new Date();

    // Update skill mastery
    skillsUsed.forEach((skill) => {
      const skillKey = `${agentId}_${skill}`;
      if (!this.skillMastery[skillKey]) {
        this.skillMastery[skillKey] = {
          skill,
          agent_id: agentId,
          times_used: 0,
          success_rate: 0,
          average_quality: 0,
          proficiency_level: 'NOVICE',
        };
      }

      const skillData = this.skillMastery[skillKey];
      const previousSuccesses = skillData.success_rate * skillData.times_used;

      skillData.times_used++;
      if (success) {
        skillData.success_rate = (previousSuccesses + 1) / skillData.times_used;
      } else {
        skillData.success_rate = previousSuccesses / skillData.times_used;
      }

      skillData.average_quality = (skillData.average_quality * (skillData.times_used - 1) + qualityScore) / skillData.times_used;
      skillData.proficiency_level = this._calculateProficiency(skillData);
    });

    this.learningHistory.push(entry);
    this._saveLearningEntry(agentId, entry);

    return entry;
  }

  /**
   * Get agent learning profile
   */
  getAgentLearningProfile(agentId) {
    const perf = this.agentPerformance[agentId];

    if (!perf) {
      return {
        agent_id: agentId,
        status: 'NO_PERFORMANCE_DATA',
      };
    }

    const successRate = (perf.successful_tasks / perf.tasks_completed) * 100;

    return {
      agent_id: agentId,
      tasks_completed: perf.tasks_completed,
      success_rate: successRate.toFixed(1) + '%',
      average_quality_score: (perf.average_quality * 100).toFixed(1) + '%',
      average_confidence: (perf.average_confidence * 100).toFixed(1) + '%',
      domains_mastered: Array.from(perf.domains),
      improvement_trend: this._calculateTrend(agentId),
      learning_stage: this._determineStage(perf),
      strengths: this._extractStrengths(agentId),
      development_areas: this._extractWeaknesses(agentId),
      recommended_actions: this._recommendActions(perf),
      last_updated: perf.last_updated.toISOString(),
    };
  }

  /**
   * Get skill mastery details
   */
  getSkillMastery(agentId, skill = null) {
    const skillKeys = Object.keys(this.skillMastery).filter((k) => k.startsWith(`${agentId}_`));

    if (!skillKeys.length) {
      return {
        agent_id: agentId,
        status: 'NO_SKILL_DATA',
      };
    }

    const skills = skillKeys.map((key) => {
      const data = this.skillMastery[key];
      return {
        skill: data.skill,
        times_used: data.times_used,
        success_rate: (data.success_rate * 100).toFixed(1) + '%',
        average_quality: (data.average_quality * 100).toFixed(1) + '%',
        proficiency_level: data.proficiency_level,
      };
    });

    if (skill) {
      return skills.find((s) => s.skill === skill) || { error: 'Skill not found' };
    }

    // Sort by proficiency
    const proficiencyOrder = ['EXPERT', 'ADVANCED', 'INTERMEDIATE', 'NOVICE'];
    skills.sort((a, b) => proficiencyOrder.indexOf(a.proficiency_level) - proficiencyOrder.indexOf(b.proficiency_level));

    return {
      agent_id: agentId,
      total_skills: skills.length,
      skills,
    };
  }

  /**
   * Recommend next learning opportunity
   */
  recommendLearning(agentId) {
    const profile = this.getAgentLearningProfile(agentId);
    const mastery = this.getSkillMastery(agentId);

    const recommendations = [];

    // Check for improvement areas
    if (parseFloat(profile.success_rate) < 75) {
      recommendations.push({
        type: 'QUALITY_IMPROVEMENT',
        priority: 'HIGH',
        message: `Improve task success rate from ${profile.success_rate} to 80%+`,
        suggested_focus: profile.development_areas,
      });
    }

    // Check for skill gaps
    if (mastery.skills && mastery.skills.some((s) => s.proficiency_level === 'NOVICE')) {
      const noviceSkills = mastery.skills
        .filter((s) => s.proficiency_level === 'NOVICE')
        .map((s) => s.skill);

      recommendations.push({
        type: 'SKILL_DEVELOPMENT',
        priority: 'MEDIUM',
        message: `Improve novice-level skills: ${noviceSkills.join(', ')}`,
        suggested_focus: noviceSkills,
      });
    }

    // Recommend new domains
    if (profile.domains_mastered && profile.domains_mastered.length < 3) {
      recommendations.push({
        type: 'DOMAIN_EXPANSION',
        priority: 'LOW',
        message: `Expand expertise to new domains`,
        suggested_focus: ['Explore adjacent domains'],
      });
    }

    return {
      agent_id: agentId,
      current_stage: profile.learning_stage,
      recommendations,
      estimated_improvement_potential: this._estimateGrowth(profile),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update agent capabilities based on learning
   */
  updateAgentCapabilities(agent, agentId) {
    const profile = this.getAgentLearningProfile(agentId);
    const mastery = this.getSkillMastery(agentId);

    if (profile.status === 'NO_PERFORMANCE_DATA') {
      return { status: 'NO_UPDATES_AVAILABLE' };
    }

    const updates = {
      expertise_level: profile.learning_stage,
      quality_certification: Math.round(parseFloat(profile.average_quality_score)),
      mastered_domains: profile.domains_mastered,
      skill_matrix: mastery.skills.map((s) => ({
        skill: s.skill,
        level: s.proficiency_level,
        confidence: s.success_rate,
      })),
    };

    // Create updated agent definition
    const updatedAgent = {
      ...agent,
      learning_profile: profile,
      certified_expertise: updates.expertise_level,
      quality_score: updates.quality_certification,
      capabilities: {
        ...(agent.capabilities || {}),
        ...updates,
      },
      last_capability_update: new Date().toISOString(),
    };

    return {
      agent_id: agentId,
      updates_applied: Object.keys(updates).length,
      updated_agent: updatedAgent,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get learning analytics dashboard
   */
  getLearningDashboard(agentIds = []) {
    const agents = agentIds.length > 0 ? agentIds : Object.keys(this.agentPerformance);

    const profiles = agents
      .map((id) => this.getAgentLearningProfile(id))
      .filter((p) => p.status !== 'NO_PERFORMANCE_DATA');

    const averageSuccess = profiles.length
      ? (profiles.reduce((sum, p) => sum + parseFloat(p.success_rate), 0) / profiles.length).toFixed(1)
      : 0;

    const topPerformers = profiles
      .sort((a, b) => parseFloat(b.success_rate) - parseFloat(a.success_rate))
      .slice(0, 3);

    const developmentNeeded = profiles
      .filter((p) => parseFloat(p.success_rate) < 70)
      .map((p) => p.agent_id);

    return {
      total_agents_tracked: agents.length,
      agents_with_data: profiles.length,
      average_success_rate: averageSuccess + '%',
      top_performers: topPerformers.map((p) => ({
        agent_id: p.agent_id,
        success_rate: p.success_rate,
        quality: p.average_quality_score,
      })),
      development_needed: developmentNeeded,
      system_improvement_potential: this._estimateSystemGrowth(profiles),
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== Private Helpers ====================

  _calculateProficiency(skillData) {
    const successRate = skillData.success_rate;
    const quality = skillData.average_quality;
    const score = (successRate * 0.6 + quality * 0.4) * 100;

    if (score >= 90) return 'EXPERT';
    if (score >= 75) return 'ADVANCED';
    if (score >= 60) return 'INTERMEDIATE';
    return 'NOVICE';
  }

  _calculateTrend(agentId) {
    const entries = this.learningHistory.filter((e) => e.agent_id === agentId);
    if (entries.length < 2) return 'INSUFFICIENT_DATA';

    const recent = entries.slice(-5);
    const older = entries.slice(0, Math.max(1, entries.length - 5));

    const recentAvg = recent.reduce((sum, e) => sum + e.quality_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.quality_score, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return 'IMPROVING';
    if (recentAvg < olderAvg * 0.9) return 'DECLINING';
    return 'STABLE';
  }

  _determineStage(perf) {
    if (perf.tasks_completed < 5) return 'NOVICE';
    if (perf.tasks_completed < 20) return 'DEVELOPING';
    if (perf.average_quality < 0.7) return 'PROFICIENT';
    return 'EXPERT';
  }

  _extractStrengths(agentId) {
    const entries = this.learningHistory.filter((e) => e.agent_id === agentId && e.success);
    const skillCounts = {};

    entries.forEach((e) => {
      e.skills_used.forEach((skill) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([skill]) => skill);
  }

  _extractWeaknesses(agentId) {
    const entries = this.learningHistory.filter((e) => e.agent_id === agentId && !e.success);
    const skillCounts = {};

    entries.forEach((e) => {
      e.skills_used.forEach((skill) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([skill]) => skill);
  }

  _recommendActions(perf) {
    const actions = [];

    if (perf.average_quality < 0.7) {
      actions.push('Implement quality improvement program');
    }

    if (perf.average_confidence < 0.6) {
      actions.push('Build confidence through mentoring');
    }

    if (perf.tasks_completed > 50 && perf.average_quality > 0.85) {
      actions.push('Consider for leadership or mentoring role');
    }

    return actions;
  }

  _estimateGrowth(profile) {
    const current = parseFloat(profile.success_rate);
    const potential = Math.min(current + 20, 95); // Max 95%
    return `From ${current.toFixed(0)}% to ${potential.toFixed(0)}%`;
  }

  _estimateSystemGrowth(profiles) {
    if (!profiles.length) return '0%';
    const avgCurrent = profiles.reduce((sum, p) => sum + parseFloat(p.success_rate), 0) / profiles.length;
    const potential = Math.min(avgCurrent + 15, 92);
    return `From ${avgCurrent.toFixed(0)}% to ${potential.toFixed(0)}%`;
  }

  _saveLearningEntry(agentId, entry) {
    const filepath = path.join(this.learningPath, `${agentId}_${entry.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
  }
}

module.exports = { AgentLearning };
