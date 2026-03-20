"""
Debate System — Multi-round debate between expert clones
"""

import asyncio
import json
import os
from typing import List, Dict
from datetime import datetime
from brain.clone.agent import CloneAgent
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

DEBATE_PROMPTS = {
    1: "Answer this question clearly and concisely: {question}",
    2: "Other experts have given these perspectives:\n{other_perspectives}\n\nRespond with your perspective, addressing any disagreements: {question}",
    3: "Consider all previous perspectives and provide a synthesized response: {question}"
}


class DebateManager:
    """Manage multi-round debate between clones"""

    def __init__(self, question: str, clones: List[str]):
        self.question = question
        self.clones = clones
        self.debate_id = f"debate_{datetime.now().timestamp()}"
        self.rounds = {}

    async def execute(self, num_rounds: int = 3) -> Dict:
        """Execute debate for specified number of rounds"""
        debate_results = {
            "debate_id": self.debate_id,
            "question": self.question,
            "clones": self.clones,
            "rounds": [],
            "timestamp": datetime.now().isoformat()
        }

        for round_num in range(1, num_rounds + 1):
            round_result = await self._execute_round(round_num, debate_results)
            debate_results["rounds"].append(round_result)

        # Save to Redis
        redis_client.setex(
            f"brain:squad:debate:{self.debate_id}",
            86400,  # 24h TTL
            json.dumps(debate_results)
        )

        return debate_results

    async def _execute_round(self, round_num: int, debate_results: Dict) -> Dict:
        """Execute a single debate round"""
        round_data = {
            "round": round_num,
            "responses": {},
            "timestamp": datetime.now().isoformat()
        }

        # Build prompts for this round
        if round_num == 1:
            prompts = {clone: DEBATE_PROMPTS[1].format(question=self.question)
                      for clone in self.clones}
        else:
            # Include previous responses in prompt
            prev_responses = debate_results["rounds"][-1]["responses"]
            other_perspectives = "\n".join([
                f"- {slug}: {resp.get('response', 'No response')[:200]}..."
                for slug, resp in prev_responses.items()
            ])
            prompts = {clone: DEBATE_PROMPTS[round_num].format(
                question=self.question,
                other_perspectives=other_perspectives
            ) for clone in self.clones}

        # Query all clones in parallel for this round
        tasks = []
        for slug in self.clones:
            agent = CloneAgent(slug)
            # Use the debate prompt instead of the normal question
            tasks.append(agent.ask(prompts[slug], use_rag=False))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for slug, result in zip(self.clones, results):
            if isinstance(result, Exception):
                round_data["responses"][slug] = {"error": str(result)}
            else:
                round_data["responses"][slug] = result

        return round_data

    @staticmethod
    def score_consensus(debate_results: Dict) -> Dict:
        """Score agreement between clones"""
        # Extract all responses from final round
        final_round = debate_results["rounds"][-1]
        responses = final_round["responses"]

        # Simple keyword-based consensus scoring
        keywords_mentioned = {}
        for slug, resp in responses.items():
            text = resp.get("response", "").lower()
            # Count key consensus words (would be more sophisticated in production)
            consensus_words = ["agree", "consensus", "important", "key", "critical"]
            for word in consensus_words:
                if word in text:
                    keywords_mentioned[word] = keywords_mentioned.get(word, 0) + 1

        consensus_score = [
            {
                "word": keyword,
                "clones_mentioned": count,
                "agreement_percentage": (count / len(responses)) * 100
            } for keyword, count in keywords_mentioned.items()
        ]

        return {
            "consensus_analysis": consensus_score,
            "total_agreement_score": sum(c["agreement_percentage"] for c in consensus_score) / len(
                consensus_score) if consensus_score else 0
        }


if __name__ == "__main__":
    import sys

    async def test():
        if len(sys.argv) > 1:
            question = sys.argv[1]
            clones = sys.argv[2].split(",") if len(sys.argv) > 2 else ["test_clone"]
            manager = DebateManager(question, clones)
            result = await manager.execute(3)
            print(json.dumps(result, indent=2))

    asyncio.run(test())
