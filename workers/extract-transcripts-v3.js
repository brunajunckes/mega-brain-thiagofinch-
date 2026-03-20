#!/usr/bin/env node

/**
 * Extract YouTube Transcripts via Public YouTube API
 * Auto-evolutionary: no external dependencies, pure Node.js
 *
 * Approach: Use YouTube's captions.googleapis.com endpoint
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const VIDEOS_FILE = 'recent-videos.json';
const OUTPUT_DIR = process.argv[2] || './data/transcripts';

// ============================================================================
// YOUTUBE CAPTION EXTRACTION
// ============================================================================

function fetchCaptions(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const options = {
      hostname: 'www.youtube.com',
      path: `/watch?v=${videoId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    };

    https.get(options, (res) => {
      let html = '';

      res.on('data', chunk => {
        html += chunk;
      });

      res.on('end', () => {
        // Extract caption tracks from page source
        const captionRegex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(captionRegex);

        if (match) {
          try {
            const tracks = JSON.parse(match[1]);
            // Get Portuguese or any available caption
            const track = tracks.find(t => t.languageCode?.includes('pt')) ||
                         tracks.find(t => t.languageCode?.includes('en')) ||
                         tracks[0];

            if (track && track.baseUrl) {
              fetchCaptionXML(track.baseUrl, videoId, resolve);
              return;
            }
          } catch (e) {
            // Continue
          }
        }

        // No captions found
        resolve({
          success: false,
          videoId,
          error: 'No captions found',
          timestamp: new Date().toISOString()
        });
      });
    }).on('error', () => {
      resolve({
        success: false,
        videoId,
        error: 'Network error',
        timestamp: new Date().toISOString()
      });
    });
  });
}

function fetchCaptionXML(captionUrl, videoId, callback) {
  const url = new URL(captionUrl);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    },
    timeout: 5000
  };

  https.get(options, (res) => {
    let xml = '';

    res.on('data', chunk => {
      xml += chunk;
    });

    res.on('end', () => {
      const transcript = parseXMLCaptions(xml);

      callback({
        success: transcript.length > 0,
        videoId,
        transcript: transcript.join(' '),
        entries: transcript,
        length: transcript.join(' ').length,
        timestamp: new Date().toISOString()
      });
    });
  }).on('error', () => {
    callback({
      success: false,
      videoId,
      error: 'Caption download failed',
      timestamp: new Date().toISOString()
    });
  });
}

function parseXMLCaptions(xml) {
  const textRegex = /<text[^>]*>([^<]+)<\/text>/g;
  const captions = [];
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    // Decode HTML entities
    let text = match[1];
    text = text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));

    if (text.trim()) {
      captions.push(text);
    }
  }

  return captions;
}

function loadVideoIds() {
  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ ${VIDEOS_FILE} not found`);
    console.error('Run: node workers/fetch-last-2months.js @oalanicolas');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf-8'));
  return data.last60Days.map(v => v.videoId);
}

function saveTranscript(data, videoId) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const jsonFile = path.join(OUTPUT_DIR, `${videoId}.json`);
  const mdFile = path.join(OUTPUT_DIR, `${videoId}.md`);

  // Save JSON
  fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

  // Save Markdown
  if (data.success) {
    fs.writeFileSync(mdFile, `# Transcript: ${videoId}\n\n**Length:** ${data.length} chars\n\n---\n\n${data.transcript}`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n📺 Extract YouTube Transcripts (Last 2 Months)\n');
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const videoIds = loadVideoIds();
  console.log(`📊 Videos to extract: ${videoIds.length}\n`);

  let successful = 0;
  let failed = 0;

  for (let idx = 0; idx < videoIds.length; idx++) {
    const videoId = videoIds[idx];
    process.stdout.write(`[${idx + 1}/${videoIds.length}] ${videoId}... `);

    const data = await fetchCaptions(videoId);
    saveTranscript(data, videoId);

    if (data.success) {
      console.log(`✓ (${data.length} chars)`);
      successful++;
    } else {
      console.log(`✗ ${data.error}`);
      failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ Complete!\n`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nNext step:`);
  console.log(`  node workers/extract-all-ai-structures.js ${OUTPUT_DIR}`);
}

main().catch(console.error);
