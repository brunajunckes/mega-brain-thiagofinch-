/**
 * Config Loader for Squad Creator Scripts
 *
 * Detecta o root do projeto automaticamente e carrega paths do squad-config.yaml.
 * NUNCA usa paths absolutos hardcoded.
 *
 * Usage:
 *   const config = require('./lib/config-loader');
 *   console.log(config.paths.tasks);  // /path/to/project/squads/squad-creator/tasks
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ============================================================================
// PROJECT ROOT DETECTION
// ============================================================================

function findProjectRoot(startDir = __dirname) {
  let currentDir = startDir;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    // Check for markers that indicate project root
    const markers = [
      'package.json',
      '.git',
      '.claude'
    ];

    for (const marker of markers) {
      const markerPath = path.join(currentDir, marker);
      if (fs.existsSync(markerPath)) {
        // Verify it's the right project by checking for squads/squad-creator
        const squadCreatorPath = path.join(currentDir, 'squads', 'squad-creator');
        if (fs.existsSync(squadCreatorPath)) {
          return currentDir;
        }
      }
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  throw new Error('Could not find project root. Make sure you are running from within the project.');
}

// ============================================================================
// CONFIG LOADER
// ============================================================================

function loadSquadConfig(projectRoot) {
  const configPath = path.join(projectRoot, 'squads', 'squad-creator', 'config', 'squad-config.yaml');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Squad config not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  return yaml.load(content);
}

// ============================================================================
// PATH RESOLVER
// ============================================================================

function resolvePaths(projectRoot, pathsConfig) {
  const resolved = {};

  function resolve(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        // It's a path - resolve it
        resolved[fullKey] = path.join(projectRoot, value);
      } else if (typeof value === 'object' && value !== null) {
        // It's a nested object - recurse
        resolve(value, fullKey);
      }
    }
  }

  resolve(pathsConfig);
  return resolved;
}

// ============================================================================
// EXPORTS
// ============================================================================

let _config = null;

function getConfig() {
  if (_config) return _config;

  const projectRoot = findProjectRoot();
  const squadConfig = loadSquadConfig(projectRoot);
  const pathsConfig = squadConfig.squad_config?.paths || {};
  const resolvedPaths = resolvePaths(projectRoot, pathsConfig);

  // Flatten for easy access
  _config = {
    projectRoot,
    squadConfig,

    // Resolved absolute paths
    paths: {
      // Squad-creator paths
      squadRoot: resolvedPaths['squad_root'],
      tasks: resolvedPaths['tasks'],
      agents: resolvedPaths['agents'],
      config: resolvedPaths['config'],
      scripts: resolvedPaths['scripts'],

      // Output paths
      outputs: resolvedPaths['outputs.root'],
      minds: resolvedPaths['outputs.minds'],
      llmTests: resolvedPaths['outputs.llm_tests'],
      llmTestInputs: resolvedPaths['outputs.llm_test_inputs'],

      // Infrastructure
      envLoader: resolvedPaths['infrastructure.env_loader'],
      llmRouter: resolvedPaths['infrastructure.llm_router'],
    },

    // Helper to join paths relative to project root
    resolve: (...segments) => path.join(projectRoot, ...segments),

    // Helper to join paths relative to squad-creator
    squadResolve: (...segments) => path.join(projectRoot, 'squads', 'squad-creator', ...segments),
  };

  return _config;
}

module.exports = getConfig();

// Also export the functions for testing
module.exports.findProjectRoot = findProjectRoot;
module.exports.loadSquadConfig = loadSquadConfig;
module.exports.resolvePaths = resolvePaths;
