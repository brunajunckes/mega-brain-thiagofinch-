"""
Watcher Daemon — Background service for YouTube channel polling
"""

import asyncio
import os
import signal
from typing import List
from datetime import datetime
from brain.watch.manager import WatchManager
from brain.ingestion.youtube import ingest_youtube

WATCH_INTERVAL = int(os.getenv("BRAIN_WATCH_INTERVAL", "21600"))  # 6h default


class WatcherDaemon:
    """Background daemon that polls YouTube channels"""

    def __init__(self):
        self.running = False
        self.watches = []

    async def start(self):
        """Start the watching daemon"""
        self.running = True
        signal.signal(signal.SIGTERM, self._shutdown_handler)

        print("[✓] Watcher Daemon started")

        while self.running:
            await self._poll_all_channels()
            await asyncio.sleep(WATCH_INTERVAL)

    async def _poll_all_channels(self):
        """Poll all registered channels"""
        watches = WatchManager.list_watches()

        for watch in watches:
            if watch.get("active") == "true":
                try:
                    await self._check_channel(watch)
                except Exception as e:
                    print(f"[✗] Error watching {watch['slug']}: {e}")

    async def _check_channel(self, watch: dict):
        """Check single channel for new videos"""
        slug = watch["slug"]
        channel_url = watch["channel_url"]

        print(f"[→] Checking {slug}...")

        # Use yt-dlp to list latest videos
        try:
            chunks = await ingest_youtube(channel_url, slug, last_n=1)
            if chunks:
                print(f"[+] Ingested {len(chunks)} chunks for {slug}")
                WatchManager.add_to_history(slug, "auto", "auto_ingest", len(chunks))
        except Exception as e:
            print(f"[✗] Failed to ingest {slug}: {e}")

        # Update last check
        WatchManager.get_watch(slug)
        watch_key = f"brain:watch:{slug}:config"
        import redis
        redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"),
                                      decode_responses=True)
        redis_client.hset(watch_key, "last_check", datetime.now().isoformat())

    def _shutdown_handler(self, signum, frame):
        """Handle graceful shutdown"""
        print("\n[→] Shutting down gracefully...")
        self.running = False
