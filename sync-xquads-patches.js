#!/usr/bin/env node
/**
 * sync-aiox-patches.js
 *
 * Applies Epic 9 patches (Global Hub + Handoffs + Orchestrator) to .aiox-core/
 * after a framework update. Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node sync-aiox-patches.js           — apply patches
 *   node sync-aiox-patches.js --dry-run — preview without writing
 *   node sync-aiox-patches.js --verify  — check if patches are applied
 *
 * Source of truth: tools/aiox-patches/
 * Target:          .aiox-core/
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PATCHES_DIR = path.join(ROOT, 'tools', 'aiox-patches');
const AIOX_CORE = path.join(ROOT, '.aiox-core');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERIFY = args.includes('--verify');

// ---------------------------------------------------------------------------
// Files to copy verbatim (source relative to PATCHES_DIR → target relative to AIOX_CORE)
// ---------------------------------------------------------------------------

const FILE_COPIES = [
  'core/global-hub/hub-manager.js',
  'core/global-hub/__tests__/hub-manager.test.js',
  'core/handoffs/handoff-writer.js',
  'core/handoffs/handoff-consumer.js',
  'core/handoffs/handoff-cleanup.js',
  'core/handoffs/handoff-watcher.js',
  'core/handoffs/index.js',
  'core/handoffs/__tests__/handoff-system.test.js',
  'core/handoffs/__tests__/handoff-orchestrator.test.js',
  'core/orchestration/handoff-orchestrator.js',
  'core/health-check/checks/project/global-hub.js',
  'cli/commands/hub/index.js',
  'cli/commands/handoffs/index.js',
  'cli/commands/watch/index.js',
];

// ---------------------------------------------------------------------------
// Patches to apply to existing files (idempotent string injection)
// ---------------------------------------------------------------------------

const PATCHES = [
  {
    file: 'core/health-check/checks/project/index.js',
    sentinel: "require('./global-hub')",
    inject: {
      after: "const WorkflowDependenciesCheck = require('./workflow-dependencies');",
      code: "const GlobalHubCheck = require('./global-hub');",
    },
    exportPatch: {
      after: '  WorkflowDependenciesCheck,',
      code: '  GlobalHubCheck,',
    },
  },
  {
    file: 'cli/index.js',
    sentinel: "require('./commands/hub')",
    inject: {
      after: "const { createProCommand } = require('./commands/pro');",
      code: [
        "const { createHubCommand } = require('./commands/hub');",
        "const { createHandoffsCommand } = require('./commands/handoffs');",
        "const { createWatchCommand } = require('./commands/watch');",
      ].join('\n'),
    },
    commandPatch: {
      after: "  program.addCommand(createProCommand());",
      code: [
        '',
        '  // Add hub command (Story 9.1)',
        '  program.addCommand(createHubCommand());',
        '',
        '  // Add handoffs command (Story 9.2)',
        '  program.addCommand(createHandoffsCommand());',
        '',
        '  // Add watch command (Story 9.3)',
        '  program.addCommand(createWatchCommand());',
      ].join('\n'),
    },
  },
  {
    file: 'development/scripts/agent-exit-hooks.js',
    sentinel: 'getHandoffWriter',
    inject: {
      after: "const SESSION_STATE_PATH = path.join(process.cwd(), '.aiox', 'session-state.json');",
      code: [
        '',
        '// Lazy-load handoff writer to avoid startup cost when handoffs not needed',
        'let _handoffWriter = null;',
        'function getHandoffWriter() {',
        '  if (!_handoffWriter) {',
        '    try {',
        "      _handoffWriter = require('../../core/handoffs/handoff-writer');",
        '    } catch {',
        '      // handoffs module not available — graceful degradation',
        '    }',
        '  }',
        '  return _handoffWriter;',
        '}',
      ].join('\n'),
    },
    hookPatch: {
      find: '    // Graceful degradation - hook failures must not break command execution\n    console.warn(\'[AgentExitHooks] Hook failed:\', error.message);\n  }\n}',
      replace: [
        "    // Persist handoff to disk if toAgent is known (Story 9.2)",
        "    if (context.next_agent) {",
        "      persistHandoffAsync(agent, context.next_agent, context).catch(() => {});",
        "    }",
        "  } catch (error) {",
        "    // Graceful degradation - hook failures must not break command execution",
        "    console.warn('[AgentExitHooks] Hook failed:', error.message);",
        "  }",
        "}",
        "",
        "/**",
        " * Persists a handoff to disk when an agent switch occurs (Story 9.2).",
        " * @param {string} fromAgent",
        " * @param {string} toAgent",
        " * @param {Object} context",
        " * @returns {Promise<void>}",
        " */",
        "async function persistHandoffAsync(fromAgent, toAgent, context) {",
        "  const writer = getHandoffWriter();",
        "  if (!writer) return;",
        "",
        "  const projectName = writer.resolveProjectName(process.cwd());",
        "  if (!projectName) return;",
        "",
        "  await writer.writeHandoff(",
        "    {",
        "      from_agent: fromAgent,",
        "      to_agent: toAgent,",
        "      story_id: context.story_path ? path.basename(context.story_path, '.story.md') : 'unknown',",
        "      story_path: context.story_path || '',",
        "      branch: context.branch || '',",
        "      next_action: context.next_action || `continue-from-${fromAgent}`,",
        "      decisions: context.decisions || [],",
        "      files_modified: context.files_modified || [],",
        "      blockers: context.blockers || [],",
        "    },",
        "    { projectName },",
        "  );",
        "}",
      ].join('\n'),
    },
    exportPatch: {
      find: "module.exports = {\n  onCommandComplete,\n  registerHook,\n  detectWorkflowState,\n};",
      replace: "module.exports = {\n  onCommandComplete,\n  registerHook,\n  detectWorkflowState,\n  persistHandoffAsync,\n};",
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  if (DRY_RUN) return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function ensureDir(dirPath) {
  if (!DRY_RUN && !fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Step 1: Copy files verbatim
// ---------------------------------------------------------------------------

function applyFileCopies() {
  log('\n📁', 'Copying new files...');
  let copied = 0;
  let skipped = 0;

  for (const relPath of FILE_COPIES) {
    const src = path.join(PATCHES_DIR, relPath);
    const dst = path.join(AIOX_CORE, relPath);

    if (!fs.existsSync(src)) {
      log('  ⚠️ ', `Source missing: tools/aiox-patches/${relPath}`);
      continue;
    }

    const srcContent = readFile(src);

    if (fs.existsSync(dst)) {
      const dstContent = readFile(dst);
      if (srcContent === dstContent) {
        log('  ✔ ', `Up-to-date: ${relPath}`);
        skipped++;
        continue;
      }
    }

    ensureDir(path.dirname(dst));
    writeFile(dst, srcContent);
    log('  ✅', `${DRY_RUN ? '[dry] ' : ''}Copied: ${relPath}`);
    copied++;
  }

  log('', `   ${copied} copied, ${skipped} already up-to-date`);
}

// ---------------------------------------------------------------------------
// Step 2: Patch existing files (idempotent)
// ---------------------------------------------------------------------------

function applyTextPatch(content, patch) {
  if (!patch) return content;

  // inject block (after a marker)
  if (patch.inject && !content.includes(patch.sentinel)) {
    if (content.includes(patch.inject.after)) {
      content = content.replace(patch.inject.after, patch.inject.after + '\n' + patch.inject.code);
    }
  }

  // export/command patches (specific string replacements)
  for (const key of ['exportPatch', 'commandPatch', 'hookPatch']) {
    if (patch[key]) {
      const p = patch[key];
      if (p.after && p.code && !content.includes(p.code)) {
        content = content.replace(p.after, p.after + '\n' + p.code);
      }
      if (p.find && p.replace && content.includes(p.find)) {
        content = content.replace(p.find, p.replace);
      }
    }
  }

  return content;
}

function applyFilePatches() {
  log('\n🔧', 'Patching existing files...');

  for (const patch of PATCHES) {
    const filePath = path.join(AIOX_CORE, patch.file);

    if (!fs.existsSync(filePath)) {
      log('  ⚠️ ', `Target missing: .aiox-core/${patch.file}`);
      continue;
    }

    const original = readFile(filePath);

    if (original.includes(patch.sentinel)) {
      log('  ✔ ', `Already patched: ${patch.file}`);
      continue;
    }

    const patched = applyTextPatch(original, patch);

    if (patched === original) {
      log('  ⚠️ ', `No change applied to: ${patch.file}`);
      continue;
    }

    writeFile(filePath, patched);
    log('  ✅', `${DRY_RUN ? '[dry] ' : ''}Patched: ${patch.file}`);
  }
}

// ---------------------------------------------------------------------------
// Verify mode
// ---------------------------------------------------------------------------

function verifyPatches() {
  log('\n🔍', 'Verifying patches...\n');
  let ok = 0;
  let missing = 0;

  for (const relPath of FILE_COPIES) {
    const dst = path.join(AIOX_CORE, relPath);
    if (fs.existsSync(dst)) {
      log('  ✅', relPath);
      ok++;
    } else {
      log('  ❌', `Missing: ${relPath}`);
      missing++;
    }
  }

  for (const patch of PATCHES) {
    const filePath = path.join(AIOX_CORE, patch.file);
    if (fs.existsSync(filePath) && readFile(filePath).includes(patch.sentinel)) {
      log('  ✅', `Patched: ${patch.file}`);
      ok++;
    } else {
      log('  ❌', `Not patched: ${patch.file}`);
      missing++;
    }
  }

  console.log('');
  log(missing === 0 ? '✅' : '❌', `${ok} OK, ${missing} missing/not patched`);
  process.exit(missing > 0 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   AIOX Patches Sync — Epic 9 (Hub+Handoffs) ║');
  console.log('╚══════════════════════════════════════════╝');

  if (VERIFY) return verifyPatches();

  if (DRY_RUN) log('\n⚠️ ', 'DRY RUN — no files will be written\n');

  if (!fs.existsSync(PATCHES_DIR)) {
    log('❌', `Patches source not found: tools/aiox-patches/`);
    log('   ', 'Run this from C:/DesenvCode/Squads/');
    process.exit(1);
  }

  if (!fs.existsSync(AIOX_CORE)) {
    log('❌', `.aiox-core/ not found. Make sure you are in the Squads project root.`);
    process.exit(1);
  }

  applyFileCopies();
  applyFilePatches();

  console.log('');
  log('🎉', DRY_RUN ? 'Dry run complete.' : 'Sync complete. Epic 9 patches applied to .aiox-core/');

  if (!DRY_RUN) {
    console.log('');
    console.log('   Verify with: node sync-aiox-patches.js --verify');
  }
  console.log('');
}

main();
