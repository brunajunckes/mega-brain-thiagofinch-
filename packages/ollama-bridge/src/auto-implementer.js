const fs = require('fs');
const path = require('path');
const OllamaClient = require('./client');
const ConfigManager = require('./config');
const AuthorizedExecutor = require('./authorized-executor');

class AutoImplementer {
  constructor(options = {}) {
    this.config = ConfigManager.load();
    this.client = new OllamaClient(this.config.ollama.host);
    this.model = this.config.ollama.model;
    this.inactivityTimeout = 30000; // 30 segundos
    this.lastActivityTime = Date.now();
    this.isRunning = false;
    this.currentTask = null;
    this.taskHistory = [];
    this.checklistPath = path.join(process.env.HOME, '.aiox/auto-implement-progress.json');
    this.continuous = options.continuous !== false; // Default: rodar continuamente
    this.maxTasksPerSession = options.maxTasksPerSession || null; // null = sem limite
    this.autoCommit = options.autoCommit !== false;
    this.autoPush = options.autoPush || false;

    // Executor com autorizações
    this.executor = new AuthorizedExecutor({
      gitPush: options.autoPush || false,
      gitResetHard: false,
      rmRf: false,
    });
  }

  // Carregar progresso salvo
  loadProgress() {
    try {
      if (fs.existsSync(this.checklistPath)) {
        const progress = JSON.parse(fs.readFileSync(this.checklistPath, 'utf-8'));
        return progress;
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error.message);
    }
    return {
      completed: [],
      pending: [],
      lastRun: null,
      totalTokens: 0,
    };
  }

  // Salvar progresso
  saveProgress(progress) {
    try {
      const dir = path.dirname(this.checklistPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.checklistPath, JSON.stringify(progress, null, 2));
    } catch (error) {
      console.error('Erro ao salvar progresso:', error.message);
    }
  }

  // Parse improvements-checklist.md para extrair tasks
  async parseChecklist() {
    try {
      const checklistPath = path.join(process.env.HOME, '.claude/projects/-srv-aiox/memory/improvements-checklist.md');
      if (!fs.existsSync(checklistPath)) {
        console.warn(`⚠️  Checklist não encontrado em: ${checklistPath}`);
        return [];
      }

      const content = fs.readFileSync(checklistPath, 'utf-8');
      const tasks = [];

      // Regex para encontrar itens com [ ] (não marcados)
      const pendingRegex = /- \[ \] (.+?)(?=\n|-|$)/gs;
      let match;

      while ((match = pendingRegex.exec(content)) !== null) {
        tasks.push({
          id: `task-${Date.now()}-${Math.random()}`,
          description: match[1].trim(),
          priority: this.extractPriority(match[1]),
          phase: this.extractPhase(content, match.index),
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }

      return tasks;
    } catch (error) {
      console.error('Erro ao fazer parse do checklist:', error.message);
      return [];
    }
  }

  // Extrair prioridade do texto da task
  extractPriority(taskText) {
    if (taskText.toLowerCase().includes('crítico') || taskText.includes('TOP')) return 'critical';
    if (taskText.toLowerCase().includes('high') || taskText.includes('HIGH')) return 'high';
    if (taskText.toLowerCase().includes('medium')) return 'medium';
    return 'normal';
  }

  // Extrair fase da task
  extractPhase(content, position) {
    const beforeContent = content.substring(0, position);
    const phases = ['FASE 1', 'FASE 2', 'FASE 3', 'FASE 4', 'FASE 5', 'FASE 6'];

    for (const phase of phases.reverse()) {
      if (beforeContent.includes(phase)) return phase;
    }
    return 'Unknown';
  }

  // Gerar prompt para implementação automática
  async generateImplementationPrompt(task) {
    return `Você é um assistente de implementação automática para o AIOX.

TAREFA ATUAL:
${task.description}

FASE: ${task.phase}
PRIORIDADE: ${task.priority}

Implemente esta tarefa seguindo as regras:
1. CLI-First: toda funcionalidade DEVE funcionar via CLI antes de UI
2. Story-Driven: crie/atualize a story associada
3. Quality-First: npm run lint, typecheck, test DEVEM passar
4. Sem invenção: siga apenas os requisitos
5. Salve progresso no checklist

Responda com:
1. O que foi implementado
2. Arquivos criados/modificados
3. Testes criados
4. Próxima tarefa recomendada

COMECE!`;
  }

  // Executar implementação automática (contínua ou limitada)
  async startAutoImplementation(options = {}) {
    const { interactive = true, maxTasks = null, verbose = false } = options;

    this.isRunning = true;

    if (this.continuous) {
      await this.startContinuousImplementation({ interactive, verbose });
    } else {
      await this.runImplementationCycle({ maxTasks, interactive, verbose });
    }

    this.isRunning = false;
  }

  // Ciclo contínuo de implementação
  async startContinuousImplementation(options = {}) {
    const { interactive = true, verbose = false } = options;

    console.log(`\n🤖 AUTO-IMPLEMENTADOR AIOX — MODO CONTÍNUO`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⚠️  Este modo rodará CONTINUAMENTE`);
    console.log(`🛑 Use Ctrl+C para interromper\n`);

    let cycleCount = 0;

    while (this.isRunning) {
      cycleCount++;
      console.log(`\n\n🔄 CICLO ${cycleCount}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`⏰ ${new Date().toLocaleString()}\n`);

      // Pre-flight checks
      console.log('🔍 Executando security checks...\n');
      const preFlightResults = await this.executor.runPreFlightChecks();
      const allChecksPassed = Object.values(preFlightResults).every(r => r.status === 'PASS');

      if (!allChecksPassed) {
        console.log('⚠️  Alguns checks falharam. Aguardando próximo ciclo...');
        await this.sleep(60000); // Aguarda 1 minuto
        continue;
      }

      // Criar backup antes de operações críticas
      const backup = this.executor.createBackup('pre-cycle');

      try {
        // Executar uma sessão de implementação
        const tasksCompleted = await this.runImplementationCycle({
          maxTasks: this.maxTasksPerSession,
          interactive,
          verbose,
        });

        if (tasksCompleted > 0) {
          // Post-execution checks
          console.log('\n✔️ Verificando integridade após implementações...\n');
          await this.executor.runPostExecutionChecks();

          // Auto-commit se configurado
          if (this.autoCommit) {
            const commitMsg = `Auto-implement: ${tasksCompleted} tasks completadas [Ciclo ${cycleCount}]`;
            await this.executor.commitChanges(commitMsg);

            // Auto-push se configurado
            if (this.autoPush) {
              await this.executor.pushChanges();
            }
          }
        }

        console.log('\n✅ Ciclo completo! Aguardando próximo...');
        await this.sleep(300000); // Aguarda 5 minutos antes do próximo ciclo
      } catch (error) {
        console.error(`\n❌ Erro durante ciclo: ${error.message}`);
        console.log('🔄 Tentando rollback...');
        if (backup) {
          this.executor.rollback(backup);
        }
        await this.sleep(120000); // Aguarda 2 minutos antes de tentar novamente
      }
    }

    console.log(`\n\n🛑 Auto-implementação interrompida após ${cycleCount} ciclos`);
  }

  // Ciclo única execução
  async runImplementationCycle(options = {}) {
    const { maxTasks = null, interactive = true, verbose = false } = options;

    const progress = this.loadProgress();
    const allTasks = await this.parseChecklist();

    if (allTasks.length === 0) {
      console.log('❌ Nenhuma tarefa encontrada no checklist');
      return 0;
    }

    const pendingTasks = allTasks.filter(t => !progress.completed.includes(t.id));
    const tasksToRun = maxTasks ? pendingTasks.slice(0, maxTasks) : pendingTasks;

    if (tasksToRun.length === 0) {
      console.log('✅ Todas as tarefas foram completadas!');
      return 0;
    }

    console.log(`📋 Total: ${allTasks.length} | ✅ Completadas: ${progress.completed.length} | ⏳ Pendentes: ${tasksToRun.length}\n`);

    let completedCount = 0;

    for (const task of tasksToRun) {
      const success = await this.executeTask(task, verbose);

      if (success) {
        completedCount++;
        progress.completed.push(task.id);
        progress.lastRun = new Date().toISOString();
        this.saveProgress(progress);

        if (interactive) {
          await this.sleep(5000); // Aguarda 5s entre tasks
        }
      }
    }

    return completedCount;
  }

  // Executar task individual
  async executeTask(task, verbose = false) {
    console.log(`\n📌 ${task.description}`);
    console.log(`🏷️  ${task.phase} | 🎯 ${task.priority}`);

    try {
      const prompt = await this.generateImplementationPrompt(task);
      const response = await this.client.chat(
        this.model,
        [{ role: 'user', content: prompt }],
        (chunk) => {
          if (verbose && chunk.message?.content) {
            process.stdout.write(chunk.message.content);
          }
        }
      );

      console.log('\n✅ Task completada!');
      this.taskHistory.push({
        taskId: task.id,
        completedAt: new Date().toISOString(),
        result: response.response.substring(0, 200),
      });

      return true;
    } catch (error) {
      console.error(`❌ Erro: ${error.message}`);
      return false;
    }
  }

  // Sleep helper
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Aguardar atividade ou timeout
  async waitForActivityOrTimeout(timeout) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= timeout) {
          clearInterval(checkInterval);
          console.log(`\n⏸️  Inatividade detectada (${timeout / 1000}s). Continuando...\n`);
          resolve();
        }
      }, 1000);
    });
  }

  // Modo interativo com detecção de inatividade
  async startInteractiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const progress = this.loadProgress();
    const allTasks = await this.parseChecklist();
    const pendingTasks = allTasks.filter(t => !progress.completed.includes(t.id));

    console.log(`\n🤖 MODO INTERATIVO - AUTO-IMPLEMENTADOR`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Tarefas pendentes: ${pendingTasks.length}`);
    console.log(`Tipo /status para ver progresso`);
    console.log(`Tipo /next para implementar próxima tarefa`);
    console.log(`Tipo /exit para sair\n`);

    const prompt = () => {
      rl.question('auto-impl> ', async (input) => {
        if (input === '/exit') {
          rl.close();
          process.exit(0);
        } else if (input === '/status') {
          console.log(`\n📊 Status:`);
          console.log(`  Completadas: ${progress.completed.length}`);
          console.log(`  Pendentes: ${pendingTasks.length}`);
          console.log(`  Última execução: ${progress.lastRun || 'Nunca'}\n`);
        } else if (input === '/next') {
          if (pendingTasks.length === 0) {
            console.log('✅ Todas as tarefas foram completadas!');
          } else {
            const nextTask = pendingTasks[0];
            await this.runSingleTask(nextTask);
            pendingTasks.shift();
            progress.completed.push(nextTask.id);
            this.saveProgress(progress);
          }
        }
        prompt();
      });
    };

    prompt();
  }

  async runSingleTask(task) {
    console.log(`\n🚀 Implementando: ${task.description}\n`);
    try {
      const prompt = await this.generateImplementationPrompt(task);
      const response = await this.client.chat(
        this.model,
        [{ role: 'user', content: prompt }],
        (chunk) => {
          if (chunk.message?.content) {
            process.stdout.write(chunk.message.content);
          }
        }
      );
      console.log('\n\n✅ Completado!\n');
    } catch (error) {
      console.error(`\n❌ Erro: ${error.message}\n`);
    }
  }
}

module.exports = AutoImplementer;
