#!/usr/bin/env node

/**
 * Extract ALL 41 @oalanicolas YouTube Transcripts
 * Batch processing with native YouTube caption extraction
 * No external APIs or authentication required
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIG
// ============================================================================

const VIDEO_IDS = [
  "gEUtUdqiAyk", "pqtLLYyztc8", "GOMj4OUP4Es", "TNNkBTuEcEw", "k5GmoaiSQ4g",
  "PgQVdfFJNX8", "8XAeBgIq7Ms", "5agcA_m0-Bk", "_X6UGXmgijM", "JeT6byYruXs",
  "M8ntFI1v2NY", "lkRB43U2jbw", "Ut4ecAzE7o8", "tAcKxn1crOc", "WZPyIbxjNHc",
  "d4xLP-GxJMM", "tUeejX6BEC0", "Zdjy4DRoDTE", "oEtJVbwR1Fk", "ik5JOtIH2D8",
  "R5MElc0DV28", "9UjshLhT8aE", "qnC7rfjkH2c", "CHwoLLLAWAw", "1SnUpdFLO5c",
  "HIzL0oilejU", "n6ETmqs-Mp8", "86qD7miH5V4", "WcnnVl9wVbU", "ngpkUlZGXQk",
  "OOuzaxQWYKs", "JE0KQrSBqIs", "MkGlXlIxF34", "fX_z8qoifRQ", "_VQZQ_jHmhA",
  "mH05OcE7rQQ", "6Qu3Uh0qCgg", "lc7U1TdaeWI", "nyQZNWyEU_I", "IhEU9Zg5vgw",
  "MaHEr_TaCxU"
];

const OUTPUT_DIR = process.argv[2] || './data/transcripts-apify';
const BATCH_DELAY = 1500; // ms between requests (avoid rate limiting)
const TIMEOUT = 10000; // ms per request

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(prefix, message) {
  console.log(`[${prefix}] ${message}`);
}

function logSuccess(message) {
  log('✓', message);
}

function logError(message) {
  log('✗', message);
}

function logInfo(message) {
  log('ℹ', message);
}

// ============================================================================
// YOUTUBE CAPTION EXTRACTION
// ============================================================================

function fetchPageHTML(videoId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.youtube.com',
      path: `/watch?v=${videoId}&hl=pt`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: TIMEOUT
    };

    const req = https.request(options, (res) => {
      let html = '';

      res.on('data', chunk => {
        html += chunk;
        // Prevent memory bloat
        if (html.length > 10 * 1024 * 1024) {
          req.abort();
          reject(new Error('Response too large'));
        }
      });

      res.on('end', () => {
        resolve(html);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function extractCaptionTracks(html) {
  try {
    // Look for captionTracks in the page HTML
    const match = html.match(/"captionTracks":\s*(\[.*?\])/);

    if (!match) {
      return null;
    }

    const tracks = JSON.parse(match[1]);

    // Prefer Portuguese, fallback to English
    let selectedTrack = tracks.find(t =>
      t.languageCode && (t.languageCode.startsWith('pt') || t.languageCode === 'pt')
    );

    if (!selectedTrack) {
      selectedTrack = tracks.find(t =>
        t.languageCode && t.languageCode.startsWith('en')
      );
    }

    if (!selectedTrack && tracks.length > 0) {
      selectedTrack = tracks[0];
    }

    return selectedTrack;
  } catch (e) {
    return null;
  }
}

function fetchCaptionXML(captionUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(captionUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: TIMEOUT
    };

    const req = https.request(options, (res) => {
      let xml = '';

      res.on('data', chunk => {
        xml += chunk;
      });

      res.on('end', () => {
        resolve(xml);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Caption fetch timeout'));
    });

    req.end();
  });
}

function parseXMLCaptions(xml) {
  const captions = [];
  const regex = /<text start="([\d.]+)"[^>]*duration="([\d.]+)"[^>]*>(.*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const timestamp = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = decodeHTMLEntities(match[3]);

    if (text.trim()) {
      captions.push({
        start: timestamp,
        duration: duration,
        text: text
      });
    }
  }

  return captions;
}

function decodeHTMLEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#10;': '\n',
    '&#xa;': '\n'
  };

  return text.replace(/&[a-z]+;|&#?\w+;/gi, m => entities[m] || m);
}

function buildTranscript(captions) {
  return captions.map(c => c.text).join(' ');
}

// ============================================================================
// EXTRACT SINGLE VIDEO
// ============================================================================

async function extractVideoTranscript(videoId) {
  try {
    logInfo(`Fetching page for ${videoId}...`);

    const html = await fetchPageHTML(videoId);
    const track = extractCaptionTracks(html);

    if (!track || !track.baseUrl) {
      return {
        success: false,
        videoId,
        error: 'No captions found or no baseUrl',
        timestamp: new Date().toISOString()
      };
    }

    logInfo(`Found ${track.languageCode} captions for ${videoId}`);

    const xml = await fetchCaptionXML(track.baseUrl);
    const captions = parseXMLCaptions(xml);

    if (captions.length === 0) {
      return {
        success: false,
        videoId,
        error: 'Could not parse captions',
        timestamp: new Date().toISOString()
      };
    }

    const transcript = buildTranscript(captions);

    return {
      success: true,
      videoId,
      language: track.languageCode || 'unknown',
      languageName: track.name?.simpleText || track.languageCode,
      captionCount: captions.length,
      transcript: transcript,
      length: transcript.length,
      captions: captions,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      videoId,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// SAVE RESULTS
// ============================================================================

function saveResults(results) {
  ensureDir(OUTPUT_DIR);

  const summary = {
    extracted: new Date().toISOString(),
    totalProcessed: results.length,
    totalSuccess: results.filter(r => r.success).length,
    totalFailed: results.filter(r => !r.success).length,
    videos: []
  };

  results.forEach(result => {
    if (result.success) {
      // Save individual transcript
      const jsonFile = path.join(OUTPUT_DIR, `${result.videoId}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(result, null, 2));

      // Save markdown
      const mdFile = path.join(OUTPUT_DIR, `${result.videoId}.md`);
      const mdContent = `# Transcript: ${result.videoId}

**Language:** ${result.languageName || result.language}
**Captions:** ${result.captionCount}
**Length:** ${result.length} characters
**Extracted:** ${result.timestamp}

---

${result.transcript}
`;
      fs.writeFileSync(mdFile, mdContent);

      // Save plain text
      const txtFile = path.join(OUTPUT_DIR, `${result.videoId}.txt`);
      fs.writeFileSync(txtFile, result.transcript);

      summary.videos.push({
        videoId: result.videoId,
        language: result.language,
        captionCount: result.captionCount,
        length: result.length,
        files: {
          json: `${result.videoId}.json`,
          md: `${result.videoId}.md`,
          txt: `${result.videoId}.txt`
        }
      });

      logSuccess(`Saved ${result.videoId} (${result.captionCount} captions, ${result.length} chars)`);
    } else {
      logError(`Failed ${result.videoId}: ${result.error}`);
      summary.videos.push({
        videoId: result.videoId,
        success: false,
        error: result.error
      });
    }
  });

  // Save summary
  const summaryFile = path.join(OUTPUT_DIR, 'INDEX.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  logSuccess(`Summary saved to ${summaryFile}`);

  return summary;
}

// ============================================================================
// BATCH PROCESSOR
// ============================================================================

async function processBatch() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('YouTube Transcript Extractor - Batch Mode');
  console.log(`${'='.repeat(70)}\n`);

  logInfo(`Processing ${VIDEO_IDS.length} videos`);
  logInfo(`Output directory: ${OUTPUT_DIR}`);
  logInfo(`Batch delay: ${BATCH_DELAY}ms between requests\n`);

  ensureDir(OUTPUT_DIR);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < VIDEO_IDS.length; i++) {
    const videoId = VIDEO_IDS[i];
    const progress = `[${i + 1}/${VIDEO_IDS.length}]`;

    console.log(`\n${progress} Processing ${videoId}...`);

    try {
      const result = await extractVideoTranscript(videoId);
      results.push(result);

      if (result.success) {
        logSuccess(`${progress} ${videoId} extracted successfully`);
      } else {
        logError(`${progress} ${videoId} failed: ${result.error}`);
      }
    } catch (error) {
      logError(`${progress} ${videoId} error: ${error.message}`);
      results.push({
        success: false,
        videoId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Rate limiting (except for last video)
    if (i < VIDEO_IDS.length - 1) {
      await sleep(BATCH_DELAY);
    }
  }

  const summary = saveResults(results);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(70)}`);
  console.log('EXTRACTION COMPLETE');
  console.log(`${'='.repeat(70)}`);
  logSuccess(`Processed ${summary.totalProcessed} videos`);
  logSuccess(`Successful: ${summary.totalSuccess}`);
  logError(`Failed: ${summary.totalFailed}`);
  logInfo(`Duration: ${duration}s`);
  logInfo(`Output: ${OUTPUT_DIR}`);
  console.log(`${'='.repeat(70)}\n`);

  return summary;
}

// ============================================================================
// MAIN
// ============================================================================

processBatch()
  .then(summary => {
    process.exit(summary.totalSuccess === summary.totalProcessed ? 0 : 1);
  })
  .catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
