#!/usr/bin/env node

/**
 * AIOX Chat Interface
 * Simple, working chat with Ollama backend
 */

const http = require('http');
const readline = require('readline');

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

/**
 * Query Ollama API
 */
function queryOllama(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: MODEL,
      prompt: prompt,
      stream: false,
    });

    const url = new URL(OLLAMA_URL);
    const options = {
      hostname: url.hostname,
      port: parseInt(url.port) || 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result.response.trim());
        } catch (e) {
          reject(new Error('Failed to parse Ollama response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Ollama error: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Main chat loop
 */
async function startChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`
${COLORS.cyan}${COLORS.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}
${COLORS.cyan}  🧠 AIOX Chat with Ollama${COLORS.reset}
${COLORS.cyan}${COLORS.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}
${COLORS.dim}Model: ${MODEL}
Backend: Ollama (100% offline, zero tokens)
Commands: /status, /help, /exit${COLORS.reset}
`);

  let exiting = false;

  const askQuestion = () => {
    if (exiting) return;
    rl.question(`${COLORS.cyan}you${COLORS.reset} → `, async (input) => {
      const prompt = input.trim();

      if (!prompt) {
        askQuestion();
        return;
      }

      // Commands
      if (prompt === '/exit' || prompt === '/quit') {
        exiting = true;
        console.log(`\n${COLORS.dim}Goodbye!${COLORS.reset}\n`);
        rl.close();
        process.exit(0);
      }

      if (prompt === '/help') {
        console.log(`
${COLORS.cyan}Commands:${COLORS.reset}
  Type anything to chat
  /status    - Show system status
  /help      - Show this help
  /exit      - Exit chat
`);
        askQuestion();
        return;
      }

      if (prompt === '/status') {
        console.log(`${COLORS.green}✓ AIOX Online
Model: ${MODEL}
Backend: Ollama
Status: Ready${COLORS.reset}\n`);
        askQuestion();
        return;
      }

      // Regular chat
      try {
        console.log(`${COLORS.dim}[thinking...]${COLORS.reset}`);
        const response = await queryOllama(prompt);
        console.log(`${COLORS.green}assistant${COLORS.reset}\n${response}\n`);
      } catch (error) {
        console.log(`${COLORS.red}Error: ${error.message}${COLORS.reset}\n`);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Start
startChat().catch((error) => {
  console.error(`${COLORS.red}Fatal error: ${error.message}${COLORS.reset}`);
  process.exit(1);
});
