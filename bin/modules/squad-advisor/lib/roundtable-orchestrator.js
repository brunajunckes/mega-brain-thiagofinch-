class RoundtableOrchestrator {
  constructor() {
    this.rounds = [];
    this.synthesis = null;
  }

  async orchestrate(config) {
    const { id, projectName, projectDescription, question, experts, rounds = 3 } = config;

    console.log('📋 Roundtable Setup:');
    console.log(`   ID: ${id}`);
    console.log(`   Participants: ${experts.length}`);
    console.log(`   Rounds: ${rounds}\n`);

    // Simulate expert responses (in production, would call Claude API per expert)
    const roundResults = [];

    for (let r = 1; r <= rounds; r++) {
      console.log(`🔄 Round ${r}/${rounds}...`);

      const roundData = {
        round: r,
        responses: [],
      };

      for (const expert of experts) {
        const response = await this.getExpertResponse(expert, projectDescription || question, r, roundResults);
        roundData.responses.push({
          expert: expert.name,
          response,
        });
      }

      roundResults.push(roundData);
      console.log(`✓ Round ${r} complete\n`);
    }

    // Synthesize results
    console.log('🔗 Synthesizing expert consensus...');
    const synthesis = this.synthesizeResponses(roundResults, experts);
    console.log('✓ Synthesis complete\n');

    const markdown = this.generateMarkdown(id, question || projectDescription, experts, roundResults, synthesis);

    return {
      id,
      rounds: roundResults,
      synthesis,
      markdown,
      timestamp: new Date().toISOString(),
    };
  }

  async getExpertResponse(expert, context, round, previousRounds) {
    // Simulate expert perspective based on expertise
    const perspectives = {
      'alex_hormozi': 'Focus on market fit and unit economics',
      'andrew_ng': 'Consider data requirements and ML feasibility',
      'don_norman': 'Prioritize user problem clarity before technical decisions',
      'frank_kern': 'Lead with clear value proposition and messaging',
      'satya_nadella': 'Think about organizational readiness and culture',
    };

    const defaultPerspective = `As an expert, I recommend focusing on the core value delivery.
Build the MVP to validate assumptions, then iterate based on real user feedback.
Don't over-engineer in the beginning.`;

    return perspectives[expert.slug] || defaultPerspective;
  }

  synthesizeResponses(roundResults, experts) {
    return {
      consensus: 'Start with MVP focused on core problem',
      agreements: [
        'Focus on user validation before scaling',
        'Implement metrics from day 1',
        'Keep architecture simple until proven need',
      ],
      disagreements: [],
      recommendation: 'Build lean MVP, measure, then evolve based on data',
    };
  }

  generateMarkdown(id, question, experts, roundResults, synthesis) {
    let md = '# Expert Roundtable Discussion\n\n';
    md += `**ID:** ${id}\n`;
    md += `**Date:** ${new Date().toISOString()}\n\n`;

    md += '## Participants\n';
    experts.forEach(expert => {
      md += `- **${expert.name}** — ${(expert.expertise || []).join(', ')}\n`;
    });

    md += `\n## Question\n${question}\n\n`;

    roundResults.forEach(round => {
      md += `## Round ${round.round}\n\n`;
      round.responses.forEach(resp => {
        md += `### ${resp.expert}\n${resp.response}\n\n`;
      });
    });

    md += '## Consensus\n';
    md += `**Agreement:** ${synthesis.consensus}\n\n`;
    md += '**Key Points:**\n';
    synthesis.agreements.forEach(pt => {
      md += `- ${pt}\n`;
    });

    md += `\n**Recommendation:** ${synthesis.recommendation}\n`;

    return md;
  }
}

module.exports = RoundtableOrchestrator;
