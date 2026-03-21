/**
 * LLM Backend Factory
 * Creates the appropriate backend (Claude or Ollama) based on config
 */

const ClaudeBackend = require('./backends/claude-backend');
const OllamaBackend = require('./backends/ollama-backend');

class LLMFactory {
  /**
   * Create LLM backend instance
   * @param {string} type - 'claude' or 'ollama'
   * @param {Object} config - Backend-specific config
   * @returns {LLMBackend}
   */
  static create(type = 'claude', config = {}) {
    const normalizedType = (type || 'claude').toLowerCase();

    switch (normalizedType) {
      case 'claude':
        return new ClaudeBackend(config);

      case 'ollama':
        return new OllamaBackend(config);

      default:
        throw new Error(
          `Unknown LLM backend: ${type}. Supported: 'claude', 'ollama'`
        );
    }
  }

  /**
   * Get default backend based on environment
   */
  static getDefault() {
    // If AIOX_OFFLINE_MODE is set, prefer Ollama (including remote models)
    if (process.env.AIOX_OFFLINE_MODE === 'true') {
      return this.create('ollama', {
        baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || process.env.OLLAMA_PRIMARY_MODEL || 'glm-4.7:cloud',
      });
    }

    // Otherwise use Claude
    return this.create('claude', {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-6',
    });
  }
}

module.exports = LLMFactory;
