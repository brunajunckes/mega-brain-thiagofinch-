"""
Squad Coordinator — Orchestrates parallel queries across multiple clones
"""

import asyncio
import json
import redis
import hashlib
import os
import time
from typing import List, Dict, Optional
from datetime import datetime

import httpx
from brain.clone.agent import CloneAgent
from brain.clone.store import BrainStore

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://172.17.0.1:11434")
SYNTHESIS_MODEL = os.getenv("SYNTHESIS_MODEL", "qwen2.5:14b")
SQUAD_CACHE_TTL = int(os.getenv("SQUAD_CACHE_TTL", "300"))  # 5 min
DEBATE_CACHE_TTL = int(os.getenv("DEBATE_CACHE_TTL", "86400"))  # 24h

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class SquadCoordinator:
    """Coordinates parallel queries across multiple clones"""

    def __init__(self, question: str, clones: Optional[List[str]] = None, timeout: int = 30):
        self.question = question
        self.timeout = timeout
        self.clones = clones or self._get_available_clones()
        self.debate_id = f"debate_{hashlib.sha256(question.encode()).hexdigest()[:8]}_{int(time.time())}"
        self._metrics = {
            "num_clones": len(self.clones),
            "parallel_queries": 0,
            "synthesis_time": 0,
            "total_tokens": 0,
        }

    def _get_available_clones(self) -> List[str]:
        """Get all registered clone slugs"""
        try:
            collections = redis_client.hgetall("brain:clones:registry")
            return list(collections.keys())
        except Exception:
            return []

    def _get_cache_key(self) -> str:
        """Generate cache key for squad query"""
        question_hash = hashlib.sha256(self.question.encode()).hexdigest()
        return f"brain:squad:ask:{question_hash}"

    async def ask_all(self, use_rag: bool = True) -> Dict:
        """Query all clones in parallel with caching"""
        # Check cache
        cache_key = self._get_cache_key()
        cached = redis_client.get(cache_key)
        if cached:
            result = json.loads(cached)
            result["cache_hit"] = True
            return result

        start_time = time.time()
        tasks = [
            self._query_clone(clone, use_rag)
            for clone in self.clones
        ]
        self._metrics["parallel_queries"] = len(tasks)

        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=self.timeout
            )
        except asyncio.TimeoutError:
            return {
                "error": f"Squad timeout after {self.timeout}s",
                "responses": {},
                "metrics": self._metrics,
            }

        responses = {}
        for clone, result in zip(self.clones, results):
            if isinstance(result, Exception):
                responses[clone] = {"error": str(result)}
            else:
                responses[clone] = result
                # Accumulate token counts
                if isinstance(result, dict):
                    self._metrics["total_tokens"] += result.get("input_tokens", 0)
                    self._metrics["total_tokens"] += result.get("output_tokens", 0)

        elapsed = time.time() - start_time

        output = {
            "responses": responses,
            "cache_hit": False,
            "metrics": {
                **self._metrics,
                "query_time": round(elapsed, 2),
            },
        }

        # Cache result with TTL
        redis_client.setex(cache_key, SQUAD_CACHE_TTL, json.dumps(output))

        return output

    async def _query_clone(self, clone: str, use_rag: bool) -> Dict:
        """Query single clone"""
        try:
            agent = CloneAgent(clone)
            result = await agent.ask(self.question, use_rag=use_rag)
            return result
        except Exception as e:
            return {"error": str(e)}

    async def debate(self, rounds: int = 3) -> Dict:
        """Execute multi-round debate between clones"""
        debate_responses = {}
        previous_responses = {}

        for round_num in range(1, rounds + 1):
            round_key = f"round_{round_num}"
            debate_responses[round_key] = {}

            tasks = [
                self._query_debate_round(clone, round_num, previous_responses)
                for clone in self.clones
            ]

            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=self.timeout
                )

                for clone, result in zip(self.clones, results):
                    if isinstance(result, Exception):
                        debate_responses[round_key][clone] = {"error": str(result)}
                    else:
                        debate_responses[round_key][clone] = result

                # Store round responses for next round context
                previous_responses = {
                    clone: (result.get("response", "") if isinstance(result, dict) else str(result))
                    for clone, result in zip(self.clones, results)
                    if not isinstance(result, Exception)
                }
            except asyncio.TimeoutError:
                debate_responses[round_key] = {"error": f"Round {round_num} timed out"}
                break

        # Save debate history to Redis with 24h TTL
        redis_client.setex(
            f"brain:squad:debate:{self.debate_id}",
            DEBATE_CACHE_TTL,
            json.dumps({
                "debate_id": self.debate_id,
                "question": self.question,
                "clones": self.clones,
                "rounds": debate_responses,
                "timestamp": datetime.now().isoformat(),
            })
        )

        return {
            "debate_id": self.debate_id,
            "rounds": debate_responses,
        }

    async def _query_debate_round(self, clone: str, round_num: int, previous_responses: Dict) -> Dict:
        """Query a clone for a specific debate round with appropriate prompting"""
        try:
            agent = CloneAgent(clone)

            if round_num == 1:
                # Round 1: normal answer
                result = await agent.ask(self.question, use_rag=True)
            elif round_num == 2:
                # Round 2: respond to others, shorter and more argumentative
                others = {k: v for k, v in previous_responses.items() if k != clone}
                others_text = "\n".join([f"- {k}: {v}" for k, v in others.items()])
                debate_prompt = (
                    f"Other experts have given these perspectives:\n{others_text}\n\n"
                    f"Challenge or build on their views. Be concise and direct. "
                    f"Point out what they missed or got wrong. "
                    f"Original question: {self.question}"
                )
                result = await agent.ask(debate_prompt, use_rag=False)
            else:
                # Round 3+: synthesis round
                others = {k: v for k, v in previous_responses.items() if k != clone}
                others_text = "\n".join([f"- {k}: {v}" for k, v in others.items()])
                synthesis_prompt = (
                    f"After hearing all perspectives:\n{others_text}\n\n"
                    f"Give your final, refined answer. Acknowledge valid counterpoints. "
                    f"Be brief. Original question: {self.question}"
                )
                result = await agent.ask(synthesis_prompt, use_rag=False)

            return result
        except Exception as e:
            return {"error": str(e)}

    async def synthesize(self, responses: Dict) -> Dict:
        """Synthesize all clone responses into a unified perspective"""
        start_time = time.time()

        # Build synthesis prompt
        responses_text = ""
        for clone_name, response in responses.items():
            if isinstance(response, dict):
                resp_text = response.get("response", str(response))
            else:
                resp_text = str(response)
            responses_text += f"\n## {clone_name}\n{resp_text}\n"

        synthesis_prompt = (
            f"You are a synthesis engine. Multiple expert clones answered this question:\n"
            f"Question: {self.question}\n\n"
            f"Their responses:\n{responses_text}\n\n"
            f"Provide:\n"
            f"1. A unified perspective combining the best insights\n"
            f"2. Key agreements between the experts\n"
            f"3. Key disagreements or different perspectives\n"
            f"4. Final recommendation\n\n"
            f"Be concise and actionable."
        )

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{OLLAMA_URL}/api/chat",
                    json={
                        "model": SYNTHESIS_MODEL,
                        "messages": [
                            {"role": "system", "content": "You synthesize expert perspectives into unified insights."},
                            {"role": "user", "content": synthesis_prompt},
                        ],
                        "stream": False,
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                synthesis_text = data.get("message", {}).get("content", "")
                synth_tokens = data.get("prompt_eval_count", 0) + data.get("eval_count", 0)
        except Exception as e:
            synthesis_text = f"Synthesis error: {str(e)}"
            synth_tokens = 0

        elapsed = time.time() - start_time
        self._metrics["synthesis_time"] = round(elapsed, 2)
        self._metrics["total_tokens"] += synth_tokens

        return {
            "text": synthesis_text,
            "model": SYNTHESIS_MODEL,
            "synthesis_time": round(elapsed, 2),
        }

    def get_clones(self) -> List[Dict]:
        """Get list of available clones with metadata"""
        clones_info = []
        for clone in self.clones:
            try:
                store = BrainStore(clone)
                stats = store.get_stats()
                clones_info.append({
                    "name": clone,
                    "chunk_count": stats.get("points_count", 0),
                    "source_types": self._get_source_types(clone),
                    "available": True,
                })
            except Exception:
                clones_info.append({
                    "name": clone,
                    "chunk_count": 0,
                    "source_types": [],
                    "available": False,
                    "error": "Could not fetch stats",
                })

        return clones_info

    def _get_source_types(self, clone: str) -> List[str]:
        """Get unique source types for a clone from registry"""
        try:
            types_key = f"brain:clone:{clone}:source_types"
            types = redis_client.smembers(types_key)
            return list(types) if types else []
        except Exception:
            return []

    @staticmethod
    def get_debate_history(debate_id: str) -> Optional[Dict]:
        """Retrieve saved debate history"""
        try:
            data = redis_client.get(f"brain:squad:debate:{debate_id}")
            if data:
                return json.loads(data)
            return None
        except Exception:
            return None
