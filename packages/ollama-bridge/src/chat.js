const readline = require('readline');
const OllamaClient = require('./client');
const ConfigManager = require('./config');
const Classifier = require('./classifier');
const Router = require('./router');
const AutoImplementer = require('./auto-implementer');

class InteractiveChat {
  constructor() {
    this.config = ConfigManager.load();
    this.client = new OllamaClient(this.config.ollama.host);
    this.history = [];
    this.maxHistory = this.config.chat?.maxHistory || 10;
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  async start() {
    console.log('\n🤖 AIOX Ollama Bridge — Interactive Chat');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Commands: /help, /models, /threshold, /force-ollama, /force-claude, /auto, /exit\n');

    const health = await this.client.healthCheck();
    if (!health.available) {
      console.warn(`⚠️  ${health.message}`);
      console.log('Ollama may not be running. Use: ollama serve\n');
    }

    await this.loop();
  }

  async loop() {
    const prompt = () => {
      this.rl.question('You: ', async (input) => {
        try {
          if (input.startsWith('/')) {
            await this.handleCommand(input);
          } else if (input.trim()) {
            await this.handleMessage(input);
          }
        } catch (error) {
          console.error(`\n❌ Error: ${error.message}\n`);
        }
        prompt();
      });
    };
    prompt();
  }

  async handleCommand(cmd) {
    const [command, ...args] = cmd.split(' ');
    switch (command) {
      case '/help':
        this.showHelp();
        break;
      case '/models':
        await this.listModels();
        break;
      case '/threshold':
        const newThreshold = parseInt(args[0]);
        if (newThreshold >= 1 && newThreshold <= 5) {
          ConfigManager.set('ollama.complexityThreshold', newThreshold);
          this.config = ConfigManager.load();
          console.log(`✅ Threshold set to ${newThreshold}`);
        } else {
          console.log('❌ Invalid threshold (must be 1-5)');
        }
        break;
      case '/force-ollama':
        ConfigManager.set('routing.forceOllama', true);
        ConfigManager.set('routing.forceClaude', false);
        this.config = ConfigManager.load();
        console.log('✅ Forcing Ollama for all requests');
        break;
      case '/force-claude':
        ConfigManager.set('routing.forceClaude', true);
        ConfigManager.set('routing.forceOllama', false);
        this.config = ConfigManager.load();
        console.log('✅ Forcing Claude for all requests');
        break;
      case '/clear':
        this.history = [];
        console.log('✅ History cleared');
        break;
      case '/auto':
        await this.startAutoImplementation(args);
        break;
      case '/exit':
        console.log('\n👋 Goodbye!');
        this.rl.close();
        process.exit(0);
        break;
      default:
        console.log('❓ Unknown command. Use /help');
    }
  }

  async handleMessage(input) {
    const score = Classifier.classify(input);
    const useOllama = Router.decide(score, this.config) === 'ollama';
    const category = Classifier.getCategory(score);

    this.history.push({ role: 'user', content: input });
    if (this.history.length > this.maxHistory) this.history.shift();

    console.log(`\n📊 [${category} (${score})] → Using ${useOllama ? 'Ollama' : 'Claude'}`);

    if (useOllama) {
      await this.ollamaResponse();
    } else {
      this.claudePrompt();
    }
  }

  async ollamaResponse() {
    const model = this.config.ollama.model;
    console.log(`\nOllama (${model}):`);

    try {
      const response = await this.client.chat(model, this.history, (chunk) => {
        if (chunk.message?.content) process.stdout.write(chunk.message.content);
      });

      console.log('\n');
      this.history.push({ role: 'assistant', content: response.response });
    } catch (error) {
      console.error(`\n❌ Ollama error: ${error.message}\n`);
    }
  }

  claudePrompt() {
    console.log('\n💡 This task is complex. Switch to Claude Code for @dev, @architect, etc.\n');
  }

  async listModels() {
    try {
      const models = await this.client.listModels();
      if (models.length === 0) {
        console.log('❌ No models. Run: ollama pull llama3.2');
      } else {
        console.log('\n📦 Available models:');
        models.forEach(m => console.log(`  • ${m}`));
        console.log();
      }
    } catch (error) {
      console.error(`❌ ${error.message}`);
    }
  }

  async startAutoImplementation(args) {
    const autoImpl = new AutoImplementer();
    const mode = args[0] || 'auto';

    console.log('\n⏸️  Encerrando chat interativo...\n');
    this.rl.close();

    if (mode === 'interactive' || mode === 'i') {
      await autoImpl.startInteractiveMode();
    } else {
      const options = {
        interactive: true,
        verbose: true,
        maxTasks: args[1] ? parseInt(args[1]) : null,
      };
      await autoImpl.startAutoImplementation(options);
    }

    process.exit(0);
  }

  showHelp() {
    console.log(`
Commands:
  /help              Show help
  /models            List models
  /threshold <1-5>   Set threshold
  /force-ollama      Always use Ollama
  /force-claude      Always use Claude
  /auto [i|auto]     Auto-implementação (i=interativo, auto=automático)
  /clear             Clear history
  /exit              Exit
`);
  }
}

module.exports = InteractiveChat;
