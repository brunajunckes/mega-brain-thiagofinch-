/**
 * Global Hub Manager
 *
 * Manages the ~/.aiox/ global directory — the cross-project hub for
 * reusable squads, workflows, templates, and handoff queues.
 *
 * Responsibilities:
 *   - Create and validate ~/.aiox/ structure (AC1, AC7)
 *   - Load/save ~/.aiox/config.yaml with defaults (AC2)
 *   - Create .aiox/config.yaml local with extends:global support (AC4)
 *   - Register/lookup projects in global registry (AC3)
 *   - Resolve squad paths (global → local fallback) (AC5)
 *
 * Config loading order: defaults → ~/.aiox/config.yaml → .aiox/config.yaml (deep merge)
 *
 * @module core/global-hub/hub-manager
 * @story 9.1 — AIOX Global Hub
 * @version 1.0.0
 */

'use strict';

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GLOBAL_HUB_DIR = path.join(os.homedir(), '.aiox');

const GLOBAL_SUBDIRS = ['squads', 'workflows', 'templates', 'handoffs', 'config'];

const GLOBAL_CONFIG_PATH = path.join(GLOBAL_HUB_DIR, 'config.yaml');

const LOCAL_AIOX_DIR = '.aiox';
const LOCAL_CONFIG_FILE = 'config.yaml';

/** Default values for ~/.aiox/config.yaml */
const GLOBAL_CONFIG_DEFAULTS = {
  version: '1.0.0',
  defaultConcurrency: 3,
  handoffRetentionDays: 7,
  projects: {},
};

/** Default values for .aiox/config.yaml (local) */
const LOCAL_CONFIG_DEFAULTS = {
  extends: 'global',
  name: null, // filled during init
  projectPath: null, // filled during init
  squads: {},
  workflows: {},
};

// ---------------------------------------------------------------------------
// Path Utilities
// ---------------------------------------------------------------------------

/**
 * Returns the absolute path to the global hub directory (~/.aiox/)
 * @returns {string}
 */
function getGlobalHubPath() {
  return GLOBAL_HUB_DIR;
}

/**
 * Returns the absolute path to the global config file (~/.aiox/config.yaml)
 * @returns {string}
 */
function getGlobalConfigPath() {
  return GLOBAL_CONFIG_PATH;
}

/**
 * Returns the absolute path to the local .aiox/ directory
 * @param {string} [projectRoot=process.cwd()]
 * @returns {string}
 */
function getLocalAioxPath(projectRoot = process.cwd()) {
  return path.join(projectRoot, LOCAL_AIOX_DIR);
}

/**
 * Returns the absolute path to the local .aiox/config.yaml
 * @param {string} [projectRoot=process.cwd()]
 * @returns {string}
 */
function getLocalConfigPath(projectRoot = process.cwd()) {
  return path.join(projectRoot, LOCAL_AIOX_DIR, LOCAL_CONFIG_FILE);
}

// ---------------------------------------------------------------------------
// Global Hub — Init & Structure
// ---------------------------------------------------------------------------

/**
 * Checks whether the global hub directory exists
 * @returns {boolean}
 */
function isGlobalHubInitialized() {
  return fs.existsSync(GLOBAL_HUB_DIR);
}

/**
 * Creates the default ~/.aiox/ directory structure with config.yaml.
 * Safe to call multiple times — skips dirs/files that already exist.
 *
 * @returns {Promise<{created: string[], skipped: string[]}>}
 */
async function createDefaultHub() {
  const created = [];
  const skipped = [];

  // Create root hub dir
  if (!fs.existsSync(GLOBAL_HUB_DIR)) {
    await fsPromises.mkdir(GLOBAL_HUB_DIR, { recursive: true });
    created.push(GLOBAL_HUB_DIR);
  } else {
    skipped.push(GLOBAL_HUB_DIR);
  }

  // Create subdirectories
  for (const subdir of GLOBAL_SUBDIRS) {
    const fullPath = path.join(GLOBAL_HUB_DIR, subdir);
    if (!fs.existsSync(fullPath)) {
      await fsPromises.mkdir(fullPath, { recursive: true });
      created.push(fullPath);
    } else {
      skipped.push(fullPath);
    }
  }

  // Create default config.yaml if missing
  if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
    await saveGlobalConfig(GLOBAL_CONFIG_DEFAULTS);
    created.push(GLOBAL_CONFIG_PATH);
  } else {
    skipped.push(GLOBAL_CONFIG_PATH);
  }

  return { created, skipped };
}

// ---------------------------------------------------------------------------
// Global Config — Load / Save / Merge
// ---------------------------------------------------------------------------

/**
 * Loads ~/.aiox/config.yaml, merging with defaults.
 * Returns defaults if file doesn't exist yet.
 *
 * @returns {Object} Merged global config
 */
function loadGlobalConfig() {
  if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
    return { ...GLOBAL_CONFIG_DEFAULTS };
  }

  try {
    const raw = fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf8');
    const parsed = yaml.load(raw) || {};
    return deepMerge({ ...GLOBAL_CONFIG_DEFAULTS }, parsed);
  } catch (err) {
    throw new Error(`Failed to load global config at ${GLOBAL_CONFIG_PATH}: ${err.message}`);
  }
}

/**
 * Saves an object as ~/.aiox/config.yaml.
 * Creates the hub directory if necessary.
 *
 * @param {Object} config
 * @returns {Promise<void>}
 */
async function saveGlobalConfig(config) {
  if (!fs.existsSync(GLOBAL_HUB_DIR)) {
    await fsPromises.mkdir(GLOBAL_HUB_DIR, { recursive: true });
  }

  const header = '# AIOX Global Configuration\n# Shared across all projects on this machine.\n\n';
  const content = header + yaml.dump(config, { lineWidth: 120, noRefs: true });
  await fsPromises.writeFile(GLOBAL_CONFIG_PATH, content, 'utf8');
}

// ---------------------------------------------------------------------------
// Local Config — Load / Save
// ---------------------------------------------------------------------------

/**
 * Loads .aiox/config.yaml from the project root.
 * Returns null if file doesn't exist.
 *
 * @param {string} [projectRoot=process.cwd()]
 * @returns {Object|null}
 */
function loadLocalConfig(projectRoot = process.cwd()) {
  const localPath = getLocalConfigPath(projectRoot);

  if (!fs.existsSync(localPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(localPath, 'utf8');
    return yaml.load(raw) || {};
  } catch (err) {
    throw new Error(`Failed to load local config at ${localPath}: ${err.message}`);
  }
}

/**
 * Saves .aiox/config.yaml to the project root.
 * Creates .aiox/ directory if necessary.
 *
 * @param {Object} config
 * @param {string} [projectRoot=process.cwd()]
 * @returns {Promise<void>}
 */
async function saveLocalConfig(config, projectRoot = process.cwd()) {
  const localDir = getLocalAioxPath(projectRoot);
  const localPath = getLocalConfigPath(projectRoot);

  if (!fs.existsSync(localDir)) {
    await fsPromises.mkdir(localDir, { recursive: true });
  }

  const header = '# AIOX Local Project Configuration\n# Project-specific settings. Safe to commit (no secrets).\n\n';
  const content = header + yaml.dump(config, { lineWidth: 120, noRefs: true });
  await fsPromises.writeFile(localPath, content, 'utf8');
}

// ---------------------------------------------------------------------------
// Resolved Config — Merge global + local (AC4)
// ---------------------------------------------------------------------------

/**
 * Returns the fully resolved config for a project.
 * Order: defaults → global config → local config (deep merge).
 * If local config has `extends: global`, global values are inherited.
 *
 * @param {string} [projectRoot=process.cwd()]
 * @returns {Object} Resolved config
 */
function resolveConfig(projectRoot = process.cwd()) {
  const globalConfig = loadGlobalConfig();
  const localConfig = loadLocalConfig(projectRoot);

  if (!localConfig) {
    return globalConfig;
  }

  // If local extends global, deep-merge (local wins on conflicts)
  if (localConfig.extends === 'global') {
    return deepMerge({ ...globalConfig }, localConfig);
  }

  // No extends — return local only (with defaults as base)
  return deepMerge({ ...LOCAL_CONFIG_DEFAULTS }, localConfig);
}

// ---------------------------------------------------------------------------
// Project Registration (AC3)
// ---------------------------------------------------------------------------

/**
 * Registers a project in ~/.aiox/config.yaml projects map.
 * Creates the global hub if it doesn't exist.
 *
 * @param {string} projectName - Short project name (e.g., "astroluna")
 * @param {string} projectPath - Absolute path to the project
 * @returns {Promise<void>}
 */
async function registerProject(projectName, projectPath) {
  if (!isGlobalHubInitialized()) {
    await createDefaultHub();
  }

  const config = loadGlobalConfig();
  config.projects = config.projects || {};
  config.projects[projectName] = projectPath;
  await saveGlobalConfig(config);
}

/**
 * Removes a project from the global registry.
 *
 * @param {string} projectName
 * @returns {Promise<boolean>} true if removed, false if not found
 */
async function unregisterProject(projectName) {
  if (!isGlobalHubInitialized()) return false;

  const config = loadGlobalConfig();
  if (!config.projects || !(projectName in config.projects)) {
    return false;
  }

  delete config.projects[projectName];
  await saveGlobalConfig(config);
  return true;
}

/**
 * Returns all registered projects as { name: path } map.
 * @returns {Object}
 */
function listProjects() {
  if (!isGlobalHubInitialized()) return {};
  const config = loadGlobalConfig();
  return config.projects || {};
}

// ---------------------------------------------------------------------------
// Project Init (AC3, AC7)
// ---------------------------------------------------------------------------

/**
 * Initializes a project's local .aiox/config.yaml, auto-detects project name
 * from core-config.yaml or falls back to directory name, and registers in global hub.
 *
 * @param {string} [projectRoot=process.cwd()]
 * @returns {Promise<{projectName: string, localConfigPath: string, globalHubCreated: boolean}>}
 */
async function initProject(projectRoot = process.cwd()) {
  let globalHubCreated = false;

  // Create global hub if missing (AC7)
  if (!isGlobalHubInitialized()) {
    await createDefaultHub();
    globalHubCreated = true;
  }

  // Detect project name from core-config.yaml or directory name
  const projectName = detectProjectName(projectRoot);

  // Create local .aiox/config.yaml
  const localConfig = {
    ...LOCAL_CONFIG_DEFAULTS,
    name: projectName,
    projectPath: projectRoot,
  };

  await saveLocalConfig(localConfig, projectRoot);

  // Register in global hub
  await registerProject(projectName, projectRoot);

  return {
    projectName,
    localConfigPath: getLocalConfigPath(projectRoot),
    globalHubCreated,
  };
}

/**
 * Detects the project name from core-config.yaml or falls back to directory name.
 *
 * @param {string} projectRoot
 * @returns {string}
 */
function detectProjectName(projectRoot) {
  // Try core-config.yaml (AIOX projects)
  const coreConfigPath = path.join(projectRoot, '.aiox-core', 'core-config.yaml');
  if (fs.existsSync(coreConfigPath)) {
    try {
      const raw = fs.readFileSync(coreConfigPath, 'utf8');
      const config = yaml.load(raw);
      if (config && config.project && config.project.name) {
        return config.project.name;
      }
    } catch {
      // Fall through to directory name
    }
  }

  // Try package.json name
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (pkg.name) return pkg.name;
    } catch {
      // Fall through
    }
  }

  // Fallback: directory name
  return path.basename(projectRoot);
}

// ---------------------------------------------------------------------------
// Squad Resolution (AC5)
// ---------------------------------------------------------------------------

/**
 * Resolves the path for a named squad.
 * Search order: .aiox/squads/{name}.yaml → ~/.aiox/squads/{name}.yaml
 *
 * @param {string} squadName
 * @param {string} [projectRoot=process.cwd()]
 * @returns {string|null} Absolute path to squad file, or null if not found
 */
function resolveSquadPath(squadName, projectRoot = process.cwd()) {
  const fileName = squadName.endsWith('.yaml') ? squadName : `${squadName}.yaml`;

  // 1. Check local .aiox/squads/
  const localSquadPath = path.join(projectRoot, LOCAL_AIOX_DIR, 'squads', fileName);
  if (fs.existsSync(localSquadPath)) {
    return localSquadPath;
  }

  // 2. Check global ~/.aiox/squads/
  const globalSquadPath = path.join(GLOBAL_HUB_DIR, 'squads', fileName);
  if (fs.existsSync(globalSquadPath)) {
    return globalSquadPath;
  }

  return null;
}

/**
 * Lists all available squads (global + local, deduplicated — local overrides global).
 *
 * @param {string} [projectRoot=process.cwd()]
 * @returns {Array<{name: string, path: string, source: 'local'|'global'}>}
 */
function listSquads(projectRoot = process.cwd()) {
  const squads = new Map();

  // Load global squads first (lower priority)
  const globalSquadsDir = path.join(GLOBAL_HUB_DIR, 'squads');
  if (fs.existsSync(globalSquadsDir)) {
    for (const file of fs.readdirSync(globalSquadsDir)) {
      if (file.endsWith('.yaml')) {
        const name = file.replace(/\.yaml$/, '');
        squads.set(name, { name, path: path.join(globalSquadsDir, file), source: 'global' });
      }
    }
  }

  // Load local squads (higher priority — overrides global)
  const localSquadsDir = path.join(projectRoot, LOCAL_AIOX_DIR, 'squads');
  if (fs.existsSync(localSquadsDir)) {
    for (const file of fs.readdirSync(localSquadsDir)) {
      if (file.endsWith('.yaml')) {
        const name = file.replace(/\.yaml$/, '');
        squads.set(name, { name, path: path.join(localSquadsDir, file), source: 'local' });
      }
    }
  }

  return Array.from(squads.values());
}

/**
 * Loads and parses a squad by name.
 *
 * @param {string} squadName
 * @param {string} [projectRoot=process.cwd()]
 * @returns {Object} Parsed squad YAML
 * @throws {Error} If squad not found
 */
function loadSquad(squadName, projectRoot = process.cwd()) {
  const squadPath = resolveSquadPath(squadName, projectRoot);
  if (!squadPath) {
    throw new Error(`Squad "${squadName}" not found in local (.aiox/squads/) or global (~/.aiox/squads/)`);
  }

  try {
    const raw = fs.readFileSync(squadPath, 'utf8');
    return yaml.load(raw);
  } catch (err) {
    throw new Error(`Failed to load squad "${squadName}" from ${squadPath}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates the global hub structure and config.
 *
 * @returns {{valid: boolean, issues: string[], warnings: string[]}}
 */
function validateGlobalHub() {
  const issues = [];
  const warnings = [];

  if (!fs.existsSync(GLOBAL_HUB_DIR)) {
    issues.push(`Global hub not found: ${GLOBAL_HUB_DIR}`);
    return { valid: false, issues, warnings };
  }

  // Check required subdirectories
  for (const subdir of GLOBAL_SUBDIRS) {
    const fullPath = path.join(GLOBAL_HUB_DIR, subdir);
    if (!fs.existsSync(fullPath)) {
      warnings.push(`Missing subdir: ~/.aiox/${subdir}/`);
    }
  }

  // Validate config.yaml
  if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
    warnings.push('~/.aiox/config.yaml not found (will use defaults)');
  } else {
    try {
      loadGlobalConfig();
    } catch (err) {
      issues.push(`Invalid config.yaml: ${err.message}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Deep Merge Utility
// ---------------------------------------------------------------------------

/**
 * Deep merges source into target. Arrays are replaced (not concatenated).
 * Null values in source override target.
 *
 * @param {Object} target
 * @param {Object} source
 * @returns {Object} Merged object (mutates target)
 */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;

  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      target[key] = deepMerge({ ...tgtVal }, srcVal);
    } else {
      target[key] = srcVal;
    }
  }

  return target;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Path resolution
  getGlobalHubPath,
  getGlobalConfigPath,
  getLocalAioxPath,
  getLocalConfigPath,

  // Hub lifecycle
  isGlobalHubInitialized,
  createDefaultHub,

  // Config
  loadGlobalConfig,
  saveGlobalConfig,
  loadLocalConfig,
  saveLocalConfig,
  resolveConfig,

  // Project registration
  registerProject,
  unregisterProject,
  listProjects,
  initProject,
  detectProjectName,

  // Squad resolution
  resolveSquadPath,
  listSquads,
  loadSquad,

  // Validation
  validateGlobalHub,

  // Utilities
  deepMerge,

  // Constants
  GLOBAL_HUB_DIR,
  GLOBAL_CONFIG_PATH,
  GLOBAL_SUBDIRS,
  GLOBAL_CONFIG_DEFAULTS,
};
