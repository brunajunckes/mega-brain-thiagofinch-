#!/usr/bin/env node
/**
 * Claude Code Hook: Stop — Session Save
 * Salva contexto real da sessão para continuidade entre reinicializações.
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MEMORY_PATH = '/root/.claude/projects/-srv-aiox/memory/session-history.md';
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
    setTimeout(() => resolve({}), 3000);
  });
}

function runCmd(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 5000 }).trim();
  } catch { return ''; }
}

async function main() {
  const input = await readStdin();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Git state
  const branch = runCmd('git rev-parse --abbrev-ref HEAD');
  const lastCommit = runCmd('git log --oneline -1');
  const diffStat = runCmd('git diff --stat HEAD');
  const modifiedFiles = runCmd('git status --short').split('\n').filter(Boolean).slice(0, 10).join('\n');

  // Docker state
  const containers = runCmd('docker ps --format "{{.Names}}:{{.Status}}" 2>/dev/null').split('\n').filter(Boolean).join(', ');

  // Ler conteúdo atual para preservar histórico
  let existingContent = '';
  try { existingContent = fs.readFileSync(MEMORY_PATH, 'utf8'); } catch {}

  // Extrair sessões anteriores (max 2)
  const sessionBlocks = (existingContent.match(/## Sessão[\s\S]*?(?=\n## Sessão|$)/g) || []).slice(0, 2);
  const historico = sessionBlocks.length > 0 ? '\n---\n## Sessões Anteriores\n' + sessionBlocks.join('\n') : '';

  const newContent = `---
name: session-history
description: Histórico das últimas sessões — contexto real para continuidade
type: project
---

## Sessão ${now}

**Branch:** ${branch || 'main'}
**Último commit:** ${lastCommit || 'N/A'}
**Containers rodando:** ${containers || 'nenhum/docker off'}

**Arquivos modificados:**
\`\`\`
${modifiedFiles || 'nenhum'}
\`\`\`

**Notas da sessão:**
- Ver session-history.md e project-context.md para contexto completo da VPS
- Projeto principal: /srv/aiox (Synkra AIOX v5.0.3)
- Sistema VPS em: /root/AIOX/ (containers, scripts, monitoring)
- Autonomia total configurada: ~/.claude.json + settings.local.json

${historico}`;

  fs.mkdirSync(path.dirname(MEMORY_PATH), { recursive: true });
  fs.writeFileSync(MEMORY_PATH, newContent, 'utf8');
}

const timer = setTimeout(() => process.exit(0), 9000);
timer.unref();
main().then(() => { clearTimeout(timer); process.exitCode = 0; })
      .catch(() => { clearTimeout(timer); process.exitCode = 0; });
