#!/usr/bin/env node

/**
 * AUTO-IMPLEMENTADOR AIOX — CONTÍNUO & SEGURO
 * Executa tasks do improvements-checklist.md automaticamente
 * - Modo contínuo (roda indefinidamente com ciclos de 5min)
 * - Auto-commit e auto-push
 * - Security checks e rollback automático
 */

const { AutoImplementer } = require('../index');

const args = process.argv.slice(2);
const mode = args[0] || 'continuous'; // Default: contínuo
const maxTasks = args[1] ? parseInt(args[1]) : null;

async function main() {
  const options = {
    continuous: mode === 'continuous' || mode === 'c' || !mode,
    autoCommit: args.includes('--commit') || args.includes('-c'),
    autoPush: args.includes('--push') || args.includes('-p'),
    maxTasksPerSession: maxTasks,
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  if (mode === '-h' || mode === '--help' || args.includes('--help')) {
    console.log(`
🤖 AIOX AUTO-IMPLEMENTADOR — CONTÍNUO & SEGURO

MODOS:
  aiox-auto                       # Contínuo (roda indefinidamente)
  aiox-auto continuous            # Contínuo explícito
  aiox-auto once                  # Uma única sessão
  aiox-auto interactive           # Modo interativo
  aiox-auto --help                # Esta ajuda

OPÇÕES:
  -c, --commit                    # Auto-commit após cada ciclo
  -p, --push                      # Auto-push após cada commit
  -v, --verbose                   # Output detalhado
  --max-tasks N                   # Máximo de tasks por ciclo

EXEMPLOS:
  # Contínuo com auto-commit (recomendado)
  aiox-auto -c

  # Contínuo com auto-commit e auto-push
  aiox-auto -c -p

  # Uma única sessão (5 tasks)
  aiox-auto once --max-tasks 5

  # Interativo
  aiox-auto interactive

MODO CONTÍNUO:
  ✅ Roda indefinidamente (Ctrl+C para parar)
  ✅ Security checks antes de cada ciclo
  ✅ Auto-backup antes de mudanças
  ✅ Rollback automático em caso de erro
  ✅ Ciclos de 5 minutos
  ✅ Pre-flight: git status, disco, lint, tests
  ✅ Post-execution: validação de integridade

SEGURANÇA:
  🔒 Todas as permissões validadas
  🔒 Testes executados antes de commit
  🔒 Rollback automático em falha
  🔒 Backups em ~/.aiox/backups/
  🔒 Logs detalhados de todas as operações

AUTORIZAÇÕES ATIVAS:
  ✅ Leitura/escrita de arquivos
  ✅ npm lint, typecheck, test
  ✅ git commit, git status
  ⚠️  git push (apenas com -p)
  ❌ git reset --hard (bloqueado)
  ❌ rm -rf (bloqueado)
  ❌ Operações de banco de dados (bloqueado)
`);
    return;
  }

  try {
    const autoImpl = new AutoImplementer(options);

    if (mode === 'interactive' || mode === 'i') {
      console.log('\n🤖 Iniciando modo INTERATIVO...\n');
      await autoImpl.startInteractiveMode();
    } else {
      console.log(`\n🤖 Iniciando modo ${options.continuous ? 'CONTÍNUO' : 'ÚNICO'}...\n`);
      console.log(`Opções:`);
      console.log(`  Contínuo: ${options.continuous}`);
      console.log(`  Auto-commit: ${options.autoCommit}`);
      console.log(`  Auto-push: ${options.autoPush}\n`);

      if (options.continuous) {
        console.log('⚠️  Este processo rodará INDEFINIDAMENTE');
        console.log('Use Ctrl+C para interromper\n');
        // Aguarda 3 segundos antes de iniciar
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      await autoImpl.startAutoImplementation(options);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Auto-implementador interrompido pelo usuário');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Auto-implementador finalizado');
  process.exit(0);
});

main();
