"""
Squad Coordinator — Query multiple clones in parallel and synthesize responses
"""

import asyncio
import json
import os
from typing import Optional, Dict, List
from datetime import datetime
from brain.clone.agent import CloneAgent
from brain.clone.store import BrainStore
import httpx
import redis

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://172.17.0.1:11434")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
SYNTHESIS_MODEL = os.getenv("SYNTHESIS_MODEL", "qwen2.5:14b")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class SquadCoordinator:
    """Coordinate queries across multiple expert clones"""

    def __init__(self, question: str, clones: Optional[List[str]] = None, timeout: int = 30):
        self.question = question
        self.clones = clones
        self.timeout = timeout
        self.all_clones = self._discover_clones() if not clones else clones

    def _discover_clones(self) -> List[str]:
        """Discover all available clones from Qdrant"""
        try:
            from qdrant_client import QdrantClient
            url = os.getenv("QDRANT_URL", "http://localhost:6333")
            api_key = os.getenv("QDRANT_API_KEY", "aiox-secret-key")
            client = QdrantClient(url=url, api_key=api_key)

            collections = client.get_collections().collections
            clones = []

            for col in collections:
                if col.name.startswith("brain_clone_"):
                    slug = col.name.replace("brain_clone_", "")
                    clones.append(slug)

            return clones
        except:
            return []

    async def ask_all(self, use_rag: bool = True) -> Dict:
        """Query all clones in parallel"""
        tasks = []
        for slug in self.all_clones:
            agent = CloneAgent(slug)
            tasks.append(agent.ask(self.question, use_rag=use_rag))

        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=self.timeout
            )
        except asyncio.TimeoutError:
            results = [{"error": "timeout"} for _ in self.all_clones]

        responses = {}
        for slug, result in zip(self.all_clones, results):
            if isinstance(result, Exception):
                responses[slug] = {"error": str(result)}
            elif isinstance(result, dict) and "error" in result:
                responses[slug] = result
            else:
                responses[slug] = result

        return {
            "question": self.question,
            "all_responses": responses,
            "num_clones": len(self.all_clones),
            "timestamp": datetime.now().isoformat()
        }

    async def synthesize(self, all_responses: Dict) -> str:
        """Generate unified synthesis from all clone responses"""
        response_text = "\n\n".join([
            f"**{slug}**: {resp.get('response', 'No response')}"
            for slug, resp in all_responses.items()
            if isinstance(resp, dict) and "response" in resp
        ])

        synthesis_prompt = f"""You are an expert synthesizer. The following are perspectives from {len(all_responses)} different expert clones on this question:

Question: {self.question}

Perspectives:
{response_text}

Please synthesize these perspectives into:
1. A unified answer that captures the common wisdom
2. Key areas of agreement
3. Key areas of disagreement
4. Recommendations

Provide a balanced, comprehensive synthesis."""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/chat",
                    json={
                        "model": SYNTHESIS_MODEL,
                        "messages": [{"role": "user", "content": synthesis_prompt}],
                        "stream": False
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get("message", {}).get("content", "")
        except Exception as e:
            return f"Error synthesizing responses: {str(e)}"

    async def debate(self, rounds: int = 3) -> Dict:
        """Execute multi-round debate between clones"""
        from brain.squad.debate import DebateManager

        manager = DebateManager(self.question, self.all_clones)
        debate_result = await manager.execute(rounds)
        return debate_result

    def get_clones(self) -> List[str]:
        """Get list of all available clones"""
        return self.all_clones


if __name__ == "__main__":
    import sys

    async def test():
        if len(sys.argv) > 1:
            question = sys.argv[1]
            coordinator = SquadCoordinator(question)
            result = await coordinator.ask_all()
            print(json.dumps(result, indent=2))

    asyncio.run(test())
