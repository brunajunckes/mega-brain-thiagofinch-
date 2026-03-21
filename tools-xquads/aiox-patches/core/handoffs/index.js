/**
 * AIOX Handoff System — Public API
 *
 * Cross-session coordination via file-based handoff queue in ~/.aiox/handoffs/{project}/
 *
 * Usage:
 *   const { writeHandoff, getNext, complete, fail, cleanupHandoffs } = require('./core/handoffs');
 *
 * @module core/handoffs
 * @story 9.2 — Cross-Session Handoff System
 * @version 1.0.0
 */

'use strict';

const writer = require('./handoff-writer');
const consumer = require('./handoff-consumer');
const cleanup = require('./handoff-cleanup');

module.exports = {
  // Writer API
  writeHandoff: writer.writeHandoff,
  validateHandoff: writer.validateHandoff,
  ensureQueueDirs: writer.ensureQueueDirs,
  resolveProjectName: writer.resolveProjectName,

  // Consumer API
  getNext: consumer.getNext,
  complete: consumer.complete,
  fail: consumer.fail,
  peekNext: consumer.peekNext,
  listQueue: consumer.listQueue,
  listAll: consumer.listAll,

  // Cleanup API
  cleanupHandoffs: cleanup.cleanupHandoffs,
  formatCleanupResult: cleanup.formatCleanupResult,
  getRetentionDays: cleanup.getRetentionDays,

  // Constants
  HANDOFFS_ROOT: writer.HANDOFFS_ROOT,
  QUEUE_DIRS: writer.QUEUE_DIRS,
  LIMITS: writer.LIMITS,
};
