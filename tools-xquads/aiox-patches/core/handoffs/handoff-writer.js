/**
 * Handoff Writer
 *
 * API for agents to write handoff files to ~/.aiox/handoffs/{project}/ready/
 * when completing tasks. Enables async cross-session coordination.
 *
 * Filename format: handoff-{from}-to-{to}-{timestamp}.yaml
 * Size limit: ~2KB / 500 tokens (per agent-handoff.md protocol)
 *
 * @module core/handoffs/handoff-writer
 * @story 9.2 — Cross-Session Handoff System
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
const HANDOFFS_ROOT = path.join(GLOBAL_HUB_DIR, 'handoffs');

const QUEUE_DIRS = ['ready', 'in-progress', 'done', 'failed'];

/** Limits per agent-handoff.md protocol */
const LIMITS = {
  decisions: 5,
  files_modified: 10,
  blockers: 3,
};

const REQUIRED_FIELDS = ['from_agent', 'to_agent', 'story_id', 'next_action'];

// ---------------------------------------------------------------------------
// Path Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the handoff directory for a project
 * @param {string} projectName
 * @returns {string}
 */
function getProjectHandoffsPath(projectName) {
  return path.join(HANDOFFS_ROOT, projectName);
}

/**
 * Returns the path to a specific queue dir for a project
 * @param {string} projectName
 * @param {'ready'|'in-progress'|'done'|'failed'} status
 * @returns {string}
 */
function getQueuePath(projectName, status) {
  return path.join(HANDOFFS_ROOT, projectName, status);
}

/**
 * Generates a unique handoff ID
 * @param {string} fromAgent
 * @param {string} toAgent
 * @returns {string}
 */
function generateHandoffId(fromAgent, toAgent) {
  const ts = Date.now();
  return `handoff-${fromAgent}-to-${toAgent}-${ts}`;
}

/**
 * Returns the filename for a handoff
 * @param {string} id
 * @returns {string}
 */
function handoffFilename(id) {
  return `${id}.yaml`;
}

// ---------------------------------------------------------------------------
// Queue Initialization
// ---------------------------------------------------------------------------

/**
 * Ensures the project's handoff queue directories exist.
 * Creates: ready/, in-progress/, done/, failed/
 *
 * @param {string} projectName
 * @returns {Promise<void>}
 */
async function ensureQueueDirs(projectName) {
  for (const dir of QUEUE_DIRS) {
    const fullPath = getQueuePath(projectName, dir);
    await fsPromises.mkdir(fullPath, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Schema Validation
// ---------------------------------------------------------------------------

/**
 * Validates and normalizes a handoff data object.
 * Enforces required fields and array size limits.
 *
 * @param {Object} data - Raw handoff data
 * @returns {Object} Normalized handoff object
 * @throws {Error} If required fields are missing
 */
function validateHandoff(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Handoff data must be an object');
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      throw new Error(`Handoff missing required field: ${field}`);
    }
  }

  // Normalize and enforce limits
  const normalized = {
    id: data.id || generateHandoffId(data.from_agent, data.to_agent),
    from_agent: String(data.from_agent),
    to_agent: String(data.to_agent),
    story_id: String(data.story_id),
    story_path: data.story_path || '',
    branch: data.branch || '',
    status: 'ready',
    created_at: data.created_at || new Date().toISOString(),
    next_action: String(data.next_action),
    decisions: truncateArray(data.decisions, LIMITS.decisions),
    files_modified: truncateArray(data.files_modified, LIMITS.files_modified),
    blockers: truncateArray(data.blockers, LIMITS.blockers),
  };

  return normalized;
}

/**
 * Truncates an array to max items, converting to array if needed.
 * @param {any} value
 * @param {number} max
 * @returns {Array}
 */
function truncateArray(value, max) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.slice(0, max);
}

// ---------------------------------------------------------------------------
// Write Handoff (AC3)
// ---------------------------------------------------------------------------

/**
 * Writes a handoff file to the project's ready/ queue.
 *
 * @param {Object} data - Handoff data (see schema above)
 * @param {Object} options
 * @param {string} options.projectName - Project name (from .aiox/config.yaml)
 * @returns {Promise<{id: string, filePath: string}>}
 * @throws {Error} If validation fails or write fails
 */
async function writeHandoff(data, options = {}) {
  const projectName = options.projectName || resolveProjectName();

  if (!projectName) {
    throw new Error('projectName is required. Pass it explicitly or run `aiox hub init` first.');
  }

  // Validate and normalize
  const handoff = validateHandoff(data);

  // Ensure queue dirs exist
  await ensureQueueDirs(projectName);

  // Write to ready/
  const readyDir = getQueuePath(projectName, 'ready');
  const filename = handoffFilename(handoff.id);
  const filePath = path.join(readyDir, filename);

  const header = `# AIOX Handoff — ${handoff.from_agent} → ${handoff.to_agent}\n# Created: ${handoff.created_at}\n\n`;
  const content = header + yaml.dump(handoff, { lineWidth: 120, noRefs: true });

  await fsPromises.writeFile(filePath, content, 'utf8');

  return { id: handoff.id, filePath };
}

// ---------------------------------------------------------------------------
// Project Name Resolution
// ---------------------------------------------------------------------------

/**
 * Attempts to resolve project name from local .aiox/config.yaml.
 * Returns null if not found (caller should handle).
 *
 * @param {string} [projectRoot=process.cwd()]
 * @returns {string|null}
 */
function resolveProjectName(projectRoot = process.cwd()) {
  const configPath = path.join(projectRoot, '.aiox', 'config.yaml');
  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(raw);
    return config && config.name ? config.name : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  writeHandoff,
  validateHandoff,
  ensureQueueDirs,
  generateHandoffId,
  getProjectHandoffsPath,
  getQueuePath,
  resolveProjectName,
  handoffFilename,
  HANDOFFS_ROOT,
  QUEUE_DIRS,
  LIMITS,
};
