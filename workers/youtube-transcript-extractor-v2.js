#!/usr/bin/env node

/**
 * YouTube Transcript Extractor v2 - Usar npx com youtube-captions-scraper
 *
 * Instala via npm (sem dependências do pip)
 * Funciona com captions públicas do YouTube
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// UTILITY: Run external commands
// ============================================================================

function runCommand(cmd, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`[RUN] ${cmd} ${args.join(' ')}`);

    const child = spawn(cmd, args, {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', data => stdout += data);
    child.stderr?.on('data', data => stderr += data);

    child.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed: ${stderr || stdout}`));
      }
    });

    child.on('error', reject);
  });
}

// ============================================================================
// EXTRACT: Get video IDs from YouTube channel (via HTML parsing)
// ============================================================================

async function getChannelVideoIds(channelHandle, maxResults = 20) {
  /**
   * Get video IDs from a YouTube channel using simple HEAD request
   * Works with @channelname format
   */
  console.log(`[INFO] Fetching videos from @${channelHandle}...`);

  try {
    // Use curl to fetch channel page
    const cmd = `curl -s "https://www.youtube.com/@${channelHandle}/videos" \\
      -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`;

    const result = await runCommand('bash', ['-c', cmd]);

    // Extract video IDs from JSON embedded in HTML
    const videoIds = [];
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let match;

    while ((match = regex.exec(result)) !== null && videoIds.length < maxResults) {
      if (!videoIds.includes(match[1])) {
        videoIds.push(match[1]);
      }
    }

    console.log(`[✓] Found ${videoIds.length} video(s)`);
    return videoIds;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch channel:`, error.message);
    return [];
  }
}

// ============================================================================
// EXTRACT: Download captions using youtube-captions-scraper or similar
// ============================================================================

async function getVideoCaption(videoId, lang = 'pt') {
  /**
   * Download captions for a single video
   * Uses npm package that doesn't require auth
   */
  console.log(`[INFO] Extracting captions for ${videoId} (${lang})...`);

  try {
    // Try using npx with youtube-transcript or similar
    // Fallback: use native YouTube caption API endpoint
    const captions = await fetchCaptions(videoId, lang);

    return {
      videoId,
      language: lang,
      captions: captions || [],
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`[WARN] Could not fetch captions for ${videoId}:`, error.message);
    return null;
  }
}

async function fetchCaptions(videoId, lang) {
  /**
   * Fetch captions using REST endpoint
   * Alternative: youtube-transcript-api via npm
   */
  return new Promise((resolve, reject) => {
    // Use Node.js https module
    const https = require('https');

    // Try YouTube's JSON endpoint for captions
    const url = `https://www.youtube.com/watch?v=${videoId}&hl=${lang}`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };

    https.get(url, options, (res) => {
      let html = '';

      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        try {
          // Extract captions from HTML
          // Look for caption tracks in the initial data
          const match = html.match(/"captionTracks":\[(.*?)\]/);

          if (match) {
            const captions = JSON.parse(`[${match[1]}]`);
            console.log(`[✓] Found ${captions.length} caption track(s)`);

            // For now, return the track URL (can be downloaded separately)
            resolve(captions.map(c => ({
              language: c.languageCode,
              name: c.name?.simpleText || '',
              baseUrl: c.baseUrl
            })));
          } else {
            console.warn(`[WARN] No captions found in HTML`);
            resolve([]);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// ============================================================================
// PROCESS: Convert and structure transcripts
// ============================================================================

async function downloadCaptionText(captionUrl) {
  /**
   * Download actual caption text from YouTube's caption URL
   */
  return new Promise((resolve) => {
    const https = require('https');

    https.get(captionUrl, (res) => {
      let xml = '';

      res.on('data', chunk => xml += chunk);
      res.on('end', () => {
        try {
          const captions = parseXmlCaptions(xml);
          resolve(captions);
        } catch (error) {
          console.warn(`[WARN] Could not parse captions:`, error.message);
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function parseXmlCaptions(xml) {
  /**
   * Parse YouTube's XML caption format
   */
  const captions = [];
  const regex = /<text start="([\d.]+)"[^>]*>(.*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    captions.push({
      timestamp: parseFloat(match[1]),
      text: decodeHTMLEntities(match[2])
    });
  }

  return captions;
}

function decodeHTMLEntities(text) {
  const map = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&#39;': "'", '&apos;': "'"
  };
  return text.replace(/&[a-z]+;/gi, m => map[m] || m);
}

// ============================================================================
// SAVE: Structure and export results
// ============================================================================

function saveTranscriptResults(data, outputDir) {
  /**
   * Save transcripts in multiple formats
   */
  if (!data || data.captions.length === 0) return null;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const videoId = data.videoId;
  const timestamp = new Date().toISOString().split('T')[0];

  const files = {};

  // JSON format
  files.json = path.join(outputDir, `${videoId}.json`);
  fs.writeFileSync(files.json, JSON.stringify(data, null, 2));
  console.log(`[✓] Saved: ${files.json}`);

  // Markdown format
  files.md = path.join(outputDir, `${videoId}.md`);
  const mdContent = `# Video: ${videoId}\n\n**Language:** ${data.language}\n**Fetched:** ${data.fetchedAt}\n\n---\n\n${
    data.captions.map(c => `[${formatTime(c.timestamp)}] ${c.text}`).join('\n')
  }`;
  fs.writeFileSync(files.md, mdContent);
  console.log(`[✓] Saved: ${files.md}`);

  // Plain text format
  files.txt = path.join(outputDir, `${videoId}.txt`);
  const txtContent = data.captions.map(c => c.text).join(' ');
  fs.writeFileSync(files.txt, txtContent);
  console.log(`[✓] Saved: ${files.txt}`);

  return files;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================================================================
// INSTALL: NPM dependency if needed
// ============================================================================

async function ensureYoutubeDependency() {
  /**
   * Check and install youtube-transcript or youtube-captions-scraper if needed
   */
  console.log('[CHECK] Verifying YouTube scraper library...');

  try {
    require.resolve('youtube-transcript-api');
    console.log('[✓] youtube-transcript-api already installed');
    return true;
  } catch (e) {
    console.log('[INFO] Installing youtube-transcript-api...');

    try {
      await runCommand('npm', ['install', '-g', 'youtube-transcript-api']);
      console.log('[✓] youtube-transcript-api installed');
      return true;
    } catch (error) {
      console.warn('[WARN] Could not install youtube-transcript-api globally');
      console.warn('[INFO] Will attempt alternative methods...');
      return false;
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
YouTube Transcript Extractor v2

Usage:
  node workers/youtube-transcript-extractor-v2.js <videoId|@channel> [outputDir] [lang]

Examples:
  # Single video
  node workers/youtube-transcript-extractor-v2.js JeT6byYruXs ./transcripts pt

  # Entire channel (last 20 videos)
  node workers/youtube-transcript-extractor-v2.js @oalanicolas ./transcripts pt

Options:
  videoId    - YouTube video ID (11 chars) or @channelname
  outputDir  - Output directory (default: ./transcripts)
  lang       - Language code (default: pt for Portuguese)

Features:
  ✓ No authentication required
  ✓ Extracts public captions
  ✓ Saves as JSON, Markdown, Text
  ✓ Can process entire channels
  ✓ Rate-limited to avoid blocking
    `);
    process.exit(0);
  }

  const input = args[0];
  const outputDir = args[1] || './transcripts';
  const lang = args[2] || 'pt';

  console.log(`\n[START] YouTube Transcript Extractor v2`);
  console.log(`Input: ${input}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Language: ${lang}\n`);

  try {
    let videoIds = [];

    // Parse input
    if (input.startsWith('@')) {
      // Channel name
      const channelHandle = input.substring(1);
      videoIds = await getChannelVideoIds(channelHandle);
    } else if (input.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(input)) {
      // Video ID
      videoIds = [input];
    } else {
      console.error('[ERROR] Invalid input. Use video ID or @channelname');
      process.exit(1);
    }

    if (videoIds.length === 0) {
      console.error('[ERROR] No videos found');
      process.exit(1);
    }

    // Process each video
    const results = [];
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      console.log(`\n[${i + 1}/${videoIds.length}] Processing ${videoId}...`);

      const data = await getVideoCaption(videoId, lang);

      if (data && data.captions.length > 0) {
        const saved = saveTranscriptResults(data, outputDir);
        if (saved) results.push({ videoId, ...saved });
      }

      // Rate limiting
      if (i < videoIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Save index
    const indexPath = path.join(outputDir, 'INDEX.json');
    fs.writeFileSync(indexPath, JSON.stringify({
      extracted: new Date().toISOString(),
      count: results.length,
      language: lang,
      videos: results
    }, null, 2));

    console.log(`\n[✓] Complete!`);
    console.log(`[✓] Processed: ${results.length}/${videoIds.length} videos`);
    console.log(`[✓] Index: ${indexPath}`);
  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

main();
