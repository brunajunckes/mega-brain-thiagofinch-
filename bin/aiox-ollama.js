#!/usr/bin/env node

/**
 * AIOX Ollama Bridge CLI
 * Main entry point for hybrid LLM routing
 */

const path = require('path');
const { OllamaClient, ConfigManager, Router, InteractiveChat } = require('../packages/ollama-bridge');

const VERSION = '1.0.0';

const showVersion = () => {
  console.log(`AIOX Ollama Bridge v${VERSION}`);
};

const showHelp = () => {
  console.log(`
AIOX Ollama Bridge — Hybrid LLM Routing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USAGE
  aiox ollama [COMMAND] [OPTIONS]
  claude-ollama [COMMAND] [OPTIONS]

COMMANDS
  (none)                Start interactive chat
  --health              Check Ollama health status
  --list-models         List available models
  --setup               Run configuration wizard
  --config              Show current configuration
  --reset-config        Reset to default configuration

OPTIONS
  --model <name>        Use specific Ollama model
  --threshold <1-5>     Set complexity threshold (1=always Ollama, 5=always Claude)
  --force-ollama        Always use Ollama (this session)
  --force-claude        Always use Claude (this session)
  --verbose             Show detailed routing information
  --version             Show version
  --help                Show this help

EXAMPLES
  $ aiox ollama
    → Start interactive chat

  $ aiox ollama --health
    → Check if Ollama is running

  $ aiox ollama --list-models
    → List available models

  $ aiox ollama --setup
    → Configure Ollama bridge

  $ aiox ollama --threshold 4 --force-ollama
    → Use Ollama for all messages (this session)

CONFIGURATION
  Config file: ~/.aiox/ollama-bridge.json

  Example:
  {
    "ollama": {
      "host": "http://localhost:11434",
      "model": "llama3.2",
      "complexityThreshold": 3
    }
  }

REQUIREMENTS
  - Ollama installed and running (ollama serve)
  - At least one model installed (ollama pull llama3.2)
  - Node.js 18+

`);
};

const showHealthStatus = async () => {
  const client = new OllamaClient(ConfigManager.get('ollama.host'));
  const health = await client.healthCheck();

  console.log('\n' + (health.available ? '✅' : '❌') + ' Ollama Status');
  console.log(`   ${health.message}`);

  if (health.models && health.models.length > 0) {
    console.log('\n📦 Available Models:');
    health.models.forEach(model => {
      console.log(`   • ${model}`);
    });
  }

  console.log();
  process.exit(health.available ? 0 : 1);
};

const listModels = async () => {
  const client = new OllamaClient(ConfigManager.get('ollama.host'));
  try {
    const models = await client.listModels();
    console.log('\n📦 Available Ollama Models:\n');
    models.forEach(model => {
      console.log(`  • ${model}`);
    });
    console.log();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.log('Is Ollama running? Start it with: ollama serve\n');
    process.exit(1);
  }
};

const showConfig = () => {
  console.log('\n📋 Current Configuration:\n');
  console.log(ConfigManager.display());
  console.log();
  console.log(`📁 Config file: ${ConfigManager.getPath()}\n`);
};

const runSetup = async () => {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => new Promise(resolve => {
    rl.question(prompt, resolve);
  });

  console.log('\n🔧 AIOX Ollama Bridge Setup\n');

  try {
    const config = ConfigManager.load();

    const host = await question(
      `Ollama Host [${config.ollama.host}]: `,
    );
    if (host) config.ollama.host = host;

    const model = await question(
      `Model [${config.ollama.model}]: `,
    );
    if (model) config.ollama.model = model;

    const thresholdStr = await question(
      `Complexity Threshold [${config.ollama.complexityThreshold}]: `,
    );
    if (thresholdStr) {
      const threshold = parseInt(thresholdStr);
      if (threshold >= 1 && threshold <= 5) {
        config.ollama.complexityThreshold = threshold;
      }
    }

    ConfigManager.save(config);
    console.log('\n✅ Configuration saved!\n');
  } finally {
    rl.close();
  }
};

const startChat = async () => {
  const chat = new InteractiveChat();
  await chat.start();
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await startChat();
    return;
  }

  const cmd = args[0];

  switch (cmd) {
    case '--version':
    case '-v':
      showVersion();
      break;

    case '--help':
    case '-h':
      showHelp();
      break;

    case '--health':
      await showHealthStatus();
      break;

    case '--list-models':
      await listModels();
      break;

    case '--config':
      showConfig();
      break;

    case '--setup':
      await runSetup();
      break;

    case '--reset-config':
      ConfigManager.reset();
      console.log('✅ Configuration reset to defaults\n');
      break;

    default:
      // Parse options
      const config = ConfigManager.load();

      if (args.includes('--force-ollama')) {
        config.routing.forceOllama = true;
      }
      if (args.includes('--force-claude')) {
        config.routing.forceClaude = true;
      }

      const modelIdx = args.indexOf('--model');
      if (modelIdx >= 0 && args[modelIdx + 1]) {
        config.ollama.model = args[modelIdx + 1];
      }

      const thresholdIdx = args.indexOf('--threshold');
      if (thresholdIdx >= 0 && args[thresholdIdx + 1]) {
        const t = parseInt(args[thresholdIdx + 1]);
        if (t >= 1 && t <= 5) config.ollama.complexityThreshold = t;
      }

      if (args.includes('--model') || args.includes('--threshold') ||
          args.includes('--force-ollama') || args.includes('--force-claude')) {
        ConfigManager.save(config);
      }

      // Start chat with options
      await startChat();
  }
};

main().catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
