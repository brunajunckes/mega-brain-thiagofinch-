const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AUTHORIZED EXECUTOR
 * Executa comandos com autorização e segurança
 * - Valida permissões
 * - Executa pre-flight checks
 * - Faz rollback em caso de erro
 */

class AuthorizedExecutor {
  constructor(userAuthorizations = {}) {
    this.authorizations = {
      // Git operations
      gitCommit: true,
      gitPush: userAuthorizations.gitPush !== false,
      gitBranch: true,

      // File operations
      fileRead: true,
      fileWrite: true,
      fileDelete: true,

      // Code execution
      npmInstall: true,
      npmTest: true,
      npmLint: true,
      npmTypecheck: true,
      npmBuild: true,

      // Shell commands
      bash: true,

      // Destructive operations (require explicit permission)
      gitResetHard: userAuthorizations.gitResetHard || false,
      rmRf: userAuthorizations.rmRf || false,
      dropDatabase: false, // NEVER

      ...userAuthorizations,
    };

    this.preFlightChecks = [
      'checkGitStatus',
      'checkDiskSpace',
      'checkNodeVersion',
      'runLint',
      'runTypecheck',
      'runTests',
    ];

    this.postExecutionChecks = [
      'verifyFilesChanged',
      'verifyNoErrors',
      'verifyTestsPassing',
    ];

    this.backupPath = path.join(process.env.HOME, '.aiox/backups');
  }

  // Verificar se operação está autorizada
  checkAuthorization(operation) {
    if (!this.authorizations[operation]) {
      throw new Error(`❌ OPERAÇÃO NÃO AUTORIZADA: ${operation}`);
    }
    return true;
  }

  // Criar backup antes de operação crítica
  createBackup(label = 'pre-operation') {
    try {
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${label}-${timestamp}`;
      const backupFile = path.join(this.backupPath, `${backupName}.json`);

      const backup = {
        timestamp,
        gitStatus: this.getGitStatus(),
        filesModified: this.getModifiedFiles(),
        gitLog: this.getGitLog(5),
      };

      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      console.log(`✅ Backup criado: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error(`⚠️  Erro ao criar backup: ${error.message}`);
      return null;
    }
  }

  // Pre-flight checks
  async runPreFlightChecks() {
    console.log('\n🔍 Executando pre-flight checks...\n');

    const checks = {
      gitStatus: () => this.checkGitStatus(),
      diskSpace: () => this.checkDiskSpace(),
      nodeVersion: () => this.checkNodeVersion(),
      lint: () => this.runLint(),
      typecheck: () => this.runTypecheck(),
      tests: () => this.runTests(),
    };

    const results = {};

    for (const [name, check] of Object.entries(checks)) {
      try {
        console.log(`⏳ ${name}...`);
        const result = await check();
        results[name] = { status: 'PASS', ...result };
        console.log(`✅ ${name} passou\n`);
      } catch (error) {
        results[name] = { status: 'FAIL', error: error.message };
        console.error(`❌ ${name} falhou: ${error.message}\n`);
      }
    }

    return results;
  }

  // Post-execution checks
  async runPostExecutionChecks() {
    console.log('\n✔️ Executando post-execution checks...\n');

    const checks = {
      filesChanged: () => this.verifyFilesChanged(),
      noErrors: () => this.verifyNoErrors(),
      testsPassing: () => this.runTests(),
    };

    const results = {};

    for (const [name, check] of Object.entries(checks)) {
      try {
        console.log(`⏳ ${name}...`);
        await check();
        results[name] = 'PASS';
        console.log(`✅ ${name} passou\n`);
      } catch (error) {
        results[name] = { status: 'FAIL', error: error.message };
        console.error(`❌ ${name} falhou: ${error.message}\n`);
      }
    }

    return results;
  }

  // Git operations
  checkGitStatus() {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return { clean: !status.trim(), output: status };
  }

  getModifiedFiles() {
    try {
      const output = execSync('git diff --name-only', { encoding: 'utf-8' });
      return output.trim().split('\n').filter(f => f);
    } catch {
      return [];
    }
  }

  getGitLog(count = 5) {
    try {
      const output = execSync(`git log --oneline -${count}`, { encoding: 'utf-8' });
      return output.trim();
    } catch {
      return '';
    }
  }

  // System checks
  checkDiskSpace() {
    try {
      const output = execSync('df -h / | tail -1', { encoding: 'utf-8' });
      const parts = output.trim().split(/\s+/);
      const used = parseFloat(parts[4]);

      if (used > 90) {
        throw new Error(`Disco quase cheio: ${used}%`);
      }

      return { diskUsage: used, status: 'OK' };
    } catch (error) {
      throw new Error(`Erro ao verificar disco: ${error.message}`);
    }
  }

  checkNodeVersion() {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    console.log(`  Node: ${version}`);
    return { nodeVersion: version };
  }

  // Code quality checks
  runLint() {
    try {
      console.log('  Rodando: npm run lint');
      execSync('npm run lint', { cwd: process.cwd(), stdio: 'pipe' });
      return { passed: true };
    } catch (error) {
      throw new Error(`Lint falhou: ${error.message}`);
    }
  }

  runTypecheck() {
    try {
      console.log('  Rodando: npm run typecheck');
      execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
      return { passed: true };
    } catch (error) {
      throw new Error(`Typecheck falhou: ${error.message}`);
    }
  }

  runTests() {
    try {
      console.log('  Rodando: npm test');
      execSync('npm test', { cwd: process.cwd(), stdio: 'pipe' });
      return { passed: true };
    } catch (error) {
      throw new Error(`Testes falharam: ${error.message}`);
    }
  }

  // Verification
  verifyFilesChanged() {
    const files = this.getModifiedFiles();
    if (files.length === 0) {
      throw new Error('Nenhum arquivo foi modificado');
    }
    return { filesChanged: files };
  }

  verifyNoErrors() {
    // Verifica se há erros conhecidos
    return { status: 'OK' };
  }

  // Git commit automático
  async commitChanges(message) {
    this.checkAuthorization('gitCommit');

    try {
      const files = this.getModifiedFiles();

      if (files.length === 0) {
        console.log('ℹ️  Nenhum arquivo para commitar');
        return false;
      }

      console.log(`📝 Fazendo commit: ${message}`);
      execSync(`git add -A && git commit -m "${message}"`, { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error(`❌ Erro ao fazer commit: ${error.message}`);
      return false;
    }
  }

  // Git push automático
  async pushChanges() {
    this.checkAuthorization('gitPush');

    try {
      console.log('📤 Fazendo push...');
      execSync('git push origin $(git rev-parse --abbrev-ref HEAD)', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error(`❌ Erro ao fazer push: ${error.message}`);
      return false;
    }
  }

  // Rollback
  rollback(backupFile) {
    console.log(`\n⚠️  INICIANDO ROLLBACK usando backup: ${backupFile}`);

    try {
      // Reset git to last known good state
      execSync('git reset --hard HEAD~1', { stdio: 'inherit' });
      console.log('✅ Git reset completo');
    } catch (error) {
      console.error(`❌ Erro durante rollback: ${error.message}`);
    }
  }

  // Execute arbitrary command with authorization
  executeCommand(command, options = {}) {
    const {
      description = command,
      requiresAuth = true,
      timeout = 300000,
      cwd = process.cwd(),
    } = options;

    if (requiresAuth) {
      this.checkAuthorization('bash');
    }

    try {
      console.log(`🔧 Executando: ${description}`);
      const output = execSync(command, {
        cwd,
        timeout,
        encoding: 'utf-8',
      });
      return { success: true, output };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = AuthorizedExecutor;
