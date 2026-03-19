"""Model Selector - Routes prompts to optimal Ollama model"""

import re
from typing import Optional

# Model routing configuration
MODEL_CONFIG = {
    "deepseek-coder:6.7b": {
        "name": "deepseek-coder:6.7b",
        "category": "code_specialist",
        "keywords": ["code", "debug", "function", "algorithm", "error", "fix", "implement", "refactor", "test", "git", "cli", "bash", "python", "javascript", "typescript", "write", "script"],
        "patterns": [
            r"\b(function|def|class|async|await|import|export|return|const|let|var|if|for|while)\b",
            r"\b(error|bug|fix|debug|exception|traceback)\b",
            r"\b(endpoint|database|sql|docker|kubernetes|devops)\b",
            r"\b(github|gitlab|deploy|build|test)\b",
        ]
    },
    "qwen2.5:14b": {
        "name": "qwen2.5:14b",
        "category": "reasoning_engine",
        "keywords": ["analyze", "explain", "design", "architecture", "strategy", "plan", "decision", "complex", "reason", "compare", "evaluate", "recommend", "tradeoff", "approach"],
        "patterns": [
            r"\b(analyze|explain|design|architect|strategy|plan|decide|compare|evaluate|tradeoff)\b",
            r"\b(why|how|what if|should|consider|method|approach)\b",
            r"\b(benefit|disadvantage|pro|con|impact)\b",
            r"\b(system|component|module|layer|structure|best)\b",
        ]
    },
    "qwen2.5:7b": {
        "name": "qwen2.5:7b",
        "category": "general_fast",
        "keywords": ["hello", "help", "info", "question", "answer", "what", "when", "where", "who"],
        "patterns": [
            r"\b(hello|hi|what|when|where|who|how|why|what|please|thanks)\b",
        ]
    }
}

def select_model(prompt: str) -> str:
    """
    Select optimal model based on prompt analysis.

    Routing strategy:
    1. Strong code indicators → deepseek-coder
    2. Strong reasoning indicators → qwen2.5:14b
    3. Default to fast model → qwen2.5:7b

    Args:
        prompt: User prompt/task

    Returns:
        Model name string (e.g., "deepseek-coder:6.7b")
    """

    if not prompt or len(prompt.strip()) == 0:
        return "qwen2.5:7b"  # Default for empty prompts

    # Convert to lowercase for analysis
    prompt_lower = prompt.lower()
    prompt_length = len(prompt)

    # Strong code indicators (definitive)
    strong_code_indicators = [
        r"\b(function|def|class|async|await|import|export|return|const|let|var)\b",
        r"\b(error|bug|fix|debug|exception|traceback)\b",
        r"\b(python|javascript|typescript|bash|docker|kubectl|sql|json|xml)\b",
        r"\b(api|endpoint|server|client|backend|frontend|database)\b",
    ]

    # Strong reasoning indicators (definitive)
    strong_reasoning_indicators = [
        r"\b(analyze|design|architect|strategy|plan|compare)\b",
        r"\b(tradeoff|evaluate|recommend|approach|method|solution)\b",
    ]

    code_score = 0
    reasoning_score = 0

    # Check strong code patterns
    for pattern in strong_code_indicators:
        matches = len(re.findall(pattern, prompt_lower, re.IGNORECASE))
        code_score += matches * 3

    # Check strong reasoning patterns
    for pattern in strong_reasoning_indicators:
        matches = len(re.findall(pattern, prompt_lower, re.IGNORECASE))
        reasoning_score += matches * 3

    # Secondary keyword checks
    for keyword in MODEL_CONFIG["deepseek-coder:6.7b"]["keywords"]:
        if keyword in prompt_lower:
            code_score += 1

    for keyword in MODEL_CONFIG["qwen2.5:14b"]["keywords"]:
        if keyword in prompt_lower:
            reasoning_score += 1

    # Decision logic
    if code_score >= reasoning_score and code_score > 0:
        return "deepseek-coder:6.7b"
    elif reasoning_score > 0:
        return "qwen2.5:14b"
    else:
        return "qwen2.5:7b"  # Default/fallback
