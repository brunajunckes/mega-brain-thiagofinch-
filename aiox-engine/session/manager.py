"""
Session Manager for AIOX Engine
Manages conversation sessions and message history in Redis
"""

import json
import redis
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import os

class Message:
  """Single message in a session"""
  def __init__(self, role: str, content: str, model: Optional[str] = None, timestamp: Optional[str] = None):
    self.role = role  # "user" or "assistant"
    self.content = content
    self.model = model
    self.timestamp = timestamp or datetime.utcnow().isoformat()

  def to_dict(self) -> Dict[str, Any]:
    return {
      "role": self.role,
      "content": self.content,
      "model": self.model,
      "timestamp": self.timestamp
    }

  @staticmethod
  def from_dict(data: Dict[str, Any]) -> 'Message':
    return Message(
      role=data.get("role", "user"),
      content=data.get("content", ""),
      model=data.get("model"),
      timestamp=data.get("timestamp")
    )


class SessionInfo:
  """Metadata about a session"""
  def __init__(self, session_id: str, created_at: str, message_count: int):
    self.session_id = session_id
    self.created_at = created_at
    self.message_count = message_count

  def to_dict(self) -> Dict[str, Any]:
    return {
      "session_id": self.session_id,
      "created_at": self.created_at,
      "message_count": self.message_count
    }


class SessionManager:
  """Manages conversation sessions in Redis"""

  def __init__(self):
    # Connect to Redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    try:
      # Parse Redis URL: redis://host:port
      parts = redis_url.replace("redis://", "").split(":")
      host = parts[0]
      port = int(parts[1]) if len(parts) > 1 else 6379
      self.redis_client = redis.Redis(host=host, port=port, decode_responses=True)
      self.redis_client.ping()
    except Exception as e:
      print(f"[WARNING] Redis connection failed: {e}")
      self.redis_client = None

  def get_messages(self, session_id: str, last_n: int = 10) -> List[Message]:
    """Get last N messages from session"""
    if not self.redis_client:
      return []

    try:
      key = f"session:{session_id}:messages"
      messages_raw = self.redis_client.lrange(key, -last_n, -1)
      messages = []
      for msg_str in messages_raw:
        try:
          msg_dict = json.loads(msg_str)
          messages.append(Message.from_dict(msg_dict))
        except json.JSONDecodeError:
          pass
      return messages
    except Exception as e:
      print(f"[ERROR] Failed to get messages: {e}")
      return []

  def save_message(self, session_id: str, role: str, content: str, model: Optional[str] = None) -> bool:
    """Save a message to session history"""
    if not self.redis_client:
      return False

    try:
      msg = Message(role=role, content=content, model=model)
      key = f"session:{session_id}:messages"
      self.redis_client.rpush(key, json.dumps(msg.to_dict()))
      self.redis_client.expire(key, 86400)  # 24h TTL

      # Update metadata
      meta_key = f"session:{session_id}:meta"
      self.redis_client.hincrby(meta_key, "message_count", 1)
      self.redis_client.expire(meta_key, 86400)

      return True
    except Exception as e:
      print(f"[ERROR] Failed to save message: {e}")
      return False

  def create_session(self, session_id: str) -> bool:
    """Initialize a new session"""
    if not self.redis_client:
      return False

    try:
      meta_key = f"session:{session_id}:meta"
      self.redis_client.hset(meta_key, mapping={
        "created_at": datetime.utcnow().isoformat(),
        "message_count": 0
      })
      self.redis_client.expire(meta_key, 86400)
      return True
    except Exception as e:
      print(f"[ERROR] Failed to create session: {e}")
      return False

  def get_session_info(self, session_id: str) -> Optional[SessionInfo]:
    """Get session metadata"""
    if not self.redis_client:
      return None

    try:
      meta_key = f"session:{session_id}:meta"
      meta = self.redis_client.hgetall(meta_key)
      if not meta:
        return None

      return SessionInfo(
        session_id=session_id,
        created_at=meta.get("created_at", ""),
        message_count=int(meta.get("message_count", 0))
      )
    except Exception as e:
      print(f"[ERROR] Failed to get session info: {e}")
      return None

  def clear_session(self, session_id: str) -> bool:
    """Delete all messages from a session"""
    if not self.redis_client:
      return False

    try:
      self.redis_client.delete(f"session:{session_id}:messages")
      self.redis_client.delete(f"session:{session_id}:meta")
      return True
    except Exception as e:
      print(f"[ERROR] Failed to clear session: {e}")
      return False

  def session_exists(self, session_id: str) -> bool:
    """Check if session has any messages"""
    if not self.redis_client:
      return False

    try:
      key = f"session:{session_id}:messages"
      return self.redis_client.exists(key) > 0
    except Exception as e:
      print(f"[ERROR] Failed to check session existence: {e}")
      return False


# Global instance
session_manager = SessionManager()
