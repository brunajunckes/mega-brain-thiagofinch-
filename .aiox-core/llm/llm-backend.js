/**
 * Abstract LLM Backend Interface
 * Allows AIOX to work with Claude API or Ollama transparently
 */

class LLMBackend {
  constructor(config = {}) {
    this.config = config;
    this.model = config.model || 'default';
    this.contextUsage = 0;
    this.tokensUsed = 0;
  }

  /**
   * Execute an agent task
   * @param {string} agentId - Agent identifier (@dev, @architect, etc)
   * @param {string} task - Task description or prompt
   * @param {Object} context - Additional context (story, memory, etc)
   * @returns {Promise<{response: string, model: string, metadata: Object}>}
   */
  async executeAgent(agentId, task, context = {}) {
    throw new Error('executeAgent() must be implemented by subclass');
  }

  /**
   * Simple chat completion
   * @param {string} prompt - User prompt
   * @param {Object} options - Optional params (model, temperature, etc)
   * @returns {Promise<{response: string, model: string, usage: Object}>}
   */
  async chat(prompt, options = {}) {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * Stream chat completion
   * @param {string} prompt - User prompt
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<{response: string, model: string}>}
   */
  async streamChat(prompt, onChunk) {
    throw new Error('streamChat() must be implemented by subclass');
  }

  /**
   * Get backend status
   * @returns {Promise<{healthy: boolean, model: string, info: Object}>}
   */
  async getStatus() {
    throw new Error('getStatus() must be implemented by subclass');
  }

  /**
   * Get backend metrics
   * @returns {Object}
   */
  getMetrics() {
    return {
      model: this.model,
      contextUsage: this.contextUsage,
      tokensUsed: this.tokensUsed,
      type: this.constructor.name,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.contextUsage = 0;
    this.tokensUsed = 0;
  }
}

module.exports = LLMBackend;
