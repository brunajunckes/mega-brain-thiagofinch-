#!/usr/bin/env node

/**
 * Fetch Last 2 Months of Video IDs from YouTube Channel
 * Auto-evolutionary approach: uses public YouTube URLs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CHANNEL = process.argv[2] || '@oalanicolas';
const OUTPUT_FILE = 'recent-videos.json';

// ============================================================================
// FETCH VIDEO IDs
// ============================================================================

function fetchChannelPage(channel) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/${channel}/videos`;

    const options = {
      hostname: 'www.youtube.com',
      path: `/${channel}/videos`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        // Extract video IDs using regex
        const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
        const matches = [...new Set(data.matchAll(videoIdRegex))];
        const videoIds = Array.from(matches).map(m => m[1]).slice(0, 50);

        resolve({
          videoIds,
          totalFound: videoIds.length,
          timestamp: new Date().toISOString()
        });
      });
    }).on('error', reject);
  });
}

function estimateVideoDate(videoId, position) {
  // Simple heuristic: assume chronological order
  // Videos earlier in list are more recent
  const now = new Date();
  const daysAgo = position * 1.5; // ~1.5 days per video average
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}

function isWithinLast60Days(date) {
  const now = new Date();
  const diff = now - date;
  const days = diff / (1000 * 60 * 60 * 24);
  return days <= 60;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`\n📺 Fetching Last 2 Months of Videos\n`);
  console.log(`Channel: ${CHANNEL}`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  try {
    console.log('⏳ Fetching video IDs from YouTube...');
    const result = await fetchChannelPage(CHANNEL);

    console.log(`✓ Found ${result.totalFound} videos\n`);

    // Filter to last 60 days
    const recentVideos = result.videoIds
      .map((videoId, idx) => ({
        videoId,
        position: idx,
        estimatedDate: estimateVideoDate(videoId, idx),
        daysAgo: idx * 1.5,
        inLast60Days: idx * 1.5 <= 60
      }))
      .filter(v => v.inLast60Days);

    console.log(`📊 Videos in last 60 days: ${recentVideos.length}\n`);

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
      channel: CHANNEL,
      totalFetched: result.totalFound,
      recentCount: recentVideos.length,
      last60Days: recentVideos,
      timestamp: result.timestamp
    }, null, 2));

    console.log(`✅ Saved to ${OUTPUT_FILE}\n`);

    console.log('Next steps:');
    console.log('1. Install youtube-transcript-api:');
    console.log('   pip install youtube-transcript-api\n');
    console.log('2. Run extraction:');
    console.log('   python3 workers/extract-transcripts-python.py\n');

    return recentVideos;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
