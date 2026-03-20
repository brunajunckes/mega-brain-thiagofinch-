"""
Tests for Brain Factory Clone Builder
"""

import pytest
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
from brain.clone.builder import (
    load_persona,
    get_system_prompt,
    validate_slug,
    clear_persona_cache
)


class TestValidateSlug:
    """Test slug validation"""

    def test_valid_slug(self):
        assert validate_slug("alex_hormozi") is True
        assert validate_slug("test_clone") is True
        assert validate_slug("clone123") is True

    def test_invalid_slug_uppercase(self):
        assert validate_slug("Alex_Hormozi") is False

    def test_invalid_slug_special_chars(self):
        assert validate_slug("clone-name") is False
        assert validate_slug("clone@name") is False

    def test_invalid_slug_too_long(self):
        assert validate_slug("a" * 41) is False

    def test_empty_slug(self):
        assert validate_slug("") is False


class TestGetSystemPrompt:
    """Test system prompt loading"""

    @patch('brain.clone.builder.redis_client')
    def test_load_from_cache(self, mock_redis):
        """Should load persona from Redis cache"""
        mock_redis.get.return_value = "Cached prompt"

        result = get_system_prompt("test_clone")

        assert result == "Cached prompt"
        mock_redis.get.assert_called_once_with("brain:persona:test_clone")

    @patch('brain.clone.builder.redis_client')
    @patch('brain.clone.builder.Path.exists')
    @patch('builtins.open', create=True)
    def test_load_from_filesystem(self, mock_open, mock_exists, mock_redis):
        """Should load from filesystem if not in cache"""
        mock_redis.get.return_value = None
        mock_exists.return_value = True
        mock_open.return_value.__enter__.return_value.read.return_value = "File prompt"

        result = get_system_prompt("test_clone")

        assert result == "File prompt"
        mock_redis.setex.assert_called_once()
        args = mock_redis.setex.call_args[0]
        assert args[0] == "brain:persona:test_clone"
        assert args[1] == 3600  # 1 hour TTL
        assert args[2] == "File prompt"

    @patch('brain.clone.builder.redis_client')
    @patch('brain.clone.builder.Path.exists')
    def test_fallback_to_default(self, mock_exists, mock_redis):
        """Should fallback to default if no file or cache"""
        mock_redis.get.return_value = None
        mock_exists.return_value = False

        result = get_system_prompt("nonexistent_clone")

        # Should contain default persona text
        assert "expert assistant" in result.lower()
        mock_redis.setex.assert_called_once()

    def test_invalid_slug_raises(self):
        """Should raise ValueError for invalid slug"""
        with pytest.raises(ValueError):
            get_system_prompt("Invalid-Slug")


class TestLoadPersona:
    """Test persona loading"""

    @patch('brain.clone.builder.get_system_prompt')
    @patch('brain.clone.builder.Path.exists')
    def test_load_persona_custom(self, mock_exists, mock_get_prompt):
        """Should load custom persona with correct metadata"""
        mock_get_prompt.return_value = "Custom prompt"
        mock_exists.return_value = True

        result = load_persona("alex_hormozi")

        assert result["slug"] == "alex_hormozi"
        assert result["system_prompt"] == "Custom prompt"
        assert result["is_custom"] is True
        assert "alex_hormozi" in result["source"]

    @patch('brain.clone.builder.get_system_prompt')
    @patch('brain.clone.builder.Path.exists')
    def test_load_persona_default(self, mock_exists, mock_get_prompt):
        """Should load default persona if no custom prompt"""
        mock_get_prompt.return_value = "Default prompt"
        mock_exists.return_value = False

        result = load_persona("unknown_clone")

        assert result["slug"] == "unknown_clone"
        assert result["system_prompt"] == "Default prompt"
        assert result["is_custom"] is False
        assert result["source"] == "default"


class TestClearPersonaCache:
    """Test cache clearing"""

    @patch('brain.clone.builder.redis_client')
    def test_clear_cache_success(self, mock_redis):
        """Should delete cache key"""
        mock_redis.delete.return_value = 1

        result = clear_persona_cache("test_clone")

        assert result is True
        mock_redis.delete.assert_called_once_with("brain:persona:test_clone")

    @patch('brain.clone.builder.redis_client')
    def test_clear_cache_not_found(self, mock_redis):
        """Should return False if key not found"""
        mock_redis.delete.return_value = 0

        result = clear_persona_cache("nonexistent_clone")

        assert result is False
