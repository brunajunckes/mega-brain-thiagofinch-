#!/usr/bin/env node

/**
 * YouTube Transcript Extractor Worker
 * Automaticamente baixa e processa transcrições do YouTube
 * Uso: node workers/youtube-transcript-extractor.js [channelUrl|videoUrl] [output-dir]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================================
// STEP 1: Extract video IDs from channel or individual video
// ============================================================================

async function getChannelVideos(channelUrl) {
  /**
   * Extract latest video IDs from a YouTube channel.
   * Works with URLs like: youtube.com/@channelname or youtube.com/channel/CHANNELID
   */
  console.log(`[INFO] Fetching videos from channel: ${channelUrl}`);

  try {
    // Handle different URL formats
    let channelId = channelUrl;

    if (channelUrl.includes('@')) {
      // @channelname format - need to resolve to channel ID
      const channelHandle = channelUrl.split('@')[1];
      console.log(`[INFO] Resolving handle @${channelHandle} to channel ID...`);

      // Simple approach: use YouTube's channel page to extract video IDs
      const videoIds = await scrapeChannelVideos(channelUrl);
      return videoIds;
    } else if (channelUrl.includes('youtube.com/channel/')) {
      // Standard channel URL
      channelId = channelUrl.split('youtube.com/channel/')[1];
    }

    return [];
  } catch (error) {
    console.error(`[ERROR] Failed to get channel videos:`, error.message);
    return [];
  }
}

async function scrapeChannelVideos(channelUrl, maxResults = 30) {
  /**
   * Scrape video IDs from channel using simple HTML parsing.
   * Returns array of video IDs.
   */
  return new Promise((resolve, reject) => {
    https.get(channelUrl, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Extract video IDs from the HTML
          // Look for patterns like "watch?v=XXXXX" or "/watch?v=XXXXX"
          const videoIds = [];
          const regex = /(?:youtu\.be\/|watch\?v=|\/video\/)([a-zA-Z0-9_-]{11})/g;
          let match;

          while ((match = regex.exec(data)) !== null && videoIds.length < maxResults) {
            const videoId = match[1];
            if (!videoIds.includes(videoId)) {
              videoIds.push(videoId);
            }
          }

          console.log(`[INFO] Found ${videoIds.length} video IDs`);
          resolve(videoIds);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// ============================================================================
// STEP 2: Get transcript using InnerTube API (no auth required)
// ============================================================================

async function getTranscript(videoId, lang = 'pt') {
  /**
   * Get transcript for a video using YouTube's InnerTube API.
   * No authentication required - uses public API endpoint.
   */
  console.log(`[INFO] Fetching transcript for video: ${videoId} (lang: ${lang})`);

  try {
    // Get captions JSON from YouTube
    const captionsJson = await getCaptions(videoId);

    if (!captionsJson || !captionsJson.captions) {
      console.warn(`[WARN] No captions found for ${videoId}`);
      return null;
    }

    // Find transcript in requested language
    const transcript = findTranscript(captionsJson, lang);

    if (!transcript) {
      console.warn(`[WARN] No ${lang} transcript found for ${videoId}`);
      return null;
    }

    return {
      videoId,
      language: lang,
      title: captionsJson.videoDetails?.title || 'Unknown',
      duration: captionsJson.videoDetails?.lengthSeconds || '0',
      captions: transcript
    };
  } catch (error) {
    console.error(`[ERROR] Failed to get transcript for ${videoId}:`, error.message);
    return null;
  }
}

async function getCaptions(videoId) {
  /**
   * Fetch captions metadata from YouTube using InnerTube API.
   * Returns JSON with caption tracks and video metadata.
   */
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      context: {
        client: { clientName: 'WEB', clientVersion: '2.20240101.00.00' }
      },
      videoId: videoId
    });

    const options = {
      hostname: 'www.youtube.com',
      path: '/youtubei/v1/get_transcript',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          // Fallback: try alternative endpoint
          getTranscriptAlternative(videoId).then(resolve).catch(reject);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getTranscriptAlternative(videoId) {
  /**
   * Alternative method: Extract transcript from initial data in video page.
   * More reliable than InnerTube API.
   */
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Extract captions from initial data
          const match = data.match(/"captions":(\{[^}]*\})/);
          if (match) {
            const captions = JSON.parse(match[1]);
            resolve({ captions });
          } else {
            resolve({ captions: null });
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function findTranscript(captionsJson, lang = 'pt') {
  /**
   * Find transcript track in requested language from captions JSON.
   */
  if (!captionsJson.captions || !captionsJson.captions.playerCaptionsTracklistRenderer) {
    return null;
  }

  const tracks = captionsJson.captions.playerCaptionsTracklistRenderer.captionTracks || [];

  // Try exact language match first
  let track = tracks.find(t => t.languageCode.startsWith(lang));

  // Fallback to English if not found
  if (!track) {
    track = tracks.find(t => t.languageCode.startsWith('en'));
  }

  // Use first available if still not found
  if (!track && tracks.length > 0) {
    track = tracks[0];
  }

  return track?.baseUrl ? track.baseUrl : null;
}

// ============================================================================
// STEP 3: Process and structure transcript
// ============================================================================

async function processTranscript(transcriptUrl) {
  /**
   * Download and parse transcript from YouTube's caption URL.
   */
  if (!transcriptUrl) return null;

  return new Promise((resolve, reject) => {
    https.get(transcriptUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Parse XML response
          const captions = parseTranscriptXml(data);
          resolve(captions);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function parseTranscriptXml(xml) {
  /**
   * Parse YouTube's XML transcript format.
   * Extract text and timestamps.
   */
  const captions = [];
  const regex = /<text start="([\d.]+)"[^>]*>(.*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    captions.push({
      timestamp: parseFloat(match[1]),
      text: decodeHTML(match[2])
    });
  }

  return captions;
}

function decodeHTML(text) {
  /**
   * Decode HTML entities in caption text.
   */
  const htmlDecoder = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };

  return text.replace(/&[a-z]+;/gi, match => htmlDecoder[match] || match);
}

// ============================================================================
// STEP 4: Save and structure output
// ============================================================================

function saveTranscript(transcript, outputDir) {
  /**
   * Save transcript to JSON and markdown files.
   */
  if (!transcript) return null;

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const videoId = transcript.videoId;
    const timestamp = new Date().toISOString().split('T')[0];

    // Save as JSON
    const jsonPath = path.join(outputDir, `${videoId}-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2));
    console.log(`[✓] Saved JSON: ${jsonPath}`);

    // Save as Markdown
    const mdPath = path.join(outputDir, `${videoId}-${timestamp}.md`);
    const mdContent = transcriptToMarkdown(transcript);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`[✓] Saved Markdown: ${mdPath}`);

    // Save as plain text
    const txtPath = path.join(outputDir, `${videoId}-${timestamp}.txt`);
    const txtContent = transcript.captions
      .map(c => c.text)
      .join(' ')
      .trim();
    fs.writeFileSync(txtPath, txtContent);
    console.log(`[✓] Saved Text: ${txtPath}`);

    return { jsonPath, mdPath, txtPath };
  } catch (error) {
    console.error(`[ERROR] Failed to save transcript:`, error.message);
    return null;
  }
}

function transcriptToMarkdown(transcript) {
  /**
   * Convert transcript to readable markdown format.
   */
  let md = `# ${transcript.title}\n\n`;
  md += `**Video ID:** ${transcript.videoId}\n`;
  md += `**Language:** ${transcript.language}\n`;
  md += `**Duration:** ${transcript.duration}s\n`;
  md += `**Extracted:** ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  // Group captions by time sections (every 30 seconds)
  let section = '';
  let sectionTime = 0;

  for (const caption of transcript.captions) {
    if (caption.timestamp - sectionTime >= 30) {
      if (section) {
        md += `**[${formatTime(sectionTime)}]**\n${section.trim()}\n\n`;
      }
      sectionTime = caption.timestamp;
      section = '';
    }
    section += caption.text + ' ';
  }

  if (section) {
    md += `**[${formatTime(sectionTime)}]**\n${section.trim()}\n`;
  }

  return md;
}

function formatTime(seconds) {
  /**
   * Convert seconds to MM:SS format.
   */
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
YouTube Transcript Extractor

Usage:
  node workers/youtube-transcript-extractor.js <videoId|channelUrl> [outputDir] [lang]

Examples:
  node workers/youtube-transcript-extractor.js JeT6byYruXs
  node workers/youtube-transcript-extractor.js youtube.com/@oalanicolas ./transcripts pt
  node workers/youtube-transcript-extractor.js https://www.youtube.com/watch?v=abc123 ./out en

Output:
  - Saves transcripts in JSON, Markdown, and Text formats
  - Creates index file with metadata
  - Ready for further processing
    `);
    process.exit(0);
  }

  const input = args[0];
  const outputDir = args[1] || './transcripts';
  const lang = args[2] || 'pt';

  console.log('[START] YouTube Transcript Extractor');
  console.log(`Input: ${input}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Language: ${lang}\n`);

  try {
    // Determine if input is video ID or channel URL
    let videoIds = [];

    if (input.includes('youtube.com') || input.includes('youtu.be')) {
      // Extract video ID from URL
      const match = input.match(/(?:youtu\.be\/|watch\?v=|\/video\/)([a-zA-Z0-9_-]{11})/);
      if (match) {
        videoIds = [match[1]];
      } else if (input.includes('@') || input.includes('/channel/')) {
        // It's a channel URL
        videoIds = await getChannelVideos(input);
      }
    } else if (input.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(input)) {
      // It's a video ID
      videoIds = [input];
    } else {
      console.error('[ERROR] Invalid input. Must be video ID, YouTube URL, or channel URL');
      process.exit(1);
    }

    if (videoIds.length === 0) {
      console.error('[ERROR] No video IDs found');
      process.exit(1);
    }

    console.log(`[INFO] Processing ${videoIds.length} video(s)\n`);

    const results = [];
    for (const videoId of videoIds) {
      const transcript = await getTranscript(videoId, lang);

      if (transcript) {
        const saved = saveTranscript(transcript, outputDir);
        if (saved) {
          results.push({ videoId, ...saved });
        }
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save index
    const indexPath = path.join(outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify({
      extracted: new Date().toISOString(),
      language: lang,
      count: results.length,
      videos: results
    }, null, 2));

    console.log(`\n[✓] Complete! Saved ${results.length} transcript(s)`);
    console.log(`[✓] Index saved to: ${indexPath}`);
  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

main();
