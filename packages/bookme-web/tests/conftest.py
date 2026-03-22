"""
Shared fixtures for BookMe test suite.
All LLM calls and external services are mocked.
"""
import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Ensure the parent package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    """Remove all LLM-related env vars so tests start from a clean slate."""
    for key in [
        "DEEPSEEK_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY",
        "OPENROUTER_API_KEY", "OLLAMA_URL", "OLLAMA_MODEL",
        "OPENAI_MODEL", "ANTHROPIC_MODEL", "DEEPSEEK_MODEL", "OPENROUTER_MODEL",
    ]:
        monkeypatch.delenv(key, raising=False)


# ---------------------------------------------------------------------------
# Mock LLM call — shared across both modules
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_call_llm():
    """Patch call_llm in novel_process so it returns controlled text."""
    with patch("novel_process.call_llm", return_value=None) as m:
        yield m


@pytest.fixture
def mock_call_llm_backend():
    """Patch call_llm at the backend-god-mode module level."""
    # backend-god-mode defines call_llm itself, so we patch the module attribute
    import importlib
    mod_name = "backend-god-mode"
    # Python can't import hyphenated names directly; use importlib
    spec = importlib.util.spec_from_file_location(
        "backend_god_mode",
        os.path.join(os.path.dirname(__file__), "..", "backend-god-mode.py"),
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    with patch.object(mod, "call_llm", return_value=None) as m:
        yield m, mod


# ---------------------------------------------------------------------------
# Sample text fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_fiction_text():
    """A short Portuguese fiction paragraph for testing."""
    return (
        "Maria olhou pela janela embaçada. O vento cortava as folhas secas do quintal. "
        "Ela disse algo sobre o frio. João perguntou se queria café. "
        "\"Não\", ela respondeu, apertando as mãos. O silêncio caiu pesado entre eles. "
        "Maria sabia que aquela conversa não podia mais ser adiada. "
        "O coração batia forte enquanto as palavras se formavam na boca. "
        "Ela respirou fundo e começou a falar. João ouviu em silêncio. "
        "As lágrimas vieram antes das palavras. O destino de ambos estava selado."
    )


@pytest.fixture
def sample_nonfiction_text():
    """A short Portuguese non-fiction paragraph for testing."""
    return (
        "A pesquisa sobre inteligência artificial avançou significativamente nos últimos anos. "
        "Estudos recentes demonstram que modelos de linguagem podem gerar texto coerente. "
        "No entanto, existem limitações importantes a considerar. "
        "A análise dos dados revela padrões interessantes de comportamento. "
        "A conclusão é que mais pesquisa é necessária para entender o impacto da tecnologia. "
        "Evidências sugerem que a prática constante melhora os resultados. "
        "A metodologia empregada foi rigorosa e os resultados são confiáveis."
    )


@pytest.fixture
def sample_ai_heavy_text():
    """Text with many AI-tell patterns for detector testing."""
    return (
        "É importante notar que a situação é complexa. No entanto, devemos considerar todos os aspectos. "
        "No entanto, a análise revela padrões. No entanto, não podemos ignorar os fatos. "
        "No entanto, é fundamental destacar que existem alternativas. "
        "Possivelmente, a melhor abordagem seria diferente. Aparentemente, os resultados confirmam isso. "
        "Talvez seja necessário reavaliar. De certa forma, todos concordam. "
        "Indubitavelmente, a ciência avança. É importante notar que muitos discordam. "
        "É importante notar que existem exceções. Vale ressaltar que o progresso é lento."
    )


@pytest.fixture
def sample_chapter_content():
    """A longer fiction chapter excerpt for story bible / notes testing."""
    return (
        "Capítulo 3: A Chegada\n\n"
        "Carlos entrou na sala com passos cautelosos. A cidade de Florianópolis "
        "brilhava pela janela. Ana estava sentada no sofá, lendo um livro antigo.\n\n"
        "\"Você demorou\", Ana disse, sem levantar os olhos.\n\n"
        "Carlos não respondeu. Ele pensava em Roberto, que tinha partido na semana anterior. "
        "Roberto sempre fora o mais corajoso dos três. Agora restavam apenas Carlos e Ana "
        "naquela casa antiga.\n\n"
        "A chuva começou a cair sobre Florianópolis. Carlos olhou pela janela e viu "
        "as luzes da cidade se refletindo na água. Ana fechou o livro e levantou.\n\n"
        "\"Precisamos falar sobre Roberto\", ela disse.\n\n"
        "Carlos sabia que ela tinha razão. Roberto havia deixado uma carta, e naquela carta "
        "havia segredos que mudariam tudo. Carlos e Ana se entreolharam. "
        "A verdade estava prestes a emergir. Carlos sentou-se e começou a ler a carta em voz alta."
    )


@pytest.fixture
def voice_profile_dict():
    """A pre-built voice profile dict for reconstruction tests."""
    return {
        "sentence_rhythm": "Variado",
        "vocabulary_register": "Coloquial-inteligente",
        "dialogue_style": "Naturalista",
        "emotional_temperature": "Quente",
        "interiority_depth": "Profundo",
        "punctuation_habits": "Pontos para ênfase",
        "structural_instincts": "Linear",
        "tonal_anchors": "Pragmatismo",
        "pov_and_tense": "Terceira pessoa, passado",
        "avoid": ["Prosa roxa", "Advérbios"],
        "genre": "fiction",
        "topic": "drama",
        "source": "custom",
        "custom_rules": {"max_adverbs": 5},
    }
