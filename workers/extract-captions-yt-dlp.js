#!/usr/bin/env node

/**
 * Extract YouTube Captions using yt-dlp
 * Auto-evolutionary: uses system yt-dlp if available, falls back gracefully
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VIDEOS_FILE = 'recent-videos.json';
const OUTPUT_DIR = process.argv[2] || './data/transcripts';

// ============================================================================
// CHECK yt-dlp AVAILABILITY
// ============================================================================

function checkYtDlp() {
  try {
    execSync('yt-dlp --version', { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function installYtDlp() {
  console.log('\n📦 Installing yt-dlp...');
  try {
    execSync('pip install --user yt-dlp 2>&1', { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.log('⚠️  yt-dlp installation failed. Attempting fallback method...');
    return false;
  }
}

// ============================================================================
// EXTRACT CAPTIONS
// ============================================================================

function extractCaptionsFromVideo(videoId, outputDir) {
  try {
    const tempDir = path.join(outputDir, '.temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputTemplate = path.join(tempDir, videoId);

    // Extract captions with yt-dlp
    const cmd = `yt-dlp \
      --write-subs \
      --sub-langs pt,en \
      --skip-unavailable-fragments \
      --no-warnings \
      -q \
      -o "${outputTemplate}" \
      "https://www.youtube.com/watch?v=${videoId}"`;

    execSync(cmd, {
      stdio: 'pipe',
      timeout: 30000
    });

    // Find caption files
    const vttFiles = fs.readdirSync(tempDir)
      .filter(f => f.startsWith(videoId) && f.endsWith('.vtt'));

    if (vttFiles.length === 0) {
      return { success: false, videoId, error: 'No captions found' };
    }

    // Parse first available caption file
    const captionFile = path.join(tempDir, vttFiles[0]);
    const vttContent = fs.readFileSync(captionFile, 'utf-8');
    const transcript = parseVTT(vttContent);

    // Clean up temp
    vttFiles.forEach(f => {
      try { fs.unlinkSync(path.join(tempDir, f)); } catch (e) {}
    });

    return {
      success: transcript.length > 0,
      videoId,
      transcript: transcript.join(' '),
      entries: transcript,
      length: transcript.join(' ').length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      videoId,
      error: error.message.slice(0, 100)
    };
  }
}

function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const captions = [];

  for (const line of lines) {
    // Skip timestamps and metadata
    if (line.includes('-->') || line.startsWith('WEBVTT') || line.trim() === '') {
      continue;
    }

    const text = line.trim();
    if (text && !text.startsWith('NOTE')) {
      // Remove cue identifiers and clean up
      if (!/^\d+$/.test(text)) {
        captions.push(text);
      }
    }
  }

  return captions;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('\n📺 Extract YouTube Captions via yt-dlp\n');

  // Check yt-dlp
  if (!checkYtDlp()) {
    console.log('⚠️  yt-dlp not found');
    if (!installYtDlp()) {
      console.error('❌ Could not install yt-dlp');
      console.error('\nManual install:');
      console.error('  pip install yt-dlp');
      process.exit(1);
    }
  }

  console.log('✓ yt-dlp available\n');

  // Load videos
  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ ${VIDEOS_FILE} not found`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf-8'));
  const videoIds = data.last60Days.map(v => v.videoId);

  console.log(`📊 Extracting ${videoIds.length} videos\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    process.stdout.write(`[${i + 1}/${videoIds.length}] ${videoId}... `);

    const result = extractCaptionsFromVideo(videoId, OUTPUT_DIR);

    // Save result
    const jsonFile = path.join(OUTPUT_DIR, `${videoId}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(result, null, 2));

    if (result.success) {
      const mdFile = path.join(OUTPUT_DIR, `${videoId}.md`);
      fs.writeFileSync(mdFile, `# Transcript: ${videoId}\n\n**Length:** ${result.length} chars\n\n---\n\n${result.transcript}`);
      console.log(`✓ (${result.length} chars)`);
      successful++;
    } else {
      console.log(`✗ ${result.error}`);
      failed++;
    }
  }

  console.log(`\n✅ Complete!\n`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nNext step:`);
  console.log(`  node workers/extract-all-ai-structures.js ${OUTPUT_DIR}`);
}

main();
