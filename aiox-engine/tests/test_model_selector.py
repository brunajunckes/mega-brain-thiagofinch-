"""Tests for model selection logic"""

import sys
sys.path.insert(0, '/aiox-engine')

from router.selector import select_model

def test_code_detection():
    """Test that code prompts select deepseek-coder"""
    code_prompts = [
        "write a python function to parse JSON",
        "debug this error: AttributeError in line 42",
        "implement a REST API endpoint",
        "fix the git merge conflict",
    ]
    for prompt in code_prompts:
        model = select_model(prompt)
        assert model == "deepseek-coder:6.7b", f"Expected deepseek for '{prompt}', got {model}"
    print("✅ Code detection tests passed")


def test_reasoning_detection():
    """Test that reasoning prompts select qwen2.5:14b"""
    reasoning_prompts = [
        "analyze the system architecture",
        "explain why microservices are better than monoliths",
        "design a caching strategy for our database",
        "compare REST vs GraphQL for our API",
    ]
    for prompt in reasoning_prompts:
        model = select_model(prompt)
        assert model == "qwen2.5:14b", f"Expected qwen2.5:14b for '{prompt}', got {model}"
    print("✅ Reasoning detection tests passed")


def test_default_fallback():
    """Test that simple prompts default to qwen2.5:7b"""
    simple_prompts = [
        "hello",
        "what time is it",
        "hi there",
        "",
    ]
    for prompt in simple_prompts:
        model = select_model(prompt)
        assert model == "qwen2.5:7b", f"Expected qwen2.5:7b for '{prompt}', got {model}"
    print("✅ Default fallback tests passed")


def test_empty_prompt():
    """Test empty prompt handling"""
    model = select_model("")
    assert model == "qwen2.5:7b"
    print("✅ Empty prompt test passed")


if __name__ == "__main__":
    test_code_detection()
    test_reasoning_detection()
    test_default_fallback()
    test_empty_prompt()
    print("\n✅ All model selector tests passed!")
