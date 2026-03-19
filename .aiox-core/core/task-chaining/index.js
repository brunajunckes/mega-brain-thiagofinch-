'use strict';

const { TaskAnalyzer } = require('./task-analyzer');
const { TaskDispatcher } = require('./task-dispatcher');

/**
 * Task Chaining Module
 *
 * Provides automatic task dependency detection and execution chaining.
 *
 * @module aiox-core/task-chaining
 * @version 1.0.0
 */

module.exports = {
  TaskAnalyzer,
  TaskDispatcher,
};
