'use strict';

const fs = require('fs');
const path = require('path');

/**
 * TaskChainConfig -- Load, parse, and validate task chain definitions
 *
 * Reads chain definitions from `.aiox/task-chains.yaml` and provides
 * a validated, cached representation for the dispatcher.
 *
 * @class TaskChainConfig
 * @version 1.0.0
 * @story 1.2
 */
class TaskChainConfig {
  /**
   * Initialize TaskChainConfig
   * @param {Object} options Configuration options
   * @param {string} options.configPath Path to task-chains.yaml
   * @param {Function} options.yamlParser YAML parser function (yaml.parse)
   */
  constructor(options = {}) {
    this.configPath = options.configPath || path.join(process.cwd(), '.aiox', 'task-chains.yaml');
    this.yamlParser = options.yamlParser || null;
    this._chains = null;
    this._lastLoadTime = null;
    this._fileWatcher = null;
  }

  /**
   * Load and parse chain configuration
   * @returns {Object} Parsed chain definitions
   * @throws {Error} If config file is missing or invalid
   */
  load() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Task chain config not found: ${this.configPath}`);
    }

    const rawContent = fs.readFileSync(this.configPath, 'utf8');
    const parsed = this._parse(rawContent);

    this._validate(parsed);
    this._chains = parsed;
    this._lastLoadTime = Date.now();

    return parsed;
  }

  /**
   * Get all chain definitions
   * @returns {Object} Chain definitions keyed by chain name
   */
  getChains() {
    if (!this._chains) {
      this.load();
    }
    return this._chains.chains || {};
  }

  /**
   * Get a specific chain by name
   * @param {string} name Chain name
   * @returns {Object|null} Chain definition or null
   */
  getChain(name) {
    const chains = this.getChains();
    return chains[name] || null;
  }

  /**
   * List all available chain names
   * @returns {Array<string>} Chain names
   */
  listChains() {
    const chains = this.getChains();
    return Object.keys(chains);
  }

  /**
   * Get chain with resolved task order (topological sort)
   * @param {string} name Chain name
   * @returns {Array<Object>} Ordered tasks
   */
  getOrderedTasks(name) {
    const chain = this.getChain(name);
    if (!chain || !chain.tasks) {
      return [];
    }

    return this._topologicalSort(chain.tasks);
  }

  /**
   * Validate chain integrity (no cycles, valid deps)
   * @param {string} name Chain name
   * @returns {Object} Validation result { valid, errors }
   */
  validateChain(name) {
    const chain = this.getChain(name);
    if (!chain) {
      return { valid: false, errors: [`Chain '${name}' not found`] };
    }

    const errors = [];
    const tasks = chain.tasks || [];
    const taskNames = new Set(tasks.map((t) => t.name));

    // Check for duplicate task names
    if (taskNames.size !== tasks.length) {
      errors.push('Duplicate task names detected');
    }

    // Check dependency references
    for (const task of tasks) {
      if (task.depends_on && !taskNames.has(task.depends_on)) {
        errors.push(`Task '${task.name}' depends on unknown task '${task.depends_on}'`);
      }
    }

    // Check for cycles
    if (this._hasCycle(tasks)) {
      errors.push('Circular dependency detected');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Reload configuration if file has changed
   * @returns {boolean} Whether config was reloaded
   */
  reload() {
    if (!fs.existsSync(this.configPath)) {
      return false;
    }

    const stat = fs.statSync(this.configPath);
    if (this._lastLoadTime && stat.mtimeMs <= this._lastLoadTime) {
      return false;
    }

    this.load();
    return true;
  }

  /**
   * Parse YAML content
   * @private
   * @param {string} content Raw YAML content
   * @returns {Object} Parsed object
   */
  _parse(content) {
    if (this.yamlParser) {
      return this.yamlParser(content);
    }

    // Try to require js-yaml
    try {
      const yaml = require('js-yaml');
      return yaml.load(content);
    } catch (_e) {
      // Fallback: simple YAML-like parser for basic structures
      return this._simpleYamlParse(content);
    }
  }

  /**
   * Simple YAML parser for basic chain configs
   * @private
   * @param {string} content YAML content
   * @returns {Object} Parsed object
   */
  _simpleYamlParse(content) {
    // This is a minimal fallback; production should use js-yaml
    const lines = content.split('\n');
    const result = { chains: {} };
    let currentChain = null;
    let currentTask = null;
    let inTasks = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Chain name detection (2-space indent under chains:)
      const chainMatch = line.match(/^ {2}(\w[\w-]*):$/);
      if (chainMatch) {
        // New chain starts -- reset task context
        currentChain = chainMatch[1];
        result.chains[currentChain] = { description: '', tasks: [] };
        currentTask = null;
        inTasks = false;
        continue;
      }

      // Description
      const descMatch = line.match(/^\s+description:\s*(.+)$/);
      if (descMatch && currentChain && !inTasks) {
        result.chains[currentChain].description = descMatch[1].trim();
        continue;
      }

      // Tasks section
      if (trimmed === 'tasks:' && currentChain) {
        inTasks = true;
        currentTask = null;
        continue;
      }

      // Task item (list entry with name)
      const taskItemMatch = line.match(/^\s+-\s*name:\s*(.+)$/);
      if (taskItemMatch && currentChain && inTasks) {
        currentTask = { name: taskItemMatch[1].trim() };
        result.chains[currentChain].tasks.push(currentTask);
        continue;
      }

      // Task properties (indented under current task)
      if (currentTask && inTasks) {
        const propMatch = line.match(/^\s+(\w[\w_]*):\s*(.+)$/);
        if (propMatch) {
          const key = propMatch[1].trim();
          let value = propMatch[2].trim();

          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (/^\d+$/.test(value)) value = parseInt(value, 10);

          currentTask[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Validate parsed config structure
   * @private
   * @param {Object} config Parsed config
   * @throws {Error} If config is invalid
   */
  _validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config: must be an object');
    }

    if (!config.chains || typeof config.chains !== 'object') {
      throw new Error('Invalid config: must have a "chains" section');
    }

    for (const [chainName, chain] of Object.entries(config.chains)) {
      if (!chain.tasks || !Array.isArray(chain.tasks)) {
        throw new Error(`Chain '${chainName}' must have a "tasks" array`);
      }

      for (const task of chain.tasks) {
        if (!task.name) {
          throw new Error(`All tasks in chain '${chainName}' must have a "name"`);
        }
      }
    }
  }

  /**
   * Detect cycles in task dependencies using DFS
   * @private
   * @param {Array} tasks Task list
   * @returns {boolean} True if cycle exists
   */
  _hasCycle(tasks) {
    const graph = new Map();
    for (const task of tasks) {
      graph.set(task.name, task.depends_on ? [task.depends_on] : []);
    }

    const visited = new Set();
    const inStack = new Set();

    const dfs = (node) => {
      if (inStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      inStack.add(node);

      const deps = graph.get(node) || [];
      for (const dep of deps) {
        if (dfs(dep)) return true;
      }

      inStack.delete(node);
      return false;
    };

    for (const task of tasks) {
      if (dfs(task.name)) return true;
    }

    return false;
  }

  /**
   * Topological sort of tasks based on dependencies
   * @private
   * @param {Array} tasks Task list
   * @returns {Array} Sorted tasks
   */
  _topologicalSort(tasks) {
    const taskMap = new Map(tasks.map((t) => [t.name, t]));
    const inDegree = new Map();
    const adjList = new Map();

    // Initialize
    for (const task of tasks) {
      inDegree.set(task.name, 0);
      adjList.set(task.name, []);
    }

    // Build adjacency list
    for (const task of tasks) {
      if (task.depends_on && taskMap.has(task.depends_on)) {
        adjList.get(task.depends_on).push(task.name);
        inDegree.set(task.name, (inDegree.get(task.name) || 0) + 1);
      }
    }

    // BFS (Kahn's algorithm)
    const queue = [];
    for (const [name, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(name);
    }

    const sorted = [];
    while (queue.length > 0) {
      const node = queue.shift();
      sorted.push(taskMap.get(node));

      for (const neighbor of adjList.get(node) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return sorted;
  }
}

module.exports = { TaskChainConfig };
