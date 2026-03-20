#!/usr/bin/env node

/**
 * Complete Mapping: @oalanicolas Channel
 * Extracts & analyzes:
 * - All videos (last 60 days)
 * - AI tools usage
 * - Guest information
 * - Architecture patterns
 *
 * Output: Comprehensive markdown reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIG
// ============================================================================

const CHANNEL = '@oalanicolas';
const VIDEOS_FILE = 'recent-videos.json';
const OUTPUT_DIR = './data/analysis/oalanicolas';
const TRANSCRIPTS_DIR = './data/transcripts';

// AI Models to detect
const AI_MODELS = [
  'ChatGPT', 'GPT-4', 'GPT-3.5', 'Claude', 'Gemini', 'Llama',
  'Ollama', 'OpenAI', 'Anthropic', 'Mistral', 'Cohere',
  'Groq', 'Falcon', 'Alpaca', 'Vicuna'
];

// Common guest names and platforms to detect
const GUEST_PATTERNS = [
  'with ', 'feat. ', 'ft. ', 'featuring',
  'interview', 'talk with', 'conversation'
];

// ============================================================================
// INITIALIZATION
// ============================================================================

function initialize() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('\n🚀 OALANICOLAS COMPLETE MAPPING\n');
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
}

// ============================================================================
// LOAD VIDEO LIST
// ============================================================================

function loadVideos() {
  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ ${VIDEOS_FILE} not found`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
  return data.last60Days || [];
}

// ============================================================================
// LOAD TRANSCRIPTS
// ============================================================================

function loadTranscripts() {
  const transcripts = {};

  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    console.log('⚠️  No transcripts folder yet. Creating mapping from video list...\n');
    return transcripts;
  }

  const files = fs.readdirSync(TRANSCRIPTS_DIR)
    .filter(f => f.endsWith('.json'))
    .slice(0, 41);  // Limit to 41 videos

  console.log(`📖 Found ${files.length} transcript files\n`);

  files.forEach((file, idx) => {
    try {
      const data = JSON.parse(
        fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf8')
      );
      if (data.success && data.transcript) {
        const videoId = file.replace('.json', '');
        transcripts[videoId] = data.transcript;
      }
    } catch (e) {
      // Skip on error
    }
  });

  return transcripts;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function detectAIModels(text) {
  const detected = {};
  const lowerText = text.toLowerCase();

  AI_MODELS.forEach(model => {
    const count = (lowerText.match(new RegExp(model.toLowerCase(), 'g')) || []).length;
    if (count > 0) {
      detected[model] = count;
    }
  });

  return detected;
}

function detectGuests(title, text) {
  const guests = [];
  const lowerTitle = title.toLowerCase();
  const lowerText = text.toLowerCase();

  // Simple heuristic: look for patterns
  GUEST_PATTERNS.forEach(pattern => {
    if (lowerTitle.includes(pattern)) {
      // Try to extract name after pattern
      const match = lowerTitle.match(new RegExp(`${pattern}\\s+([A-Za-z\\s]+?)\\s*(?:\\||$)`));
      if (match && match[1]) {
        guests.push(match[1].trim());
      }
    }
  });

  return [...new Set(guests)];  // Remove duplicates
}

function extractFrameworks(text) {
  const frameworks = {};

  // Detect common patterns/frameworks
  const patterns = {
    'AIOX': /aiox/gi,
    'Agents': /agents?/gi,
    'Workflows': /workflows?/gi,
    'Prompting': /prompts?/gi,
    'RAG': /rag|retrieval/gi,
    'Embeddings': /embeddings?/gi,
    'Fine-tuning': /fine-tun/gi,
    'Integration': /integrat/gi,
    'Automation': /automat/gi,
    'API': /api[s]?/gi
  };

  Object.entries(patterns).forEach(([name, regex]) => {
    const matches = text.match(regex);
    if (matches) {
      frameworks[name] = matches.length;
    }
  });

  return frameworks;
}

// ============================================================================
// GENERATE REPORTS
// ============================================================================

function generateChannelMapping(videos, transcripts) {
  let md = `# ${CHANNEL} - Complete Channel Mapping\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Videos analyzed:** ${videos.length}\n`;
  md += `**Transcripts available:** ${Object.keys(transcripts).length}\n\n`;

  md += `## 📊 Videos List\n\n`;
  md += `| # | Video ID | Days Ago | Has Transcript |\n`;
  md += `|---|----------|----------|----------------|\n`;

  videos.forEach((video, idx) => {
    const hasTranscript = transcripts[video.videoId] ? '✅' : '❌';
    md += `| ${idx + 1} | ${video.videoId} | ${video.daysAgo.toFixed(1)} | ${hasTranscript} |\n`;
  });

  return md;
}

function generateAIMapping(transcripts) {
  let md = `# AI Tools Usage Mapping\n\n`;
  md += `**Complete analysis of AI tools mentioned in ${CHANNEL} channel**\n\n`;

  const aiAggregate = {};
  const videoAI = [];

  Object.entries(transcripts).forEach(([videoId, text]) => {
    const detected = detectAIModels(text);
    if (Object.keys(detected).length > 0) {
      videoAI.push({
        videoId,
        models: detected
      });

      // Aggregate
      Object.entries(detected).forEach(([model, count]) => {
        aiAggregate[model] = (aiAggregate[model] || 0) + count;
      });
    }
  });

  md += `## 📊 AI Models Summary\n\n`;
  const sorted = Object.entries(aiAggregate)
    .sort((a, b) => b[1] - a[1]);

  md += `| AI Model | Mentions |\n`;
  md += `|----------|----------|\n`;
  sorted.forEach(([model, count]) => {
    md += `| ${model} | ${count} |\n`;
  });

  md += `\n## 🎯 By Video\n\n`;
  videoAI.forEach(({videoId, models}) => {
    md += `### ${videoId}\n`;
    Object.entries(models).forEach(([model, count]) => {
      md += `- **${model}**: ${count} mentions\n`;
    });
    md += `\n`;
  });

  return md;
}

function generateGuestMapping(videos, transcripts) {
  let md = `# Guest Expertise & AI Usage\n\n`;

  const guestMap = {};

  videos.forEach((video, idx) => {
    const guests = detectGuests(
      `Video ${idx}`,  // Fallback title
      transcripts[video.videoId] || ''
    );

    guests.forEach(guest => {
      if (!guestMap[guest]) {
        guestMap[guest] = {
          appearances: 0,
          aisUsed: {},
          topics: []
        };
      }
      guestMap[guest].appearances++;
    });
  });

  md += `## 👥 Guest Network\n\n`;
  md += `| Guest | Appearances | AI Tools | Topics |\n`;
  md += `|-------|-------------|----------|--------|\n`;

  Object.entries(guestMap).forEach(([guest, data]) => {
    const aiTools = Object.keys(data.aisUsed).join(', ') || '-';
    md += `| ${guest} | ${data.appearances} | ${aiTools} | ${data.topics.join(', ') || '-'} |\n`;
  });

  return md;
}

function generateFrameworksReport(transcripts) {
  let md = `# Frameworks & Patterns Detected\n\n`;

  const frameworkAggregate = {};

  Object.entries(transcripts).forEach(([videoId, text]) => {
    const frameworks = extractFrameworks(text);
    Object.entries(frameworks).forEach(([name, count]) => {
      frameworkAggregate[name] = (frameworkAggregate[name] || 0) + count;
    });
  });

  md += `## 📚 Framework Mentions\n\n`;
  const sorted = Object.entries(frameworkAggregate)
    .sort((a, b) => b[1] - a[1]);

  md += `| Framework | Mentions |\n`;
  md += `|-----------|----------|\n`;
  sorted.forEach(([name, count]) => {
    md += `| ${name} | ${count} |\n`;
  });

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  initialize();

  console.log('📥 Loading data...');
  const videos = loadVideos();
  const transcripts = loadTranscripts();

  console.log(`✅ Loaded ${videos.length} videos`);
  console.log(`✅ Loaded ${Object.keys(transcripts).length} transcripts\n`);

  // Generate reports
  console.log('🔍 Analyzing...\n');

  const channelMapping = generateChannelMapping(videos, transcripts);
  const aiMapping = generateAIMapping(transcripts);
  const guestMapping = generateGuestMapping(videos, transcripts);
  const frameworksReport = generateFrameworksReport(transcripts);

  // Save reports
  console.log('💾 Saving reports...\n');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'OALANICOLAS-CHANNEL-MAPPING.md'),
    channelMapping
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'AI-TOOLS-USAGE-MAPPING.md'),
    aiMapping
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'GUESTS-EXPERTISE-TABLE.md'),
    guestMapping
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'FRAMEWORKS-PATTERNS.md'),
    frameworksReport
  );

  // Summary
  console.log('✅ COMPLETE MAPPING FINISHED!\n');
  console.log('📄 Generated files:');
  console.log(`   ✓ OALANICOLAS-CHANNEL-MAPPING.md`);
  console.log(`   ✓ AI-TOOLS-USAGE-MAPPING.md`);
  console.log(`   ✓ GUESTS-EXPERTISE-TABLE.md`);
  console.log(`   ✓ FRAMEWORKS-PATTERNS.md`);
  console.log(`\n📁 Location: ${OUTPUT_DIR}\n`);
}

main();
