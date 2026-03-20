"""
Debate System — Executes multi-round debates between clones
"""

import json
import hashlib
from typing import Dict, List
from collections import Counter


class DebateRound:
    """Represents a single debate round"""

    def __init__(self, round_num: int, question: str, previous_responses: Dict = None):
        self.round_num = round_num
        self.question = question
        self.previous_responses = previous_responses or {}
        self.responses = {}

    def get_prompt(self) -> str:
        """Get prompt for this round"""
        if self.round_num == 1:
            return f"Answer this question: {self.question}"
        elif self.round_num == 2:
            prev_text = json.dumps(self.previous_responses, indent=2)
            return f"Considering these perspectives:\n{prev_text}\n\nProvide your response: {self.question}"
        else:
            return f"Synthesize all perspectives on: {self.question}"


def score_consensus(responses: Dict[str, str]) -> Dict:
    """Score consensus across responses using keyword overlap"""
    if not responses:
        return {"consensus_score": 0, "agreement_level": "none"}

    # Extract key terms from responses
    all_terms = []
    for response in responses.values():
        if isinstance(response, str):
            terms = response.lower().split()
            all_terms.extend([t for t in terms if len(t) > 3])

    # Count term frequency
    term_counts = Counter(all_terms)
    top_terms = [term for term, count in term_counts.most_common(10) if count > 1]

    # Calculate consensus score
    if not all_terms:
        return {"consensus_score": 0, "agreement_level": "none"}

    consensus_score = len(top_terms) / len(set(all_terms)) if all_terms else 0

    if consensus_score > 0.7:
        agreement_level = "high"
    elif consensus_score > 0.4:
        agreement_level = "medium"
    else:
        agreement_level = "low"

    return {
        "consensus_score": round(consensus_score, 2),
        "agreement_level": agreement_level,
        "common_themes": top_terms[:5]
    }
