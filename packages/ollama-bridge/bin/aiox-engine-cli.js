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
    // Generate unique session ID (UUID v4)
    this.sessionId = this.generateUUID();
    this.history = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: HISTORY_SIZE,
    });
    this.isRunning = true;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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
    console.log(`📊 Session ID: ${this.sessionId.substring(0, 8)}...\n`);
    console.log('Commands:');
    console.log('  /help     - Show commands');
    console.log('  /session  - Show session info');
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
        model: null, // Let engine choose
        session_id: this.sessionId,
        use_rag: true,
      });

      const url = new URL(`${ENGINE_URL}/agent`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
        timeout: 120000,
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            // Trim whitespace and check if empty
            const trimmed = responseData.trim();
            if (!trimmed) {
              reject(new Error('Empty response from engine'));
              return;
            }

            // Try parsing JSON
            const parsed = JSON.parse(trimmed);

            // Check for error detail in response
            if (parsed.detail) {
              reject(new Error(parsed.detail));
            } else if (!parsed.response) {
              reject(new Error('Invalid response format: missing "response" field'));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            // Better error message with actual response preview
            const preview = responseData.substring(0, 200);
            reject(new Error(`Invalid JSON response (${e.message}): ${preview}`));
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
    const contextInfo = result.context_used > 0 ? ` 📚 ${result.context_used} context(s)` : '';
    const lines = [
      '',
      `[${result.model}${cached}${contextInfo}]`,
      '─'.repeat(50),
      result.response,
      '',
    ];
    return lines.join('\n');
  }

  handleCommand(input) {
    const cmd = input.trim().toLowerCase();

    switch (cmd) {
      case '/help':
        console.log('\n📋 Commands:');
        console.log('  /help     - Show this message');
        console.log('  /session  - Show session info');
        console.log('  /clear    - Clear history');
        console.log('  /history  - Show conversation history');
        console.log('  /exit     - Exit terminal\n');
        return true;

      case '/session':
        console.log('\n📊 Session Info:');
        console.log(`  ID: ${this.sessionId}`);
        console.log(`  Messages: ${this.history.length}`);
        console.log('  Status: Active\n');
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
    return new Promise((resolve, reject) => {
      if (!this.rl) {
        reject(new Error('readline closed'));
        return;
      }

      // Handle close event
      this.rl.once('close', () => {
        this.isRunning = false;
        reject(new Error('readline was closed'));
      });

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

        // Process with engine (with 1 retry on failure)
        let result;
        let retries = 1;
        while (retries >= 0) {
          try {
            process.stdout.write('⏳ Processing...');
            result = await this.callEngine(input);
            process.stdout.write('\r          \r'); // Clear loading
            break;
          } catch (err) {
            process.stdout.write('\r          \r'); // Clear loading
            if (retries > 0 && err.message.includes('timeout')) {
              console.log(`⚠️  ${err.message} - retrying...\n`);
              retries--;
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              throw err;
            }
          }
        }

        // Store in history
        this.history.push({
          prompt: input,
          response: result.response,
          model: result.model,
          cached: result.cached,
          timestamp: result.timestamp,
        });

        // Display result
        console.log(this.formatResponse(result));

      } catch (error) {
        // Handle readline closed event
        if (error.message.includes('readline') || error.message.includes('closed')) {
          break;
        }

        console.error(`\n❌ Error: ${error.message}`);

        // Helpful suggestions based on error type
        if (error.message.includes('ECONNREFUSED')) {
          console.error('   → AIOX Engine não está rodando');
          console.error('   → Execute: docker compose up -d (em /srv/aiox/aiox-engine)');
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          console.error('   → Ollama está demorando muito');
          console.error('   → Verifique: docker ps | grep ollama');
        } else if (error.message.includes('Invalid')) {
          console.error('   → Engine retornou resposta inválida');
          console.error('   → Verifique os logs: docker logs aiox-api');
        }
        console.log('');
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
