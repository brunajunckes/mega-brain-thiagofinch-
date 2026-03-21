#!/usr/bin/env node
/**
 * Squad Guide Generator
 *
 * Generates the complete *guide output dynamically from agent .md files.
 * Single source of truth: the agents themselves define commands.
 *
 * Follows the same pattern as generate-squad-greeting.js:
 * - Extracts YAML blocks from squad agent files
 * - Parses commands, modes, categories
 * - Generates numbered command tables per agent
 *
 * Usage:
 *   node generate-squad-guide.js <squad-name>
 *
 * Example:
 *   node generate-squad-guide.js squad-creator
 *
 * @module generate-squad-guide
 * @version 1.0.0
 * @location squads/squad-creator/scripts/
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const SQUADS_PATH = './squads';

// ═══════════════════════════════════════════════════════════════════════════════
// YAML EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract ALL yaml/yml code blocks from markdown content.
 * @param {string} content - Markdown file content
 * @returns {string[]} Raw YAML block strings
 */
function extractAllYamlBlocks(content) {
  const blocks = [];
  const regex = /```ya?ml\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * Preprocess YAML to fix known format issues.
 *
 * pedro-valerio modes have commands like:
 *   - "*eng-map {processo}" - Mapear processo completo
 * which is invalid YAML (content after closing quote).
 * We fix it to:
 *   - "*eng-map {processo} - Mapear processo completo"
 *
 * @param {string} yamlStr - Raw YAML string
 * @returns {string} Preprocessed YAML string
 */
function preprocessYaml(yamlStr) {
  // Fix: use [ \t] instead of \s to avoid matching across newlines
  return yamlStr.replace(
    /^(\s*-\s*)"([^"]+)"[ \t]+-[ \t]+(.+)$/gm,
    '$1"$2 - $3"',
  );
}

/**
 * Parse YAML blocks safely, returning parsed objects.
 * Applies preprocessing and skips blocks that fail to parse.
 *
 * @param {string[]} rawBlocks - Raw YAML block strings
 * @returns {Object[]} Successfully parsed YAML documents
 */
function parseYamlBlocks(rawBlocks) {
  const parsed = [];
  for (const block of rawBlocks) {
    try {
      const preprocessed = preprocessYaml(block);
      const doc = yaml.load(preprocessed);
      if (doc && typeof doc === 'object') {
        parsed.push(doc);
      }
    } catch (e) {
      // Block failed to parse — skip silently
    }
  }
  return parsed;
}

/**
 * Find a top-level key across multiple parsed YAML blocks.
 * Returns the first match found.
 *
 * @param {Object[]} parsedBlocks - Array of parsed YAML documents
 * @param {string} key - Key to search for
 * @returns {*} Value found, or null
 */
function findKey(parsedBlocks, key) {
  for (const block of parsedBlocks) {
    if (block[key] !== undefined) {
      return block[key];
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regex-based fallback to extract agent info from raw YAML blocks.
 * Used when YAML parsing fails due to loose formatting (e.g. "text" → more text).
 *
 * @param {string[]} rawBlocks - Raw YAML block strings
 * @returns {Object|null} Agent info {name, id, title, icon} or null
 */
function extractAgentInfoFromRaw(rawBlocks) {
  for (const block of rawBlocks) {
    const agentStart = block.match(/^agent:\s*$/m);
    if (!agentStart) continue;

    const agentSection = block.substring(agentStart.index);
    const getName = agentSection.match(/^\s+name:\s*(.+)/m);
    const getId = agentSection.match(/^\s+id:\s*(.+)/m);
    const getTitle = agentSection.match(/^\s+title:\s*(.+)/m);
    const getIcon = agentSection.match(/^\s+icon:\s*(.+)/m);

    if (getName) {
      const clean = (v) => v.trim().replace(/^["']|["']$/g, '');
      return {
        name: clean(getName[1]),
        id: getId ? clean(getId[1]) : '',
        title: getTitle ? clean(getTitle[1]) : '',
        icon: getIcon ? getIcon[1].trim() : '',
      };
    }
  }
  return null;
}

/**
 * Load and parse an agent .md file, extracting all YAML blocks
 * and searching for relevant keys across blocks.
 *
 * @param {string} squadName - Squad directory name
 * @param {string} agentName - Agent filename (without .md)
 * @returns {Promise<Object>} Agent data with parsed YAML keys
 */
async function loadAgentData(squadName, agentName) {
  const agentPath = path.join(
    process.cwd(),
    SQUADS_PATH,
    squadName,
    'agents',
    `${agentName}.md`,
  );
  const content = await fs.readFile(agentPath, 'utf8');
  const rawBlocks = extractAllYamlBlocks(content);
  const parsedBlocks = parseYamlBlocks(rawBlocks);

  // agent key may fail YAML parsing (loose formatting in core_beliefs etc.)
  // Use regex fallback if not found via standard parsing.
  const agent =
    findKey(parsedBlocks, 'agent') || extractAgentInfoFromRaw(rawBlocks);

  return {
    agent,
    commands: findKey(parsedBlocks, 'commands'),
    modes: findKey(parsedBlocks, 'modes'),
    command_categories: findKey(parsedBlocks, 'command_categories'),
    command_aliases_ptbr: findKey(parsedBlocks, 'command_aliases_ptbr'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND PARSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a command string in the format:
 *   "*command {params} - Description"
 *
 * Used for squad-chief commands (string array) and
 * pedro-valerio mode commands (after YAML preprocessing).
 *
 * @param {string} str - Command string
 * @returns {{command: string, description: string}|null}
 */
function parseCommandString(str) {
  if (typeof str !== 'string') return null;

  // Match: *command-name {optional params} - Description
  const match = str.match(/^(\*\S+(?:\s+\{[^}]+\})*)\s+-\s+(.+)$/);
  if (match) {
    return { command: match[1].trim(), description: match[2].trim() };
  }

  // Fallback: just extract the command name
  const cmdMatch = str.match(/^(\*\S+)/);
  if (cmdMatch) {
    return { command: cmdMatch[1], description: '' };
  }

  return null;
}

/**
 * Parse object-format commands (from oalanicolas/pedro-valerio visibility blocks).
 * Format: [{name: "*cmd", description: "..."}, ...]
 *
 * @param {Array} arr - Array of command objects
 * @returns {{command: string, description: string}[]}
 */
function parseObjectCommands(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((cmd) => cmd && typeof cmd === 'object' && cmd.name)
    .map((cmd) => ({
      command: cmd.name.startsWith('*') ? cmd.name : `*${cmd.name}`,
      description: cmd.description || '',
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDE GENERATION — Shared Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a markdown table of commands with sequential numbering.
 *
 * @param {{command: string, description: string}[]} commands
 * @param {number} startNumber - First row number
 * @returns {string} Markdown table
 */
function generateCommandTable(commands, startNumber) {
  let table = '| # | Comando | Descrição |\n|---|---------|-----------|';
  commands.forEach((cmd, i) => {
    table += `\n| ${startNumber + i} | \`${cmd.command}\` | ${cmd.description} |`;
  });
  return table;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDE GENERATION — Conceptual Sections (static template strings)
// ═══════════════════════════════════════════════════════════════════════════════

function generateConceptualSections() {
  return `## O que é o Squad Architect?

Sou o arquiteto especializado em criar **squads de agentes** baseados em **elite minds reais** — pessoas com frameworks documentados e skin in the game. Ao invés de criar bots genéricos, eu clono a metodologia de experts reais de qualquer domínio.

> **Filosofia:** "Clone minds > create bots"

## Conceitos Fundamentais

| Conceito | O que é | Detalhes |
|----------|---------|----------|
| **Voice DNA** | COMO o expert comunica | Vocabulário, frases assinatura, tom, histórias recorrentes |
| **Thinking DNA** | COMO o expert decide | Frameworks, heurísticas, arquitetura de decisão |
| **Tiers** | Organização hierárquica | T0: Diagnóstico → T1: Masters → T2: Sistemáticos → Orchestrator |
| **Quality Gates** | Validação rigorosa | 3 smoke tests + Voice DNA rastreável + Heuristics com QUANDO |

## Workflow de Criação

| Fase | Ação | Descrição |
|------|------|-----------|
| 1 | CONTEXTO | Detecto greenfield/resume/brownfield |
| 2 | DISCOVERY | Pesquisa paralela (experts, tools, riscos) |
| 3 | ARQUITETURA | Defino tiers, handoffs e escopo |
| 4 | CRIAÇÃO | Gero agents/tasks/workflows |
| 5 | INTEGRAÇÃO | Wiring, handoffs, documentação |
| 6 | GATES FINAIS | validate-squad + validate-final-artifacts |

## Primeiros Passos

| Ação | Comando | Descrição |
|------|---------|-----------|
| Criar squad | \`*create-squad-smart legal\` | Detecto contexto e escolho workflow automaticamente |
| Upgrade brownfield | \`*brownfield-upgrade legal\` | Valido baseline e aplico upgrade seguro |
| Clonar expert | \`*clone-mind Gary Halbert\` | Extrair Voice DNA + Thinking DNA completo |
| Validar squad | \`*validate-squad copy\` | Validação granular component-by-component |
| Ver analytics | \`*squad-analytics\` | Dashboard detalhado de métricas |`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDE GENERATION — Per-Agent Command Sections
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate squad-chief command section, grouped by command_categories.
 * Falls back to flat table if no categories defined.
 *
 * @param {Object} data - Agent data from loadAgentData
 * @param {number} startNumber - First command number
 * @returns {{output: string, nextNumber: number}}
 */
function generateSquadChiefCommands(data, startNumber) {
  const rawCommands = data.commands || [];

  // Parse all commands from string array
  const allParsed = rawCommands
    .filter((cmd) => typeof cmd === 'string' && cmd.startsWith('*'))
    .map(parseCommandString)
    .filter(Boolean);

  // Build lookup by base command name (without params)
  const cmdMap = new Map();
  for (const cmd of allParsed) {
    const baseName = cmd.command.split(' ')[0];
    if (!cmdMap.has(baseName)) {
      cmdMap.set(baseName, cmd);
    }
  }

  const categories = data.command_categories;
  let output = '';
  let currentNum = startNumber;

  if (categories) {
    // Group by categories (preserves order from YAML)
    for (const [, category] of Object.entries(categories)) {
      const catCommands = (category.commands || [])
        .map((cmdName) => cmdMap.get(cmdName) || null)
        .filter(Boolean);

      if (catCommands.length > 0) {
        output += `\n**${category.display}**\n`;
        output += generateCommandTable(catCommands, currentNum);
        output += '\n';
        currentNum += catCommands.length;
      }
    }
  } else {
    // No categories — flat table
    output += generateCommandTable(allParsed, currentNum);
    currentNum += allParsed.length;
  }

  return { output, nextNumber: currentNum };
}

/**
 * Generate oalanicolas command section — flat table (no subcategories).
 *
 * @param {Object} data - Agent data from loadAgentData
 * @param {number} startNumber - First command number
 * @returns {{output: string, nextNumber: number}}
 */
function generateOalanicolasCommands(data, startNumber) {
  const commands = parseObjectCommands(data.commands);
  const table = generateCommandTable(commands, startNumber);
  return { output: table, nextNumber: startNumber + commands.length };
}

/**
 * Generate pedro-valerio command section, grouped by modes prefix.
 * Remaining commands (not in any mode) go to "CRIAÇÃO & AUDITORIA".
 *
 * @param {Object} data - Agent data from loadAgentData
 * @param {number} startNumber - First command number
 * @returns {{output: string, nextNumber: number}}
 */
function generatePedroValerioCommands(data, startNumber) {
  const { commands: visibilityCommands, modes } = data;
  const parsedVisibility = parseObjectCommands(visibilityCommands);

  let output = '';
  let currentNum = startNumber;
  const usedCommandBases = new Set();

  if (modes) {
    for (const [, mode] of Object.entries(modes)) {
      const prefix = mode.prefix || '';
      const modeCommands = [];

      // Extract commands from mode.commands (strings with params + descriptions)
      if (Array.isArray(mode.commands)) {
        for (const cmdStr of mode.commands) {
          const parsed = parseCommandString(cmdStr);
          if (parsed) {
            modeCommands.push(parsed);
            usedCommandBases.add(parsed.command.split(' ')[0]);
          }
        }
      }

      // Fallback: if no mode commands parsed, match visibility commands by prefix
      if (modeCommands.length === 0 && prefix) {
        for (const cmd of parsedVisibility) {
          if (cmd.command.startsWith(prefix)) {
            modeCommands.push(cmd);
            usedCommandBases.add(cmd.command);
          }
        }
      }

      if (modeCommands.length > 0) {
        const displayName = (mode.name || '').toUpperCase();
        const prefixDisplay = prefix ? ` (\`${prefix}*\`)` : '';
        output += `\n**${displayName}${prefixDisplay}**\n`;
        output += generateCommandTable(modeCommands, currentNum);
        output += '\n';
        currentNum += modeCommands.length;
      }
    }
  }

  // Remaining commands not assigned to any mode
  const remaining = parsedVisibility.filter(
    (cmd) => !usedCommandBases.has(cmd.command),
  );
  if (remaining.length > 0) {
    output += '\n**CRIAÇÃO & AUDITORIA**\n';
    output += generateCommandTable(remaining, currentNum);
    output += '\n';
    currentNum += remaining.length;
  }

  return { output, nextNumber: currentNum };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDE GENERATION — Aliases Section
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate aliases table from command_aliases_ptbr array.
 *
 * @param {string[]} aliases - Array of alias strings
 * @returns {string} Markdown table or empty string
 */
function generateAliasesSection(aliases) {
  if (!Array.isArray(aliases)) return '';

  const rows = [];
  let num = 1;
  for (const alias of aliases) {
    if (typeof alias !== 'string') continue;
    const match = alias.match(/^\*(\S+)\s*->\s*\*(\S+)$/);
    if (match) {
      rows.push(`| ${num} | \`*${match[1]}\` | → \`*${match[2]}\` |`);
      num++;
    }
  }

  if (rows.length === 0) return '';
  return '| # | Alias PT-BR | Comando Original |\n|---|-------------|-----------------|' + '\n' + rows.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate the complete squad guide.
 *
 * @param {string} squadName - Squad directory name (e.g. "squad-creator")
 * @returns {Promise<string>} Complete guide as markdown
 */
async function generateSquadGuide(squadName) {
  // Load squad-chief (always available)
  const chiefData = await loadAgentData(squadName, 'squad-chief');

  // Try to load PRO agents (graceful fallback if not installed)
  let alanData = null;
  let pedroData = null;
  try {
    [alanData, pedroData] = await Promise.all([
      loadAgentData(squadName, 'oalanicolas'),
      loadAgentData(squadName, 'pedro-valerio'),
    ]);
  } catch {
    // PRO agents not available — base mode
  }

  const proMode = alanData && pedroData;
  const parts = [];

  // ── Title ──
  parts.push('SQUAD CREATOR — Guia Completo & Menu de Comandos');

  // ── Conceptual Sections ──
  parts.push(generateConceptualSections());

  // ── Squad Chief Commands ──
  const chiefAgent = chiefData.agent || {};
  const chiefLabel = chiefAgent.name || 'Squad Chief';
  const chiefResult = generateSquadChiefCommands(chiefData, 1);
  parts.push(
    `## 100% Comandos — @squad-chief (${chiefLabel})\n${chiefResult.output}`,
  );

  let lastNextNumber = chiefResult.nextNumber;

  // ── PRO: oalanicolas Commands ──
  if (proMode) {
    const alanAgent = alanData.agent || {};
    const alanLabel = alanAgent.name || 'oalanicolas';
    const alanResult = generateOalanicolasCommands(
      alanData,
      lastNextNumber,
    );
    parts.push(
      `## [PRO] Comandos — @oalanicolas (${alanLabel})\n${alanResult.output}`,
    );
    lastNextNumber = alanResult.nextNumber;

    // ── PRO: pedro-valerio Commands ──
    const pedroAgent = pedroData.agent || {};
    const pedroLabel = pedroAgent.name || 'pedro-valerio';
    const pedroResult = generatePedroValerioCommands(
      pedroData,
      lastNextNumber,
    );
    parts.push(
      `## [PRO] Comandos — @pedro-valerio (${pedroLabel})\n${pedroResult.output}`,
    );
    lastNextNumber = pedroResult.nextNumber;
  }

  // ── Aliases PT-BR ──
  const aliasesTable = generateAliasesSection(chiefData.command_aliases_ptbr);
  if (aliasesTable) {
    parts.push(`## Aliases PT-BR (Squad Chief)\n${aliasesTable}`);
  }

  // ── Footer ──
  const totalCommands = lastNextNumber - 1;
  const agentCount = proMode ? 3 : 1;
  const agentList = proMode
    ? '@squad-chief, @oalanicolas, @pedro-valerio'
    : '@squad-chief';
  parts.push(
    `## Resumo & Próximo Passo\n\n| Métrica | Valor |\n|---------|-------|\n| Comandos totais | **${totalCommands}** |\n| Agentes no squad | **${agentCount}** (${agentList}) |${proMode ? '' : '\n| Modo | **Base** (AIOX Pro adiciona mind cloning, DNA extraction, otimização) |'}\n| Aliases PT-BR | **${chiefData.command_aliases_ptbr ? chiefData.command_aliases_ptbr.filter(a => a.includes('->')).length : 0}** |\n\nDigite o **número** ou o **comando** para executar. Qual domínio você quer transformar em squad?`,
  );

  return parts.join('\n\n');
}

/**
 * Fallback guide when generation fails.
 * @returns {string}
 */
function generateFallbackGuide() {
  return '🎨 Squad Architect — Guide\n\nType *help to see available commands.';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const squadName = process.argv[2];

  if (!squadName) {
    console.error(
      'Usage: node generate-squad-guide.js <squad-name>\n\nExample:\n  node generate-squad-guide.js squad-creator',
    );
    process.exit(1);
  }

  generateSquadGuide(squadName)
    .then((guide) => {
      console.log(guide);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error.message);
      console.log(generateFallbackGuide());
      process.exit(1);
    });
}

module.exports = { generateSquadGuide, generateFallbackGuide };
