"""
Tests for Brain Factory Clone Agent
"""

import pytest
import json
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from brain.clone.agent import CloneAgent


class TestCloneAgentInit:
    """Test CloneAgent initialization"""

    @patch('brain.clone.agent.validate_slug')
    @patch('brain.clone.agent.BrainStore')
    @patch('brain.clone.agent.load_persona')
    def test_init_valid_slug(self, mock_load_persona, mock_store, mock_validate):
        """Should initialize with valid slug"""
        mock_validate.return_value = True
        mock_load_persona.return_value = {
            "slug": "test_clone",
            "system_prompt": "Test prompt",
            "is_custom": False
        }

        agent = CloneAgent("test_clone")

        assert agent.slug == "test_clone"
        assert agent.system_prompt == "Test prompt"
        mock_validate.assert_called_once_with("test_clone")

    @patch('brain.clone.agent.validate_slug')
    def test_init_invalid_slug(self, mock_validate):
        """Should raise ValueError for invalid slug"""
        mock_validate.return_value = False

        with pytest.raises(ValueError):
            CloneAgent("Invalid-Slug")

    @patch('brain.clone.agent.validate_slug')
    @patch('brain.clone.agent.BrainStore')
    @patch('brain.clone.agent.load_persona')
    def test_init_with_session_id(self, mock_load_persona, mock_store, mock_validate):
        """Should accept custom session_id"""
        mock_validate.return_value = True
        mock_load_persona.return_value = {"system_prompt": "Test"}

        agent = CloneAgent("test_clone", session_id="custom_session_123")

        assert agent.session_id == "custom_session_123"


class TestCloneAgentAsk:
    """Test CloneAgent.ask() method"""

    @pytest.mark.asyncio
    @patch('brain.clone.agent.redis_client')
    @patch('brain.clone.agent.httpx.AsyncClient')
    @patch('brain.clone.agent.validate_slug')
    @patch('brain.clone.agent.BrainStore')
    @patch('brain.clone.agent.load_persona')
    async def test_ask_with_rag(self, mock_load_persona, mock_store, mock_validate,
                                mock_client, mock_redis):
        """Should query clone with RAG context"""
        # Setup mocks
        mock_validate.return_value = True
        mock_load_persona.return_value = {"system_prompt": "You are an expert."}

        # Mock BrainStore
        mock_brain_store = MagicMock()
        mock_brain_store.search.return_value = [
            {"text": "Context chunk 1", "source_title": "test.pdf", "source_type": "pdf"},
            {"text": "Context chunk 2", "source_title": "test.pdf", "source_type": "pdf"}
        ]
        mock_store.return_value = mock_brain_store

        # Mock Redis (no cache hit)
        mock_redis.get.return_value = None
        mock_redis.setex = MagicMock()

        # Mock Ollama response
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "message": {"content": "This is the answer"},
            "prompt_eval_count": 50,
            "eval_count": 30
        }
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)

        # Create agent and ask
        agent = CloneAgent("test_clone")
        result = await agent.ask("What is the answer?", use_rag=True)

        # Assertions
        assert result["slug"] == "test_clone"
        assert result["question"] == "What is the answer?"
        assert "This is the answer" in result["response"]
        assert result["chunks_used"] == 2
        assert result["cache_hit"] is False
        assert result["input_tokens"] == 50
        assert result["output_tokens"] == 30

    @pytest.mark.asyncio
    @patch('brain.clone.agent.redis_client')
    @patch('brain.clone.agent.validate_slug')
    @patch('brain.clone.agent.BrainStore')
    @patch('brain.clone.agent.load_persona')
    async def test_ask_cache_hit(self, mock_load_persona, mock_store, mock_validate, mock_redis):
        """Should return cached response on cache hit"""
        mock_validate.return_value = True
        mock_load_persona.return_value = {"system_prompt": "Test"}

        cached_result = {
            "slug": "test_clone",
            "response": "Cached answer",
            "chunks_used": 0,
            "cache_hit": False,
            "model": "test",
            "input_tokens": 0,
            "output_tokens": 0,
            "timestamp": "2026-03-20T00:00:00"
        }
        mock_redis.get.return_value = json.dumps(cached_result)

        agent = CloneAgent("test_clone")
        result = await agent.ask("What is the answer?", use_rag=True)

        assert result["response"] == "Cached answer"
        assert result["cache_hit"] is True

    @pytest.mark.asyncio
    @patch('brain.clone.agent.redis_client')
    @patch('brain.clone.agent.httpx.AsyncClient')
    @patch('brain.clone.agent.validate_slug')
    @patch('brain.clone.agent.BrainStore')
    @patch('brain.clone.agent.load_persona')
    async def test_ask_no_rag(self, mock_load_persona, mock_store, mock_validate,
                              mock_client, mock_redis):
        """Should work without RAG context"""
        mock_validate.return_value = True
        mock_load_persona.return_value = {"system_prompt": "Test"}

        mock_brain_store = MagicMock()
        mock_store.return_value = mock_brain_store

        mock_redis.get.return_value = None
        mock_redis.setex = MagicMock()

        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "message": {"content": "Direct answer"},
            "prompt_eval_count": 10,
            "eval_count": 5
        }
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)

        agent = CloneAgent("test_clone")
        result = await agent.ask("Question", use_rag=False)

        assert result["chunks_used"] == 0
        # search should not be called when use_rag=False
        mock_brain_store.search.assert_not_called()


class TestCloneAgentSession:
    """Test session management"""

    @patch('brain.clone.agent.redis_client')
    @patch('brain.clone.agent.validate_slug')
    @patch('brain.clone.agent.BrainStore')
    @patch('brain.clone.agent.load_persona')
    def test_get_session_history(self, mock_load_persona, mock_store, mock_validate, mock_redis):
        """Should retrieve session history"""
        mock_validate.return_value = True
        mock_load_persona.return_value = {"system_prompt": "Test"}

        messages = [
            json.dumps({"role": "assistant", "content": "Answer 2"}),
            json.dumps({"role": "user", "content": "Question 2"}),
            json.dumps({"role": "assistant", "content": "Answer 1"}),
            json.dumps({"role": "user", "content": "Question 1"}),
        ]
        mock_redis.lrange.return_value = messages

        agent = CloneAgent("test_clone", "test_session")
        history = agent.get_session_history(last_n=10)

        assert len(history) == 4
        assert history[0]["role"] == "user"
        assert history[0]["content"] == "Question 1"

    @patch('brain.clone.agent.redis_client')
    @patch('brain.clone.agent.validate_slug')
    @patch('brain.clone.agent.BrainStore')
    @patch('brain.clone.agent.load_persona')
    def test_clear_session(self, mock_load_persona, mock_store, mock_validate, mock_redis):
        """Should clear session history"""
        mock_validate.return_value = True
        mock_load_persona.return_value = {"system_prompt": "Test"}
        mock_redis.delete.return_value = 1

        agent = CloneAgent("test_clone", "test_session")
        result = agent.clear_session()

        assert result is True
        mock_redis.delete.assert_called_once()
