"""
Tests for Watch Manager
"""

import pytest
from unittest.mock import MagicMock, patch
from brain.watch.manager import WatchManager


def test_add_watch():
    """Test adding a new channel watch"""
    manager = WatchManager()

    with patch.object(manager.redis, 'hset') as mock_hset:
        with patch.object(manager.redis, 'sadd') as mock_sadd:
            result = manager.add_watch("https://youtube.com/@test", "test_clone")

            assert result["slug"] == "test_clone"
            assert result["channel_url"] == "https://youtube.com/@test"
            assert mock_hset.called
            assert mock_sadd.called


def test_list_watches():
    """Test listing watches"""
    manager = WatchManager()

    with patch.object(manager.redis, 'smembers', return_value={"test"}):
        with patch.object(manager.redis, 'hgetall', return_value={"slug": "test"}):
            watches = manager.list_watches()

            assert len(watches) > 0


def test_pause_watch():
    """Test pausing a watch"""
    manager = WatchManager()

    with patch.object(manager.redis, 'hset') as mock_hset:
        result = manager.pause_watch("test_clone")

        assert result is True
        assert mock_hset.called


def test_mark_seen_video():
    """Test marking video as seen"""
    manager = WatchManager()

    with patch.object(manager.redis, 'sadd') as mock_sadd:
        manager.mark_seen("test_clone", "video_123")

        assert mock_sadd.called


def test_resume_watch():
    """Test resuming a watch"""
    manager = WatchManager()

    with patch.object(manager.redis, 'hset') as mock_hset:
        result = manager.resume_watch("test_clone")

        assert result is True
        assert mock_hset.called


def test_is_watching():
    """Test checking if slug is watched"""
    manager = WatchManager()

    with patch.object(manager.redis, 'sismember', return_value=True):
        assert manager.is_watching("test_clone") is True


def test_get_watched_channels():
    """Test getting all watched channel slugs"""
    manager = WatchManager()

    with patch.object(manager.redis, 'smembers', return_value={"a", "b"}):
        channels = manager.get_watched_channels()
        assert len(channels) == 2


def test_log_event():
    """Test logging watch events"""
    manager = WatchManager()

    with patch.object(manager.redis, 'rpush') as mock_rpush:
        manager.log_event("test", "check_complete", "success")

        assert mock_rpush.called
        call_args = mock_rpush.call_args
        assert call_args[0][0] == "brain:watch:logs:test"


def test_add_history():
    """Test recording ingestion history"""
    manager = WatchManager()

    with patch.object(manager.redis, 'rpush') as mock_rpush:
        manager.add_history("test", "vid123", "Test Video", 5)

        assert mock_rpush.called
        call_args = mock_rpush.call_args
        assert call_args[0][0] == "brain:watch:test:history"


def test_get_seen_videos():
    """Test getting seen video IDs"""
    manager = WatchManager()

    with patch.object(manager.redis, 'smembers', return_value={"v1", "v2"}):
        seen = manager.get_seen_videos("test")
        assert "v1" in seen
        assert "v2" in seen


def test_get_history():
    """Test getting ingestion history"""
    manager = WatchManager()

    import json
    mock_data = [json.dumps({"video_id": "v1", "title": "Test"})]
    with patch.object(manager.redis, 'lrange', return_value=mock_data):
        history = manager.get_history("test")
        assert len(history) == 1
        assert history[0]["video_id"] == "v1"


def test_get_logs():
    """Test getting watch logs"""
    manager = WatchManager()

    import json
    mock_data = [json.dumps({"event_type": "check_complete", "status": "success"})]
    with patch.object(manager.redis, 'lrange', return_value=mock_data):
        logs = manager.get_logs("test")
        assert len(logs) == 1
        assert logs[0]["event_type"] == "check_complete"


def test_get_metrics():
    """Test getting performance metrics"""
    manager = WatchManager()

    with patch.object(manager.redis, 'smembers', return_value={"a", "b"}):
        with patch.object(manager.redis, 'scard', return_value=5):
            metrics = manager.get_metrics()
            assert metrics["channels_monitored"] == 2
            assert metrics["videos_ingested"] == 10
