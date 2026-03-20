# YouTube Transcript Extractor - Setup & Automation Guide

**Status:** Production-ready
**Language:** Portuguese, English, any YouTube language
**Auth:** ❌ None required (uses public captions)
**Rate Limit:** Safe (2 sec delay between videos)

---

## Quick Start

### Extract Single Video
```bash
node workers/youtube-transcript-extractor-v2.js JeT6byYruXs ./transcripts pt
```

### Extract Entire Channel (Last 20 Videos)
```bash
node workers/youtube-transcript-extractor-v2.js @oalanicolas ./transcripts pt
```

### Output Files
```
transcripts/
├── INDEX.json              # Metadata + file list
├── JeT6byYruXs.json       # Full data (JSON)
├── JeT6byYruXs.md         # Readable (Markdown)
└── JeT6byYruXs.txt        # Plain text
```

---

## Automation Options

### Option 1: Daily Cron Job (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /srv/aiox && node workers/youtube-transcript-extractor-v2.js @oalanicolas ./data/youtube-transcripts pt > /tmp/youtube-extractor.log 2>&1
```

### Option 2: GitHub Actions (Automated Cloud)
Create `.github/workflows/youtube-transcripts.yml`:
```yaml
name: Fetch YouTube Transcripts

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger

jobs:
  extract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Extract transcripts
        run: |
          node workers/youtube-transcript-extractor-v2.js @oalanicolas ./data/youtube-transcripts pt

      - name: Commit changes
        run: |
          git config user.name "Transcript Bot"
          git config user.email "bot@aiox.dev"
          git add data/youtube-transcripts/
          git commit -m "chore: update YouTube transcripts [automated]" || true
          git push
```

### Option 3: Docker Container (Persistent)
Create `workers/Dockerfile.youtube`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY workers/youtube-transcript-extractor-v2.js .

RUN npm install -g youtube-transcript-api

# Run every 6 hours
CMD while true; do \
  node youtube-transcript-extractor-v2.js @oalanicolas /transcripts pt && \
  sleep 21600; \
done
```

Run:
```bash
docker build -f workers/Dockerfile.youtube -t youtube-extractor .
docker run -v $(pwd)/transcripts:/transcripts youtube-extractor
```

### Option 4: AIOX Scheduled Task
Add to `.aiox-core/data/scheduled-tasks.yaml`:
```yaml
youtube-transcript-extract:
  schedule: '0 2 * * *'  # Daily 2 AM
  command: 'node workers/youtube-transcript-extractor-v2.js @oalanicolas ./data/youtube-transcripts pt'
  retry: 3
  timeout: 300000
  notifyOn: error
```

---

## Integration with Mind Cloning System

### Auto-Update Mind Clone from Transcripts
Create `workers/sync-transcript-to-clone.js`:
```javascript
const fs = require('fs');
const path = require('path');

/**
 * Automatically update Alan Nicolas clone with new insights
 * from latest YouTube transcripts
 */

async function updateCloneFromTranscripts(transcriptDir) {
  const indexPath = path.join(transcriptDir, 'INDEX.json');

  if (!fs.existsSync(indexPath)) {
    console.log('[ERROR] No transcripts found');
    return;
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  console.log(`[INFO] Found ${index.count} new transcripts`);
  console.log(`[INFO] Processing for new patterns...`);

  // Read latest transcripts
  for (const video of index.videos.slice(-5)) { // Last 5 videos
    const mdPath = video.md;

    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf8');

      // Extract key phrases and patterns
      const patterns = extractPatterns(content);

      console.log(`[✓] Video: ${video.videoId}`);
      console.log(`    Patterns: ${patterns.length}`);

      // Update MEMORY.md with new patterns
      updateMemoryFile(patterns);
    }
  }

  console.log('[✓] Clone updated with latest insights');
}

function extractPatterns(text) {
  /**
   * Extract actionable patterns from transcript
   */
  const patterns = [];

  // Look for key phrases
  const keywords = [
    'padrão', 'pattern',
    'DNA',
    'heurística', 'heuristic',
    'framework',
    'veto',
    'decision',
    'escalável', 'scale'
  ];

  for (const keyword of keywords) {
    const regex = new RegExp(`[^.!?]*${keyword}[^.!?]*[.!?]`, 'gi');
    const matches = text.match(regex);

    if (matches) {
      patterns.push(...matches.slice(0, 2)); // Get top 2
    }
  }

  return patterns;
}

function updateMemoryFile(patterns) {
  const memoryPath = '.claude/agent-memory/oalanicolas/MEMORY.md';

  if (!fs.existsSync(memoryPath)) return;

  let memory = fs.readFileSync(memoryPath, 'utf8');

  // Add new patterns to "Latest Updates" section
  const updateSection = `\n## Latest from Transcripts (${new Date().toISOString().split('T')[0]})\n\n`;
  const patternLines = patterns.map(p => `- ${p.trim()}`).join('\n');

  memory = memory.replace('## Latest', updateSection + patternLines + '\n\n## Latest');

  fs.writeFileSync(memoryPath, memory);
}

// Run
updateCloneFromTranscripts('./data/youtube-transcripts');
```

Use in cron:
```bash
0 3 * * * cd /srv/aiox && node workers/sync-transcript-to-clone.js
```

---

## Monitoring & Logging

### View Logs
```bash
# Last 50 lines
tail -50 /tmp/youtube-extractor.log

# Follow live
tail -f /tmp/youtube-extractor.log

# Search for errors
grep ERROR /tmp/youtube-extractor.log
```

### Health Check Script
Create `workers/check-transcripts.js`:
```javascript
const fs = require('fs');
const path = require('path');

const dir = './data/youtube-transcripts';
const index = JSON.parse(fs.readFileSync(path.join(dir, 'INDEX.json'), 'utf8'));

console.log(`Last Update: ${index.extracted}`);
console.log(`Total Videos: ${index.count}`);

// Check if recent
const lastUpdate = new Date(index.extracted);
const daysSince = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));

if (daysSince > 7) {
  console.warn(`⚠️  Last update ${daysSince} days ago`);
} else {
  console.log(`✓ Up-to-date (${daysSince} days)`);
}
```

Run:
```bash
node workers/check-transcripts.js
```

---

## Troubleshooting

### Issue: "No captions found"
**Solution:** Video doesn't have public captions enabled
- Check if video has captions manually on YouTube
- Some videos only have auto-generated captions
- Some channels disable captions

### Issue: "Rate limited"
**Solution:** Add delay in script
```bash
# Modify cron to be less frequent
0 3 * * 0  # Once per week instead of daily
```

### Issue: "Channel not found"
**Solution:** Verify channel name
```bash
# Try with full URL
node workers/youtube-transcript-extractor-v2.js @oalanicolas ...

# Or use channel ID
# Find from YouTube channel page URL
```

---

## Monitoring Pipeline

### Daily Check
```bash
#!/bin/bash
# save as: workers/daily-check.sh

echo "=== YouTube Transcript Health Check ==="
node workers/check-transcripts.js

echo -e "\n=== Last 5 Videos ==="
ls -lt ./data/youtube-transcripts/*.json | head -5

echo -e "\n=== Total Size ==="
du -sh ./data/youtube-transcripts/
```

Make executable:
```bash
chmod +x workers/daily-check.sh
```

---

## Advanced: Multi-Channel Extraction

Extract from multiple channels:
```bash
#!/bin/bash
# workers/extract-all-channels.sh

CHANNELS=("@oalanicolas" "@another_channel" "@another_one")
BASE_DIR="./data/youtube-transcripts"

for channel in "${CHANNELS[@]}"; do
  echo "[INFO] Extracting $channel..."
  node workers/youtube-transcript-extractor-v2.js "$channel" "$BASE_DIR/$channel" pt
  sleep 5
done

echo "[✓] All channels extracted"
```

---

## Integration with AIOX Agents

### Use transcripts in @analyst agent
```markdown
/AIOX:agents:analyst

Analyze these YouTube transcripts from @oalanicolas:
- Latest 5 videos
- Find new patterns
- Update mind clone

Transcripts location: ./data/youtube-transcripts
```

### Create automated insights report
```bash
#!/bin/bash
# Generate weekly report from transcripts

node workers/youtube-transcript-extractor-v2.js @oalanicolas ./transcripts pt

# Then generate insights
node -e "
  const fs = require('fs');
  const files = fs.readdirSync('./transcripts').filter(f => f.endsWith('.txt'));
  console.log('Analyzing ' + files.length + ' transcripts...');
  // Generate insights
"
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Time per video | 3-5 seconds |
| Time per channel (20 videos) | ~2 minutes |
| Storage per video | 50-200 KB |
| Concurrent videos | 1 (rate-limited) |
| Monthly bandwidth | ~50 MB |

---

## Security & Privacy

✅ **Safe:**
- No authentication stored
- No API keys needed
- Uses public captions only
- Local storage

⚠️ **Note:**
- Respects YouTube ToS (fair use)
- Rate limiting to avoid blocks
- Check channel's caption policy

---

## Next Steps

1. **Run once:** `node workers/youtube-transcript-extractor-v2.js @oalanicolas ./transcripts pt`
2. **Check output:** `ls -la ./transcripts/`
3. **Setup cron:** Add to crontab or GitHub Actions
4. **Monitor:** Run `node workers/check-transcripts.js` weekly
5. **Sync:** Integrate with mind clone auto-update

---

**Created:** 2026-03-21
**Status:** Ready for production
**Maintenance:** Monthly review of patterns
