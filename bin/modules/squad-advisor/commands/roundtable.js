const RoundtableOrchestrator = require('../lib/roundtable-orchestrator');

class RoundtableHandler {
  async handler(options) {
    try {
      console.log('\n💬 Starting Expert Roundtable Discussion\n');
      console.log(`Question: ${options.question}\n`);

      const experts = options.experts.split(',').map(s => s.trim());
      const roundtableId = options.projectId || `roundtable_${Date.now()}`;
      const rounds = parseInt(options.rounds) || 3;

      const orchestrator = new RoundtableOrchestrator();
      const result = await orchestrator.orchestrate({
        id: roundtableId,
        question: options.question,
        experts,
        rounds,
      });

      console.log('Roundtable discussion complete!\n');
      console.log('Outputs saved to Redis for later retrieval.\n');

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

module.exports = new RoundtableHandler();
