/**
 * Ollama LLM Backend
 * 100% offline, zero tokens - executes locally via Ollama
 */

const http = require('http');
const { URL } = require('url');
const LLMBackend = require('../llm-backend');

class OllamaBackend extends LLMBackend {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = config.model || process.env.OLLAMA_MODEL || 'glm-4.7:cloud';
    this.timeout = config.timeout || 120000; // Aumentado para modelos remotos
  }

  /**
   * Execute an agent task with Ollama
   */
  async executeAgent(agentId, task, context = {}) {
    try {
      // Build system prompt from agent definition
      const systemPrompt = this._buildSystemPrompt(agentId, context);

      // Select model based on task complexity
      const model = this._selectModel(agentId, task);

      // Call Ollama
      const response = await this._callOllama(task, {
        system: systemPrompt,
        model,
      });

      this.contextUsage += response.prompt_eval_count || 0;

      return {
        response: response.response,
        model,
        metadata: {
          promptTokens: response.prompt_eval_count,
          responseTokens: response.eval_count,
          totalTime: response.total_duration,
          context: response.context,
        },
      };
    } catch (error) {
      throw new Error(`Ollama agent execution failed for ${agentId}: ${error.message}`);
    }
  }

  /**
   * Simple chat with Ollama
   */
  async chat(prompt, options = {}) {
    try {
      const model = options.model || this.model;
      const response = await this._callOllama(prompt, { model });

      this.contextUsage += response.prompt_eval_count || 0;

      return {
        response: response.response,
        model,
        usage: {
          promptTokens: response.prompt_eval_count,
          completionTokens: response.eval_count,
        },
      };
    } catch (error) {
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  /**
   * Stream chat with Ollama
   */
  async streamChat(prompt, onChunk, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const model = options.model || this.model;
        const data = JSON.stringify({
          model,
          prompt,
          stream: true,
        });

        const url = new URL(`${this.baseUrl}/api/generate`);
        const reqOptions = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
          },
          timeout: this.timeout,
        };

        const req = http.request(reqOptions, (res) => {
          let fullResponse = '';
          let totalTokens = 0;

          res.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            lines.forEach((line) => {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.response) {
                    onChunk(parsed.response);
                    fullResponse += parsed.response;
                  }
                  if (parsed.eval_count) {
                    totalTokens = parsed.eval_count;
                  }
                } catch (e) {
                  // Parse error, continue
                }
              }
            });
          });

          res.on('end', () => {
            this.contextUsage += totalTokens;
            resolve({
              response: fullResponse,
              model,
            });
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Ollama stream timeout'));
        });

        req.write(data);
        req.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check Ollama health
   */
  async getStatus() {
    try {
      const response = await this._callOllama('', {
        model: this.model,
        stream: false,
      });

      return {
        healthy: true,
        model: this.model,
        info: {
          baseUrl: this.baseUrl,
          type: 'ollama',
          offline: true,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        model: this.model,
      };
    }
  }

  /**
   * PRIVATE METHODS
   */

  async _callOllama(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const model = options.model || this.model;
        const data = JSON.stringify({
          model,
          prompt,
          system: options.system || '',
          stream: false,
          temperature: options.temperature || 0.7,
        });

        const url = new URL(`${this.baseUrl}/api/generate`);
        const reqOptions = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
          },
          timeout: this.timeout,
        };

        const req = http.request(reqOptions, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(responseData);
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Invalid Ollama response: ${e.message}`));
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Ollama timeout'));
        });

        req.write(data);
        req.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  _buildSystemPrompt(agentId, context = {}) {
    const agentRole = {
      '@pm': 'Product Manager',
      '@po': 'Product Owner',
      '@sm': 'Scrum Master',
      '@dev': 'Senior Developer',
      '@architect': 'Software Architect',
      '@data-engineer': 'Data Engineer',
      '@ux-design-expert': 'UX/UI Designer',
      '@qa': 'QA Engineer',
      '@analyst': 'Business Analyst',
      '@devops': 'DevOps Engineer',
    };

    const role = agentRole[agentId] || 'AI Assistant';
    return `You are a ${role} in the AIOX system. ${context.instructions || ''}`;
  }

  _selectModel(agentId, task) {
    // PRIMARY: Always use GLM-4.7:cloud (remote, high quality)
    const primaryModel = process.env.OLLAMA_PRIMARY_MODEL || 'glm-4.7:cloud';

    // If primary is available, use it
    if (primaryModel) {
      return primaryModel;
    }

    // FALLBACK: If GLM unavailable, use local models
    // Complex tasks → qwen2.5:14b
    if (
      agentId.includes('architect') ||
      agentId.includes('pm') ||
      task.length > 500
    ) {
      return 'qwen2.5:14b';
    }

    // Code tasks → deepseek-coder
    if (agentId === '@dev' || task.includes('code') || task.includes('implement')) {
      return 'deepseek-coder:6.7b';
    }

    // Default → qwen2.5:7b
    return 'qwen2.5:7b';
  }
}

module.exports = OllamaBackend;
