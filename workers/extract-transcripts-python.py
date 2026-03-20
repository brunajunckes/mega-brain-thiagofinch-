#!/usr/bin/env python3

"""
Extract YouTube Transcripts using youtube-transcript-api
Auto-evolutionary approach: uses public YouTube API
"""

import json
import sys
from pathlib import Path
from datetime import datetime

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print("❌ youtube-transcript-api not installed")
    print("\nInstall with:")
    print("  pip install youtube-transcript-api")
    sys.exit(1)

# ============================================================================
# CONFIG
# ============================================================================

VIDEOS_FILE = 'recent-videos.json'
OUTPUT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('./data/transcripts')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# FUNCTIONS
# ============================================================================

def load_video_ids():
    """Load video IDs from recent-videos.json"""
    if not Path(VIDEOS_FILE).exists():
        print(f"❌ {VIDEOS_FILE} not found")
        print("\nRun first:")
        print("  node workers/fetch-last-2months.js")
        sys.exit(1)

    with open(VIDEOS_FILE, 'r') as f:
        data = json.load(f)

    return [v['videoId'] for v in data['last60Days']]

def extract_transcript(video_id, language='pt'):
    """Extract transcript for a single video"""
    try:
        # Try to get transcript
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[language])
        except:
            # Fallback to any available language
            transcript = YouTubeTranscriptApi.get_transcript(video_id)

        # Combine all text
        full_text = ' '.join([item['text'] for item in transcript])

        return {
            'success': True,
            'videoId': video_id,
            'transcript': full_text,
            'entries': transcript,
            'length': len(full_text),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {
            'success': False,
            'videoId': video_id,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def save_transcript(data, video_id):
    """Save transcript to file"""
    json_file = OUTPUT_DIR / f"{video_id}.json"
    md_file = OUTPUT_DIR / f"{video_id}.md"

    # Save JSON
    with open(json_file, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Save Markdown
    if data.get('success'):
        with open(md_file, 'w') as f:
            f.write(f"# Transcript: {data['videoId']}\n\n")
            f.write(f"**Length:** {data['length']} characters\n")
            f.write(f"**Extracted:** {data['timestamp']}\n\n")
            f.write("---\n\n")
            f.write(data['transcript'])

    return json_file, md_file

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n📺 Extract YouTube Transcripts (Last 2 Months)\n")
    print(f"Output: {OUTPUT_DIR}\n")

    video_ids = load_video_ids()
    print(f"📊 Videos to extract: {len(video_ids)}\n")

    successful = 0
    failed = 0

    for idx, video_id in enumerate(video_ids, 1):
        print(f"[{idx}/{len(video_ids)}] {video_id}... ", end='', flush=True)

        data = extract_transcript(video_id)

        if data['success']:
            json_file, md_file = save_transcript(data, video_id)
            print(f"✓ ({data['length']} chars)")
            successful += 1
        else:
            print(f"✗ {data['error']}")
            failed += 1

    print(f"\n✅ Complete!\n")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"\nNext step:")
    print(f"  node workers/extract-all-ai-structures.js {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
