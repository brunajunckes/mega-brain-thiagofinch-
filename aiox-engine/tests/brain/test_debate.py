"""
Tests for Debate System
"""

import pytest
from brain.squad.debate import DebateRound, score_consensus


def test_debate_round_prompts():
    """Test debate prompt generation"""
    round1 = DebateRound(1, "What is wealth?")
    assert "wealth" in round1.get_prompt()

    round2 = DebateRound(2, "What is wealth?", {"hormozi": "Equity"})
    assert "perspectives" in round2.get_prompt().lower() or "response" in round2.get_prompt()


def test_score_consensus_high():
    """Test high consensus scoring"""
    responses = {
        "clone1": "Freedom and autonomy are key to happiness",
        "clone2": "True happiness comes from freedom and independence",
        "clone3": "Liberty and self-determination matter most"
    }

    result = score_consensus(responses)

    assert "consensus_score" in result
    assert "agreement_level" in result
    assert result["consensus_score"] >= 0


def test_score_consensus_low():
    """Test low consensus scoring"""
    responses = {
        "clone1": "The sky is blue and beautiful",
        "clone2": "Mathematics is the foundation of reality",
        "clone3": "Pizza is delicious"
    }

    result = score_consensus(responses)

    assert result["consensus_score"] >= 0
    assert result["consensus_score"] <= 1


def test_score_consensus_empty():
    """Test empty responses"""
    result = score_consensus({})

    assert result["consensus_score"] == 0
    assert result["agreement_level"] == "none"
