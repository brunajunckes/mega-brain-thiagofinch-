'use strict';

/**
 * Task Chaining Package — Project-level extensions
 *
 * Provides TaskChainConfig for loading chain definitions from YAML,
 * and re-exports core TaskAnalyzer/TaskDispatcher.
 *
 * @module packages/task-chaining
 * @version 1.0.0
 * @story 1.2
 */

const { TaskChainConfig } = require('./task-chain-config');

// Re-export core modules for convenience
let TaskAnalyzer;
let TaskDispatcher;

try {
  const core = require('../../../.aiox-core/core/task-chaining');
  TaskAnalyzer = core.TaskAnalyzer;
  TaskDispatcher = core.TaskDispatcher;
} catch (_e) {
  // Core modules may not be available in all environments
  TaskAnalyzer = null;
  TaskDispatcher = null;
}

module.exports = {
  TaskChainConfig,
  TaskAnalyzer,
  TaskDispatcher,
};
