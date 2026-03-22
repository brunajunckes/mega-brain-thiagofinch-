"""
Tests for Squad Coordinator
"""

import pytest
import asyncio
import json
from unittest.mock import MagicMock, patch, AsyncMock
from brain.squad.coordinator import SquadCoordinator


@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    with patch('brain.squad.coordinator.redis_client') as mock:
        mock.get.return_value = None
        mock.setex.return_value = True
        mock.hgetall.return_value = {}
        mock.smembers.return_value = set()
        yield mock


@pytest.mark.asyncio
async def test_ask_all_parallel_queries(mock_redis):
    """Test parallel queries across clones"""
    coordinator = SquadCoordinator(
        question="How to scale?",
        clones=["hormozi", "naval"]
    )

    with patch('brain.squad.coordinator.CloneAgent') as mock_agent:
        mock_instance = MagicMock()
        mock_instance.ask = AsyncMock(return_value={
            "response": "Test response",
            "chunks_used": 1,
            "input_tokens": 50,
            "output_tokens": 30,
        })
        mock_agent.return_value = mock_instance

        result = await coordinator.ask_all()

        assert "responses" in result
        assert "hormozi" in result["responses"]
        assert "naval" in result["responses"]
        assert "metrics" in result
        assert result["cache_hit"] is False


@pytest.mark.asyncio
async def test_ask_all_cache_hit(mock_redis):
    """Test cache hit returns cached result"""
    cached_data = json.dumps({
        "responses": {"hormozi": {"response": "cached"}},
        "cache_hit": False,
    })
    mock_redis.get.return_value = cached_data

    coordinator = SquadCoordinator(
        question="How to scale?",
        clones=["hormozi"]
    )

    result = await coordinator.ask_all()

    assert result["cache_hit"] is True


@pytest.mark.asyncio
async def test_ask_all_timeout(mock_redis):
    """Test timeout handling"""
    coordinator = SquadCoordinator(
        question="What?",
        clones=["slow_clone"],
        timeout=1
    )

    with patch('brain.squad.coordinator.CloneAgent') as mock_agent:
        async def slow_ask(*args, **kwargs):
            await asyncio.sleep(5)
            return {"response": "Should timeout"}

        mock_instance = MagicMock()
        mock_instance.ask = slow_ask
        mock_agent.return_value = mock_instance

        result = await coordinator.ask_all()

        assert "error" in result or result["responses"] == {}


@pytest.mark.asyncio
async def test_debate_rounds(mock_redis):
    """Test multi-round debate execution"""
    coordinator = SquadCoordinator(
        question="What is success?",
        clones=["hormozi", "naval"]
    )

    with patch('brain.squad.coordinator.CloneAgent') as mock_agent:
        mock_instance = MagicMock()
        mock_instance.ask = AsyncMock(return_value={
            "response": "Success is freedom",
            "chunks_used": 2,
            "input_tokens": 40,
            "output_tokens": 20,
        })
        mock_agent.return_value = mock_instance

        result = await coordinator.debate(rounds=2)

        assert "debate_id" in result
        assert "rounds" in result
        assert "round_1" in result["rounds"]
        assert "round_2" in result["rounds"]
        # Verify debate was saved to Redis
        mock_redis.setex.assert_called()


@pytest.mark.asyncio
async def test_synthesize(mock_redis):
    """Test synthesis generation"""
    coordinator = SquadCoordinator(
        question="How to grow?",
        clones=["hormozi"]
    )

    responses = {
        "hormozi": {"response": "Focus on offers"},
        "naval": {"response": "Build leverage"},
    }

    with patch('brain.squad.coordinator.httpx.AsyncClient') as mock_client:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "message": {"content": "Combined insight: focus and leverage"},
            "prompt_eval_count": 100,
            "eval_count": 50,
        }
        mock_response.raise_for_status = MagicMock()

        mock_ctx = AsyncMock()
        mock_ctx.__aenter__ = AsyncMock(return_value=mock_ctx)
        mock_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_ctx.post = AsyncMock(return_value=mock_response)
        mock_client.return_value = mock_ctx

        result = await coordinator.synthesize(responses)

        assert "text" in result
        assert "model" in result
        assert "synthesis_time" in result


def test_get_clones(mock_redis):
    """Test clone listing with metadata"""
    coordinator = SquadCoordinator("test", clones=["test_clone"])

    with patch('brain.squad.coordinator.BrainStore') as mock_store:
        mock_store_instance = MagicMock()
        mock_store_instance.get_stats.return_value = {
            "slug": "test_clone",
            "points_count": 42,
        }
        mock_store.return_value = mock_store_instance

        clones = coordinator.get_clones()

        assert len(clones) == 1
        assert clones[0]["name"] == "test_clone"
        assert "chunk_count" in clones[0]
        assert "source_types" in clones[0]
        assert clones[0]["available"] is True


def test_get_debate_history(mock_redis):
    """Test debate history retrieval"""
    mock_redis.get.return_value = json.dumps({
        "debate_id": "debate_abc123",
        "question": "test",
        "rounds": {"round_1": {}},
    })

    result = SquadCoordinator.get_debate_history("debate_abc123")

    assert result is not None
    assert result["debate_id"] == "debate_abc123"


def test_get_debate_history_not_found(mock_redis):
    """Test debate history not found"""
    mock_redis.get.return_value = None

    result = SquadCoordinator.get_debate_history("nonexistent")

    assert result is None


def test_metrics_initialization():
    """Test metrics are properly initialized"""
    coordinator = SquadCoordinator("test", clones=["a", "b", "c"])

    assert coordinator._metrics["num_clones"] == 3
    assert coordinator._metrics["parallel_queries"] == 0
    assert coordinator._metrics["synthesis_time"] == 0
    assert coordinator._metrics["total_tokens"] == 0
