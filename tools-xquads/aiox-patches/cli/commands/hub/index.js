/**
 * Hub Command Module
 *
 * CLI commands for the AIOX Global Hub (~/.aiox/).
 *
 * Subcommands:
 *   aiox hub init                    — Initialize global hub + local .aiox/config.yaml
 *   aiox hub status                  — Show global hub status and registered projects
 *   aiox hub squad list              — List all squads (global + local)
 *   aiox hub squad load <name>       — Load and display a squad definition
 *
 * @module cli/commands/hub
 * @story 9.1 — AIOX Global Hub
 * @version 1.0.0
 */

'use strict';

const { Command } = require('commander');
const path = require('path');

const HUB_MANAGER_PATH = path.resolve(__dirname, '..', '..', '..', 'core', 'global-hub', 'hub-manager');

function loadHubManager() {
  return require(HUB_MANAGER_PATH);
}

// ---------------------------------------------------------------------------
// aiox hub init
// ---------------------------------------------------------------------------

async function initAction() {
  const hub = loadHubManager();
  const projectRoot = process.cwd();

  console.log('🚀 Initializing AIOX Global Hub...\n');

  try {
    const result = await hub.initProject(projectRoot);

    if (result.globalHubCreated) {
      console.log(`✅ Global hub created: ${hub.getGlobalHubPath()}`);
    } else {
      console.log(`✔  Global hub already exists: ${hub.getGlobalHubPath()}`);
    }

    console.log(`✅ Local config created: ${result.localConfigPath}`);
    console.log(`✔  Project registered: "${result.projectName}" → ${projectRoot}`);
    console.log('\n📁 Global hub structure:');

    const globalPath = hub.getGlobalHubPath();
    for (const subdir of hub.GLOBAL_SUBDIRS) {
      console.log(`   ~/.aiox/${subdir}/`);
    }

    console.log('\n✨ Done. Your project is now connected to the global hub.');
    console.log(`   Run 'aiox hub status' to verify.\n`);
  } catch (err) {
    console.error(`\n❌ Init failed: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// aiox hub status
// ---------------------------------------------------------------------------

function statusAction() {
  const hub = loadHubManager();

  console.log('📊 AIOX Global Hub Status\n');

  const validation = hub.validateGlobalHub();

  if (!hub.isGlobalHubInitialized()) {
    console.log(`⚠️  Global hub not found at: ${hub.getGlobalHubPath()}`);
    console.log("   Run 'aiox hub init' to create it.\n");
    return;
  }

  console.log(`📁 Hub path: ${hub.getGlobalHubPath()}`);

  if (validation.issues.length > 0) {
    console.log('\n❌ Issues:');
    for (const issue of validation.issues) {
      console.log(`   • ${issue}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of validation.warnings) {
      console.log(`   • ${warning}`);
    }
  }

  if (validation.valid) {
    console.log('✅ Hub structure: OK');
  }

  // Global config summary
  try {
    const config = hub.loadGlobalConfig();
    console.log(`\n⚙️  Config:`);
    console.log(`   version:              ${config.version}`);
    console.log(`   defaultConcurrency:   ${config.defaultConcurrency}`);
    console.log(`   handoffRetentionDays: ${config.handoffRetentionDays}`);
  } catch (err) {
    console.log(`\n⚠️  Could not load config: ${err.message}`);
  }

  // Registered projects
  const projects = hub.listProjects();
  const projectNames = Object.keys(projects);

  console.log(`\n📋 Registered projects (${projectNames.length}):`);

  if (projectNames.length === 0) {
    console.log('   (none — run `aiox hub init` in a project to register it)');
  } else {
    for (const [name, projectPath] of Object.entries(projects)) {
      const exists = require('fs').existsSync(projectPath);
      const icon = exists ? '✔ ' : '⚠️';
      console.log(`   ${icon} ${name.padEnd(20)} ${projectPath}`);
    }
  }

  // Local config
  const localConfig = hub.loadLocalConfig(process.cwd());
  if (localConfig) {
    console.log(`\n🔧 Local config (.aiox/config.yaml):`);
    console.log(`   name:    ${localConfig.name || '(not set)'}`);
    console.log(`   extends: ${localConfig.extends || '(none)'}`);
  } else {
    console.log('\n💡 No local .aiox/config.yaml found in current directory.');
    console.log("   Run 'aiox hub init' to create one.\n");
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// aiox hub squad list
// ---------------------------------------------------------------------------

function squadListAction() {
  const hub = loadHubManager();
  const projectRoot = process.cwd();

  const squads = hub.listSquads(projectRoot);

  if (squads.length === 0) {
    console.log('No squads found.');
    console.log(`  Global: ~/.aiox/squads/`);
    console.log(`  Local:  .aiox/squads/`);
    return;
  }

  console.log(`📋 Available squads (${squads.length}):\n`);

  const globalSquads = squads.filter((s) => s.source === 'global');
  const localSquads = squads.filter((s) => s.source === 'local');

  if (globalSquads.length > 0) {
    console.log('  🌐 Global (~/.aiox/squads/):');
    for (const squad of globalSquads) {
      console.log(`     • ${squad.name}`);
    }
  }

  if (localSquads.length > 0) {
    console.log('  📁 Local (.aiox/squads/):');
    for (const squad of localSquads) {
      console.log(`     • ${squad.name}  (overrides global if same name)`);
    }
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// aiox hub squad load <name>
// ---------------------------------------------------------------------------

function squadLoadAction(name) {
  const hub = loadHubManager();
  const projectRoot = process.cwd();

  try {
    const squad = hub.loadSquad(name, projectRoot);
    const resolvedPath = hub.resolveSquadPath(name, projectRoot);
    const source = resolvedPath.includes(hub.getGlobalHubPath()) ? 'global' : 'local';

    console.log(`✅ Squad "${name}" loaded from ${source}: ${resolvedPath}\n`);
    console.log(require('js-yaml').dump(squad, { lineWidth: 120, noRefs: true }));
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Command Builder
// ---------------------------------------------------------------------------

/**
 * Create the `aiox hub` command with all subcommands.
 * @returns {Command}
 */
function createHubCommand() {
  const hubCmd = new Command('hub').description('Manage AIOX Global Hub (~/.aiox/)');

  // aiox hub init
  hubCmd
    .command('init')
    .description('Initialize global hub and local .aiox/config.yaml for current project')
    .action(initAction);

  // aiox hub status
  hubCmd
    .command('status')
    .description('Show global hub status and registered projects')
    .action(statusAction);

  // aiox hub squad (subcommand group)
  const squadCmd = new Command('squad').description('Manage squads (global and local)');

  squadCmd
    .command('list')
    .description('List all available squads (global + local)')
    .action(squadListAction);

  squadCmd
    .command('load <name>')
    .description('Load and display a squad definition')
    .action(squadLoadAction);

  hubCmd.addCommand(squadCmd);

  return hubCmd;
}

module.exports = {
  createHubCommand,
};
