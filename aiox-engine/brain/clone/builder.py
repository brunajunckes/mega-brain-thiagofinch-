"""
Clone Persona Builder — Load and cache expert personas for Brain Factory clones
"""

import os
import redis
import json
from pathlib import Path
from typing import Optional

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Default fallback persona
DEFAULT_PERSONA = """You are an expert assistant with specialized knowledge in your domain.
Provide thoughtful, well-reasoned answers based on the knowledge base provided.
If you don't have relevant information to answer the question, say so honestly.
Always cite your sources when relevant."""

OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "../../outputs/minds")


def validate_slug(slug: str) -> bool:
    """Validate clone slug format: ^[a-z0-9_]{1,40}$"""
    import re
    return bool(re.match(r"^[a-z0-9_]{1,40}$", slug))


def get_system_prompt(slug: str) -> str:
    """
    Load system prompt for clone from:
    1. Redis cache (1h TTL)
    2. Filesystem: outputs/minds/{slug}/implementation/system-prompt.md
    3. Fallback to default persona
    """
    if not validate_slug(slug):
        raise ValueError(f"Invalid slug format: {slug}")

    # Check Redis cache
    cache_key = f"brain:persona:{slug}"
    cached = redis_client.get(cache_key)
    if cached:
        return cached

    # Try filesystem
    persona_path = Path(OUTPUTS_DIR) / slug / "implementation" / "system-prompt.md"
    if persona_path.exists():
        try:
            with open(persona_path, "r", encoding="utf-8") as f:
                persona = f.read().strip()
                # Cache in Redis (1h = 3600s)
                redis_client.setex(cache_key, 3600, persona)
                return persona
        except Exception as e:
            print(f"[WARN] Failed to load persona from {persona_path}: {e}")

    # Fallback to default
    redis_client.setex(cache_key, 3600, DEFAULT_PERSONA)
    return DEFAULT_PERSONA


def load_persona(slug: str) -> dict:
    """Load complete persona metadata including system prompt"""
    if not validate_slug(slug):
        raise ValueError(f"Invalid slug format: {slug}")

    system_prompt = get_system_prompt(slug)

    persona_path = Path(OUTPUTS_DIR) / slug / "implementation" / "system-prompt.md"
    is_custom = persona_path.exists()

    return {
        "slug": slug,
        "system_prompt": system_prompt,
        "is_custom": is_custom,
        "source": str(persona_path) if is_custom else "default"
    }


def clear_persona_cache(slug: str) -> bool:
    """Clear cached persona from Redis"""
    cache_key = f"brain:persona:{slug}"
    deleted = redis_client.delete(cache_key)
    return deleted > 0


if __name__ == "__main__":
    # Test
    import sys
    if len(sys.argv) > 1:
        slug = sys.argv[1]
        persona = get_system_prompt(slug)
        print(f"Persona for '{slug}':")
        print(persona)
