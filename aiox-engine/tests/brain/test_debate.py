"""
Tests for Debate System
"""

import pytest
from brain.squad.debate import DebateRound, score_consensus, DEBATE_PROMPTS


def test_debate_round_1_prompt():
    """Test round 1 uses normal prompt"""
    round1 = DebateRound(1, "What is wealth?")
    prompt = round1.get_prompt()
    assert "wealth" in prompt.lower()
    assert round1.is_argumentative() is False


def test_debate_round_2_prompt():
    """Test round 2 uses argumentative prompt"""
    round2 = DebateRound(2, "What is wealth?", {"hormozi": "Equity is wealth"})
    prompt = round2.get_prompt()
    assert "challenge" in prompt.lower() or "wrong" in prompt.lower()
    assert "hormozi" in prompt.lower() or "equity" in prompt.lower()
    assert round2.is_argumentative() is True


def test_debate_round_3_prompt():
    """Test round 3 uses synthesis prompt"""
    round3 = DebateRound(3, "What is wealth?", {"hormozi": "Equity", "naval": "Leverage"})
    prompt = round3.get_prompt()
    assert "synthesize" in prompt.lower() or "final" in prompt.lower()
    assert round3.is_argumentative() is True


def test_debate_prompts_exist():
    """Test all debate prompt templates exist"""
    assert 1 in DEBATE_PROMPTS
    assert 2 in DEBATE_PROMPTS
    assert 3 in DEBATE_PROMPTS


def test_score_consensus_high():
    """Test high consensus scoring"""
    responses = {
        "clone1": "Freedom and autonomy are key to happiness and growth",
        "clone2": "True happiness comes from freedom and independence and growth",
        "clone3": "Personal freedom and growth lead to real happiness",
    }

    result = score_consensus(responses)

    assert "consensus_score" in result
    assert "consensus_percentage" in result
    assert "agreement_level" in result
    assert "common_themes" in result
    assert "agreements" in result
    assert "disagreements" in result
    assert result["consensus_score"] >= 0
    assert result["consensus_percentage"] >= 0


def test_score_consensus_low():
    """Test low consensus scoring"""
    responses = {
        "clone1": "The sky is blue and beautiful today in spring",
        "clone2": "Mathematics is the foundation of reality and existence",
        "clone3": "Pizza is delicious with extra pepperoni and cheese",
    }

    result = score_consensus(responses)

    assert result["consensus_score"] >= 0
    assert result["consensus_score"] <= 1
    assert result["consensus_percentage"] >= 0
    assert result["consensus_percentage"] <= 100


def test_score_consensus_empty():
    """Test empty responses"""
    result = score_consensus({})

    assert result["consensus_score"] == 0
    assert result["consensus_percentage"] == 0
    assert result["agreement_level"] == "none"
    assert result["common_themes"] == []
    assert result["agreements"] == []
    assert result["disagreements"] == []


def test_score_consensus_single_clone():
    """Test consensus with single clone"""
    responses = {"clone1": "Some response text here"}

    result = score_consensus(responses)

    assert result["consensus_percentage"] == 100
    assert result["agreement_level"] == "high"


def test_score_consensus_with_dict_responses():
    """Test consensus scoring handles dict responses"""
    responses = {
        "clone1": {"response": "Growth comes from discipline and habits"},
        "clone2": {"response": "Success requires discipline and consistency"},
    }

    result = score_consensus(responses)

    assert result["consensus_score"] >= 0
    assert "common_themes" in result


def test_score_consensus_exports_json():
    """Test consensus result is JSON-serializable"""
    responses = {
        "clone1": "Test response one about business growth",
        "clone2": "Test response two about business scaling",
    }

    result = score_consensus(responses)

    import json
    serialized = json.dumps(result)
    assert serialized is not None
    parsed = json.loads(serialized)
    assert parsed["consensus_score"] == result["consensus_score"]
