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
