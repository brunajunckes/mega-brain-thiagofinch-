/**
 * Automatic Agent Generator
 * Generates specialized agents from knowledge base entries
 */

const path = require('path');
const fs = require('fs');

class AgentGenerator {
  constructor(knowledgeManager) {
    this.knowledgeManager = knowledgeManager;
    this.generatedAgents = new Map();
  }

  /**
   * Generate specialized agent from knowledge entry
   */
  async generateFromEntry(entry) {
    try {
      const agentId = this.generateAgentId(entry);
      const skills = this.extractSkills(entry);
      const expertise = entry.metadata.tags || [];
      const perspectives = this.inferPerspectives(entry);

      const agent = {
        id: agentId,
        name: this.generateAgentName(entry),
        persona: {
          role: this.inferRole(entry),
          expertise,
          perspectives,
          knowledge_source: entry.id,
        },
        skills: skills.map((skill) => ({
          id: `skill_${skill.id}`,
          name: skill.name,
          description: skill.description,
          domain: entry.metadata.domain,
          confidence: skill.confidence,
        })),
        metadata: {
          source_entry: entry.id,
          source_title: entry.title,
          source_expert: entry.metadata.expert,
          created_at: new Date(),
          knowledge_domain: entry.metadata.domain,
          learning_depth: this.calculateLearningDepth(entry),
        },
      };

      this.generatedAgents.set(agentId, agent);
      return agent;
    } catch (error) {
      throw new Error(`Failed to generate agent from entry: ${error.message}`);
    }
  }

  /**
   * Generate agents from all knowledge in domain
   */
  async generateFromDomain(domain) {
    try {
      const entries = await this.knowledgeManager.getEntriesByDomain(domain);
      const agents = [];

      for (const entry of entries) {
        const agent = await this.generateFromEntry(entry);
        agents.push(agent);
      }

      // Composite agent coordinating domain
      const compositeAgent = this.createCompositeAgent(domain, agents);
      agents.push(compositeAgent);

      return agents;
    } catch (error) {
      throw new Error(`Failed to generate domain agents: ${error.message}`);
    }
  }

  /**
   * Generate specialized agent for specific task
   */
  async generateTaskSpecialist(task, relatedEntries) {
    try {
      const agentId = `task-specialist_${task.replace(/\s+/g, '-').toLowerCase()}`;
      const skills = this.extractTaskSkills(task, relatedEntries);

      const agent = {
        id: agentId,
        name: `${task} Specialist`,
        persona: {
          role: 'specialist',
          expertise: [task.toLowerCase()],
          perspectives: [`${task} focused approach`],
          knowledge_sources: relatedEntries.map((e) => e.id),
        },
        skills,
        metadata: {
          task: task,
          related_entries: relatedEntries.length,
          specialization_depth: relatedEntries.length > 5 ? 'expert' : 'intermediate',
          created_at: new Date(),
        },
      };

      this.generatedAgents.set(agentId, agent);
      return agent;
    } catch (error) {
      throw new Error(`Failed to generate task specialist: ${error.message}`);
    }
  }

  /**
   * Get all generated agents
   */
  getAllAgents() {
    return Array.from(this.generatedAgents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.generatedAgents.get(agentId) || null;
  }

  /**
   * Export agents as YAML for AIOX
   */
  async exportAsAIOXAgents(outputDir) {
    const agents = this.getAllAgents();
    const results = [];

    for (const agent of agents) {
      const yaml = this.agentToYAML(agent);
      const filename = path.join(outputDir, `${agent.id}.yaml`);
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(filename, yaml, 'utf-8');
      results.push({ id: agent.id, file: filename });
    }

    return results;
  }

  // Private helpers

  generateAgentId(entry) {
    const domain = entry.metadata.domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestamp = Date.now().toString(36);
    return `agent_${domain}_${timestamp}`;
  }

  generateAgentName(entry) {
    const expert = entry.metadata.expert || 'Knowledge';
    const domain = entry.metadata.domain;
    return `${expert} (${domain})`;
  }

  extractSkills(entry) {
    const skills = [];
    const keyPoints = entry.keyPoints || [];

    keyPoints.forEach((point, index) => {
      skills.push({
        id: `skill_${index}`,
        name: point.split(':')[0].trim(),
        description: point,
        confidence: 0.7 + (index * 0.05), // Increase confidence for later points
      });
    });

    // Extract from summary
    const summarySkills = entry.summary.split(/[.!?]+/).slice(0, 2);
    summarySkills.forEach((skill, index) => {
      skills.push({
        id: `summary_skill_${index}`,
        name: skill.substring(0, 50),
        description: skill.trim(),
        confidence: 0.6,
      });
    });

    return skills.slice(0, 10); // Top 10 skills
  }

  extractTaskSkills(task, entries) {
    const skills = [];

    entries.forEach((entry, index) => {
      const summary = entry.summary || entry.content.substring(0, 200);
      skills.push({
        id: `task_skill_${index}`,
        name: `${task} Step ${index + 1}`,
        description: summary,
        domain: entry.metadata.domain,
        confidence: 0.8 - (index * 0.05),
      });
    });

    return skills;
  }

  inferRole(entry) {
    const domain = entry.metadata.domain.toLowerCase();
    const roleMap = {
      ai: 'ml-expert',
      'system-design': 'architect',
      product: 'product-strategist',
      marketing: 'growth-specialist',
      operations: 'ops-lead',
      security: 'security-expert',
      ux: 'ux-designer',
      data: 'data-engineer',
    };

    return roleMap[domain] || 'generalist';
  }

  inferPerspectives(entry) {
    const perspectives = [];
    const content = entry.content.toLowerCase();

    if (content.includes('best practice')) perspectives.push('best-practice focused');
    if (content.includes('risk')) perspectives.push('risk-aware');
    if (content.includes('innovation')) perspectives.push('innovation-driven');
    if (content.includes('user')) perspectives.push('user-centric');
    if (content.includes('performance')) perspectives.push('performance-optimized');
    if (content.includes('scalab')) perspectives.push('scalability-first');

    return perspectives.length > 0 ? perspectives : ['pragmatic'];
  }

  calculateLearningDepth(entry) {
    const contentLength = entry.content.length;
    const keyPointCount = entry.keyPoints ? entry.keyPoints.length : 0;

    if (contentLength > 10000 && keyPointCount > 5) return 'expert';
    if (contentLength > 5000 && keyPointCount > 3) return 'advanced';
    if (contentLength > 2000) return 'intermediate';
    return 'foundational';
  }

  createCompositeAgent(domain, agents) {
    return {
      id: `composite_${domain}`,
      name: `${domain} Coordinator`,
      persona: {
        role: 'coordinator',
        expertise: [domain],
        perspectives: [
          'Orchestrates domain specialists',
          'Integrates multiple perspectives',
          'Ensures consistency',
        ],
        knowledge_sources: agents.map((a) => a.metadata.source_entry).filter(Boolean),
      },
      skills: [
        {
          id: 'orchestration',
          name: 'Agent Orchestration',
          description: `Coordinates ${agents.length} specialized agents`,
          domain,
          confidence: 0.95,
        },
        {
          id: 'integration',
          name: 'Knowledge Integration',
          description: 'Synthesizes insights from multiple sources',
          domain,
          confidence: 0.9,
        },
      ],
      metadata: {
        composite: true,
        member_agents: agents.map((a) => a.id),
        domain,
        created_at: new Date(),
      },
    };
  }

  agentToYAML(agent) {
    const yaml = `# Auto-generated agent from knowledge base
name: "${agent.name}"
id: "${agent.id}"
role: "${agent.persona.role}"

expertise:
${agent.persona.expertise.map((e) => `  - ${e}`).join('\n')}

perspectives:
${agent.persona.perspectives.map((p) => `  - ${p}`).join('\n')}

skills:
${agent.skills
  .map(
    (s) => `  - name: "${s.name}"
    description: "${s.description}"
    confidence: ${s.confidence}`
  )
  .join('\n')}

metadata:
  source: "${agent.metadata.source_title || 'auto-generated'}"
  knowledge_domain: "${agent.metadata.knowledge_domain || 'general'}"
  created_at: "${agent.metadata.created_at}"
`;
    return yaml;
  }
}

module.exports = { AgentGenerator };
