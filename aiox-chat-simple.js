#!/usr/bin/env node

const http = require('http');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

function queryOllama(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model: MODEL, prompt, stream: false });
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
          resolve(JSON.parse(body).response.trim());
        } catch (e) {
          reject(new Error('Parse error'));
        }
      });
    });
    req.on('error', reject);
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

    if (!prompt) {
      rl.prompt();
      return;
    }

    try {
      const response = await queryOllama(prompt);
      console.log(`assistant\n${response}\n`);
    } catch (e) {
      console.log(`Error: ${e.message}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

main().catch(console.error);
