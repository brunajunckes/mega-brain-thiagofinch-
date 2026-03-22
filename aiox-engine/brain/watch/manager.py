"""
Watch Manager — Manages YouTube channel monitoring and auto-ingestion
"""

import redis
import json
from typing import List, Dict, Optional
from datetime import datetime

REDIS_URL = "redis://localhost:6379"
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class WatchManager:
    """Manages watch configuration and state"""

    def __init__(self):
        self.redis = redis_client

    def add_watch(self, channel_url: str, slug: str) -> Dict:
        """Add new channel watch"""
        watch_key = f"brain:watch:{slug}"
        watch_data = {
            "channel_url": channel_url,
            "slug": slug,
            "created_at": datetime.now().isoformat(),
            "paused": False,
            "last_check": None,
            "next_check": None
        }
        self.redis.hset(watch_key, mapping=watch_data)
        self.redis.sadd("brain:watch:active", slug)
        return watch_data

    def list_watches(self) -> List[Dict]:
        """List all active watches"""
        active_watches = self.redis.smembers("brain:watch:active")
        watches = []

        for slug in active_watches:
            watch_key = f"brain:watch:{slug}"
            watch_data = self.redis.hgetall(watch_key)
            if watch_data:
                watches.append(watch_data)

        return watches

    def pause_watch(self, slug: str) -> bool:
        """Pause watching a channel"""
        watch_key = f"brain:watch:{slug}"
        self.redis.hset(watch_key, "paused", True)
        self.redis.hset(watch_key, "paused_at", datetime.now().isoformat())
        return True

    def resume_watch(self, slug: str) -> bool:
        """Resume watching a channel"""
        watch_key = f"brain:watch:{slug}"
        self.redis.hset(watch_key, "paused", False)
        self.redis.hset(watch_key, "resumed_at", datetime.now().isoformat())
        return True

    def get_watch(self, slug: str) -> Optional[Dict]:
        """Get watch configuration"""
        watch_key = f"brain:watch:{slug}"
        return self.redis.hgetall(watch_key)

    def log_event(self, slug: str, event_type: str, status: str, error: Optional[str] = None):
        """Log watch event"""
        log_key = f"brain:watch:logs:{slug}"
        event = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "status": status,
            "error": error or ""
        }
        self.redis.rpush(log_key, json.dumps(event))

    def add_history(self, slug: str, video_id: str, title: str, chunks: int):
        """Record ingestion history"""
        history_key = f"brain:watch:{slug}:history"
        entry = {
            "video_id": video_id,
            "title": title,
            "chunks_added": chunks,
            "timestamp": datetime.now().isoformat()
        }
        self.redis.rpush(history_key, json.dumps(entry))

    def get_seen_videos(self, slug: str) -> set:
        """Get set of already-seen video IDs"""
        seen_key = f"brain:watch:seen_videos:{slug}"
        return self.redis.smembers(seen_key)

    def mark_seen(self, slug: str, video_id: str):
        """Mark video as seen"""
        seen_key = f"brain:watch:seen_videos:{slug}"
        self.redis.sadd(seen_key, video_id)

    def is_watching(self, slug: str) -> bool:
        """Check if a slug is being watched"""
        return self.redis.sismember("brain:watch:active", slug)

    def get_watched_channels(self) -> List[str]:
        """Get list of all watched channel slugs"""
        return list(self.redis.smembers("brain:watch:active"))

    def get_history(self, slug: str) -> List[Dict]:
        """Get ingestion history for a slug"""
        history_key = f"brain:watch:{slug}:history"
        raw = self.redis.lrange(history_key, 0, -1)
        return [json.loads(entry) for entry in raw]

    def get_logs(self, slug: str) -> List[Dict]:
        """Get watch event logs for a slug"""
        log_key = f"brain:watch:logs:{slug}"
        raw = self.redis.lrange(log_key, 0, -1)
        return [json.loads(entry) for entry in raw]

    def get_metrics(self) -> Dict:
        """Get performance metrics across all watches"""
        active = self.get_watched_channels()
        total_videos = 0
        for slug in active:
            seen_key = f"brain:watch:seen_videos:{slug}"
            total_videos += self.redis.scard(seen_key)

        return {
            "channels_monitored": len(active),
            "videos_ingested": total_videos,
        }
