/**
 * Handoff Consumer
 *
 * API for sessions to consume handoffs from the queue.
 * Uses atomic fs.rename() to prevent race conditions between parallel sessions.
 *
 * Race condition safety:
 *   - getNext() uses fs.rename() which is atomic on same filesystem
 *   - If rename fails with ENOENT (already taken by another session), tries next
 *   - complete() and fail() also use rename for consistency
 *
 * @module core/handoffs/handoff-consumer
 * @story 9.2 — Cross-Session Handoff System
 * @version 1.0.0
 */

'use strict';

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const { getQueuePath, getProjectHandoffsPath, handoffFilename, resolveProjectName } = require('./handoff-writer');

// ---------------------------------------------------------------------------
// Read Handoff File
// ---------------------------------------------------------------------------

/**
 * Reads and parses a handoff YAML file.
 * @param {string} filePath
 * @returns {Object|null} Parsed handoff or null if unreadable
 */
function readHandoffFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return yaml.load(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// List Handoffs
// ---------------------------------------------------------------------------

/**
 * Lists handoff files in a queue directory, sorted oldest-first.
 *
 * @param {string} projectName
 * @param {'ready'|'in-progress'|'done'|'failed'} status
 * @returns {Array<{filename: string, filePath: string, mtime: Date}>}
 */
function listQueue(projectName, status) {
  const queueDir = getQueuePath(projectName, status);

  if (!fs.existsSync(queueDir)) return [];

  try {
    return fs
      .readdirSync(queueDir)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => {
        const filePath = path.join(queueDir, f);
        const stat = fs.statSync(filePath);
        return { filename: f, filePath, mtime: stat.mtime };
      })
      .sort((a, b) => a.mtime - b.mtime); // oldest first (FIFO)
  } catch {
    return [];
  }
}

/**
 * Lists all handoffs across all statuses for a project.
 *
 * @param {string} projectName
 * @returns {Object} { ready: [], 'in-progress': [], done: [], failed: [] }
 */
function listAll(projectName) {
  return {
    ready: listQueue(projectName, 'ready'),
    'in-progress': listQueue(projectName, 'in-progress'),
    done: listQueue(projectName, 'done'),
    failed: listQueue(projectName, 'failed'),
  };
}

// ---------------------------------------------------------------------------
// getNext — Atomic Consume (AC4, AC5)
// ---------------------------------------------------------------------------

/**
 * Atomically takes the next available handoff from the ready/ queue.
 * Moves it to in-progress/ using fs.rename() (atomic on same filesystem).
 *
 * If another session grabbed it first (ENOENT), transparently tries the next one.
 *
 * @param {Object} options
 * @param {string} [options.projectName] - Project name (auto-detected if omitted)
 * @param {string} [options.toAgent] - Filter by destination agent
 * @returns {Promise<Object|null>} Handoff object or null if queue empty
 */
async function getNext(options = {}) {
  const projectName = options.projectName || resolveProjectName();
  if (!projectName) return null;

  const candidates = listQueue(projectName, 'ready');

  // Filter by toAgent if specified
  const filtered = options.toAgent
    ? candidates.filter((c) => {
        const data = readHandoffFile(c.filePath);
        return data && data.to_agent === options.toAgent;
      })
    : candidates;

  for (const candidate of filtered) {
    const srcPath = candidate.filePath;
    const inProgressDir = getQueuePath(projectName, 'in-progress');
    const dstPath = path.join(inProgressDir, candidate.filename);

    // Ensure in-progress dir exists
    if (!fs.existsSync(inProgressDir)) {
      await fsPromises.mkdir(inProgressDir, { recursive: true });
    }

    try {
      // Atomic rename — only one session wins
      await fsPromises.rename(srcPath, dstPath);

      // Read and return the handoff
      const handoff = readHandoffFile(dstPath);
      if (handoff) {
        handoff.status = 'in-progress';
        return handoff;
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Another session grabbed it first — try next
        continue;
      }
      throw err;
    }
  }

  return null; // Queue empty or no matching handoff
}

// ---------------------------------------------------------------------------
// complete — Move to done/ (AC4)
// ---------------------------------------------------------------------------

/**
 * Marks a handoff as complete. Moves from in-progress/ to done/.
 *
 * @param {string} handoffId - The handoff ID (without .yaml extension)
 * @param {Object} options
 * @param {string} [options.projectName] - Project name (auto-detected if omitted)
 * @returns {Promise<boolean>} true if moved, false if not found
 */
async function complete(handoffId, options = {}) {
  const projectName = options.projectName || resolveProjectName();
  if (!projectName) return false;

  const filename = handoffFilename(handoffId);
  const srcPath = path.join(getQueuePath(projectName, 'in-progress'), filename);
  const doneDir = getQueuePath(projectName, 'done');
  const dstPath = path.join(doneDir, filename);

  if (!fs.existsSync(srcPath)) return false;

  if (!fs.existsSync(doneDir)) {
    await fsPromises.mkdir(doneDir, { recursive: true });
  }

  try {
    await fsPromises.rename(srcPath, dstPath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// fail — Move to failed/ with reason (AC4)
// ---------------------------------------------------------------------------

/**
 * Marks a handoff as failed. Moves from in-progress/ to failed/,
 * appending the failure reason to the YAML.
 *
 * @param {string} handoffId - The handoff ID
 * @param {string} reason - Failure reason
 * @param {Object} options
 * @param {string} [options.projectName] - Project name (auto-detected if omitted)
 * @returns {Promise<boolean>} true if moved, false if not found
 */
async function fail(handoffId, reason, options = {}) {
  const projectName = options.projectName || resolveProjectName();
  if (!projectName) return false;

  const filename = handoffFilename(handoffId);
  const srcPath = path.join(getQueuePath(projectName, 'in-progress'), filename);
  const failedDir = getQueuePath(projectName, 'failed');
  const dstPath = path.join(failedDir, filename);

  if (!fs.existsSync(srcPath)) return false;

  if (!fs.existsSync(failedDir)) {
    await fsPromises.mkdir(failedDir, { recursive: true });
  }

  try {
    // Append failure reason to the file before moving
    const handoff = readHandoffFile(srcPath);
    if (handoff) {
      handoff.status = 'failed';
      handoff.failed_at = new Date().toISOString();
      handoff.failure_reason = reason || 'Unknown error';

      const content = yaml.dump(handoff, { lineWidth: 120, noRefs: true });
      await fsPromises.writeFile(srcPath, content, 'utf8');
    }

    await fsPromises.rename(srcPath, dstPath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// peek — Read without consuming
// ---------------------------------------------------------------------------

/**
 * Reads the next handoff from ready/ WITHOUT moving it (non-destructive preview).
 *
 * @param {Object} options
 * @param {string} [options.projectName]
 * @param {string} [options.toAgent]
 * @returns {Object|null} Handoff data or null
 */
function peekNext(options = {}) {
  const projectName = options.projectName || resolveProjectName();
  if (!projectName) return null;

  const candidates = listQueue(projectName, 'ready');

  const filtered = options.toAgent
    ? candidates.filter((c) => {
        const data = readHandoffFile(c.filePath);
        return data && data.to_agent === options.toAgent;
      })
    : candidates;

  if (filtered.length === 0) return null;

  return readHandoffFile(filtered[0].filePath);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  getNext,
  complete,
  fail,
  peekNext,
  listQueue,
  listAll,
  readHandoffFile,
};
