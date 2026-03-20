const { Command } = require('commander');
const { ingest } = require('./ingest');
const { status } = require('./status');
const { ask } = require('./ask');
const { squad } = require('./squad');

const program = new Command('aiox-brain');

program
  .version('1.0.0')
  .description('Brain Factory - Cognitive clone ingestion and management');

program
  .command('ingest')
  .description('Ingest content (YouTube, PDF, doc, image)')
  .option('--youtube <url>', 'YouTube video or channel URL')
  .option('--pdf <path>', 'PDF file path')
  .option('--doc <path>', 'Plain text or markdown file path')
  .option('--image <path>', 'Image file path')
  .option('--clone <slug>', 'Target clone slug (required)', null)
  .option('--last <n>', 'For YouTube channels, limit to last N videos', null)
  .option('--dry-run', 'Show what would be ingested without storing', false)
  .action(ingest);

program
  .command('status')
  .description('Show all clones and chunk counts')
  .option('--json', 'Output as JSON', false)
  .action(status);

program
  .command('ask <question>')
  .description('Ask a clone a question')
  .option('--clone <slug>', 'Target clone slug (required)', null)
  .option('--session <id>', 'Session ID for multi-turn conversation', null)
  .option('--history', 'Show conversation history instead of asking', false)
  .option('--model <name>', 'Model to use (default: qwen2.5:7b)', null)
  .option('--no-rag', 'Disable RAG context')
  .action(ask);

program
  .command('squad')
  .description('Query multiple clones in squad')
  .option('--ask <question>', 'Question to ask the squad', null)
  .option('--list', 'List all available clones', false)
  .option('--synthesize', 'Synthesize responses into unified answer', false)
  .option('--debate <rounds>', 'Enable multi-round debate (number of rounds)', null)
  .option('--json', 'Output as JSON', false)
  .action(squad);

module.exports = { run: (argv) => program.parse(argv) };
