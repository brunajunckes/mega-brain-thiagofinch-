"""
Tests for Watcher Daemon
"""

import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from brain.watch.daemon import WatcherDaemon, WATCH_INTERVAL, MAX_RETRIES


@pytest.fixture
def daemon():
    """Create a WatcherDaemon with mocked manager"""
    with patch('brain.watch.daemon.WatchManager') as MockManager:
        mock_manager = MockManager.return_value
        d = WatcherDaemon()
        d.manager = mock_manager
        yield d


def test_daemon_initializes(daemon):
    """Test daemon creates WatchManager and sets running flag"""
    assert daemon.running is True
    assert daemon.pending_retries == {}


def test_handle_sigterm(daemon):
    """Test graceful shutdown on SIGTERM"""
    daemon._handle_sigterm(15, None)
    assert daemon.running is False


@pytest.mark.asyncio
async def test_poll_channels_skips_paused(daemon):
    """Test polling skips paused watches"""
    daemon.manager.list_watches.return_value = [
        {"slug": "test", "channel_url": "https://youtube.com/@test", "paused": True}
    ]

    with patch.object(daemon, 'check_channel', new_callable=AsyncMock) as mock_check:
        await daemon.poll_channels()
        mock_check.assert_not_called()


@pytest.mark.asyncio
async def test_poll_channels_checks_active(daemon):
    """Test polling checks active watches"""
    daemon.manager.list_watches.return_value = [
        {"slug": "test", "channel_url": "https://youtube.com/@test", "paused": False}
    ]

    with patch.object(daemon, 'check_channel', new_callable=AsyncMock) as mock_check:
        await daemon.poll_channels()
        mock_check.assert_called_once_with("https://youtube.com/@test", "test")


@pytest.mark.asyncio
async def test_poll_channels_retries_on_error(daemon):
    """Test polling retries on check failure"""
    daemon.manager.list_watches.return_value = [
        {"slug": "test", "channel_url": "https://youtube.com/@test", "paused": False}
    ]

    with patch.object(daemon, 'check_channel', new_callable=AsyncMock, side_effect=Exception("fail")):
        with patch.object(daemon, '_retry_channel', new_callable=AsyncMock) as mock_retry:
            await daemon.poll_channels()
            mock_retry.assert_called_once_with("test", "fail")


@pytest.mark.asyncio
async def test_retry_increments_count(daemon):
    """Test retry increments pending_retries counter"""
    daemon.pending_retries = {}

    with patch('asyncio.sleep', new_callable=AsyncMock):
        await daemon._retry_channel("test", "error msg")

    assert daemon.pending_retries["test"] == 1


@pytest.mark.asyncio
async def test_retry_max_retries_reached(daemon):
    """Test retry logs event when max retries reached"""
    daemon.pending_retries = {"test": MAX_RETRIES}

    await daemon._retry_channel("test", "persistent error")

    daemon.manager.log_event.assert_called_once_with(
        "test", "max_retries_reached", "failed", "persistent error"
    )
    assert "test" not in daemon.pending_retries


@pytest.mark.asyncio
async def test_retry_exponential_backoff(daemon):
    """Test retry uses exponential backoff"""
    daemon.pending_retries = {"test": 2}

    with patch('asyncio.sleep', new_callable=AsyncMock) as mock_sleep:
        await daemon._retry_channel("test", "error")
        mock_sleep.assert_called_once_with(4)  # 2^2 = 4


def test_max_retries_constant():
    """Test MAX_RETRIES is 3"""
    assert MAX_RETRIES == 3


def test_watch_interval_default():
    """Test WATCH_INTERVAL defaults to 21600 (6 hours)"""
    assert WATCH_INTERVAL == 21600
