"""
Watch Manager — Manage YouTube channel watching for auto-ingestion
"""

import os
import redis
import json
from typing import Optional, List, Dict
from datetime import datetime

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class WatchManager:
    """Manage all active channel watches"""

    @staticmethod
    def add_watch(channel_url: str, slug: str) -> bool:
        """Register a channel to watch"""
        watch_key = f"brain:watch:{slug}:config"
        redis_client.hset(watch_key, mapping={
            "channel_url": channel_url,
            "slug": slug,
            "active": "true",
            "created_at": datetime.now().isoformat(),
            "last_check": None
        })
        return True

    @staticmethod
    def list_watches() -> List[Dict]:
        """List all active watches"""
        watches = []
        for key in redis_client.scan_iter("brain:watch:*:config"):
            data = redis_client.hgetall(key)
            if data.get("active") == "true":
                watches.append(data)
        return watches

    @staticmethod
    def get_watch(slug: str) -> Optional[Dict]:
        """Get watch configuration"""
        key = f"brain:watch:{slug}:config"
        data = redis_client.hgetall(key)
        return data if data else None

    @staticmethod
    def pause_watch(slug: str) -> bool:
        """Pause a watch"""
        key = f"brain:watch:{slug}:config"
        redis_client.hset(key, "active", "false")
        redis_client.hset(key, "paused_at", datetime.now().isoformat())
        return True

    @staticmethod
    def resume_watch(slug: str) -> bool:
        """Resume a paused watch"""
        key = f"brain:watch:{slug}:config"
        redis_client.hset(key, "active", "true")
        redis_client.hdel(key, "paused_at")
        return True

    @staticmethod
    def add_to_history(slug: str, video_id: str, title: str, chunks: int) -> bool:
        """Add entry to watch history"""
        history_key = f"brain:watch:{slug}:history"
        entry = {
            "video_id": video_id,
            "title": title,
            "chunks_added": chunks,
            "timestamp": datetime.now().isoformat()
        }
        redis_client.lpush(history_key, json.dumps(entry))
        return True

    @staticmethod
    def get_history(slug: str, limit: int = 50) -> List[Dict]:
        """Get ingestion history for a clone"""
        history_key = f"brain:watch:{slug}:history"
        entries = redis_client.lrange(history_key, 0, limit - 1)
        return [json.loads(e) for e in entries]

    @staticmethod
    def mark_video_seen(slug: str, video_id: str) -> bool:
        """Mark video as already ingested"""
        seen_key = f"brain:watch:seen_videos:{slug}"
        redis_client.sadd(seen_key, video_id)
        return True

    @staticmethod
    def is_video_seen(slug: str, video_id: str) -> bool:
        """Check if video already ingested"""
        seen_key = f"brain:watch:seen_videos:{slug}"
        return redis_client.sismember(seen_key, video_id)
