"""
Tests for Squad Coordinator
"""

import pytest
import asyncio
from unittest.mock import MagicMock, patch
from brain.squad.coordinator import SquadCoordinator


@pytest.mark.asyncio
async def test_ask_all_parallel_queries():
    """Test parallel queries across clones"""
    coordinator = SquadCoordinator(
        question="How to scale?",
        clones=["hormozi", "naval"]
    )

    with patch('brain.squad.coordinator.CloneAgent') as mock_agent:
        mock_instance = MagicMock()
        mock_instance.ask = MagicMock(return_value={
            "response": "Test response",
            "chunks_used": 1
        })
        mock_agent.return_value = mock_instance

        results = await coordinator.ask_all()

        assert "hormozi" in results
        assert "naval" in results


@pytest.mark.asyncio
async def test_ask_all_timeout():
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

        results = await coordinator.ask_all()

        # Timeout should trigger error handling
        assert "error" in results or len(results) == 0


@pytest.mark.asyncio
async def test_debate_rounds():
    """Test multi-round debate execution"""
    coordinator = SquadCoordinator(
        question="What is success?",
        clones=["hormozi", "naval"]
    )

    with patch('brain.squad.coordinator.CloneAgent') as mock_agent:
        mock_instance = MagicMock()
        mock_instance.ask = MagicMock(return_value={
            "response": "Success is freedom",
            "chunks_used": 2
        })
        mock_agent.return_value = mock_instance

        debate_result = await coordinator.debate(rounds=2)

        assert "round_1" in debate_result
        assert "round_2" in debate_result


def test_get_clones():
    """Test clone listing"""
    coordinator = SquadCoordinator("test", clones=["test_clone"])

    with patch('brain.squad.coordinator.BrainStore') as mock_store:
        mock_store_instance = MagicMock()
        mock_store.return_value = mock_store_instance

        clones = coordinator.get_clones()

        assert len(clones) > 0
