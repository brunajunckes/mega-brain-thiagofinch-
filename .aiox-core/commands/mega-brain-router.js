/**
 * Mega-Brain CLI Router
 * Registers and routes all mega-brain commands for production integration
 * Phase 3: CLI Router Integration
 */

const { ingestCommand, getKnowledgeStats } = require('./ingest');
const { askCouncilCommand, getCouncilComposition } = require('./ask-council');
const {
  searchKnowledgeCommand,
  searchByDomainCommand,
  compareDomainsCommand,
} = require('./knowledge-search');
const {
  generateAgentsFromDomain,
  generateTaskSpecialist,
  exportAgentsAsYAML,
} = require('./generate-agents');
const { orchestrateTask, getOrchestrationStats } = require('./orchestrate-task');
const { makeDecision, getDecisionHistory } = require('./make-decision');

class MegaBrainRouter {
  /**
   * Register all mega-brain commands
   */
  static registerCommands(program) {
    // Phase 1: Knowledge System Commands

    // ingest command
    program
      .command('ingest')
      .description('Ingest knowledge from various sources')
      .option('--title <title>', 'Knowledge entry title')
      .option('--summary <summary>', 'Knowledge entry summary')
      .option('--type <type>', 'Type of knowledge (best-practice, case-study, etc.)')
      .option('--domain <domain>', 'Domain classification')
      .option('--expert <expert>', 'Expert/source attribution')
      .option('--tags <tags>', 'Comma-separated tags')
      .action(async (options) => {
        try {
          const result = await ingestCommand(options);
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Ingest failed: ${error.message}`);
          process.exit(1);
        }
      });

    // knowledge-search command
    program
      .command('knowledge-search')
      .description('Search knowledge base')
      .option('--query <query>', 'Search query', '')
      .option('--domain <domain>', 'Filter by domain')
      .option('--limit <number>', 'Maximum results', '5')
      .option('--min-relevance <score>', 'Minimum relevance score', '0.6')
      .action(async (options) => {
        try {
          const result = await searchKnowledgeCommand({
            text: options.query,
            domain: options.domain,
            limit: parseInt(options.limit),
            minRelevance: parseFloat(options.minRelevance),
          });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Search failed: ${error.message}`);
          process.exit(1);
        }
      });

    // knowledge-stats command
    program
      .command('knowledge-stats')
      .description('Get knowledge base statistics')
      .action(async () => {
        try {
          const stats = await getKnowledgeStats();
          console.log(JSON.stringify(stats, null, 2));
        } catch (error) {
          console.error(`❌ Stats failed: ${error.message}`);
          process.exit(1);
        }
      });

    // Phase 1: Council Deliberation Commands

    // ask-council command
    program
      .command('ask-council')
      .description('Ask deliberation council for recommendation')
      .option('--question <question>', 'Question to deliberate')
      .option('--domains <domains>', 'Comma-separated domains')
      .option('--timeout <ms>', 'Deliberation timeout in ms', '10000')
      .action(async (options) => {
        try {
          const result = await askCouncilCommand({
            question: options.question,
            domains: options.domains ? options.domains.split(',') : [],
            timeout: parseInt(options.timeout),
          });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Council failed: ${error.message}`);
          process.exit(1);
        }
      });

    // council-composition command
    program
      .command('council-composition')
      .description('Get deliberation council composition')
      .action(async () => {
        try {
          const composition = await getCouncilComposition();
          console.log(JSON.stringify(composition, null, 2));
        } catch (error) {
          console.error(`❌ Composition failed: ${error.message}`);
          process.exit(1);
        }
      });

    // Phase 2: Agent Generation Commands

    // generate-agents command
    program
      .command('generate-agents')
      .description('Generate agents from knowledge domain')
      .option('--domain <domain>', 'Knowledge domain')
      .action(async (options) => {
        try {
          const result = await generateAgentsFromDomain(options.domain || 'general');
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Generation failed: ${error.message}`);
          process.exit(1);
        }
      });

    // generate-task-specialist command
    program
      .command('generate-task-specialist')
      .description('Generate task specialist agent')
      .option('--task-title <title>', 'Task title')
      .option('--task-description <desc>', 'Task description')
      .option('--skills <skills>', 'Comma-separated required skills')
      .action(async (options) => {
        try {
          const result = await generateTaskSpecialist({
            title: options.taskTitle,
            description: options.taskDescription,
            requiredSkills: options.skills ? options.skills.split(',') : [],
          });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Specialist generation failed: ${error.message}`);
          process.exit(1);
        }
      });

    // export-agents command
    program
      .command('export-agents')
      .description('Export agents as AIOX YAML format')
      .option('--domain <domain>', 'Export agents from domain')
      .option('--output <path>', 'Output file path')
      .action(async (options) => {
        try {
          const result = await exportAgentsAsYAML(options.domain || 'all', options.output);
          console.log(
            JSON.stringify({ success: true, message: 'Agents exported', output: result }, null, 2)
          );
        } catch (error) {
          console.error(`❌ Export failed: ${error.message}`);
          process.exit(1);
        }
      });

    // Phase 2: Agent Orchestration Commands

    // orchestrate-task command
    program
      .command('orchestrate-task')
      .description('Route task to best agent')
      .option('--type <type>', 'Task type')
      .option('--description <desc>', 'Task description')
      .option('--domain <domain>', 'Task domain')
      .action(async (options) => {
        try {
          const result = await orchestrateTask({
            type: options.type,
            description: options.description,
            domain: options.domain,
          });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Orchestration failed: ${error.message}`);
          process.exit(1);
        }
      });

    // orchestration-stats command
    program
      .command('orchestration-stats')
      .description('Get orchestration statistics')
      .action(async () => {
        try {
          const stats = await getOrchestrationStats();
          console.log(JSON.stringify(stats, null, 2));
        } catch (error) {
          console.error(`❌ Stats failed: ${error.message}`);
          process.exit(1);
        }
      });

    // Phase 2: Decision Engine Commands

    // make-decision command
    program
      .command('make-decision')
      .description('Make intelligent decision using full pipeline')
      .option('--question <question>', 'Decision question')
      .option('--domains <domains>', 'Comma-separated relevant domains')
      .option('--type <type>', 'Decision type (strategic, tactical, operational)', 'decision')
      .action(async (options) => {
        try {
          const result = await makeDecision({
            question: options.question,
            domains: options.domains ? options.domains.split(',') : [],
            type: options.type,
          });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Decision failed: ${error.message}`);
          process.exit(1);
        }
      });

    // decision-history command
    program
      .command('decision-history')
      .description('Get decision history')
      .option('--limit <number>', 'Maximum decisions to retrieve', '10')
      .action(async (options) => {
        try {
          const result = await getDecisionHistory({
            limit: parseInt(options.limit),
          });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ History failed: ${error.message}`);
          process.exit(1);
        }
      });
  }

  /**
   * Get comprehensive router status
   */
  static getStatus() {
    return {
      name: 'Mega-Brain CLI Router',
      phase: 3,
      status: 'Production Ready',
      commandsRegistered: 11,
      commands: [
        'ingest',
        'knowledge-search',
        'knowledge-stats',
        'ask-council',
        'council-composition',
        'generate-agents',
        'generate-task-specialist',
        'export-agents',
        'orchestrate-task',
        'orchestration-stats',
        'make-decision',
        'decision-history',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Show mega-brain help
   */
  static showHelp() {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         MEGA-BRAIN CLI COMMANDS                            ║
║                                                                            ║
║  Intelligent Knowledge + Decision System for AI-Orchestrated Development  ║
╚════════════════════════════════════════════════════════════════════════════╝

PHASE 1: KNOWLEDGE & COUNCIL SYSTEM
══════════════════════════════════════════════════════════════════════════════

  📚 Knowledge Management:
     aiox ingest                           Ingest knowledge from sources
     aiox knowledge-search                 Search knowledge base
     aiox knowledge-stats                  View knowledge statistics

  🏛️  Council Deliberation:
     aiox ask-council                      Ask council for recommendation
     aiox council-composition               View council member roles

PHASE 2: AGENT GENERATION & ORCHESTRATION
══════════════════════════════════════════════════════════════════════════════

  🤖 Agent Generation:
     aiox generate-agents                  Generate agents from knowledge
     aiox generate-task-specialist         Create task specialist agent
     aiox export-agents                    Export agents as YAML

  🎯 Agent Orchestration:
     aiox orchestrate-task                 Route task to best agent
     aiox orchestration-stats              View orchestration metrics

PHASE 2: INTELLIGENT DECISION MAKING
══════════════════════════════════════════════════════════════════════════════

  🧠 Decision Engine:
     aiox make-decision                    Make decision using full pipeline
     aiox decision-history                 View decision history

EXAMPLES
══════════════════════════════════════════════════════════════════════════════

  # Ingest knowledge
  aiox ingest \\
    --title "AI Best Practices" \\
    --domain "ai" \\
    --expert "AI Expert" \\
    --type "best-practice"

  # Ask council
  aiox ask-council \\
    --question "Should we implement feature X?" \\
    --domains "architecture,product"

  # Generate agents from domain
  aiox generate-agents --domain "system-design"

  # Make strategic decision
  aiox make-decision \\
    --question "How to optimize performance?" \\
    --domains "performance,architecture" \\
    --type "strategic"

  # Get decision history
  aiox decision-history --limit 10

STATUS
══════════════════════════════════════════════════════════════════════════════

${JSON.stringify(MegaBrainRouter.getStatus(), null, 2).split('\n').map((line) => '  ' + line).join('\n')}

For detailed documentation, visit: .aiox-core/commands/mega-brain-help.md
`);
  }
}

module.exports = { MegaBrainRouter };
