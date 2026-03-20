#!/usr/bin/env node

const { Command } = require('commander');
const newProjectCmd = require('./commands/new-project');
const expertSearchCmd = require('./commands/expert-search');
const cloneExpertCmd = require('./commands/clone-expert');
const roundtableCmd = require('./commands/roundtable');
const specGeneratorCmd = require('./commands/spec-generator');
const projectKickoffCmd = require('./commands/project-kickoff');

const program = new Command('squad-advisor');

program
  .description('Squad Advisor - Expert roundtables for professional project planning')
  .version('1.0.0');

program
  .command('new-project <description>')
  .description('Start a new project with expert roundtable discussion')
  .option('--project-name <name>', 'Project name (auto-generated if not provided)')
  .option('--skip-roundtable', 'Skip roundtable, just identify experts')
  .option('--output-dir <dir>', 'Output directory for specs (default: docs/stories/{project-name})')
  .action(newProjectCmd.handler);

program
  .command('expert-search <domain>')
  .description('Find top 3 experts for a specific domain')
  .option('--squad <squad-id>', 'Limit search to specific squad')
  .option('--json', 'Output as JSON')
  .action(expertSearchCmd.handler);

program
  .command('clone-expert <slug>')
  .description('Clone a specific expert for roundtable discussion')
  .action(cloneExpertCmd.handler);

program
  .command('roundtable')
  .description('Execute expert debate on project decisions')
  .requiredOption('--experts <list>', 'Comma-separated expert slugs')
  .requiredOption('--question <q>', 'Question for roundtable discussion')
  .option('--project-id <id>', 'Associated project ID')
  .option('--rounds <n>', 'Number of debate rounds (default: 3)', '3')
  .action(roundtableCmd.handler);

program
  .command('spec-generator <roundtable-id>')
  .description('Generate auto-evolutionary spec from roundtable output')
  .option('--output-file <path>', 'Output file path')
  .action(specGeneratorCmd.handler);

program
  .command('project-kickoff <project-name>')
  .description('Create full story backlog from auto-evolved spec')
  .option('--spec-file <path>', 'Path to spec-auto-evolved.md')
  .option('--epic-id <id>', 'Associate with existing epic')
  .action(projectKickoffCmd.handler);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

module.exports = program;
