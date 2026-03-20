#!/usr/bin/env node

/**
 * AI Capabilities Extractor
 *
 * Analisa transcrições de YouTube e extrai:
 * - Funcionalidades que a IA dele faz
 * - Como ela faz
 * - Casos de uso
 *
 * Economiza tokens: usa regex + Node.js, não chama Claude
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CAPABILITY PATTERNS - Keywords that indicate capabilities
// ============================================================================

const CAPABILITY_KEYWORDS = {
  'cloning': ['clonar', 'clonagem', 'clone', 'replicar', 'replication'],
  'pattern-extraction': ['padrão', 'pattern', 'extrair padrão', 'identify pattern'],
  'analysis': ['analisar', 'análise', 'analyze', 'assessment'],
  'teaching': ['ensinar', 'teaching', 'mentoria', 'mentorship', 'educação'],
  'decision-making': ['decisão', 'decision', 'veto', 'framework decisão'],
  'prediction': ['prever', 'predict', 'forecast', 'antecipação'],
  'automation': ['automatizar', 'automate', 'automação', 'workflow'],
  'optimization': ['otimizar', 'optimize', 'melhorar', 'improve'],
  'learning': ['aprender', 'learning', 'aprendizado', 'knowledge'],
  'generation': ['gerar', 'generate', 'criar', 'create'],
  'validation': ['validar', 'validate', 'verificar', 'verify'],
  'ranking': ['ranking', 'rank', 'score', 'priorizar'],
  'translation': ['traduzir', 'translate', 'transferir conhecimento'],
  'structuring': ['estruturar', 'structure', 'organizar', 'organize']
};

const DOMAIN_KEYWORDS = {
  'copywriting': ['copywriting', 'copy', 'persuasão', 'persuasion', 'vendas', 'sales'],
  'business': ['negócio', 'business', 'empreendedor', 'entrepreneur', 'startup'],
  'ai': ['IA', 'AI', 'inteligência artificial', 'artificial intelligence', 'modelo'],
  'leadership': ['liderança', 'leadership', 'equipe', 'team', 'management'],
  'marketing': ['marketing', 'campanha', 'campaign', 'growth'],
  'coding': ['código', 'code', 'programação', 'programming', 'desenvolvimento'],
  'content': ['conteúdo', 'content', 'video', 'vídeo', 'blog'],
  'product': ['produto', 'product', 'feature', 'funcionalidade'],
  'psychology': ['psicologia', 'psychology', 'comportamento', 'behavior', 'mente'],
  'economics': ['economia', 'economics', 'preço', 'price', 'valor', 'value']
};

// ============================================================================
// EXTRACT: Parse transcript and find capability mentions
// ============================================================================

function extractCapabilities(transcriptText, videoId) {
  /**
   * Analyze transcript and extract:
   * - What capabilities are mentioned
   * - How they're used
   * - In what context/domain
   */

  const capabilities = new Map();

  // Split into sentences for better context
  const sentences = transcriptText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  console.log(`[INFO] Analyzing ${sentences.length} sentences...`);

  // Scan for capability mentions
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    // Find which capability keywords match
    for (const [capability, keywords] of Object.entries(CAPABILITY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          // Found capability mention
          if (!capabilities.has(capability)) {
            capabilities.set(capability, []);
          }

          const contextList = capabilities.get(capability);
          contextList.push({
            sentence: sentence.substring(0, 150),
            domains: findDomains(lower)
          });

          break;
        }
      }
    }
  }

  // Remove duplicates
  const uniqueCapabilities = {};
  for (const [capability, contexts] of capabilities.entries()) {
    uniqueCapabilities[capability] = {
      mentions: contexts.length,
      contexts: contexts.slice(0, 3), // Keep top 3
      domains: [...new Set(contexts.flatMap(c => c.domains))]
    };
  }

  return uniqueCapabilities;
}

function findDomains(sentence) {
  /**
   * Identify which domain(s) are mentioned in the sentence
   */
  const domains = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (sentence.includes(keyword)) {
        domains.push(domain);
        break;
      }
    }
  }

  return domains;
}

// ============================================================================
// EXTRACT: Function mentions and examples
// ============================================================================

function extractFunctionMentions(transcriptText) {
  /**
   * Find specific functions or operations mentioned
   * E.g.: "o sistema consegue", "a IA faz", "permite que"
   */

  const functions = [];

  const patterns = [
    /(?:a IA|sistema|clone|agente)[\s\w]*(?:consegue|pode|faz|permite|gera|analisa|extrai)\s+([^.!?]+)/gi,
    /(?:você pode|é possível|permite|funciona)\s+([^.!?]+)/gi,
    /para\s+([^,]+),?\s+(?:use|utilize|faça|execute)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(transcriptText)) !== null) {
      functions.push(match[1].trim().substring(0, 100));
    }
  }

  return [...new Set(functions)];
}

// ============================================================================
// EXTRACT: Use cases and examples
// ============================================================================

function extractUseCases(transcriptText) {
  /**
   * Find practical examples of how the AI is used
   */

  const useCases = [];

  const patterns = [
    /(?:exemplo|example)[\s\w]*:?\s+([^.!?]+)/gi,
    /(?:quando|if|when)\s+([^,]+),?\s+(?:use|utilize|faça)\s+([^.!?]+)/gi,
    /para\s+([^,]+)\s*[,:]?\s+(?:você pode|é possível|use|utilize)\s+([^.!?]+)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(transcriptText)) !== null) {
      const useCase = match[match.length - 1].trim();
      if (useCase.length > 20) {
        useCases.push(useCase.substring(0, 120));
      }
    }
  }

  return [...new Set(useCases)];
}

// ============================================================================
// STRUCTURE: Organize into categories
// ============================================================================

function organizeCapabilities(allCapabilities) {
  /**
   * Group capabilities by category and create structure
   */

  const categories = {
    'mind-cloning': {
      name: 'Mind Cloning & Replication',
      description: 'Capabilities for extracting and replicating expert patterns',
      capabilities: []
    },
    'pattern-analysis': {
      name: 'Pattern Analysis & Recognition',
      description: 'Finding hidden patterns and structures',
      capabilities: []
    },
    'decision-support': {
      name: 'Decision Support & Framework',
      description: 'Helping with complex decisions',
      capabilities: []
    },
    'learning': {
      name: 'Learning & Knowledge Transfer',
      description: 'Teaching and knowledge acquisition',
      capabilities: []
    },
    'automation': {
      name: 'Automation & Optimization',
      description: 'Automating repetitive tasks',
      capabilities: []
    },
    'generation': {
      name: 'Content & Code Generation',
      description: 'Creating content, code, and structures',
      capabilities: []
    }
  };

  // Map capabilities to categories
  const categoryMap = {
    'cloning': 'mind-cloning',
    'pattern-extraction': 'pattern-analysis',
    'analysis': 'pattern-analysis',
    'decision-making': 'decision-support',
    'teaching': 'learning',
    'learning': 'learning',
    'automation': 'automation',
    'optimization': 'automation',
    'generation': 'generation',
    'structuring': 'generation',
    'translation': 'learning'
  };

  for (const [cap, data] of Object.entries(allCapabilities)) {
    const category = categoryMap[cap] || 'automation';
    if (categories[category]) {
      categories[category].capabilities.push({
        name: cap,
        mentions: data.mentions,
        domains: data.domains,
        examples: data.contexts.slice(0, 2)
      });
    }
  }

  return categories;
}

// ============================================================================
// OUTPUT: Generate markdown report
// ============================================================================

function generateReport(allCapabilities, functions, useCases, videoStats) {
  /**
   * Create comprehensive markdown report
   */

  let report = `# AI Capabilities Map - Alan Nicolas\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Source:** YouTube Transcripts\n`;
  report += `**Videos Analyzed:** ${videoStats.count}\n`;
  report += `**Total Sentences:** ${videoStats.sentences}\n\n`;

  report += `---\n\n`;

  // Summary
  report += `## Summary\n\n`;
  report += `Found **${Object.keys(allCapabilities).length}** distinct capability categories\n`;
  report += `Across **${videoStats.domains}** application domains\n`;
  report += `With **${functions.length}** specific functions\n`;
  report += `And **${useCases.length}** documented use cases\n\n`;

  // Capability matrix
  report += `## Capability Matrix\n\n`;
  report += `| Capability | Mentions | Primary Domain |\n`;
  report += `|------------|----------|----------------|\n`;

  const sorted = Object.entries(allCapabilities)
    .sort((a, b) => b[1].mentions - a[1].mentions);

  for (const [cap, data] of sorted.slice(0, 15)) {
    const domain = data.domains[0] || 'general';
    report += `| ${cap} | ${data.mentions} | ${domain} |\n`;
  }

  report += `\n---\n\n`;

  // Top functions
  report += `## Core Functions (${functions.length} identified)\n\n`;
  for (const func of functions.slice(0, 10)) {
    report += `- **${func}**\n`;
  }

  report += `\n---\n\n`;

  // Use cases
  report += `## Documented Use Cases (${useCases.length})\n\n`;
  for (const usecase of useCases.slice(0, 12)) {
    report += `- ${usecase}\n`;
  }

  report += `\n---\n\n`;

  // Detailed breakdown
  report += `## Capability Details by Category\n\n`;

  const organized = organizeCapabilities(allCapabilities);

  for (const [catKey, category] of Object.entries(organized)) {
    if (category.capabilities.length === 0) continue;

    report += `### ${category.name}\n\n`;
    report += `${category.description}\n\n`;

    for (const cap of category.capabilities) {
      report += `**${cap.name}**\n`;
      report += `- Mentions: ${cap.mentions}\n`;
      report += `- Domains: ${cap.domains.join(', ')}\n`;
      if (cap.examples.length > 0) {
        report += `- Examples:\n`;
        for (const ex of cap.examples.slice(0, 2)) {
          report += `  - *"${ex.sentence.substring(0, 80)}..."*\n`;
        }
      }
      report += `\n`;
    }
  }

  return report;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Capabilities Extractor

Usage:
  node workers/extract-capabilities.js <transcript-dir> [output-file]

Examples:
  node workers/extract-capabilities.js ./transcripts ./capabilities-map.md
  node workers/extract-capabilities.js ./transcripts

Output:
  - Analyzes all transcripts in directory
  - Extracts capabilities, functions, use cases
  - Generates comprehensive markdown report
    `);
    process.exit(0);
  }

  const transcriptDir = args[0];
  const outputFile = args[1] || 'CAPABILITIES-MAP.md';

  if (!fs.existsSync(transcriptDir)) {
    console.error(`[ERROR] Directory not found: ${transcriptDir}`);
    process.exit(1);
  }

  console.log(`[START] Extracting Capabilities`);
  console.log(`Input: ${transcriptDir}`);
  console.log(`Output: ${outputFile}\n`);

  try {
    // Find all transcript files
    const files = fs.readdirSync(transcriptDir)
      .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
      .filter(f => !f.includes('INDEX') && !f.includes('index'));

    console.log(`[INFO] Found ${files.length} transcript files\n`);

    let allCapabilities = {};
    let allFunctions = [];
    let allUseCases = [];
    let totalSentences = 0;
    const domains = new Set();

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(transcriptDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      console.log(`[${i + 1}/${files.length}] Processing: ${file}`);

      // Extract capabilities
      const caps = extractCapabilities(content, file);
      for (const [cap, data] of Object.entries(caps)) {
        if (!allCapabilities[cap]) {
          allCapabilities[cap] = { mentions: 0, contexts: [], domains: new Set() };
        }
        allCapabilities[cap].mentions += data.mentions;
        allCapabilities[cap].contexts.push(...data.contexts);
        data.domains.forEach(d => allCapabilities[cap].domains.add(d));
        data.domains.forEach(d => domains.add(d));
      }

      // Extract functions and use cases
      const funcs = extractFunctionMentions(content);
      const uses = extractUseCases(content);

      allFunctions.push(...funcs);
      allUseCases.push(...uses);

      totalSentences += content.split(/[.!?]+/).length;
    }

    // Convert Sets to arrays
    for (const cap in allCapabilities) {
      allCapabilities[cap].domains = Array.from(allCapabilities[cap].domains);
    }

    // Generate report
    const report = generateReport(
      allCapabilities,
      [...new Set(allFunctions)],
      [...new Set(allUseCases)],
      {
        count: files.length,
        sentences: totalSentences,
        domains: domains.size
      }
    );

    // Save report
    fs.writeFileSync(outputFile, report);
    console.log(`\n[✓] Report saved: ${outputFile}`);

    // Also save as JSON
    const jsonFile = outputFile.replace('.md', '.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      generated: new Date().toISOString(),
      filesAnalyzed: files.length,
      capabilities: allCapabilities,
      functions: [...new Set(allFunctions)],
      useCases: [...new Set(allUseCases)],
      domains: Array.from(domains)
    }, null, 2));

    console.log(`[✓] JSON saved: ${jsonFile}`);
    console.log(`\n[✓] Complete!`);
  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

main();
