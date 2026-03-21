/**
 * Handoff Cleanup
 *
 * Removes old handoffs from done/ and failed/ queues based on retention policy.
 * Called by `aiox doctor` and `aiox hub init`.
 *
 * Retention: configurable via ~/.aiox/config.yaml → handoffRetentionDays (default: 7)
 *
 * @module core/handoffs/handoff-cleanup
 * @story 9.2 — Cross-Session Handoff System
 * @version 1.0.0
 */

'use strict';

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const os = require('os');

const { HANDOFFS_ROOT, getQueuePath } = require('./handoff-writer');

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.aiox', 'config.yaml');
const DEFAULT_RETENTION_DAYS = 7;

// ---------------------------------------------------------------------------
// Config Loader (lightweight, no hub-manager dep to avoid circular)
// ---------------------------------------------------------------------------

/**
 * Reads handoffRetentionDays from ~/.aiox/config.yaml.
 * Falls back to DEFAULT_RETENTION_DAYS if unreadable.
 * @returns {number}
 */
function getRetentionDays() {
  try {
    if (!fs.existsSync(GLOBAL_CONFIG_PATH)) return DEFAULT_RETENTION_DAYS;
    const yaml = require('js-yaml');
    const raw = fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf8');
    const config = yaml.load(raw);
    const days = config && config.handoffRetentionDays;
    return typeof days === 'number' && days > 0 ? days : DEFAULT_RETENTION_DAYS;
  } catch {
    return DEFAULT_RETENTION_DAYS;
  }
}

// ---------------------------------------------------------------------------
// cleanupHandoffs (AC6)
// ---------------------------------------------------------------------------

/**
 * Removes handoffs from done/ and failed/ older than retentionDays.
 *
 * @param {Object} options
 * @param {string} [options.projectName] - Specific project to clean, or all projects if omitted
 * @param {number} [options.retentionDays] - Override retention (default: from global config)
 * @param {boolean} [options.dryRun=false] - Preview without deleting
 * @returns {Promise<{removed: string[], kept: number, dryRun: boolean}>}
 */
async function cleanupHandoffs(options = {}) {
  const retentionDays = options.retentionDays || getRetentionDays();
  const dryRun = options.dryRun === true;
  const cutoffMs = retentionDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const removed = [];
  let kept = 0;

  if (!fs.existsSync(HANDOFFS_ROOT)) {
    return { removed, kept, dryRun };
  }

  // Determine which projects to clean
  let projectNames;
  if (options.projectName) {
    projectNames = [options.projectName];
  } else {
    try {
      projectNames = fs
        .readdirSync(HANDOFFS_ROOT)
        .filter((entry) => {
          const fullPath = path.join(HANDOFFS_ROOT, entry);
          return fs.statSync(fullPath).isDirectory();
        });
    } catch {
      return { removed, kept, dryRun };
    }
  }

  // Clean done/ and failed/ for each project
  for (const projectName of projectNames) {
    for (const status of ['done', 'failed']) {
      const queueDir = getQueuePath(projectName, status);
      if (!fs.existsSync(queueDir)) continue;

      let files;
      try {
        files = fs.readdirSync(queueDir).filter((f) => f.endsWith('.yaml'));
      } catch {
        continue;
      }

      for (const file of files) {
        const filePath = path.join(queueDir, file);
        try {
          const stat = fs.statSync(filePath);
          const ageMs = now - stat.mtimeMs;

          if (ageMs > cutoffMs) {
            if (!dryRun) {
              await fsPromises.unlink(filePath);
            }
            removed.push(filePath);
          } else {
            kept++;
          }
        } catch {
          // File may have been removed by another process — skip
        }
      }
    }
  }

  return { removed, kept, dryRun };
}

/**
 * Returns a human-readable summary of cleanup results.
 * @param {{removed: string[], kept: number, dryRun: boolean}} result
 * @returns {string}
 */
function formatCleanupResult(result) {
  const prefix = result.dryRun ? '[DRY RUN] ' : '';
  if (result.removed.length === 0) {
    return `${prefix}No handoffs to clean (${result.kept} retained).`;
  }
  return `${prefix}Removed ${result.removed.length} handoff(s), kept ${result.kept}.`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  cleanupHandoffs,
  formatCleanupResult,
  getRetentionDays,
};
