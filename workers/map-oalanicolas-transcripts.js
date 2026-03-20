#!/usr/bin/env node

/**
 * Map @oalanicolas Transcripts - Advanced Analysis
 *
 * Analyzes extracted transcripts to generate:
 * - AI Tools usage matrix
 * - Guest expertise mapping
 * - Framework/pattern detection
 * - Technical concepts extraction
 * - Content taxonomy
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIG
// ============================================================================

const TRANSCRIPTS_DIR = process.argv[2] || './data/transcripts-apify';
const OUTPUT_DIR = process.argv[3] || './data/analysis/oalanicolas';

// Detection patterns
const AI_MODELS = {
  'ChatGPT': /\bchatgpt\b/gi,
  'GPT-4': /\bgpt-?4\b/gi,
  'GPT-3.5': /\bgpt-?3[._]5\b/gi,
  'Claude': /\bclaude\b/gi,
  'Gemini': /\bgemini\b/gi,
  'Llama': /\bllama\b/gi,
  'Ollama': /\bollama\b/gi,
  'OpenAI': /\bopenai\b/gi,
  'Anthropic': /\banthropics?\b/gi,
  'Mistral': /\bmistral\b/gi,
  'Cohere': /\bcohere\b/gi,
  'Groq': /\bgroq\b/gi,
  'Falcon': /\bfalcon\b/gi,
  'Alpaca': /\balpaca\b/gi,
  'Vicuna': /\bvicuna\b/gi,
  'BERT': /\bbert\b/gi,
  'T5': /\bt5\b/gi,
  'Transformers': /\btransformers\b/gi
};

const FRAMEWORKS = {
  'AIOX': /\baiox\b/gi,
  'Agents': /\bagents?\b/gi,
  'Workflows': /\bworkflows?\b/gi,
  'Prompting': /\bprompt(?:ing|s)?\b/gi,
  'RAG': /\b(?:rag|retrieval-augmented generation)\b/gi,
  'Embeddings': /\bembeddings?\b/gi,
  'Fine-tuning': /\bfine-tun(?:ing|ed)\b/gi,
  'Integration': /\bintegrat(?:ion|ing|ed)\b/gi,
  'Automation': /\bautomat(?:ion|ing|ed)\b/gi,
  'API': /\b(?:api|apis)\b/gi,
  'LLM': /\b(?:llm|large language model)\b/gi,
  'Vector Database': /\bvector\s+db|vectordb|pinecone|weaviate\b/gi,
  'Semantic Search': /\bsemantic\s+search\b/gi,
  'Zero-shot': /\bzero-shot\b/gi,
  'Few-shot': /\bfew-shot\b/gi,
  'Chain of Thought': /\bchain\s+of\s+thought\b/gi
};

const LANGUAGES = {
  'Python': /\bpython\b/gi,
  'JavaScript': /\b(?:javascript|js|node|nodejs)\b/gi,
  'TypeScript': /\b(?:typescript|ts)\b/gi,
  'Go': /\b\bgo\b(?:\blang)?\b/gi,
  'Rust': /\brust\b/gi,
  'Java': /\bjava\b/gi,
  'C++': /\b(?:c\+\+|cpp)\b/gi,
  'SQL': /\bsql\b/gi
};

const PLATFORMS = {
  'OpenAI Platform': /\bopenai\s+api|openai\s+platform/gi,
  'Hugging Face': /\bhugging\s+face|huggingface\b/gi,
  'GitHub': /\bgithub\b/gi,
  'Docker': /\bdocker\b/gi,
  'Kubernetes': /\bkubernetes|k8s\b/gi,
  'AWS': /\baws|amazon\s+web\s+services\b/gi,
  'Google Cloud': /\bgcp|google\s+cloud\b/gi,
  'Azure': /\bazure\b/gi,
  'Vercel': /\bvercel\b/gi,
  'Supabase': /\bsupabase\b/gi
};

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadTranscript(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    return {
      success: true,
      videoId: data.videoId,
      transcript: data.transcript,
      language: data.language,
      length: data.length
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function detectPatterns(text, patterns) {
  const results = {};
  Object.entries(patterns).forEach(([name, regex]) => {
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      results[name] = matches.length;
    }
  });
  return results;
}

function loadAllTranscripts() {
  const transcripts = [];

  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    console.error(`Error: ${TRANSCRIPTS_DIR} not found`);
    return [];
  }

  const files = fs.readdirSync(TRANSCRIPTS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'INDEX.json')
    .sort();

  console.log(`Loading ${files.length} transcripts...`);

  files.forEach((file, idx) => {
    const filePath = path.join(TRANSCRIPTS_DIR, file);
    const result = loadTranscript(filePath);

    if (result.success) {
      transcripts.push(result);
      process.stdout.write(`\r  ${idx + 1}/${files.length} loaded`);
    }
  });

  console.log(`\n✓ Loaded ${transcripts.length} transcripts\n`);
  return transcripts;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function analyzeTranscripts(transcripts) {
  const analysis = {
    totalVideos: transcripts.length,
    totalChars: 0,
    aiModels: {},
    frameworks: {},
    languages: {},
    platforms: {},
    videoDetails: []
  };

  transcripts.forEach(t => {
    analysis.totalChars += t.length;

    const aiUsage = detectPatterns(t.transcript, AI_MODELS);
    const frameworkUsage = detectPatterns(t.transcript, FRAMEWORKS);
    const langUsage = detectPatterns(t.transcript, LANGUAGES);
    const platformUsage = detectPatterns(t.transcript, PLATFORMS);

    // Aggregate
    Object.entries(aiUsage).forEach(([name, count]) => {
      analysis.aiModels[name] = (analysis.aiModels[name] || 0) + count;
    });

    Object.entries(frameworkUsage).forEach(([name, count]) => {
      analysis.frameworks[name] = (analysis.frameworks[name] || 0) + count;
    });

    Object.entries(langUsage).forEach(([name, count]) => {
      analysis.languages[name] = (analysis.languages[name] || 0) + count;
    });

    Object.entries(platformUsage).forEach(([name, count]) => {
      analysis.platforms[name] = (analysis.platforms[name] || 0) + count;
    });

    // Video details
    analysis.videoDetails.push({
      videoId: t.videoId,
      length: t.length,
      language: t.language,
      aiModels: aiUsage,
      frameworks: frameworkUsage,
      languages: langUsage,
      platforms: platformUsage
    });
  });

  return analysis;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateExecutiveSummary(analysis) {
  let md = `# @oalanicolas Channel - Analysis Summary\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Videos analyzed:** ${analysis.totalVideos}\n`;
  md += `**Total transcript size:** ${(analysis.totalChars / 1024 / 1024).toFixed(2)} MB\n`;
  md += `**Average video length:** ${(analysis.totalChars / analysis.totalVideos / 1000).toFixed(1)}K characters\n\n`;

  // Top AI Models
  md += `## 🤖 Top AI Models Discussed\n\n`;
  const topAI = Object.entries(analysis.aiModels)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  md += `| Model | Mentions |\n`;
  md += `|-------|----------|\n`;
  topAI.forEach(([model, count]) => {
    md += `| ${model} | ${count} |\n`;
  });

  // Top Frameworks
  md += `\n## 🏗️ Top Frameworks & Concepts\n\n`;
  const topFrameworks = Object.entries(analysis.frameworks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  md += `| Framework | Mentions |\n`;
  md += `|-----------|----------|\n`;
  topFrameworks.forEach(([fw, count]) => {
    md += `| ${fw} | ${count} |\n`;
  });

  // Top Languages
  md += `\n## 💻 Programming Languages Discussed\n\n`;
  const topLangs = Object.entries(analysis.languages)
    .sort((a, b) => b[1] - a[1]);

  md += `| Language | Mentions |\n`;
  md += `|----------|----------|\n`;
  topLangs.forEach(([lang, count]) => {
    md += `| ${lang} | ${count} |\n`;
  });

  // Top Platforms
  md += `\n## ☁️ Top Platforms & Services\n\n`;
  const topPlatforms = Object.entries(analysis.platforms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  md += `| Platform | Mentions |\n`;
  md += `|----------|----------|\n`;
  topPlatforms.forEach(([plat, count]) => {
    md += `| ${plat} | ${count} |\n`;
  });

  return md;
}

function generateDetailedReport(analysis) {
  let md = `# Detailed Video Analysis\n\n`;

  const sorted = analysis.videoDetails.sort((a, b) => b.length - a.length);

  sorted.forEach((video, idx) => {
    md += `## ${idx + 1}. ${video.videoId}\n\n`;
    md += `**Length:** ${(video.length / 1000).toFixed(1)}K characters | **Language:** ${video.language}\n\n`;

    if (Object.keys(video.aiModels).length > 0) {
      md += `**AI Models:**\n`;
      Object.entries(video.aiModels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([model, count]) => {
          md += `- ${model}: ${count}\n`;
        });
      md += `\n`;
    }

    if (Object.keys(video.frameworks).length > 0) {
      md += `**Frameworks:**\n`;
      Object.entries(video.frameworks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([fw, count]) => {
          md += `- ${fw}: ${count}\n`;
        });
      md += `\n`;
    }

    if (Object.keys(video.languages).length > 0) {
      md += `**Languages:**\n`;
      Object.entries(video.languages)
        .forEach(([lang, count]) => {
          md += `- ${lang}: ${count}\n`;
        });
      md += `\n`;
    }

    if (Object.keys(video.platforms).length > 0) {
      md += `**Platforms:**\n`;
      Object.entries(video.platforms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([plat, count]) => {
          md += `- ${plat}: ${count}\n`;
        });
      md += `\n`;
    }
  });

  return md;
}

function generateJSONReport(analysis) {
  return {
    metadata: {
      channel: '@oalanicolas',
      generated: new Date().toISOString(),
      videosAnalyzed: analysis.totalVideos,
      totalChars: analysis.totalChars
    },
    aiModels: analysis.aiModels,
    frameworks: analysis.frameworks,
    languages: analysis.languages,
    platforms: analysis.platforms,
    videos: analysis.videoDetails
  };
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('\n' + '='.repeat(70));
  console.log('@oalanicolas Transcripts - Advanced Analysis');
  console.log('='.repeat(70) + '\n');

  ensureDir(OUTPUT_DIR);

  // Load transcripts
  const transcripts = loadAllTranscripts();

  if (transcripts.length === 0) {
    console.error('No transcripts found to analyze');
    process.exit(1);
  }

  // Analyze
  console.log('Analyzing transcripts...\n');
  const analysis = analyzeTranscripts(transcripts);

  // Generate reports
  console.log('Generating reports...\n');

  const executiveSummary = generateExecutiveSummary(analysis);
  const detailedReport = generateDetailedReport(analysis);
  const jsonReport = generateJSONReport(analysis);

  // Save reports
  console.log('Saving reports...\n');

  const summaryPath = path.join(OUTPUT_DIR, 'EXECUTIVE-SUMMARY.md');
  fs.writeFileSync(summaryPath, executiveSummary);
  console.log(`✓ Saved: ${summaryPath}`);

  const detailedPath = path.join(OUTPUT_DIR, 'DETAILED-ANALYSIS.md');
  fs.writeFileSync(detailedPath, detailedReport);
  console.log(`✓ Saved: ${detailedPath}`);

  const jsonPath = path.join(OUTPUT_DIR, 'ANALYSIS-DATA.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`✓ Saved: ${jsonPath}`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n✓ Analyzed ${analysis.totalVideos} videos`);
  console.log(`✓ Total content: ${(analysis.totalChars / 1024 / 1024).toFixed(2)} MB`);
  console.log(`✓ AI Models detected: ${Object.keys(analysis.aiModels).length}`);
  console.log(`✓ Frameworks detected: ${Object.keys(analysis.frameworks).length}`);
  console.log(`\n📁 Reports saved to: ${OUTPUT_DIR}\n`);
}

main();
