"""
Comprehensive tests for novel_process.py
All LLM / external calls are mocked — runs fully offline.
"""
import sys
import os
import json
import importlib
import importlib.util
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------------------
# Import novel_process while mocking its god_mode dependency
# ---------------------------------------------------------------------------

# Create a fake god_mode module so novel_process can import call_llm
_fake_god_mode = MagicMock()
_fake_god_mode.call_llm = MagicMock(return_value=None)
_fake_god_mode.get_available_provider = MagicMock(return_value="template")

# Temporarily inject it, load novel_process, then clean up
_previously_loaded = "novel_process" in sys.modules
if _previously_loaded:
    # Remove stale mock from backend test's sys.modules manipulation
    del sys.modules["novel_process"]

sys.modules["god_mode"] = _fake_god_mode

# Force a fresh import
_np_spec = importlib.util.spec_from_file_location(
    "novel_process",
    os.path.join(os.path.dirname(__file__), "..", "novel_process.py"),
)
np = importlib.util.module_from_spec(_np_spec)
_np_spec.loader.exec_module(np)
sys.modules["novel_process"] = np

# Ensure HAS_LLM is True so we can control call_llm via patching
# (but the default mock returns None, so rule-based paths are exercised)
np.HAS_LLM = True


# =====================================================================
# VoiceProfile dataclass
# =====================================================================

class TestVoiceProfile:

    def test_to_dict_roundtrip(self, voice_profile_dict):
        profile = np.VoiceProfile.from_dict(voice_profile_dict)
        d = profile.to_dict()
        assert d["sentence_rhythm"] == "Variado"
        assert d["genre"] == "fiction"
        assert "Prosa roxa" in d["avoid"]

    def test_from_dict_empty(self):
        profile = np.VoiceProfile.from_dict({})
        assert profile.sentence_rhythm == ""
        assert profile.avoid == []

    def test_from_dict_none(self):
        profile = np.VoiceProfile.from_dict(None)
        assert profile.source == "default"

    def test_from_dict_ignores_unknown_keys(self):
        profile = np.VoiceProfile.from_dict({"sentence_rhythm": "fast", "bogus_key": 42})
        assert profile.sentence_rhythm == "fast"
        assert "bogus_key" not in profile.to_dict()

    def test_to_prompt_block_contains_voice_header(self):
        profile = np.VoiceProfile(sentence_rhythm="Staccato", avoid=["cliches"])
        block = profile.to_prompt_block()
        assert "VOICE PROFILE" in block
        assert "Staccato" in block
        assert "cliches" in block

    def test_to_prompt_block_with_custom_rules(self):
        profile = np.VoiceProfile(custom_rules={"max_adverbs": "5"})
        block = profile.to_prompt_block()
        assert "max_adverbs" in block

    def test_to_prompt_block_no_avoid(self):
        profile = np.VoiceProfile()
        block = profile.to_prompt_block()
        assert "EVITAR" not in block


# =====================================================================
# VoiceProfileBuilder
# =====================================================================

class TestVoiceProfileBuilder:

    def test_from_genre_defaults_fiction(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_genre_defaults("fiction")
        assert profile.genre == "fiction"
        assert profile.source == "default"
        assert len(profile.avoid) > 0

    def test_from_genre_defaults_nonfiction(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_genre_defaults("business")
        assert profile.source == "default"
        assert "Acessível" in profile.vocabulary_register

    def test_from_genre_defaults_technical(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_genre_defaults("programming")
        assert "Preciso" in profile.vocabulary_register

    def test_from_genre_defaults_empty_genre(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_genre_defaults("")
        assert profile.source == "default"

    def test_from_writing_samples_empty_falls_back(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_writing_samples([], genre="fiction")
        assert profile.source == "default"
        assert profile.genre == "fiction"

    def test_from_writing_samples_with_llm_json(self):
        llm_response = json.dumps({
            "SENTENCE_RHYTHM": "Short bursts",
            "VOCABULARY_REGISTER": "Simple",
            "DIALOGUE_STYLE": "Minimal",
            "EMOTIONAL_TEMPERATURE": "Cold",
            "INTERIORITY_DEPTH": "Shallow",
            "PUNCTUATION_HABITS": "Periods only",
            "STRUCTURAL_INSTINCTS": "Linear",
            "TONAL_ANCHORS": "Noir",
            "POV_AND_TENSE": "First person past",
            "AVOID": ["cliches", "adverbs"],
        })
        with patch.object(np, "call_llm", return_value=llm_response):
            builder = np.VoiceProfileBuilder(provider="openai")
            profile = builder.from_writing_samples(["sample text"], genre="thriller")
            assert profile.source == "samples"
            assert profile.sentence_rhythm == "Short bursts"
            assert "cliches" in profile.avoid

    def test_from_writing_samples_llm_returns_none(self):
        with patch.object(np, "call_llm", return_value=None):
            builder = np.VoiceProfileBuilder(provider="openai")
            profile = builder.from_writing_samples(["some text"], genre="fiction")
            assert profile.source == "default"

    def test_from_interview_responses_empty(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_interview_responses([])
        assert profile.source == "default"

    def test_merge_custom_rules_overwrite_field(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_genre_defaults("fiction")
        builder.merge_custom_rules(profile, {"sentence_rhythm": "All short"})
        assert profile.sentence_rhythm == "All short"

    def test_merge_custom_rules_extend_avoid(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_genre_defaults("fiction")
        original_len = len(profile.avoid)
        builder.merge_custom_rules(profile, {"avoid": ["new rule"]})
        assert len(profile.avoid) == original_len + 1

    def test_merge_custom_rules_unknown_key(self):
        builder = np.VoiceProfileBuilder(provider="template")
        profile = builder.from_genre_defaults("fiction")
        builder.merge_custom_rules(profile, {"my_custom_field": "value"})
        assert profile.custom_rules["my_custom_field"] == "value"

    def test_get_interview_questions(self):
        builder = np.VoiceProfileBuilder(provider="template")
        questions = builder.get_interview_questions()
        assert len(questions) == 4
        assert all(isinstance(q, str) for q in questions)

    def test_classify_genre_portuguese(self):
        builder = np.VoiceProfileBuilder(provider="template")
        assert builder._classify_genre("ficção científica") == "fiction"
        assert builder._classify_genre("programação") == "technical"
        assert builder._classify_genre("autoajuda") == "nonfiction"


# =====================================================================
# LivingStoryBible
# =====================================================================

class TestLivingStoryBible:

    def test_init_empty(self):
        bible = np.LivingStoryBible()
        assert len(bible.characters) == 0
        assert len(bible.timeline) == 0
        assert bible.current_alive == 0

    def test_set_initial_count(self):
        bible = np.LivingStoryBible()
        bible.set_initial_count(47)
        assert bible.initial_count == 47
        assert bible.current_alive == 47

    def test_update_from_chapter_empty_content(self):
        bible = np.LivingStoryBible()
        bible.update_from_chapter(1, "Test", "")
        assert len(bible.summaries) == 0

    def test_update_from_chapter_basic_extraction(self, sample_chapter_content):
        bible = np.LivingStoryBible()
        # Use template provider to skip LLM deep extraction
        bible.update_from_chapter(3, "A Chegada", sample_chapter_content, provider="template")
        assert len(bible.summaries) == 1
        assert bible.summaries[0]["chapter"] == 3
        assert "Carlos" in bible.characters
        assert "Roberto" in bible.characters

    def test_set_materials(self):
        bible = np.LivingStoryBible()
        long_text = "Este é um fato importante sobre o mundo. " * 20
        bible.set_materials(long_text)
        assert bible.materials_context == long_text
        assert len(bible.key_facts) > 0

    def test_set_materials_empty(self):
        bible = np.LivingStoryBible()
        bible.set_materials("")
        assert bible.materials_context == ""
        assert len(bible.key_facts) == 0

    def test_to_context_block_empty(self):
        bible = np.LivingStoryBible()
        block = bible.to_context_block()
        assert block == ""

    def test_to_context_block_with_data(self, sample_chapter_content):
        bible = np.LivingStoryBible()
        bible.set_initial_count(10)
        bible.update_from_chapter(1, "Cap 1", sample_chapter_content, provider="template")
        block = bible.to_context_block()
        assert "Carlos" in block

    def test_to_full_bible_and_from_dict(self, sample_chapter_content):
        bible = np.LivingStoryBible()
        bible.set_initial_count(10)
        bible.update_from_chapter(1, "Cap1", sample_chapter_content, provider="template")
        exported = bible.to_full_bible()
        restored = np.LivingStoryBible.from_dict(exported)
        assert len(restored.characters) == len(bible.characters)
        assert restored.initial_count == 10

    def test_from_dict_none(self):
        bible = np.LivingStoryBible.from_dict(None)
        assert len(bible.characters) == 0

    def test_to_ban_block_empty(self):
        bible = np.LivingStoryBible()
        assert bible.to_ban_block() == ""

    def test_to_materials_block_empty(self):
        bible = np.LivingStoryBible()
        assert bible.to_materials_block() == ""

    def test_to_materials_block_with_data(self):
        bible = np.LivingStoryBible()
        bible.materials_context = "Some reference text here"
        block = bible.to_materials_block()
        assert "MATERIAIS DE REFERÊNCIA" in block

    def test_banned_phrases_tracked(self):
        bible = np.LivingStoryBible()
        repeated = "the quick fox " * 10
        bible.update_from_chapter(1, "Test", repeated, provider="template")
        assert len(bible.banned_phrases) > 0


# =====================================================================
# CraftStandards
# =====================================================================

class TestCraftStandards:

    def test_from_defaults(self):
        cs = np.CraftStandards()
        d = cs.to_dict()
        assert "scene_construction" in d
        assert "dialogue" in d

    def test_to_prompt_block(self):
        cs = np.CraftStandards()
        block = cs.to_prompt_block()
        assert "CRAFT STANDARDS" in block
        assert "CONSTRUÇÃO DE CENA" in block
        assert "DIÁLOGO" in block

    def test_custom_override(self):
        cs = np.CraftStandards(standards={"dialogue": {"tags": "Custom tag rule"}})
        assert cs.standards["dialogue"]["tags"] == "Custom tag rule"
        assert "scene_construction" in cs.standards

    def test_to_line_polish_block(self):
        cs = np.CraftStandards()
        block = cs.to_line_polish_block()
        assert "LINE POLISH" in block
        assert "1." in block

    def test_from_dict(self):
        cs = np.CraftStandards.from_dict({"pacing": {"rule": "Custom pacing"}})
        assert cs.standards["pacing"]["rule"] == "Custom pacing"


# =====================================================================
# AITellDetector
# =====================================================================

class TestAITellDetector:

    def test_empty_content(self):
        detector = np.AITellDetector()
        result = detector.analyze("")
        assert result["ai_score"] == 0
        assert result["human_score"] == 100

    def test_clean_text_low_score(self, sample_fiction_text):
        detector = np.AITellDetector()
        result = detector.analyze(sample_fiction_text, language="pt-br")
        assert result["ai_score"] < 50
        assert result["total_issues"] >= 0

    def test_ai_heavy_text_high_score(self, sample_ai_heavy_text):
        detector = np.AITellDetector()
        result = detector.analyze(sample_ai_heavy_text, language="pt-br")
        assert result["ai_score"] > 0
        assert result["warnings"] > 0
        categories = [i["category"] for i in result["issues"]]
        assert "hedge_density" in categories or "formulaic_transitions" in categories

    def test_paragraph_uniformity_detection(self):
        uniform = "\n\n".join(["A" * 200 for _ in range(5)])
        detector = np.AITellDetector()
        result = detector.analyze(uniform, language="pt-br")
        categories = [i["category"] for i in result["issues"]]
        assert "paragraph_uniformity" in categories

    def test_said_bookisms_detection_pt(self):
        text = (
            "Maria exclamou com surpresa. João murmurou algo. "
            "Ana sussurrou no ouvido. Pedro gritou de raiva. "
            "Clara rosnou para o inimigo. Lucas bufou de frustração."
        )
        detector = np.AITellDetector()
        result = detector.analyze(text, language="pt-br")
        categories = [i["category"] for i in result["issues"]]
        assert "said_bookisms" in categories

    def test_adverb_stacking_pt(self):
        text = " ".join(
            [f"rapidamente lentamente cuidadosamente suavemente fortemente palavra{i}"
             for i in range(20)]
        )
        detector = np.AITellDetector()
        result = detector.analyze(text, language="pt-br")
        categories = [i["category"] for i in result["issues"]]
        assert "adverb_stacking" in categories

    def test_english_language(self):
        text = (
            "It's worth noting that the situation is complex. However, we must consider all aspects. "
            "However, the analysis reveals patterns. However, we cannot ignore the facts. "
            "Furthermore, it's important to note that alternatives exist. "
            "Perhaps the best approach would be different. Essentially, results confirm this."
        )
        detector = np.AITellDetector()
        result = detector.analyze(text, language="en")
        assert result["total_issues"] > 0


# =====================================================================
# StyleFingerprint
# =====================================================================

class TestStyleFingerprint:

    def test_empty_text(self):
        fp = np.StyleFingerprint()
        result = fp.analyze("")
        assert "error" in result

    def test_basic_analysis(self, sample_fiction_text):
        fp = np.StyleFingerprint()
        result = fp.analyze(sample_fiction_text, source_name="test")
        assert result["source_name"] == "test"
        assert result["total_words"] > 0
        assert result["total_sentences"] > 0
        assert "avg_sentence_length" in result
        assert "vocabulary_diversity_ttr" in result
        assert 0 <= result["vocabulary_diversity_ttr"] <= 1

    def test_style_guide_generated(self, sample_fiction_text):
        fp = np.StyleFingerprint()
        result = fp.analyze(sample_fiction_text)
        assert "style_guide" in result
        assert "STYLE FINGERPRINT" in result["style_guide"]

    def test_paragraph_range(self, sample_chapter_content):
        fp = np.StyleFingerprint()
        result = fp.analyze(sample_chapter_content)
        assert result["paragraph_range"]["min"] <= result["paragraph_range"]["max"]

    def test_dialogue_ratio(self, sample_chapter_content):
        fp = np.StyleFingerprint()
        result = fp.analyze(sample_chapter_content)
        assert 0 <= result["dialogue_ratio"] <= 1

    def test_short_long_ratios(self, sample_fiction_text):
        fp = np.StyleFingerprint()
        result = fp.analyze(sample_fiction_text)
        assert 0 <= result["short_sentence_ratio"] <= 1
        assert 0 <= result["long_sentence_ratio"] <= 1


# =====================================================================
# MultiDimensionAuditor
# =====================================================================

class TestMultiDimensionAuditor:

    def test_full_audit_empty_content(self):
        auditor = np.MultiDimensionAuditor(provider="template")
        result = auditor.full_audit("")
        assert result["overall_score"] >= 0

    def test_full_audit_rule_based(self, sample_ai_heavy_text):
        auditor = np.MultiDimensionAuditor(provider="template")
        result = auditor.full_audit(sample_ai_heavy_text, language="pt-br")
        assert "dimensions_checked" in result
        assert "overall_score" in result
        assert "ai_tell_score" in result
        assert result["ai_tell_score"] > 0

    def test_full_audit_with_voice_profile(self, sample_fiction_text):
        auditor = np.MultiDimensionAuditor(provider="template")
        profile = np.VoiceProfile(avoid=["De repente"])
        result = auditor.full_audit(
            sample_fiction_text, voice_profile=profile, language="pt-br"
        )
        assert result["overall_score"] >= 0
        assert result["passed_dimensions"] >= 0

    def test_specific_dimensions(self, sample_fiction_text):
        auditor = np.MultiDimensionAuditor(provider="template")
        result = auditor.full_audit(
            sample_fiction_text, dimensions=[20, 21, 22], language="pt-br"
        )
        assert result["dimensions_checked"] == [20, 21, 22]


# =====================================================================
# GenreProfiler
# =====================================================================

class TestGenreProfiler:

    def test_empty_content(self):
        profiler = np.GenreProfiler()
        result = profiler.analyze("")
        assert "error" in result

    def test_short_content(self):
        profiler = np.GenreProfiler()
        result = profiler.analyze("hello world", language="pt-br")
        assert "error" in result

    def test_fiction_detection(self, sample_fiction_text):
        profiler = np.GenreProfiler()
        result = profiler.analyze(sample_fiction_text, language="pt-br")
        assert "primary_genre" in result
        assert "recommendations" in result
        assert "structural_analysis" in result
        assert result["structural_analysis"]["total_words"] > 0

    def test_nonfiction_detection(self, sample_nonfiction_text):
        profiler = np.GenreProfiler()
        result = profiler.analyze(sample_nonfiction_text, language="pt-br")
        assert "primary_genre" in result
        nf_score = result.get("genre_scores", {}).get("nonfiction", 0)
        assert nf_score > 0

    def test_genre_scores_structure(self, sample_fiction_text):
        profiler = np.GenreProfiler()
        result = profiler.analyze(sample_fiction_text, language="pt-br")
        assert isinstance(result["genre_scores"], dict)
        assert "secondary_genres" in result

    def test_english_language(self):
        text = (
            "The detective examined the crime scene carefully. "
            "Clues were scattered across the floor. A suspect had been identified. "
            "The investigation continued through the night. The victim lay still. "
            "Evidence pointed to murder. The witness spoke in hushed tones. "
        ) * 5
        profiler = np.GenreProfiler()
        result = profiler.analyze(text, language="en")
        assert result.get("genre_scores", {}).get("mystery", 0) > 0

    def test_confidence_score(self, sample_fiction_text):
        profiler = np.GenreProfiler()
        result = profiler.analyze(sample_fiction_text, language="pt-br")
        assert 0 <= result["confidence"] <= 100


# =====================================================================
# ChapterNotesGenerator
# =====================================================================

class TestChapterNotesGenerator:

    def test_generate_no_content(self):
        gen = np.ChapterNotesGenerator(provider="template")
        notes = gen.generate(1, "Test", "")
        assert notes.chapter_number == 1
        assert notes.word_count == 0

    def test_generate_without_llm(self, sample_chapter_content):
        # With call_llm returning None, generator uses basic path
        with patch.object(np, "call_llm", return_value=None):
            gen = np.ChapterNotesGenerator(provider="openai")
            notes = gen.generate(1, "Cap 1", sample_chapter_content)
            assert notes.word_count > 0
            assert notes.chapter_title == "Cap 1"

    def test_generate_with_llm(self, sample_chapter_content):
        llm_response = json.dumps({
            "voice_decisions": ["Used short sentences for tension"],
            "structural_choices": ["Started in medias res"],
            "off_voice_flags": ["Paragraph 3 too formal"],
            "continuity_notes": ["Carlos has a scar"],
            "revision_suggestions": ["Tighten dialogue"],
        })
        with patch.object(np, "call_llm", return_value=llm_response):
            gen = np.ChapterNotesGenerator(provider="openai")
            notes = gen.generate(1, "Cap 1", sample_chapter_content)
            assert "Used short sentences for tension" in notes.voice_decisions
            assert len(notes.off_voice_flags) == 1

    def test_notes_to_display(self):
        notes = np.ChapterNotes(
            chapter_number=1,
            chapter_title="Test",
            word_count=500,
            voice_decisions=["Used short sentences"],
            off_voice_flags=["Paragraph 3 too formal"],
        )
        display = notes.to_display()
        assert "NOTES" in display
        assert "Used short sentences" in display
        assert "Paragraph 3 too formal" in display

    def test_notes_from_dict(self):
        notes = np.ChapterNotes.from_dict({
            "chapter_number": 5,
            "chapter_title": "Ch5",
            "word_count": 3000,
            "voice_decisions": ["a"],
        })
        assert notes.chapter_number == 5
        assert notes.word_count == 3000

    def test_notes_from_dict_none(self):
        notes = np.ChapterNotes.from_dict(None)
        assert notes.chapter_number == 0


# =====================================================================
# SceneOutlineEngine
# =====================================================================

class TestSceneOutlineEngine:

    def test_template_fallback(self):
        with patch.object(np, "call_llm", return_value=None):
            engine = np.SceneOutlineEngine(provider="openai")
            outline = engine.generate(
                chapter_number=1, chapter_title="Opening", genre="fiction",
                topic="drama", project_title="Test Book",
            )
            assert outline.chapter_number == 1
            assert outline.chapter_title == "Opening"
            assert len(outline.beats) > 0

    def test_outline_to_prompt_block(self):
        outline = np.SceneOutline(
            chapter_number=1,
            chapter_title="Test",
            pov="Carlos",
            beats=[{"number": 1, "description": "Intro", "purpose": "setup"}],
            turn="Big reveal",
        )
        block = outline.to_prompt_block()
        assert "SCENE OUTLINE" in block
        assert "Carlos" in block
        assert "Big reveal" in block

    def test_outline_to_dict(self):
        outline = np.SceneOutline(chapter_number=1, chapter_title="T")
        d = outline.to_dict()
        assert d["chapter_number"] == 1

    def test_generate_with_llm_json(self):
        llm_response = json.dumps({
            "pov": "Maria",
            "when": "Manhã",
            "where": "Cozinha",
            "beats": [
                {"number": 1, "description": "Maria acorda", "purpose": "setup"},
                {"number": 2, "description": "Conflito", "purpose": "tension"},
            ],
            "turn": "Revelação surpreendente",
            "alive_count": 5,
        })
        with patch.object(np, "call_llm", return_value=llm_response):
            engine = np.SceneOutlineEngine(provider="openai")
            outline = engine.generate(
                chapter_number=2, chapter_title="Morning",
                genre="fiction", topic="drama", project_title="Book",
            )
            assert outline.pov == "Maria"
            assert len(outline.beats) == 2
            assert outline.turn == "Revelação surpreendente"


# =====================================================================
# Supporting dataclasses
# =====================================================================

class TestSupportingDataclasses:

    def test_character_to_dict(self):
        c = np.Character(name="Ana", age="30", status="alive")
        d = c.to_dict()
        assert d["name"] == "Ana"
        assert d["status"] == "alive"

    def test_timeline_entry_to_dict(self):
        t = np.TimelineEntry(chapter=1, time_marker="morning", key_events=["arrival"])
        d = t.to_dict()
        assert d["chapter"] == 1

    def test_location_to_dict(self):
        loc = np.Location(name="Florianópolis", description="Coastal city")
        d = loc.to_dict()
        assert d["name"] == "Florianópolis"

    def test_motif_to_dict(self):
        m = np.Motif(element="rain", first_introduction=1)
        d = m.to_dict()
        assert d["element"] == "rain"

    def test_continuity_flag_to_dict(self):
        f = np.ContinuityFlag(item="scar", established_fact="Carlos has scar", established_in=2)
        d = f.to_dict()
        assert d["established_in"] == 2

    def test_ai_tell_issue_to_dict(self):
        issue = np.AITellIssue(severity="warning", category="hedge_density",
                               description="Too many hedges", suggestion="Remove them")
        d = issue.to_dict()
        assert d["severity"] == "warning"
