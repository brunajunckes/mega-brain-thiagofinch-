/**
 * AIOX Orchestration Module
 * Exports Squad Orchestrator and Task Chain Manager
 */

const SquadOrchestrator = require('./squad-orchestrator');
const TaskChain = require('./task-chain');

module.exports = {
  SquadOrchestrator,
  TaskChain,
};
