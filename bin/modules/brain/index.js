const { Command } = require('commander');
const { ingest } = require('./ingest');
const { status } = require('./status');

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

module.exports = { run: (argv) => program.parse(argv) };
