#!/usr/bin/env node

/**
 * AIOX Ollama Engine CLI
 * Terminal interativo que usa FastAPI + Ollama (100% offline, zero tokens)
 */

const readline = require('readline');
const http = require('http');
const { URL } = require('url');

const ENGINE_URL = 'http://localhost:8000';
const HISTORY_SIZE = 50;

class AIOXEngineCLI {
  constructor() {
    this.history = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: HISTORY_SIZE
    });
    this.isRunning = true;
  }

  async init() {
    console.clear();
    console.log('\n🚀 AIOX Ollama Engine Terminal');
    console.log('════════════════════════════════════════════\n');
    console.log('✨ 100% Offline - Zero Claude Tokens');
    console.log('📦 Models: deepseek-coder, qwen2.5:7b, qwen2.5:14b\n');

    // Check if API is running
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      console.error('❌ AIOX Engine não está rodando!');
      console.error('   Execute: docker compose up -d (em /srv/aiox/aiox-engine)\n');
      process.exit(1);
    }

    console.log('✅ AIOX Engine conectado\n');
    console.log('Commands:');
    console.log('  /help     - Show commands');
    console.log('  /clear    - Clear history');
    console.log('  /history  - Show chat history');
    console.log('  /exit     - Exit\n');
    console.log('════════════════════════════════════════════\n');
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const url = new URL(`${ENGINE_URL}/health`);
      const req = http.get(url, { timeout: 5000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async callEngine(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        prompt: prompt,
        model: null // Let engine choose
      });

      const url = new URL(`${ENGINE_URL}/agent`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        },
        timeout: 120000
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.detail) {
              reject(new Error(parsed.detail));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error('Invalid response from engine'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout - Ollama taking too long'));
      });

      req.write(data);
      req.end();
    });
  }

  formatResponse(result) {
    const cached = result.cached ? ' (📦 cached)' : '';
    const lines = [
      '',
      `[${result.model}${cached}]`,
      '─'.repeat(50),
      result.response,
      ''
    ];
    return lines.join('\n');
  }

  handleCommand(input) {
    const cmd = input.trim().toLowerCase();

    switch (cmd) {
      case '/help':
        console.log('\n📋 Commands:');
        console.log('  /help     - Show this message');
        console.log('  /clear    - Clear history');
        console.log('  /history  - Show conversation history');
        console.log('  /exit     - Exit terminal\n');
        return true;

      case '/clear':
        console.clear();
        this.history = [];
        console.log('✓ History cleared\n');
        return true;

      case '/history':
        if (this.history.length === 0) {
          console.log('\n(empty history)\n');
        } else {
          console.log('\n' + '═'.repeat(50));
          this.history.forEach((item, i) => {
            console.log(`\n[${i + 1}] User: ${item.prompt.substring(0, 50)}...`);
            console.log(`    ${item.model}: ${item.response.substring(0, 50)}...`);
          });
          console.log('\n' + '═'.repeat(50) + '\n');
        }
        return true;

      case '/exit':
        this.isRunning = false;
        return false;

      default:
        return null;
    }
  }

  async prompt() {
    return new Promise((resolve) => {
      this.rl.question('> ', (input) => {
        resolve(input);
      });
    });
  }

  async run() {
    await this.init();

    while (this.isRunning) {
      try {
        const input = await this.prompt();

        if (!input.trim()) {
          continue;
        }

        // Handle commands
        const cmdResult = this.handleCommand(input);
        if (cmdResult === false) {
          break;
        }
        if (cmdResult === true) {
          continue;
        }

        // Process with engine
        process.stdout.write('⏳ Processing...');
        const result = await this.callEngine(input);
        process.stdout.write('\r          \r'); // Clear loading

        // Store in history
        this.history.push({
          prompt: input,
          response: result.response,
          model: result.model,
          cached: result.cached,
          timestamp: result.timestamp
        });

        // Display result
        console.log(this.formatResponse(result));

      } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
      }
    }

    console.log('\n👋 Goodbye!\n');
    this.rl.close();
    process.exit(0);
  }
}

// Run CLI
const cli = new AIOXEngineCLI();
cli.run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
