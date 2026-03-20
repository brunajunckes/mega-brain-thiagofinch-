"""
Watcher Daemon — Background process for auto-ingestion of new videos
"""

import asyncio
import signal
import os
from typing import List
from datetime import datetime, timedelta
import yt_dlp

from brain.watch.manager import WatchManager
from brain.ingestion.youtube import ingest_youtube

WATCH_INTERVAL = int(os.getenv("BRAIN_WATCH_INTERVAL", "21600"))  # 6 hours default
MAX_RETRIES = 3


class WatcherDaemon:
    """Daemon that monitors channels and auto-ingests new videos"""

    def __init__(self):
        self.manager = WatchManager()
        self.running = True
        self.pending_retries = {}

        signal.signal(signal.SIGTERM, self._handle_sigterm)
        signal.signal(signal.SIGINT, self._handle_sigterm)

    def _handle_sigterm(self, signum, frame):
        """Handle graceful shutdown"""
        print("🛑 SIGTERM received, graceful shutdown...")
        self.running = False

    async def start(self):
        """Start the daemon"""
        print("🚀 Watcher daemon started")
        while self.running:
            await self.poll_channels()
            await asyncio.sleep(WATCH_INTERVAL)

    async def poll_channels(self):
        """Poll all watched channels"""
        watches = self.manager.list_watches()

        for watch in watches:
            if watch.get("paused"):
                continue

            slug = watch.get("slug")
            channel_url = watch.get("channel_url")

            try:
                await self.check_channel(channel_url, slug)
            except Exception as e:
                await self._retry_channel(slug, str(e))

    async def check_channel(self, channel_url: str, slug: str):
        """Check channel for new videos"""
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': 'in_playlist',
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(channel_url, download=False)

                if 'entries' in info:
                    videos = info['entries'][:10]  # Check last 10 videos

                    seen = self.manager.get_seen_videos(slug)
                    new_count = 0

                    for video in videos:
                        video_id = video.get('id')
                        if video_id not in seen:
                            # Ingest new video
                            video_url = f"https://www.youtube.com/watch?v={video_id}"
                            try:
                                await ingest_youtube(video_url, slug)
                                self.manager.mark_seen(slug, video_id)
                                self.manager.add_history(
                                    slug,
                                    video_id,
                                    video.get('title', 'Unknown'),
                                    chunks=1
                                )
                                new_count += 1
                            except Exception as e:
                                self.manager.log_event(
                                    slug,
                                    "ingest_failed",
                                    "error",
                                    str(e)
                                )

                    self.manager.log_event(
                        slug,
                        "check_complete",
                        "success"
                    )

                    print(f"✅ {slug}: Found {new_count} new videos")

        except Exception as e:
            self.manager.log_event(slug, "check_failed", "error", str(e))
            raise

    async def _retry_channel(self, slug: str, error: str):
        """Retry with exponential backoff"""
        if slug not in self.pending_retries:
            self.pending_retries[slug] = 0

        retry_count = self.pending_retries[slug]
        if retry_count < MAX_RETRIES:
            backoff = 2 ** retry_count
            self.pending_retries[slug] += 1
            print(f"⚠️ Retrying {slug} in {backoff}s (attempt {retry_count + 1}/{MAX_RETRIES})")
            await asyncio.sleep(backoff)
        else:
            self.manager.log_event(slug, "max_retries_reached", "failed", error)
            del self.pending_retries[slug]


async def run_daemon():
    """Run the daemon"""
    daemon = WatcherDaemon()
    await daemon.start()


if __name__ == "__main__":
    asyncio.run(run_daemon())
