#!/usr/bin/env node

const http = require('http');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Model routing: primary with fallbacks
const PRIMARY_MODEL = process.env.OLLAMA_PRIMARY_MODEL || 'qwen2.5:14b'; // "cloud" mode
const FALLBACK_MODELS = ['qwen2.5:14b', 'qwen2.5:7b', 'deepseek-coder:6.7b'];
let CURRENT_MODEL = PRIMARY_MODEL;

function queryOllama(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model: CURRENT_MODEL, prompt, stream: false });
    const url = new URL(OLLAMA_URL);
    const opts = {
      hostname: url.hostname,
      port: parseInt(url.port) || 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.response) {
            resolve(result.response.trim());
          } else {
            reject(new Error('Empty response'));
          }
        } catch (e) {
          reject(new Error('Parse error: ' + e.message));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error('Ollama error: ' + e.message));
    });

    // Timeout after 60 seconds
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🧠 AIOX Chat with Ollama');
  console.log('Type /exit to quit\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'you → ',
  });

  rl.prompt();

  rl.on('line', async (input) => {
    const prompt = input.trim();

    if (prompt === '/exit') {
      console.log('\nGoodbye!\n');
      process.exit(0);
    }

    if (prompt === '/status') {
      console.log(`\nModel: ${CURRENT_MODEL}\nBackend: Ollama\nStatus: Ready\n`);
      rl.prompt();
      return;
    }

    if (!prompt) {
      rl.prompt();
      return;
    }

    let response = null;
    let lastError = null;

    // Try primary model, then fallbacks
    for (const model of [PRIMARY_MODEL, ...FALLBACK_MODELS]) {
      try {
        CURRENT_MODEL = model;
        response = await queryOllama(prompt);
        console.log(`assistant (${model})\n${response}\n`);
        break;
      } catch (e) {
        lastError = e.message;
        // Try next model
        continue;
      }
    }

    if (!response) {
      console.log(`Error: ${lastError}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

main().catch(console.error);
