"""YouTube ingestion via yt-dlp and faster-whisper"""

import subprocess
import os
from pathlib import Path
from typing import List, Dict, Any
from .chunker import chunk_text

try:
  from faster_whisper import WhisperModel
except ImportError:
  WhisperModel = None


async def download_youtube_video(url: str, limit: int = None) -> List[str]:
  """
  Download YouTube video(s) using yt-dlp.

  Args:
    url: YouTube URL (video or channel)
    limit: Max videos to download (for channels)

  Returns:
    List of audio file paths
  """
  try:
    # Create temp dir for downloads
    temp_dir = Path('/tmp/aiox_brain_downloads')
    temp_dir.mkdir(exist_ok=True)

    # Build yt-dlp command
    cmd = [
      'yt-dlp',
      '-f', 'bestaudio',
      '-x', '--audio-format', 'mp3',
      '-o', str(temp_dir / '%(title)s.%(ext)s'),
    ]

    # If URL is a channel and limit specified
    if '//@' in url or '/channel/' in url or '/c/' in url:
      cmd.extend(['--playlist-items', f'1:{limit}' if limit else '1:'])

    cmd.append(url)

    # Execute
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
      raise RuntimeError(f'yt-dlp failed: {result.stderr}')

    # Find downloaded files
    audio_files = list(temp_dir.glob('*.mp3'))
    return [str(f) for f in audio_files]

  except Exception as e:
    print(f'❌ Error downloading YouTube: {e}')
    raise


async def transcribe_audio(audio_path: str) -> str:
  """
  Transcribe audio using faster-whisper (base model).

  Args:
    audio_path: Path to audio file

  Returns:
    Transcribed text
  """
  if WhisperModel is None:
    raise ImportError('faster-whisper not installed. Run: pip install faster-whisper')

  try:
    model = WhisperModel('base', device='cpu', compute_type='int8')
    segments, _ = model.transcribe(audio_path, language='en')

    transcript = ' '.join([segment.text for segment in segments])
    return transcript

  except Exception as e:
    print(f'❌ Error transcribing: {e}')
    raise


async def ingest_youtube(
  url: str,
  slug: str,
  last_n: int = None,
) -> List[Dict[str, Any]]:
  """
  Download and ingest YouTube video(s).

  Args:
    url: YouTube video or channel URL
    slug: Clone slug
    last_n: For channels, limit to last N videos

  Returns:
    List of chunks with metadata
  """
  try:
    # Download
    audio_files = await download_youtube_video(url, limit=last_n)
    if not audio_files:
      raise ValueError('No videos downloaded')

    all_chunks = []

    for audio_file in audio_files:
      try:
        # Transcribe
        transcript = await transcribe_audio(audio_file)

        # Extract title from filename
        title = Path(audio_file).stem

        # Chunk
        chunks = chunk_text(transcript, chunk_size=500, overlap=50)

        # Add metadata
        for chunk in chunks:
          chunk.update({
            'source_type': 'youtube',
            'source_url': url,
            'source_title': title,
            'clone_slug': slug,
          })

        all_chunks.extend(chunks)

      finally:
        # Clean up audio file
        try:
          os.remove(audio_file)
        except:
          pass

    return all_chunks

  except Exception as e:
    print(f'❌ Error ingesting YouTube: {e}')
    raise
