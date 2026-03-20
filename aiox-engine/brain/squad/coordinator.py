"""
Squad Coordinator — Orchestrates parallel queries across multiple clones
"""

import asyncio
import json
import redis
import hashlib
from typing import List, Dict, Optional
from datetime import datetime

from brain.clone.agent import CloneAgent
from brain.clone.store import BrainStore

REDIS_URL = "redis://localhost:6379"
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class SquadCoordinator:
    """Coordinates parallel queries across multiple clones"""

    def __init__(self, question: str, clones: Optional[List[str]] = None, timeout: int = 30):
        self.question = question
        self.timeout = timeout
        self.clones = clones or self._get_available_clones()
        self.debate_id = f"debate_{hashlib.sha256(question.encode()).hexdigest()[:8]}"

    def _get_available_clones(self) -> List[str]:
        """Get all registered clone slugs"""
        try:
            # Query Qdrant for collections matching pattern brain_clone_*
            collections = redis_client.hgetall("brain:clones:registry")
            return list(collections.keys())
        except Exception:
            return []

    async def ask_all(self, use_rag: bool = True) -> Dict:
        """Query all clones in parallel"""
        tasks = [
            self._query_clone(clone, use_rag)
            for clone in self.clones
        ]

        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=self.timeout
            )
        except asyncio.TimeoutError:
            return {"error": f"Squad timeout after {self.timeout}s"}

        responses = {}
        for clone, result in zip(self.clones, results):
            if isinstance(result, Exception):
                responses[clone] = {"error": str(result)}
            else:
                responses[clone] = result

        return responses

    async def _query_clone(self, clone: str, use_rag: bool) -> Dict:
        """Query single clone"""
        try:
            agent = CloneAgent(clone)
            result = await agent.ask(self.question, use_rag=use_rag)
            return result
        except Exception as e:
            return {"error": str(e)}

    async def debate(self, rounds: int = 3) -> Dict:
        """Execute multi-round debate"""
        debate_responses = {}

        for round_num in range(1, rounds + 1):
            round_key = f"round_{round_num}"
            debate_responses[round_key] = {}

            tasks = [
                self._query_clone(clone, use_rag=True)
                for clone in self.clones
            ]

            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=self.timeout
                )

                for clone, result in zip(self.clones, results):
                    if isinstance(result, Exception):
                        debate_responses[round_key][clone] = str(result)
                    else:
                        debate_responses[round_key][clone] = result
            except asyncio.TimeoutError:
                break

        # Save to Redis
        redis_client.setex(
            f"brain:squad:debate:{self.debate_id}",
            86400,
            json.dumps(debate_responses)
        )

        return debate_responses

    def get_clones(self) -> List[Dict]:
        """Get list of available clones with metadata"""
        clones_info = []
        for clone in self.clones:
            try:
                store = BrainStore(clone)
                clones_info.append({
                    "name": clone,
                    "available": True
                })
            except Exception:
                clones_info.append({
                    "name": clone,
                    "error": "Could not fetch stats"
                })

        return clones_info
