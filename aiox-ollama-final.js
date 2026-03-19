#!/usr/bin/env node

const http = require('http');
const readline = require('readline');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const PRIMARY_MODEL = process.env.OLLAMA_PRIMARY_MODEL || 'qwen2.5:7b';
const MODELS = ['qwen2.5:7b', 'qwen2.5:14b', 'deepseek-coder:6.7b'];

function queryOllama(prompt, model) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model, prompt, stream: false });
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
          resolve(result.response?.trim() || 'No response');
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🧠 AIOX Chat with Ollama');
  console.log(`Model: ${PRIMARY_MODEL} (with fallbacks)\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askLine = () => {
    if (rl.closed) return;
    rl.question('you → ', async (input) => {
      const cmd = input.trim();

      if (cmd === '/exit') {
        console.log('\nGoodbye!\n');
        rl.close();
        process.exit(0);
      }

      if (cmd === '/status') {
        console.log(`\n✓ Model: ${PRIMARY_MODEL}\n✓ Backend: Ollama\n✓ Status: Ready\n`);
        askLine();
        return;
      }

      if (!cmd) {
        askLine();
        return;
      }

      // Try to get response
      let response = null;
      for (const model of MODELS) {
        try {
          response = await queryOllama(cmd, model);
          console.log(`\nassistant (${model})\n${response}\n`);
          break;
        } catch (e) {
          continue;
        }
      }

      if (!response) {
        console.log('\nError: Ollama not responding\n');
      }

      askLine();
    });
  };

  askLine();
}

main().catch(console.error);
