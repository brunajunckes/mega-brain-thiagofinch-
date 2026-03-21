'use strict';

const { execSync, exec } = require('child_process');
const { EventEmitter } = require('events');

/**
 * Multi-Backend Executor — Execute tasks across different backends
 *
 * Supports:
 * - docker: Execute in Docker containers
 * - ssh: Execute on remote machines via SSH
 * - modal: Execute on Modal serverless platform
 * - local: Execute locally (default)
 *
 * @class MultiBackendExecutor
 * @version 1.0.0
 * @story 1.4
 */
class MultiBackendExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.backends = this._initializeBackends();
    this.defaultBackend = options.defaultBackend || 'local';
    this.timeout = options.timeout || 300000; // 5 minutes
    this.retryAttempts = options.retryAttempts || 3;
    this.executionHistory = [];
  }

  /**
   * Execute a command on specified backend
   * @param {string} command Command to execute
   * @param {Object} options Execution options (backend, env, cwd, etc.)
   * @returns {Promise<Object>} Execution result
   */
  async execute(command, options = {}) {
    const {
      backend = this.defaultBackend,
      env = {},
      cwd = process.cwd(),
      capture = true,
      async: asyncExec = false,
    } = options;

    if (!this.backends[backend]) {
      throw new Error(`Unknown backend: ${backend}`);
    }

    const executor = this.backends[backend];

    try {
      const result = await executor.execute(command, {
        env,
        cwd,
        capture,
        timeout: this.timeout,
      });

      this._recordExecution({ command, backend, status: 'success', result });
      this.emit('execution:complete', { backend, command, result });

      return result;
    } catch (error) {
      this._recordExecution({ command, backend, status: 'failed', error: error.message });
      this.emit('execution:error', { backend, command, error });
      throw error;
    }
  }

  /**
   * Execute with automatic retry
   * @param {string} command Command to execute
   * @param {Object} options Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeWithRetry(command, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.execute(command, options);
      } catch (error) {
        lastError = error;
        this.emit('retry', { attempt, maxAttempts: this.retryAttempts, error });

        if (attempt < this.retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get supported backends
   * @returns {Array} Array of backend names
   */
  getSupportedBackends() {
    return Object.keys(this.backends);
  }

  /**
   * Get execution history
   * @param {number} limit Max records to return
   * @returns {Array} Execution history
   */
  getHistory(limit = 100) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }

  /**
   * Initialize backend executors
   * @private
   * @returns {Object} Backend implementations
   */
  _initializeBackends() {
    return {
      local: new LocalBackend(),
      docker: new DockerBackend(),
      ssh: new SSHBackend(),
      modal: new ModalBackend(),
    };
  }

  /**
   * Record execution in history
   * @private
   */
  _recordExecution(entry) {
    this.executionHistory.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Local Backend — Execute commands locally
 */
class LocalBackend {
  async execute(command, options = {}) {
    const { capture = true, timeout = 300000 } = options;

    return new Promise((resolve, reject) => {
      const process = exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}`));
        } else {
          resolve({
            backend: 'local',
            command,
            status: 'success',
            stdout: capture ? stdout : '',
            stderr: capture ? stderr : '',
            code: 0,
          });
        }
      });
    });
  }
}

/**
 * Docker Backend — Execute in Docker containers
 */
class DockerBackend {
  async execute(command, options = {}) {
    const { capture = true, timeout = 300000 } = options;

    // Check if Docker is available
    try {
      execSync('docker --version', { timeout: 5000 });
    } catch (error) {
      throw new Error('Docker not available on this system');
    }

    // Wrap command in docker run
    const dockerCommand = `docker run --rm -it alpine:latest sh -c "${command}"`;

    return new Promise((resolve, reject) => {
      exec(dockerCommand, { timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Docker execution failed: ${error.message}`));
        } else {
          resolve({
            backend: 'docker',
            command,
            status: 'success',
            stdout: capture ? stdout : '',
            stderr: capture ? stderr : '',
            code: 0,
          });
        }
      });
    });
  }
}

/**
 * SSH Backend — Execute on remote machines
 */
class SSHBackend {
  constructor(options = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 22;
    this.user = options.user || 'root';
    this.key = options.key || null;
  }

  async execute(command, options = {}) {
    const { capture = true, timeout = 300000 } = options;

    const sshCommand = `ssh -p ${this.port} ${this.user}@${this.host} "${command}"`;

    return new Promise((resolve, reject) => {
      exec(sshCommand, { timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`SSH execution failed: ${error.message}`));
        } else {
          resolve({
            backend: 'ssh',
            command,
            host: this.host,
            status: 'success',
            stdout: capture ? stdout : '',
            stderr: capture ? stderr : '',
            code: 0,
          });
        }
      });
    });
  }
}

/**
 * Modal Backend — Execute on Modal serverless
 */
class ModalBackend {
  constructor(options = {}) {
    this.apiToken = options.apiToken || process.env.MODAL_API_TOKEN;
  }

  async execute(command, options = {}) {
    const { capture = true, timeout = 300000 } = options;

    if (!this.apiToken) {
      throw new Error('Modal API token required (MODAL_API_TOKEN env var)');
    }

    // Simulate Modal CLI execution
    const modalCommand = `modal run --token ${this.apiToken} "${command}"`;

    return new Promise((resolve, reject) => {
      exec(modalCommand, { timeout, env: { MODAL_TOKEN: this.apiToken } }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Modal execution failed: ${error.message}`));
        } else {
          resolve({
            backend: 'modal',
            command,
            status: 'success',
            stdout: capture ? stdout : '',
            stderr: capture ? stderr : '',
            code: 0,
          });
        }
      });
    });
  }
}

module.exports = {
  MultiBackendExecutor,
  LocalBackend,
  DockerBackend,
  SSHBackend,
  ModalBackend,
};
