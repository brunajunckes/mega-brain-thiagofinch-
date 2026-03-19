"""Integration tests for AIOX Engine"""

import sys
import asyncio
sys.path.insert(0, '/aiox-engine')

from router.selector import select_model
from memory.store import generate_vector, ensure_collection_exists


async def test_vector_generation():
    """Test vector generation from text"""
    text = "This is a test prompt"
    vector = generate_vector(text)

    assert isinstance(vector, list), "Vector should be a list"
    assert len(vector) == 384, f"Vector size should be 384, got {len(vector)}"
    assert all(isinstance(v, (int, float)) for v in vector), "All vector elements should be numeric"
    print("✅ Vector generation test passed")


async def test_model_routing():
    """Test model routing logic"""
    # Test code routing
    code_result = select_model("write a python function")
    assert code_result == "deepseek-coder:6.7b"

    # Test reasoning routing
    reasoning_result = select_model("design a system architecture")
    assert reasoning_result == "qwen2.5:14b"

    # Test default routing
    default_result = select_model("hello world")
    assert default_result == "qwen2.5:7b"

    print("✅ Model routing test passed")


async def test_consistency():
    """Test that same input produces same output"""
    prompt = "analyze this complex algorithm"
    result1 = select_model(prompt)
    result2 = select_model(prompt)

    assert result1 == result2, "Same prompt should produce same model selection"
    print("✅ Consistency test passed")


async def main():
    """Run all integration tests"""
    await test_vector_generation()
    await test_model_routing()
    await test_consistency()
    print("\n✅ All integration tests passed!")


if __name__ == "__main__":
    asyncio.run(main())
