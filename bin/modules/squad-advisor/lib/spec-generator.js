class SpecGenerator {
  async generate(config) {
    const { projectName, description, roundtableOutput, experts } = config;

    const markdown = this.generateSpecMarkdown(projectName, description, roundtableOutput, experts);
    const evolutionYaml = this.generateEvolutionYaml(projectName, roundtableOutput);

    return {
      markdown,
      evolutionYaml,
      timestamp: new Date().toISOString(),
    };
  }

  generateSpecMarkdown(projectName, description, roundtable, experts) {
    let spec = '# Auto-Evolved Specification\n\n';
    spec += `**Project:** ${projectName}\n`;
    spec += `**Generated:** ${new Date().toISOString()}\n`;
    spec += '**By:** Squad Advisor (Expert Consensus)\n\n';

    spec += '## Executive Summary\n\n';
    spec += `${description}\n\n`;

    spec += '### Expert Consensus\n';
    spec += '**Question:** What\'s the MVP that validates core assumptions?\n\n';
    spec += `**Answer:** ${roundtable.synthesis.recommendation}\n\n`;

    spec += '### Key Agreements\n';
    roundtable.synthesis.agreements.forEach(pt => {
      spec += `- ${pt}\n`;
    });

    spec += '\n## MVP Phase\n\n';
    spec += '**Target:** Launch with minimum viable product\n\n';

    spec += '### Acceptance Criteria\n';
    spec += '- [ ] **AC1:** Core user problem solved\n';
    spec += '- [ ] **AC2:** Metrics instrumentation complete\n';
    spec += '- [ ] **AC3:** User testing validated (5+ beta users)\n';
    spec += '- [ ] **AC4:** 80%+ test coverage\n\n';

    spec += '## Phase 2 — Scale\n\n';
    spec += '**Triggered when:** Daily Active Users reaches 500\n';
    spec += '**Timeline:** 4-6 weeks after MVP launch\n\n';

    spec += '### New Requirements\n';
    spec += '- Implement caching layer\n';
    spec += '- Optimize database queries\n';
    spec += '- Load testing at 5000 CCU\n\n';

    spec += '## Phase 3 — Enterprise\n\n';
    spec += '**Triggered when:** Daily Active Users reaches 5000\n';
    spec += '**Timeline:** 8-12 weeks after Phase 2\n\n';

    spec += '### New Requirements\n';
    spec += '- Implement CDN for static assets\n';
    spec += '- Multi-region deployment\n';
    spec += '- Advanced security features\n\n';

    return spec;
  }

  generateEvolutionYaml(projectName, roundtable) {
    const yaml = `project_name: "${projectName}"
created_at: "${new Date().toISOString()}"
expert_consensus: "${roundtable.synthesis.recommendation}"

mvp_phase:
  target_users: 100
  timeline: "8 weeks"
  quality_gates:
    - "Unit test coverage >= 80%"
    - "Manual QA sign-off"
    - "User acceptance test passed"

phase_2:
  name: "Scale to 10k users"
  trigger:
    type: "metric"
    metric: "daily_active_users"
    threshold: 500
  new_requirements:
    - "Implement caching layer"
    - "Database optimization"
    - "Load testing at scale"

phase_3:
  name: "Scale to 100k users"
  trigger:
    type: "metric"
    metric: "daily_active_users"
    threshold: 5000
  new_requirements:
    - "CDN implementation"
    - "Multi-region support"
    - "Advanced security"

evolution_triggers:
  latency_spike:
    metric: "api_latency_p99_ms"
    threshold: 500
    action: "Review caching strategy, consider database sharding"

  error_rate:
    metric: "error_rate_percent"
    threshold: 1
    action: "Trigger reliability review, add monitoring"

  user_growth:
    metric: "daily_active_users"
    threshold: 500
    action: "Transition to Phase 2"
`;

    return yaml;
  }
}

module.exports = SpecGenerator;
