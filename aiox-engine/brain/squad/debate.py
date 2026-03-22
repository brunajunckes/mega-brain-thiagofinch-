"""
Debate System — Executes multi-round debates between clones
"""

import json
from typing import Dict, List
from collections import Counter


# Debate prompt templates per round
DEBATE_PROMPTS = {
    1: "Answer this question thoroughly: {question}",
    2: (
        "Other experts gave these perspectives:\n{previous}\n\n"
        "Challenge their views. Be concise and argumentative. "
        "What did they miss? Where are they wrong? "
        "Original question: {question}"
    ),
    3: (
        "After this debate:\n{previous}\n\n"
        "Synthesize all perspectives on: {question}\n"
        "Acknowledge valid points. Give your final, refined answer."
    ),
}


class DebateRound:
    """Represents a single debate round"""

    def __init__(self, round_num: int, question: str, previous_responses: Dict = None):
        self.round_num = round_num
        self.question = question
        self.previous_responses = previous_responses or {}
        self.responses = {}

    def get_prompt(self) -> str:
        """Get prompt for this round with appropriate style"""
        template_key = min(self.round_num, 3)
        template = DEBATE_PROMPTS.get(template_key, DEBATE_PROMPTS[1])

        prev_text = ""
        if self.previous_responses:
            prev_text = "\n".join(
                [f"- {name}: {resp}" for name, resp in self.previous_responses.items()]
            )

        return template.format(
            question=self.question,
            previous=prev_text,
        )

    def is_argumentative(self) -> bool:
        """Return whether this round should produce shorter, more argumentative responses"""
        return self.round_num >= 2


def score_consensus(responses: Dict[str, str]) -> Dict:
    """
    Score consensus across responses using keyword overlap.
    Returns consensus percentage and key agreement/disagreement points.
    """
    if not responses:
        return {
            "consensus_score": 0,
            "consensus_percentage": 0,
            "agreement_level": "none",
            "common_themes": [],
            "agreements": [],
            "disagreements": [],
        }

    # Extract key terms from each response (words > 3 chars)
    clone_terms = {}
    all_terms = []
    for clone_name, response in responses.items():
        if isinstance(response, dict):
            response = response.get("response", str(response))
        if isinstance(response, str):
            terms = [t.lower().strip(".,!?;:\"'()") for t in response.split() if len(t) > 3]
            clone_terms[clone_name] = set(terms)
            all_terms.extend(terms)

    if not all_terms:
        return {
            "consensus_score": 0,
            "consensus_percentage": 0,
            "agreement_level": "none",
            "common_themes": [],
            "agreements": [],
            "disagreements": [],
        }

    # Count term frequency across clones
    term_counts = Counter(all_terms)
    num_clones = len(clone_terms)

    # Find terms that appear in multiple clones
    shared_terms = []
    unique_terms = {}

    for term, count in term_counts.most_common(50):
        clones_with_term = sum(1 for terms in clone_terms.values() if term in terms)
        if clones_with_term > 1:
            shared_terms.append(term)
        else:
            for clone_name, terms in clone_terms.items():
                if term in terms:
                    unique_terms.setdefault(clone_name, []).append(term)

    # Calculate consensus: % of clones that share common terms
    if num_clones <= 1:
        consensus_pct = 100
    else:
        # How many terms are shared vs unique
        total_unique = len(set(all_terms))
        shared_count = len(shared_terms)
        consensus_pct = round((shared_count / max(total_unique, 1)) * 100, 1)

    # Determine agreement level
    if consensus_pct > 60:
        agreement_level = "high"
    elif consensus_pct > 30:
        agreement_level = "medium"
    else:
        agreement_level = "low"

    # Build agreements (top shared themes)
    agreements = shared_terms[:5]

    # Build disagreements (unique terms per clone)
    disagreements = []
    for clone_name, terms in unique_terms.items():
        if terms:
            disagreements.append({
                "clone": clone_name,
                "unique_points": terms[:3],
            })

    consensus_score = round(consensus_pct / 100, 2)

    return {
        "consensus_score": consensus_score,
        "consensus_percentage": consensus_pct,
        "agreement_level": agreement_level,
        "common_themes": shared_terms[:10],
        "agreements": agreements,
        "disagreements": disagreements[:5],
    }
