/**
 * Claude LLM Backend
 * Uses Claude API via Anthropic SDK
 */

const LLMBackend = require('../llm-backend');

class ClaudeBackend extends LLMBackend {
  constructor(config = {}) {
    super(config);
    this.model = config.model || 'claude-opus-4-6';
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    // Lazy load Anthropic SDK
    this.anthropic = null;
  }

  /**
   * Initialize Anthropic client
   */
  _getClient() {
    if (!this.anthropic) {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        this.anthropic = new Anthropic({
          apiKey: this.apiKey,
        });
      } catch (error) {
        throw new Error(
          `Failed to initialize Anthropic SDK: ${error.message}. Install: npm install @anthropic-ai/sdk`
        );
      }
    }
    return this.anthropic;
  }

  /**
   * Execute an agent task with Claude
   */
  async executeAgent(agentId, task, context = {}) {
    try {
      const client = this._getClient();

      const systemPrompt = this._buildSystemPrompt(agentId, context);
      const model = this._selectModel(agentId, task);

      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: task,
          },
        ],
      });

      // Track token usage
      this.tokensUsed += response.usage.input_tokens + response.usage.output_tokens;
      this.contextUsage = response.usage.input_tokens;

      return {
        response: response.content[0].text,
        model,
        metadata: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          stopReason: response.stop_reason,
        },
      };
    } catch (error) {
      throw new Error(`Claude agent execution failed for ${agentId}: ${error.message}`);
    }
  }

  /**
   * Simple chat with Claude
   */
  async chat(prompt, options = {}) {
    try {
      const client = this._getClient();
      const model = options.model || this.model;

      const response = await client.messages.create({
        model,
        max_tokens: options.maxTokens || 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      this.tokensUsed += response.usage.input_tokens + response.usage.output_tokens;
      this.contextUsage = response.usage.input_tokens;

      return {
        response: response.content[0].text,
        model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new Error(`Claude chat failed: ${error.message}`);
    }
  }

  /**
   * Stream chat with Claude
   */
  async streamChat(prompt, onChunk, options = {}) {
    try {
      const client = this._getClient();
      const model = options.model || this.model;

      let fullResponse = '';
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      const stream = client.messages.stream({
        model,
        max_tokens: options.maxTokens || 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      stream.on('text', (text) => {
        onChunk(text);
        fullResponse += text;
      });

      stream.on('message', (message) => {
        totalInputTokens = message.usage.input_tokens;
        totalOutputTokens = message.usage.output_tokens;
        this.tokensUsed += totalInputTokens + totalOutputTokens;
        this.contextUsage = totalInputTokens;
      });

      await stream.finalMessage();

      return {
        response: fullResponse,
        model,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    } catch (error) {
      throw new Error(`Claude stream failed: ${error.message}`);
    }
  }

  /**
   * Check Claude API health
   */
  async getStatus() {
    try {
      const client = this._getClient();

      // Quick test
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'ping',
          },
        ],
      });

      return {
        healthy: response.stop_reason === 'end_turn',
        model: this.model,
        info: {
          type: 'claude-api',
          apiKey: this.apiKey ? '****' : 'not-set',
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
    // Complex tasks → opus
    if (
      agentId.includes('architect') ||
      agentId.includes('pm') ||
      task.length > 500
    ) {
      return 'claude-opus-4-6';
    }

    // Default → sonnet
    return 'claude-sonnet-4-6';
  }
}

module.exports = ClaudeBackend;
