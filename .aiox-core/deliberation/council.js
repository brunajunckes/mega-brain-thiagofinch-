/**
 * Deliberation Council
 * Multi-agent decision-making with evidence-based arguments
 */

class DeliberationCouncil {
  constructor(config) {
    this.knowledgeManager = config.knowledgeManager;
    this.ragEngine = config.ragEngine;
    this.councilSize = config.councilSize || 11;
    this.councilMembers = [];
    this.deliberations = new Map();
    this.initializeCounsil();
  }

  /**
   * Execute deliberation with full council
   */
  async deliberate(question, domains) {
    try {
      const deliberationId = this.generateId();
      const startTime = Date.now();

      // Gather evidence
      const evidence = await this.gatherEvidence(question, domains);

      // Get arguments from each council member
      const memberArguments = await this.gatherArguments(question, evidence);

      // Conduct voting
      const votes = this.conductVoting(memberArguments);

      // Form consensus
      const consensus = this.formConsensus(memberArguments, votes);

      const deliberation = {
        id: deliberationId,
        question,
        members: this.councilMembers,
        arguments: new Map(memberArguments),
        evidence,
        votes,
        consensus,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.deliberations.set(deliberationId, deliberation);
      return deliberation;
    } catch (error) {
      throw new Error(`Deliberation failed: ${error.message}`);
    }
  }

  /**
   * Get deliberation by ID
   */
  async getDeliberation(id) {
    return this.deliberations.get(id) || null;
  }

  /**
   * Get all deliberations
   */
  async getAllDeliberations() {
    return Array.from(this.deliberations.values());
  }

  /**
   * Add custom council member
   */
  addMember(member) {
    if (this.councilMembers.length < this.councilSize) {
      this.councilMembers.push(member);
    }
  }

  /**
   * Remove member by ID
   */
  removeMember(memberId) {
    const index = this.councilMembers.findIndex((m) => m.id === memberId);
    if (index !== -1) {
      this.councilMembers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get council composition
   */
  getCouncilComposition() {
    return [...this.councilMembers];
  }

  // Private helper methods

  initializeCounsil() {
    const defaultMembers = [
      {
        id: 'member-1',
        name: 'Analytic Mind',
        expertise: ['data', 'logic', 'research'],
        perspective: 'Evidence-first approach',
        role: 'analyst',
      },
      {
        id: 'member-2',
        name: 'Pragmatic Operator',
        expertise: ['execution', 'business', 'operations'],
        perspective: 'What works in reality',
        role: 'pragmatist',
      },
      {
        id: 'member-3',
        name: 'Bold Initiator',
        expertise: ['strategy', 'risk', 'innovation'],
        perspective: 'Aggressive growth mindset',
        role: 'hawk',
      },
      {
        id: 'member-4',
        name: 'Cautious Guardian',
        expertise: ['risk', 'compliance', 'stability'],
        perspective: 'Risk mitigation focused',
        role: 'dove',
      },
      {
        id: 'member-5',
        name: 'Idealist Visionary',
        expertise: ['vision', 'purpose', 'culture'],
        perspective: 'Long-term mission alignment',
        role: 'idealist',
      },
      {
        id: 'member-6',
        name: 'Devil Advocate',
        expertise: ['critique', 'alternatives', 'exceptions'],
        perspective: 'Challenge assumptions',
        role: 'devil-advocate',
      },
      {
        id: 'member-7',
        name: 'Customer Champion',
        expertise: ['user', 'market', 'experience'],
        perspective: 'Customer-centric view',
        role: 'pragmatist',
      },
      {
        id: 'member-8',
        name: 'Systems Thinker',
        expertise: ['architecture', 'integration', 'dependencies'],
        perspective: 'Holistic system view',
        role: 'analyst',
      },
      {
        id: 'member-9',
        name: 'Speed Champion',
        expertise: ['efficiency', 'velocity', 'iteration'],
        perspective: 'Bias toward action',
        role: 'hawk',
      },
      {
        id: 'member-10',
        name: 'Quality Guardian',
        expertise: ['quality', 'standards', 'excellence'],
        perspective: 'Excellence matters',
        role: 'dove',
      },
      {
        id: 'member-11',
        name: 'Future Scanner',
        expertise: ['trends', 'foresight', 'scenarios'],
        perspective: 'What could emerge',
        role: 'idealist',
      },
    ];

    this.councilMembers = defaultMembers;
  }

  async gatherEvidence(question, domains) {
    try {
      const response = await this.ragEngine.search(question);
      return response.citations;
    } catch (error) {
      console.error('Failed to gather evidence:', error);
      return [];
    }
  }

  async gatherArguments(question, evidence) {
    const memberArguments = [];

    for (const member of this.councilMembers) {
      const position = this.generatePosition(member, question, evidence);
      const confidence = this.calculateArgumentConfidence(evidence);

      const argument = {
        agentId: member.id,
        position,
        evidence: evidence.slice(0, 2), // Top 2 citations per member
        confidence,
        summary: `${member.name} (${member.role}): ${position}`,
      };

      memberArguments.push([member.id, argument]);
    }

    return memberArguments;
  }

  generatePosition(member, question, evidence) {
    const rolePositions = {
      hawk: `Yes, we should aggressively pursue this. ${question}`,
      dove: `We should be cautious. Let's mitigate risks first.`,
      analyst: `The data suggests this approach. Evidence: ${evidence.length} sources found.`,
      pragmatist: `This is practical and achievable given our constraints.`,
      idealist: `This aligns with our mission and long-term vision.`,
      'devil-advocate': `What if we're wrong? Consider these alternatives...`,
    };

    return rolePositions[member.role] || `Regarding your question: ${question}`;
  }

  conductVoting(memberArguments) {
    const votes = new Map();

    for (const [memberId, arg] of memberArguments) {
      const vote = arg.confidence > 0.7 ? 1 : arg.confidence > 0.5 ? 0 : -1;
      votes.set(memberId, vote);
    }

    return votes;
  }

  formConsensus(memberArguments, votes) {
    const voteValues = Array.from(votes.values());
    const positiveVotes = voteValues.filter((v) => v > 0).length;
    const negativeVotes = voteValues.filter((v) => v < 0).length;
    const neutralVotes = voteValues.filter((v) => v === 0).length;

    const consensus =
      positiveVotes > negativeVotes
        ? 'YES'
        : negativeVotes > positiveVotes
          ? 'NO'
          : 'MIXED';
    const confidence = (positiveVotes + neutralVotes / 2) / voteValues.length;

    const alternativePerspectives = Array.from(memberArguments)
      .filter(([_, arg]) => arg.confidence < 0.6)
      .map(([_, arg]) => arg.position);

    const caveats =
      negativeVotes > 0 ? ['Risk perspectives should be considered'] : [];

    return {
      position: consensus,
      confidence,
      reasoning: `Based on ${memberArguments.length} council members: ${positiveVotes} positive, ${negativeVotes} negative, ${neutralVotes} neutral.`,
      alternativePerspectives,
      caveats,
      actionItems: this.generateActionItems(consensus, memberArguments),
    };
  }

  generateActionItems(consensus, _memberArguments) {
    if (consensus === 'YES') {
      return [
        'Move forward with implementation',
        'Monitor key metrics',
        'Prepare contingency plans',
      ];
    } else if (consensus === 'NO') {
      return ['Explore alternatives', 'Address objections', 'Revisit timeline'];
    } else {
      return ['Gather more data', 'Test hypothesis', 'Clarify assumptions'];
    }
  }

  calculateArgumentConfidence(evidence) {
    if (evidence.length === 0) return 0.5;
    const avgRelevance =
      evidence.reduce((sum, e) => sum + e.relevance, 0) / evidence.length;
    return Math.min(avgRelevance * 1.2, 1);
  }

  generateId() {
    return `del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

module.exports = { DeliberationCouncil };
