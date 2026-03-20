#!/usr/bin/env node

/**
 * Extract YouTube Captions (Direct Method)
 *
 * How it works:
 * 1. YouTube page contains player response JSON
 * 2. Player response has captions URL
 * 3. Direct fetch of caption XML
 * 4. Convert to text
 *
 * Zero API key, zero auth, pure HTTP
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIG
// ============================================================================

const VIDEOS_FILE = 'recent-videos.json';
const OUTPUT_DIR = './data/transcripts';
const DELAY = 1000;  // 1 second between requests

// ============================================================================
// FETCH WITH TIMEOUT
// ============================================================================

function fetchUrl(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout'));
    }, timeout);

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      clearTimeout(timeoutId);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

// ============================================================================
// EXTRACT CAPTION URL FROM PLAYER RESPONSE
// ============================================================================

async function getCaptionUrl(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const html = await fetchUrl(url);

    // Find player response JSON
    const match = html.match(/"captionTracks":\s*\[([^\]]+)\]/);
    if (!match) return null;

    // Parse first caption track
    const tracks = match[1];
    const urlMatch = tracks.match(/"baseUrl":"([^"]+)"/);
    if (!urlMatch) return null;

    return urlMatch[1].replace(/\\u0026/g, '&');
  } catch (e) {
    return null;
  }
}

// ============================================================================
// EXTRACT TEXT FROM CAPTION XML
// ============================================================================

function parseCaption(xml) {
  const texts = [];
  const regex = /<text[^>]*>([^<]+)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    if (text) texts.push(text);
  }

  return texts.join(' ');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n📺 Extract YouTube Captions (Direct Method)\n');

  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ ${VIDEOS_FILE} not found`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
  const videos = data.last60Days.slice(0, 41);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`📊 Videos to extract: ${videos.length}\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const videoId = video.videoId;

    process.stdout.write(`[${i + 1}/${videos.length}] ${videoId}... `);

    try {
      // Get caption URL
      const captionUrl = await getCaptionUrl(videoId);
      if (!captionUrl) {
        console.log('❌ No captions');
        failed++;
        await new Promise(r => setTimeout(r, DELAY));
        continue;
      }

      // Download caption XML
      const xml = await fetchUrl(captionUrl);
      const text = parseCaption(xml);

      if (!text) {
        console.log('❌ Empty captions');
        failed++;
        await new Promise(r => setTimeout(r, DELAY));
        continue;
      }

      // Save as JSON
      const outputPath = path.join(OUTPUT_DIR, `${videoId}.json`);
      fs.writeFileSync(outputPath, JSON.stringify({
        videoId,
        success: true,
        text,
        length: text.length,
        timestamp: new Date().toISOString()
      }, null, 2));

      console.log(`✅ ${(text.length / 1000).toFixed(1)}KB`);
      success++;

      // Polite rate limit
      await new Promise(r => setTimeout(r, DELAY));
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
      await new Promise(r => setTimeout(r, DELAY));
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  📁 Output: ${OUTPUT_DIR}\n`);
}

main();
