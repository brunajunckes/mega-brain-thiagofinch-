/**
 * Example: Complete AIOX Multi-Agent Orchestration
 * Shows how to use Squad Orchestrator + Task Chain for full workflow
 */

const SquadOrchestrator = require('./squad-orchestrator');
const TaskChain = require('./task-chain');
const LLMFactory = require('../llm/llm-factory');

/**
 * EXAMPLE 1: Execute a single squad in parallel
 */
async function example1_parallelSquad() {
  console.log('\n=== Example 1: Parallel Squad Execution ===\n');

  const orchestrator = new SquadOrchestrator({
    backendType: 'ollama', // or 'claude'
  });

  // Register planning squad (3 agents in parallel)
  orchestrator.registerSquad('planning', ['@pm', '@po', '@sm']);

  // Execute with shared context
  const results = await orchestrator.executeSquad('planning', {
    '@pm': {
      prompt: 'Analyze market requirements for AI feature',
    },
    '@po': {
      prompt: 'Define product scope and acceptance criteria',
    },
    '@sm': {
      prompt: 'Create implementation story from requirements',
    },
  });

  // Results are available immediately (all agents ran in parallel)
  console.log('✓ All agents completed in parallel');
  console.log('PM result:', results.get('@pm')?.response?.substring(0, 50) + '...');
  console.log('PO result:', results.get('@po')?.response?.substring(0, 50) + '...');
  console.log('SM result:', results.get('@sm')?.response?.substring(0, 50) + '...');
}

/**
 * EXAMPLE 2: Execute multiple squads sequentially (task chain)
 */
async function example2_taskChain() {
  console.log('\n=== Example 2: Sequential Task Chain ===\n');

  const chain = new TaskChain('story-5.1', {
    backendType: 'ollama',
    stopOnError: false,
  });

  // Define 5-phase workflow
  chain.addStep('planning', ['@pm', '@po', '@sm'], 'Phase 1: Requirements & Story Creation');
  chain.addStep('design', ['@architect', '@data-engineer'], 'Phase 2: Architecture & DB Design');
  chain.addStep('development', ['@dev'], 'Phase 3: Implementation');
  chain.addStep('quality', ['@qa'], 'Phase 4: Testing & Validation');
  chain.addStep('deployment', ['@devops'], 'Phase 5: Deployment');

  // Execute full chain (planning output → design input → dev input → etc)
  const allResults = await chain.execute({
    storyId: 'story-5.1',
    epic: 'EPIC-5: Evolution Engine',
    features: ['Real-time collaboration', 'Offline support'],
  });

  // Check progress
  const progress = chain.getProgress();
  console.log(`\n✓ Task chain completed`);
  console.log(`  Total steps: ${progress.totalSteps}`);
  console.log(`  Completed: ${progress.completedSteps}`);
  console.log(`  Failed: ${progress.failedSteps}`);
}

/**
 * EXAMPLE 3: Hybrid - some squads parallel, some sequential
 */
async function example3_hybridWorkflow() {
  console.log('\n=== Example 3: Hybrid Workflow ===\n');

  const orchestrator = new SquadOrchestrator({
    backendType: 'claude', // Use Claude for important decisions
  });

  // Register squads
  orchestrator.registerSquad('research', ['@analyst']);
  orchestrator.registerSquad('architecture', ['@architect', '@data-engineer']);
  orchestrator.registerSquad('implementation', ['@dev']);
  orchestrator.registerSquad('validation', ['@qa']);

  // Execute squads sequentially (research → architecture → implementation → validation)
  const squadIds = ['research', 'architecture', 'implementation', 'validation'];
  const results = await orchestrator.executeSequence(squadIds, {
    topic: 'Implementing real-time database sync',
  });

  console.log('\n✓ Hybrid workflow completed');
  console.log('Research squad results:', Object.keys(results.research));
  console.log('Architecture squad results:', Object.keys(results.architecture));
}

/**
 * EXAMPLE 4: Switch backends dynamically
 */
async function example4_backendSwitching() {
  console.log('\n=== Example 4: Dynamic Backend Switching ===\n');

  // For development/testing: use Ollama (free, offline)
  const devChain = new TaskChain('dev-feature', {
    backendType: 'ollama',
  });
  devChain.addStep('planning', ['@pm'], 'Quick planning');
  console.log('Development chain using: Ollama (zero cost)');

  // For production/critical: use Claude (expensive but better)
  const prodChain = new TaskChain('prod-feature', {
    backendType: 'claude',
  });
  prodChain.addStep('planning', ['@pm'], 'Critical planning');
  console.log('Production chain using: Claude (high quality)');

  // Key insight: Same workflow, different backends!
  console.log('\n✓ Backend switching example shows flexibility');
}

/**
 * EXAMPLE 5: Monitor squad execution
 */
async function example5_monitoring() {
  console.log('\n=== Example 5: Monitoring Squad Execution ===\n');

  const orchestrator = new SquadOrchestrator({
    backendType: 'ollama',
  });

  orchestrator.registerSquad('monitoring', ['@dev', '@qa', '@devops']);

  // Execute and get log
  await orchestrator.executeSquad('monitoring', {
    '@dev': { prompt: 'Check code quality' },
    '@qa': { prompt: 'Run integration tests' },
    '@devops': { prompt: 'Monitor deployment metrics' },
  });

  // View execution log
  const log = orchestrator.getLog();
  console.log('\nExecution Log:');
  log.forEach((entry) => {
    console.log(`  [${entry.timestamp}] Squad: ${entry.squadId}`);
    console.log(`    Status: ${entry.status}`);
    console.log(`    Duration: ${entry.duration}ms`);
    if (entry.error) console.log(`    Error: ${entry.error}`);
  });
}

/**
 * EXAMPLE 6: Error handling in chains
 */
async function example6_errorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  const chain = new TaskChain('critical-feature', {
    backendType: 'claude',
    stopOnError: false, // Continue even if step fails
  });

  chain.addStep('design', ['@architect'], 'Design phase');
  chain.addStep('implementation', ['@dev'], 'Implementation phase');
  chain.addStep('testing', ['@qa'], 'Testing phase');

  try {
    await chain.execute();
  } catch (error) {
    console.error('Chain error:', error.message);
  }

  // Check which steps failed
  const progress = chain.getProgress();
  progress.steps.forEach((step) => {
    const icon = step.status === 'completed' ? '✓' : '✗';
    console.log(`${icon} ${step.squadId} (${step.duration}ms)`);
  });
}

// Run examples
async function main() {
  try {
    // Uncomment examples to run:
    // await example1_parallelSquad();
    // await example2_taskChain();
    // await example3_hybridWorkflow();
    // await example4_backendSwitching();
    // await example5_monitoring();
    // await example6_errorHandling();

    console.log('\n✓ All example patterns available');
    console.log('Examples demonstrate:');
    console.log('  1. Parallel squad execution');
    console.log('  2. Sequential task chains');
    console.log('  3. Hybrid workflows (parallel + sequential)');
    console.log('  4. Dynamic backend switching (Claude ↔ Ollama)');
    console.log('  5. Monitoring and execution tracking');
    console.log('  6. Error handling strategies');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
