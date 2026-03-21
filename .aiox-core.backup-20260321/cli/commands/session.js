/**
 * Session Command Module
 *
 * CLI commands for managing persistent agent sessions
 *
 * Subcommands:
 *   aiox session list [--agent <name>] [--json]
 *   aiox session resume <agent-id> [--session-id <id>]
 *   aiox session create <agent-id> [--story <id>] [--task <name>]
 *   aiox session archive <agent-id> <session-id>
 *   aiox session delete <agent-id> <session-id>
 *   aiox session snapshot <agent-id> <session-id>
 *
 * @module cli/commands/session
 * @version 1.0.0
 * @story 1.1
 */

'use strict';

const { Command } = require('commander');
const path = require('path');
const { SessionManager } = require('../../core/session-manager');
const chalk = require('chalk');

// Lazy load for graceful fallback if dependencies missing
let Table;
try {
  Table = require('cli-table3');
} catch (e) {
  Table = null;
}

const sessionManager = new SessionManager();

/**
 * Format session data for display
 */
function formatSessionForDisplay(session) {
  return {
    ID: session.sessionId.substring(0, 8),
    Agent: session.agentId,
    Created: new Date(session.createdAt).toLocaleString(),
    'Last Activity': new Date(session.lastActivity).toLocaleString(),
    Messages: session.conversationLength || 0,
    Tokens: session.contextTokens || 0,
    Status: session.status,
    Story: session.metadata?.currentStory || '—',
  };
}

/**
 * List all active sessions
 */
async function handleListSessions(options) {
  try {
    await sessionManager.initialize();

    let sessions;
    if (options.agent) {
      sessions = await sessionManager.getAgentSessions(options.agent);
    } else {
      sessions = await sessionManager.getAllActiveSessions();
    }

    if (sessions.length === 0) {
      console.log(chalk.yellow('No active sessions found'));
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(sessions, null, 2));
      return;
    }

    if (Table) {
      const table = new Table({
        head: ['ID', 'Agent', 'Created', 'Last Activity', 'Messages', 'Tokens', 'Status', 'Story'],
        style: { head: [], border: ['cyan'] },
        wordWrap: true,
      });

      sessions.forEach((session) => {
        const formatted = formatSessionForDisplay(session);
        table.push(Object.values(formatted));
      });

      console.log(table.toString());
    } else {
      // Fallback to JSON if cli-table3 not available
      console.log(JSON.stringify(sessions, null, 2));
    }

    console.log(chalk.green(`\n✓ Found ${sessions.length} active session(s)`));
  } catch (error) {
    console.error(chalk.red(`Error listing sessions: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Create a new session
 */
async function handleCreateSession(agentId, options) {
  try {
    await sessionManager.initialize();

    const metadata = {
      currentStory: options.story || null,
      currentTask: options.task || null,
      branch: options.branch || 'main',
    };

    const session = await sessionManager.createSession(agentId, metadata);
    console.log(chalk.green('✓ Session created'));
    console.log(`  ID: ${session.sessionId}`);
    console.log(`  Agent: ${session.agentId}`);
    console.log(`  Created: ${session.createdAt}`);

    if (options.json) {
      console.log(JSON.stringify(session, null, 2));
    }
  } catch (error) {
    console.error(chalk.red(`Error creating session: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Resume an existing session
 */
async function handleResumeSession(agentId, options) {
  try {
    await sessionManager.initialize();

    let session;

    if (options.sessionId) {
      session = await sessionManager.loadSession(agentId, options.sessionId);
    } else {
      session = await sessionManager.getMostRecentSession(agentId);
      if (!session) {
        console.log(chalk.yellow(`No sessions found for agent: ${agentId}`));
        return;
      }
    }

    console.log(chalk.green('✓ Session loaded'));
    console.log(`  Session ID: ${session.sessionId.substring(0, 8)}`);
    console.log(`  Agent: ${session.agentId}`);
    console.log(`  Messages: ${session.conversationLength}`);
    console.log(`  Context Tokens: ${session.contextTokens}`);
    console.log(`  Story: ${session.metadata?.currentStory || '—'}`);
    console.log(`  Task: ${session.metadata?.currentTask || '—'}`);

    if (options.json) {
      console.log(JSON.stringify(session, null, 2));
    }

    // Emit event for agent to use session context
    process.emit('session:loaded', session);
  } catch (error) {
    console.error(chalk.red(`Error resuming session: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Archive a session
 */
async function handleArchiveSession(agentId, sessionId, options) {
  try {
    await sessionManager.initialize();
    await sessionManager.archiveSession(agentId, sessionId);
    console.log(chalk.green(`✓ Session archived: ${sessionId.substring(0, 8)}`));
  } catch (error) {
    console.error(chalk.red(`Error archiving session: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Delete a session
 */
async function handleDeleteSession(agentId, sessionId, options) {
  try {
    if (!options.force) {
      console.log(chalk.yellow(`Session will be permanently deleted: ${sessionId.substring(0, 8)}`));
      console.log(chalk.yellow('Use --force to confirm'));
      return;
    }

    await sessionManager.initialize();
    await sessionManager.deleteSession(agentId, sessionId);
    console.log(chalk.green(`✓ Session deleted: ${sessionId.substring(0, 8)}`));
  } catch (error) {
    console.error(chalk.red(`Error deleting session: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Create a snapshot
 */
async function handleSnapshot(agentId, sessionId, options) {
  try {
    await sessionManager.initialize();
    const snapshotFile = await sessionManager.createSnapshot(agentId, sessionId);
    console.log(chalk.green(`✓ Snapshot created: ${path.basename(snapshotFile)}`));
  } catch (error) {
    console.error(chalk.red(`Error creating snapshot: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Register session command with Commander
 */
function registerSessionCommand(program) {
  // Add list subcommand
  program
    .command('list')
    .option('--agent <name>', 'Filter by agent ID')
    .option('--json', 'Output as JSON')
    .description('List all active sessions')
    .action(handleListSessions);

  // Add create subcommand
  program
    .command('create <agent-id>')
    .option('--story <id>', 'Associated story ID')
    .option('--task <name>', 'Current task name')
    .option('--branch <name>', 'Git branch (default: main)')
    .option('--json', 'Output as JSON')
    .description('Create a new session')
    .action(handleCreateSession);

  // Add resume subcommand
  program
    .command('resume <agent-id>')
    .option('--session-id <id>', 'Specific session ID to resume')
    .option('--json', 'Output as JSON')
    .description('Resume an agent session (most recent if not specified)')
    .action(handleResumeSession);

  // Add archive subcommand
  program
    .command('archive <agent-id> <session-id>')
    .description('Archive a session (mark as inactive)')
    .action(handleArchiveSession);

  // Add delete subcommand
  program
    .command('delete <agent-id> <session-id>')
    .option('--force', 'Force deletion without confirmation')
    .description('Delete a session permanently')
    .action(handleDeleteSession);

  // Add snapshot subcommand
  program
    .command('snapshot <agent-id> <session-id>')
    .description('Create a session snapshot for rollback')
    .action(handleSnapshot);
}

module.exports = {
  registerSessionCommand,
  SessionManager,
};
