const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'config', 'agents-registry.json');

class SuperAgentOrchestrator {
    constructor() {
          this.registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
          this.activeAgents = [];
    }

  listAll() {
        console.log('\n=== AIOX Core Agents (Orchestration) ===');
        this.registry.agents.aiox.forEach(a => {
                console.log(`  [${a.phase}] ${a.id} - ${a.role}`);
        });
        console.log('\n=== Claude Subagents (Specialists) ===');
        Object.entries(this.registry.agents.claude).forEach(([cat, agents]) => {
                console.log(`  ${cat}: ${agents.join(', ')}`);
        });
  }

  getAgentsByPhase(phase) {
        return this.registry.agents.aiox.filter(a => a.phase === phase);
  }

  getClaudeCategory(category) {
        return this.registry.agents.claude[category] || [];
  }

  activate(agentId) {
        this.activeAgents.push(agentId);
        console.log(`Agent activated: ${agentId}`);
        return { id: agentId, status: 'active', timestamp: new Date().toISOString() };
  }

  getStatus() {
        return {
                totalAiox: this.registry.agents.aiox.length,
                totalClaude: Object.values(this.registry.agents.claude).flat().length,
                active: this.activeAgents,
                timestamp: new Date().toISOString()
        };
  }

  init() {
        const status = this.getStatus();
        console.log(`\nSuper Agent initialized!`);
        console.log(`AIOX agents: ${status.totalAiox}`);
        console.log(`Claude subagents: ${status.totalClaude}`);
        console.log(`Total: ${status.totalAiox + status.totalClaude}`);
  }
}

const args = process.argv.slice(2);
const orchestrator = new SuperAgentOrchestrator();

if (args.includes('--list')) orchestrator.listAll();
else if (args.includes('--init')) orchestrator.init();
else if (args.includes('--status')) console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
else console.log('Usage: node orchestrator.js [--list|--init|--status]');

module.exports = SuperAgentOrchestrator;
