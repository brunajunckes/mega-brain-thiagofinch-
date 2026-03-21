/**
 * Handoffs Command Module
 *
 * CLI commands for the AIOX Cross-Session Handoff System.
 *
 * Subcommands:
 *   aiox handoffs list [--project <name>] [--status <status>]
 *   aiox handoffs next [--agent <name>] [--project <name>]
 *   aiox handoffs cleanup [--project <name>] [--dry-run]
 *
 * @module cli/commands/handoffs
 * @story 9.2 — Cross-Session Handoff System
 * @version 1.0.0
 */

'use strict';

const { Command } = require('commander');
const path = require('path');

const HANDOFFS_PATH = path.resolve(__dirname, '..', '..', '..', 'core', 'handoffs');

function loadHandoffs() {
  return require(HANDOFFS_PATH);
}

// ---------------------------------------------------------------------------
// aiox handoffs list
// ---------------------------------------------------------------------------

function listAction(options) {
  const handoffs = loadHandoffs();

  const projectName = options.project || handoffs.resolveProjectName(process.cwd());

  if (!projectName) {
    console.error('❌ No project name found. Run `aiox hub init` first or pass --project <name>.');
    process.exit(1);
  }

  const statusFilter = options.status || null;
  const all = handoffs.listAll(projectName);

  const statuses = statusFilter ? [statusFilter] : ['ready', 'in-progress', 'done', 'failed'];

  console.log(`📋 Handoffs for project: ${projectName}\n`);

  let total = 0;
  for (const status of statuses) {
    const queue = all[status] || [];
    total += queue.length;

    const icon = { ready: '🟡', 'in-progress': '🔵', done: '✅', failed: '❌' }[status] || '•';
    console.log(`  ${icon} ${status} (${queue.length}):`);

    if (queue.length === 0) {
      console.log('     (empty)');
    } else {
      for (const item of queue) {
        const data = handoffs.listQueue ? null : null;
        // Parse for display
        try {
          const yaml = require('js-yaml');
          const fs = require('fs');
          const parsed = yaml.load(fs.readFileSync(item.filePath, 'utf8'));
          const age = Math.round((Date.now() - item.mtime) / 60000);
          const ageStr = age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`;
          console.log(`     • ${parsed.from_agent} → ${parsed.to_agent}  [${parsed.story_id}]  ${ageStr}`);
          if (parsed.next_action) {
            console.log(`       next: ${parsed.next_action}`);
          }
        } catch {
          console.log(`     • ${item.filename}`);
        }
      }
    }
    console.log('');
  }

  console.log(`  Total: ${total} handoff(s)\n`);
}

// ---------------------------------------------------------------------------
// aiox handoffs next
// ---------------------------------------------------------------------------

function nextAction(options) {
  const handoffs = loadHandoffs();

  const projectName = options.project || handoffs.resolveProjectName(process.cwd());

  if (!projectName) {
    console.error('❌ No project name found. Run `aiox hub init` first or pass --project <name>.');
    process.exit(1);
  }

  const peeked = handoffs.peekNext({
    projectName,
    toAgent: options.agent || undefined,
  });

  if (!peeked) {
    const agentMsg = options.agent ? ` for agent "${options.agent}"` : '';
    console.log(`💤 No handoffs ready${agentMsg} in project "${projectName}".`);
    return;
  }

  console.log(`\n📨 Next handoff${options.agent ? ` for @${options.agent}` : ''}:\n`);
  console.log(`  ID:           ${peeked.id}`);
  console.log(`  From:         @${peeked.from_agent}`);
  console.log(`  To:           @${peeked.to_agent}`);
  console.log(`  Story:        ${peeked.story_id}  (${peeked.story_path || 'path not set'})`);
  console.log(`  Branch:       ${peeked.branch || '(not set)'}`);
  console.log(`  Next action:  ${peeked.next_action}`);

  if (peeked.decisions && peeked.decisions.length > 0) {
    console.log(`\n  Decisions:`);
    peeked.decisions.forEach((d) => console.log(`    • ${d}`));
  }

  if (peeked.files_modified && peeked.files_modified.length > 0) {
    console.log(`\n  Files modified:`);
    peeked.files_modified.forEach((f) => console.log(`    • ${f}`));
  }

  if (peeked.blockers && peeked.blockers.length > 0) {
    console.log(`\n  Blockers:`);
    peeked.blockers.forEach((b) => console.log(`    ⚠️  ${b}`));
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// aiox handoffs cleanup
// ---------------------------------------------------------------------------

async function cleanupAction(options) {
  const handoffs = loadHandoffs();

  const projectName = options.project || null;
  const dryRun = options.dryRun === true;

  console.log(`🧹 Cleaning handoffs${projectName ? ` for project "${projectName}"` : ' (all projects)'}...`);
  if (dryRun) console.log('   [DRY RUN — no files will be deleted]\n');

  try {
    const result = await handoffs.cleanupHandoffs({ projectName, dryRun });
    console.log(`\n${handoffs.formatCleanupResult(result)}`);

    if (dryRun && result.removed.length > 0) {
      console.log('\nWould remove:');
      result.removed.forEach((f) => console.log(`  • ${f}`));
    }
  } catch (err) {
    console.error(`\n❌ Cleanup failed: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Command Builder
// ---------------------------------------------------------------------------

/**
 * Create the `aiox handoffs` command.
 * @returns {Command}
 */
function createHandoffsCommand() {
  const cmd = new Command('handoffs').description('Manage cross-session handoff queue (~/.aiox/handoffs/)');

  // aiox handoffs list
  cmd
    .command('list')
    .description('List handoffs by status for a project')
    .option('-p, --project <name>', 'Project name (auto-detected from .aiox/config.yaml if omitted)')
    .option('-s, --status <status>', 'Filter by status: ready, in-progress, done, failed')
    .action(listAction);

  // aiox handoffs next
  cmd
    .command('next')
    .description('Show the next available handoff (non-destructive peek)')
    .option('-p, --project <name>', 'Project name')
    .option('-a, --agent <name>', 'Filter by destination agent')
    .action(nextAction);

  // aiox handoffs cleanup
  cmd
    .command('cleanup')
    .description('Remove old handoffs from done/ and failed/ based on retention policy')
    .option('-p, --project <name>', 'Specific project to clean (all projects if omitted)')
    .option('--dry-run', 'Preview without deleting')
    .action(cleanupAction);

  return cmd;
}

module.exports = {
  createHandoffsCommand,
};
