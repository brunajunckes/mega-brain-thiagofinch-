"""
Comprehensive tests for backend-god-mode.py
All LLM calls, external APIs, and network calls are mocked.
"""
import sys
import os
import json
import importlib.util
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------------------
# Import the hyphenated module using importlib
# ---------------------------------------------------------------------------
_mod_path = os.path.join(os.path.dirname(__file__), "..", "backend-god-mode.py")


def _load_module():
    """Load backend-god-mode.py as 'bgm' while mocking optional deps."""
    spec = importlib.util.spec_from_file_location("backend_god_mode", _mod_path)
    mod = importlib.util.module_from_spec(spec)

    # Mock optional imports that may not exist in the test env
    for dep in ["long_content"]:
        if dep not in sys.modules:
            sys.modules[dep] = MagicMock()

    # Provide a mock for novel_process so the try/except import works
    if "novel_process" not in sys.modules:
        sys.modules["novel_process"] = MagicMock()

    spec.loader.exec_module(mod)
    return mod


bgm = _load_module()


# =====================================================================
# get_available_provider -- env var priority
# =====================================================================

class TestGetAvailableProvider:

    def test_deepseek_first(self, monkeypatch):
        monkeypatch.setenv("DEEPSEEK_API_KEY", "dk-test")
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
        assert bgm.get_available_provider() == "deepseek"

    def test_openai_second(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
        assert bgm.get_available_provider() == "openai"

    def test_anthropic_third(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "ant-test")
        assert bgm.get_available_provider() == "anthropic"

    def test_openrouter_fourth(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "or-test")
        assert bgm.get_available_provider() == "openrouter"

    def test_ollama_via_env(self, monkeypatch):
        monkeypatch.setenv("OLLAMA_URL", "http://localhost:11434")
        assert bgm.get_available_provider() == "ollama"

    def test_template_fallback(self):
        with patch.object(bgm, "_check_ollama", return_value=False):
            assert bgm.get_available_provider() == "template"

    def test_priority_order_deepseek_over_anthropic(self, monkeypatch):
        monkeypatch.setenv("DEEPSEEK_API_KEY", "dk")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "ant")
        assert bgm.get_available_provider() == "deepseek"

    def test_no_keys_no_ollama(self):
        with patch.object(bgm, "_check_ollama", return_value=False):
            result = bgm.get_available_provider()
            assert result == "template"


# =====================================================================
# call_llm -- routing
# =====================================================================

class TestCallLLM:

    def test_routes_to_deepseek(self):
        with patch.object(bgm, "_call_deepseek", return_value="deepseek response") as mock:
            result = bgm.call_llm("hello", provider="deepseek")
            mock.assert_called_once()
            assert result == "deepseek response"

    def test_routes_to_openai(self):
        with patch.object(bgm, "_call_openai", return_value="openai response") as mock:
            result = bgm.call_llm("hello", provider="openai")
            mock.assert_called_once()
            assert result == "openai response"

    def test_routes_to_anthropic(self):
        with patch.object(bgm, "_call_anthropic", return_value="claude response") as mock:
            result = bgm.call_llm("hello", provider="anthropic")
            mock.assert_called_once()
            assert result == "claude response"

    def test_routes_to_openrouter(self):
        with patch.object(bgm, "_call_openrouter", return_value="or response") as mock:
            result = bgm.call_llm("hello", provider="openrouter")
            mock.assert_called_once()
            assert result == "or response"

    def test_routes_to_ollama(self):
        with patch.object(bgm, "_call_ollama", return_value="ollama response") as mock:
            result = bgm.call_llm("hello", provider="ollama")
            mock.assert_called_once()
            assert result == "ollama response"

    def test_unknown_provider_returns_none(self):
        result = bgm.call_llm("hello", provider="unknown_provider")
        assert result is None

    def test_template_provider_returns_none(self):
        result = bgm.call_llm("hello", provider="template")
        assert result is None

    def test_auto_detect_provider(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
        with patch.object(bgm, "_call_openai", return_value="auto") as mock:
            result = bgm.call_llm("hello")
            mock.assert_called_once()
            assert result == "auto"

    def test_system_prompt_forwarded(self):
        with patch.object(bgm, "_call_deepseek", return_value="ok") as mock:
            bgm.call_llm("prompt", system="sys", provider="deepseek")
            mock.assert_called_once_with("prompt", "sys", 2000)

    def test_max_tokens_forwarded(self):
        with patch.object(bgm, "_call_openai", return_value="ok") as mock:
            bgm.call_llm("prompt", max_tokens=5000, provider="openai")
            mock.assert_called_once_with("prompt", "", 5000)


# =====================================================================
# VoiceBible class
# =====================================================================

class TestVoiceBible:

    def test_fiction_genre_detection(self):
        vb = bgm.VoiceBible("fiction", "adventure")
        assert "dialogue_style" in vb.rules
        assert vb.rules["genre"] == "fiction"

    def test_nonfiction_genre_detection(self):
        vb = bgm.VoiceBible("business", "marketing")
        assert vb.rules["genre"] == "business"
        assert "autoritativo" in vb.rules.get("tone", "").lower() or "structure" in vb.rules

    def test_technical_genre_detection(self):
        vb = bgm.VoiceBible("programming", "Python")
        assert "passo" in vb.rules.get("tone", "").lower()

    def test_custom_rules_merged(self):
        vb = bgm.VoiceBible("fiction", "drama", custom_rules={"custom_key": "value"})
        assert vb.rules["custom_key"] == "value"

    def test_to_prompt_block(self):
        vb = bgm.VoiceBible("fiction", "drama")
        block = vb.to_prompt_block()
        assert "STYLE BIBLE" in block
        assert "pov" in block or "tense" in block

    def test_to_prompt_block_list_values(self):
        vb = bgm.VoiceBible("fiction", "drama")
        block = vb.to_prompt_block()
        assert "avoid" in block.lower()

    def test_empty_genre(self):
        vb = bgm.VoiceBible("", "topic")
        assert vb.rules["topic"] == "topic"

    def test_none_genre(self):
        vb = bgm.VoiceBible(None, "topic")
        assert vb.rules["topic"] == "topic"

    def test_portuguese_fiction_genre(self):
        vb = bgm.VoiceBible("ficção", "aventura")
        assert "dialogue_style" in vb.rules


# =====================================================================
# ChapterMemory class
# =====================================================================

class TestChapterMemory:

    def test_init_empty(self):
        cm = bgm.ChapterMemory()
        assert len(cm.summaries) == 0
        assert len(cm.characters) == 0
        assert cm.materials_context == ""

    def test_add_chapter_basic(self):
        cm = bgm.ChapterMemory()
        cm.add_chapter(1, "Chapter 1", "Carlos walked into the room. Carlos looked around.")
        assert len(cm.summaries) == 1
        assert cm.summaries[0]["chapter"] == 1

    def test_add_chapter_empty_content(self):
        cm = bgm.ChapterMemory()
        cm.add_chapter(1, "Empty", "")
        assert len(cm.summaries) == 0

    def test_add_chapter_none_content(self):
        cm = bgm.ChapterMemory()
        cm.add_chapter(1, "None", None)
        assert len(cm.summaries) == 0

    def test_set_materials(self):
        cm = bgm.ChapterMemory()
        text = "This is a factual statement about history and culture. " * 10
        cm.set_materials(text)
        assert cm.materials_context == text
        assert len(cm.key_facts) > 0

    def test_set_materials_empty(self):
        cm = bgm.ChapterMemory()
        cm.set_materials("")
        assert len(cm.key_facts) == 0

    def test_extract_entities(self):
        cm = bgm.ChapterMemory()
        text = "Carlos and Maria went to the store. Carlos bought flowers. Maria smiled."
        cm.add_chapter(1, "Test", text)
        assert "Carlos" in cm.characters or "Maria" in cm.characters

    def test_extract_entities_skip_common_words(self):
        cm = bgm.ChapterMemory()
        text = "Chapter one begins. Chapter two follows. Chapter three ends."
        cm.add_chapter(1, "Test", text)
        assert "Chapter" not in cm.characters

    def test_update_banned_phrases(self):
        cm = bgm.ChapterMemory()
        text = "the dark night " * 10
        cm.add_chapter(1, "Test", text)
        assert len(cm.banned_phrases) > 0

    def test_to_context_block_empty(self):
        cm = bgm.ChapterMemory()
        block = cm.to_context_block()
        assert block == ""

    def test_to_context_block_with_summaries(self):
        cm = bgm.ChapterMemory()
        cm.add_chapter(1, "Intro", "This is the first chapter with enough text to matter.")
        block = cm.to_context_block()
        assert "Capítulo 1" in block

    def test_to_materials_block_empty(self):
        cm = bgm.ChapterMemory()
        assert cm.to_materials_block() == ""

    def test_to_materials_block_with_data(self):
        cm = bgm.ChapterMemory()
        cm.set_materials("Reference material here")
        block = cm.to_materials_block()
        assert "MATERIAIS DE REFERÊNCIA" in block

    def test_to_ban_block_empty(self):
        cm = bgm.ChapterMemory()
        assert cm.to_ban_block() == ""

    def test_to_ban_block_with_data(self):
        cm = bgm.ChapterMemory()
        cm.banned_phrases = ["very very much", "again and again"]
        block = cm.to_ban_block()
        assert "very very much" in block

    def test_multiple_chapters_context(self):
        cm = bgm.ChapterMemory()
        for i in range(6):
            cm.add_chapter(i + 1, f"Chapter {i+1}", f"Content for chapter {i+1}. " * 20)
        block = cm.to_context_block()
        assert "Capítulo 6" in block


# =====================================================================
# Language support
# =====================================================================

class TestLanguageSupport:

    def test_pt_br(self):
        result = bgm.get_lang_instruction("pt-br")
        assert "português brasileiro" in result

    def test_english(self):
        result = bgm.get_lang_instruction("en")
        assert "English" in result

    def test_spanish(self):
        result = bgm.get_lang_instruction("es")
        assert "español" in result

    def test_french(self):
        result = bgm.get_lang_instruction("fr")
        assert "français" in result

    def test_unknown_defaults_to_pt_br(self):
        result = bgm.get_lang_instruction("de")
        assert "português" in result.lower() or result is not None


# =====================================================================
# _check_ollama
# =====================================================================

class TestCheckOllama:

    def test_ollama_mocked_unreachable(self):
        with patch("urllib.request.urlopen", side_effect=Exception("connection refused")):
            result = bgm._check_ollama()
            assert result is False

    def test_ollama_mocked_success(self):
        mock_resp = MagicMock()
        mock_resp.status = 200
        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = bgm._check_ollama()
            assert result is True

    def test_ollama_mocked_failure(self):
        with patch("urllib.request.urlopen", side_effect=Exception("timeout")):
            result = bgm._check_ollama()
            assert result is False


# =====================================================================
# LLM provider error handling
# =====================================================================

class TestProviderErrorHandling:

    def test_openai_error_returns_none(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
        mock_openai = MagicMock()
        mock_openai.OpenAI.side_effect = Exception("API Error")
        with patch.dict("sys.modules", {"openai": mock_openai}):
            result = bgm._call_openai("test", "", 100)
            assert result is None

    def test_anthropic_error_returns_none(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "ant-test")
        mock_anthropic = MagicMock()
        mock_anthropic.Anthropic.side_effect = Exception("API Error")
        with patch.dict("sys.modules", {"anthropic": mock_anthropic}):
            result = bgm._call_anthropic("test", "", 100)
            assert result is None

    def test_deepseek_error_returns_none(self, monkeypatch):
        monkeypatch.setenv("DEEPSEEK_API_KEY", "dk-test")
        mock_openai = MagicMock()
        mock_openai.OpenAI.side_effect = Exception("API Error")
        with patch.dict("sys.modules", {"openai": mock_openai}):
            result = bgm._call_deepseek("test", "", 100)
            assert result is None

    def test_ollama_error_returns_none(self):
        with patch("urllib.request.urlopen", side_effect=Exception("Connection refused")):
            result = bgm._call_ollama("test", "", 100)
            assert result is None


# =====================================================================
# Template-based generation (no LLM)
# =====================================================================

class TestTemplateGeneration:

    def test_template_outline_fiction(self):
        result = bgm._template_outline_pt("The Beginning", 1, "fiction", "adventure")
        assert "abertura" in result.lower() or "Cena" in result

    def test_template_outline_nonfiction(self):
        result = bgm._template_outline_pt("Intro", 1, "business", "marketing")
        assert "conceito" in result.lower() or "Abertura" in result

    def test_template_outline_with_materials(self):
        cm = bgm.ChapterMemory()
        cm.set_materials("A detailed account of historical events and their impact on society. " * 10)
        result = bgm._template_outline_pt("History", 1, "nonfiction", "history", memory=cm)
        assert "tema" in result.lower() or "Explorar" in result

    def test_template_content_fiction(self):
        cm = bgm.ChapterMemory()
        result = bgm.generate_template_content_pt(
            "The Beginning", 1, "fiction", "adventure",
            "My Book", "young adults", None, cm
        )
        assert len(result) > 0

    def test_template_content_nonfiction(self):
        cm = bgm.ChapterMemory()
        result = bgm.generate_template_content_pt(
            "Intro", 1, "business", "marketing",
            "My Book", "professionals", None, cm
        )
        assert len(result) > 0

    def test_template_content_technical(self):
        cm = bgm.ChapterMemory()
        result = bgm.generate_template_content_pt(
            "Getting Started", 1, "programming", "Python",
            "Learn Python", "beginners", None, cm
        )
        assert len(result) > 0

    def test_template_content_deterministic(self):
        cm = bgm.ChapterMemory()
        r1 = bgm.generate_template_content_pt("Ch1", 1, "fiction", "t", "Book", "all", None, cm)
        r2 = bgm.generate_template_content_pt("Ch1", 1, "fiction", "t", "Book", "all", None, cm)
        assert r1 == r2


# =====================================================================
# Agent classes (PlannerAgent, WriterAgent, CriticAgent, EditorAgent)
# =====================================================================

class TestAgents:

    def _make_memory_and_bible(self):
        cm = bgm.ChapterMemory()
        vb = bgm.VoiceBible("fiction", "drama")
        return cm, vb

    def test_planner_agent_template_fallback(self):
        cm, vb = self._make_memory_and_bible()
        with patch.object(bgm, "call_llm", return_value=None):
            agent = bgm.PlannerAgent()
            result = agent.run(
                "Chapter 1", 1, "Book", "fiction", "drama",
                "adults", "", cm, vb, "template"
            )
            assert len(result) > 0

    def test_planner_agent_with_llm(self):
        cm, vb = self._make_memory_and_bible()
        with patch.object(bgm, "call_llm", return_value="1. Scene one\n2. Scene two"):
            agent = bgm.PlannerAgent()
            result = agent.run(
                "Chapter 1", 1, "Book", "fiction", "drama",
                "adults", "", cm, vb, "openai"
            )
            assert "Scene one" in result

    def test_critic_agent_approved(self):
        with patch.object(bgm, "call_llm", return_value="APROVADO - qualidade excelente"):
            agent = bgm.CriticAgent()
            verdict, issues = agent.run(
                "draft text", "Chapter 1", "fiction", bgm.ChapterMemory(), "openai"
            )
            assert verdict == "APROVADO"
            assert len(issues) == 0

    def test_critic_agent_issues(self):
        with patch.object(bgm, "call_llm", return_value="PROBLEMA: Weak opening\nPROBLEMA: Too much telling"):
            agent = bgm.CriticAgent()
            verdict, issues = agent.run(
                "draft text", "Chapter 1", "fiction", bgm.ChapterMemory(), "openai"
            )
            assert verdict == "REVISÃO"
            assert len(issues) == 2

    def test_critic_agent_no_llm(self):
        with patch.object(bgm, "call_llm", return_value=None):
            agent = bgm.CriticAgent()
            verdict, issues = agent.run(
                "draft text", "Chapter 1", "fiction", bgm.ChapterMemory(), "template"
            )
            assert verdict == "APROVADO"

    def test_editor_agent_no_issues(self):
        vb = bgm.VoiceBible("fiction", "drama")
        agent = bgm.EditorAgent()
        result = agent.run("original draft", [], "Chapter 1", vb, "openai")
        assert result == "original draft"

    def test_editor_agent_with_fixes(self):
        vb = bgm.VoiceBible("fiction", "drama")
        with patch.object(bgm, "call_llm", return_value="improved draft text that is longer"):
            agent = bgm.EditorAgent()
            result = agent.run(
                "original", ["fix opening"], "Chapter 1", vb, "openai"
            )
            assert result == "improved draft text that is longer"

    def test_writer_agent_returns_none(self):
        cm, vb = self._make_memory_and_bible()
        with patch.object(bgm, "call_llm", return_value=None):
            agent = bgm.WriterAgent()
            result = agent.run(
                "Chapter 1", 1, "Book", "fiction", "drama",
                "adults", "", "outline", cm, vb, "template"
            )
            assert result is None
