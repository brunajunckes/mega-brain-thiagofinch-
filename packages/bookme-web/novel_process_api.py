"""
Novel Process API — Advanced Writing Craft Endpoints
Extends God Mode v3 with Novel Process features:
- Voice Profile Builder (10 dimensions)
- Living Story Bible
- Craft Standards
- Enhanced chapter generation with voice compliance
- Voice audit
- Chapter notes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
import json
import traceback

from database import get_db, User, Chapter, Project, Material
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["novel-process"])


# ===== REQUEST MODELS =====

class VoiceProfileRequest(BaseModel):
    genre: str = ""
    topic: str = ""
    writing_samples: Optional[List[str]] = None
    interview_responses: Optional[List[str]] = None
    custom_rules: Optional[Dict] = None


class EnhancedGenerateRequest(BaseModel):
    voice_profile: Optional[Dict] = None
    craft_standards: Optional[Dict] = None
    story_bible: Optional[Dict] = None
    writing_samples: Optional[List[str]] = None
    max_revisions: int = 1
    language: str = ""


class VoiceAuditRequest(BaseModel):
    content: Optional[str] = None
    chapter_id: Optional[str] = None
    voice_profile: Optional[Dict] = None


class CraftStandardsRequest(BaseModel):
    custom_standards: Optional[Dict] = None


class AITellRequest(BaseModel):
    content: Optional[str] = None
    chapter_id: Optional[str] = None
    language: str = "pt-br"


class StyleFingerprintRequest(BaseModel):
    text: str
    source_name: str = ""


class FullAuditRequest(BaseModel):
    chapter_id: Optional[str] = None
    content: Optional[str] = None
    voice_profile: Optional[Dict] = None
    craft_standards: Optional[Dict] = None
    dimensions: Optional[List[int]] = None
    language: str = "pt-br"


# ===== HELPERS =====

def _get_materials_context(db: Session, project_id: str) -> tuple:
    """Fetch materials and build context."""
    materials = db.query(Material).filter(Material.project_id == project_id).all()
    if not materials:
        return "", "pt-br"
    parts = []
    for m in materials:
        if m.extracted_text:
            parts.append(m.extracted_text)
        elif m.content:
            parts.append(m.content if isinstance(m.content, str) else str(m.content))
    text = "\n\n".join(parts)[:50000]
    pt_words = ["que", "de", "não", "para", "com", "uma", "por", "mais", "como", "seu"]
    words = text.lower().split()[:500]
    pt_count = sum(1 for w in words if w in pt_words)
    lang = "pt-br" if pt_count > 10 else "en"
    return text, lang


# ===== ENDPOINT: Voice Interview Questions =====

@router.get("/novel-process/voice-interview")
async def get_voice_interview_questions():
    """Return the 4 voice interview questions for the author."""
    try:
        from god_mode import get_god_mode_engine
        engine = get_god_mode_engine()
        questions = engine.get_voice_interview_questions()
        return {"questions": questions, "instructions": (
            "Peça ao autor para responder estas 4 perguntas por escrito, "
            "sem editar as respostas. As respostas serão analisadas para "
            "extrair um perfil de voz em 10 dimensões."
        )}
    except Exception as e:
        return {"error": str(e)}


# ===== ENDPOINT: Get Voice Profile (default for genre) =====

@router.get("/projects/{project_id}/voice-profile")
async def get_voice_profile(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get the default voice profile for a project based on its genre."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import VoiceProfileBuilder, VOICE_DIMENSION_DESCRIPTIONS
        builder = VoiceProfileBuilder()
        genre = project.genre or "fiction"
        topic = getattr(project, 'topic', '') or project.title or ""
        profile = builder.from_genre_defaults(genre, topic)
        return {
            "voice_profile": profile.to_dict(),
            "dimension_descriptions": VOICE_DIMENSION_DESCRIPTIONS,
            "source": "genre_default",
            "genre": genre,
            "status": "ok"
        }
    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Build Voice Profile =====

@router.post("/projects/{project_id}/voice-profile")
async def build_voice_profile(
    project_id: str,
    req: VoiceProfileRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Build a 10-dimension voice profile from samples, interview, or genre defaults."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from god_mode import get_god_mode_engine
        engine = get_god_mode_engine()

        genre = req.genre or project.genre or "fiction"
        topic = req.topic or getattr(project, 'topic', '') or project.title or ""

        result = engine.build_voice_profile(
            genre=genre,
            topic=topic,
            writing_samples=req.writing_samples,
            interview_responses=req.interview_responses,
        )

        # Merge custom rules if provided
        if req.custom_rules and result.get("profile"):
            result["profile"].update(req.custom_rules)

        return {
            "voice_profile": result.get("profile", {}),
            "source": result.get("source", "default"),
            "dimensions": [
                "sentence_rhythm", "vocabulary_register", "dialogue_style",
                "emotional_temperature", "interiority_depth", "punctuation_habits",
                "structural_instincts", "tonal_anchors", "pov_and_tense", "avoid"
            ],
            "status": "ok"
        }

    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Get/Set Craft Standards =====

@router.get("/novel-process/craft-standards")
async def get_default_craft_standards():
    """Return default craft standards (inspired by Novel Process AGENTS.md)."""
    try:
        from novel_process import DEFAULT_CRAFT_STANDARDS, CraftStandards
        standards = CraftStandards()
        return {
            "craft_standards": standards.to_dict(),
            "prompt_block": standards.to_prompt_block(),
            "line_polish": standards.to_line_polish_block(),
            "status": "ok"
        }
    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}


@router.post("/projects/{project_id}/craft-standards")
async def set_craft_standards(
    project_id: str,
    req: CraftStandardsRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Set custom craft standards for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import CraftStandards
        standards = CraftStandards(standards=req.custom_standards)
        return {
            "craft_standards": standards.to_dict(),
            "prompt_block": standards.to_prompt_block(),
            "status": "ok"
        }
    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}


# ===== ENDPOINT: Enhanced Chapter Generation =====

@router.post("/projects/{project_id}/chapters/{chapter_id}/generate-enhanced")
async def generate_chapter_enhanced(
    project_id: str,
    chapter_id: str,
    req: EnhancedGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Generate a chapter using the full Novel Process pipeline:
    Voice Profile → Scene Outline → Write → Critique → Edit → Audit → Notes
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(404, "Chapter not found")

    try:
        from god_mode import get_god_mode_engine
        engine = get_god_mode_engine()

        # Build materials context
        materials_context, auto_lang = _get_materials_context(db, project_id)
        language = req.language or auto_lang

        # Get previous chapters
        previous_chapters = []
        chapters = db.query(Chapter).filter(
            Chapter.project_id == project_id,
            Chapter.number < chapter.number
        ).order_by(Chapter.number).all()
        for ch in chapters:
            if ch.content:
                previous_chapters.append({
                    "number": ch.number,
                    "title": ch.title or f"Cap.{ch.number}",
                    "content": ch.content
                })

        result = engine.generate_chapter_enhanced(
            project_title=project.title or "Untitled",
            chapter_title=chapter.title or f"Capítulo {chapter.number}",
            chapter_number=chapter.number,
            genre=project.genre or "fiction",
            topic=getattr(project, 'topic', '') or project.title or "",
            target_audience=getattr(project, 'target_audience', '') or "",
            chapter_outline=getattr(chapter, 'outline', '') or "",
            previous_chapters=previous_chapters,
            materials_context=materials_context,
            language=language,
            voice_profile_data=req.voice_profile,
            craft_standards_data=req.craft_standards,
            story_bible_data=req.story_bible,
            writing_samples=req.writing_samples,
            max_revisions=req.max_revisions,
        )

        # Save generated content
        if result.get("generated_text"):
            chapter.content = result["generated_text"]
            db.commit()

        return result

    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Living Story Bible (GET — quick summary) =====

@router.get("/projects/{project_id}/living-story-bible")
async def get_story_bible_summary(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Quick story bible summary: characters, locations, timeline entries, motifs.
    Uses basic extraction (no LLM) for fast response.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import LivingStoryBible

        chapters = db.query(Chapter).filter(
            Chapter.project_id == project_id
        ).order_by(Chapter.number).all()

        bible = LivingStoryBible()
        for ch in chapters:
            if ch.content:
                # Use basic extraction only (fast, no LLM)
                bible._extract_entities_basic(ch.content, ch.number)
                summary = ch.content[:500].replace("\n", " ").strip()
                bible.summaries.append({
                    "chapter": ch.number,
                    "title": ch.title or f"Cap.{ch.number}",
                    "summary": summary
                })

        return {
            "characters": {k: v.to_dict() for k, v in list(bible.characters.items())[:20]},
            "character_count": len(bible.characters),
            "summaries": bible.summaries,
            "chapters_processed": len([ch for ch in chapters if ch.content]),
            "context_block": bible.to_context_block(),
            "status": "ok"
        }

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Living Story Bible (POST — full deep extraction) =====

@router.post("/projects/{project_id}/living-story-bible")
async def generate_living_story_bible(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Generate a comprehensive Living Story Bible from all chapters.
    Includes: characters (with arcs, speech, wounds), timeline, locations,
    motifs, continuity flags, death tracker.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from god_mode import get_god_mode_engine
        engine = get_god_mode_engine()

        chapters = db.query(Chapter).filter(
            Chapter.project_id == project_id
        ).order_by(Chapter.number).all()

        chapters_data = [
            {"number": ch.number, "title": ch.title or f"Cap.{ch.number}", "content": ch.content or ""}
            for ch in chapters if ch.content
        ]

        result = engine.generate_story_bible(
            chapters=chapters_data,
            genre=project.genre or "",
            topic=getattr(project, 'topic', '') or ""
        )

        return result

    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Voice Compliance Audit =====

@router.post("/projects/{project_id}/voice-audit")
async def voice_compliance_audit(
    project_id: str,
    req: VoiceAuditRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Audit a chapter against voice profile for compliance.
    Returns score (0-100), off-voice passages, avoid violations, and suggestions.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from god_mode import get_god_mode_engine
        engine = get_god_mode_engine()

        content = req.content
        if req.chapter_id and not content:
            chapter = db.query(Chapter).filter(Chapter.id == req.chapter_id).first()
            if not chapter or not chapter.content:
                raise HTTPException(404, "Chapter not found or empty")
            content = chapter.content

        if not content:
            raise HTTPException(400, "No content to audit")

        result = engine.audit_voice_compliance(
            content=content,
            genre=project.genre or "",
            topic=getattr(project, 'topic', '') or "",
            voice_profile_data=req.voice_profile,
        )

        return {"audit": result, "status": "ok"}

    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Chapter Notes =====

@router.get("/projects/{project_id}/chapters/{chapter_id}/notes")
async def get_chapter_notes(
    project_id: str,
    chapter_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Generate structured chapter notes (separate from prose).
    Includes: voice decisions, structural choices, off-voice flags,
    continuity notes, revision suggestions.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter or not chapter.content:
        raise HTTPException(404, "Chapter not found or empty")

    try:
        from novel_process import ChapterNotesGenerator
        from god_mode import get_available_provider

        generator = ChapterNotesGenerator(provider=get_available_provider())
        notes = generator.generate(
            chapter_number=chapter.number,
            chapter_title=chapter.title or f"Cap.{chapter.number}",
            content=chapter.content,
        )

        return {
            "notes": notes.to_dict(),
            "display": notes.to_display(),
            "status": "ok"
        }

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: AI-Tell Detection (from Inkos) =====

@router.post("/projects/{project_id}/ai-tell-detect")
async def ai_tell_detection(
    project_id: str,
    req: AITellRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Detect AI-generated text patterns using rule-based analysis (no LLM needed).
    Checks: paragraph uniformity, hedge words, formulaic transitions, list structure,
    adverb stacking, said-bookisms.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import AITellDetector

        content = req.content
        if req.chapter_id and not content:
            chapter = db.query(Chapter).filter(Chapter.id == req.chapter_id).first()
            if not chapter or not chapter.content:
                raise HTTPException(404, "Chapter not found or empty")
            content = chapter.content

        if not content:
            raise HTTPException(400, "No content to analyze")

        detector = AITellDetector()
        result = detector.analyze(content, req.language)
        return {"detection": result, "status": "ok"}

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Style Fingerprint (from Inkos) =====

@router.post("/novel-process/style-fingerprint")
async def analyze_style_fingerprint(req: StyleFingerprintRequest):
    """
    Analyze a reference text and extract its statistical style fingerprint.
    Pure text analysis — no LLM needed. Returns sentence/paragraph stats,
    vocabulary diversity, dialogue ratio, and a generated style guide.
    """
    try:
        from novel_process import StyleFingerprint

        analyzer = StyleFingerprint()
        result = analyzer.analyze(req.text, req.source_name)
        return {"fingerprint": result, "status": "ok"}

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Full Multi-Dimension Audit (from Inkos) =====

@router.post("/projects/{project_id}/full-audit")
async def full_multi_dimension_audit(
    project_id: str,
    req: FullAuditRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Run a 33-dimension quality audit combining:
    - AI-tell detection (rule-based)
    - Voice compliance (LLM-powered)
    - Craft standards verification
    - Continuity checks
    Returns per-dimension results with overall score.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import MultiDimensionAuditor, VoiceProfile, CraftStandards, LivingStoryBible
        from god_mode import get_available_provider

        content = req.content
        if req.chapter_id and not content:
            chapter = db.query(Chapter).filter(Chapter.id == req.chapter_id).first()
            if not chapter or not chapter.content:
                raise HTTPException(404, "Chapter not found or empty")
            content = chapter.content

        if not content:
            raise HTTPException(400, "No content to audit")

        voice_profile = VoiceProfile.from_dict(req.voice_profile) if req.voice_profile else None
        craft_standards = CraftStandards.from_dict(req.craft_standards) if req.craft_standards else None

        auditor = MultiDimensionAuditor(provider=get_available_provider())
        result = auditor.full_audit(
            content=content,
            voice_profile=voice_profile,
            craft_standards=craft_standards,
            language=req.language,
            dimensions=req.dimensions,
        )

        return {"audit": result, "status": "ok"}

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Batch Audit (all chapters) =====

class BatchAuditRequest(BaseModel):
    voice_profile: Optional[Dict] = None
    craft_standards: Optional[Dict] = None
    dimensions: Optional[List[int]] = None
    language: str = "pt-br"


@router.post("/projects/{project_id}/batch-audit")
async def batch_audit_all_chapters(
    project_id: str,
    req: BatchAuditRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Run AI-tell detection + multi-dimension audit on ALL chapters in a project.
    Returns per-chapter results, overall project score, and cross-chapter patterns.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import (
            AITellDetector, MultiDimensionAuditor, VoiceProfile,
            CraftStandards, StyleFingerprint
        )
        from god_mode import get_available_provider

        chapters = db.query(Chapter).filter(
            Chapter.project_id == project_id
        ).order_by(Chapter.number).all()

        chapters_with_content = [ch for ch in chapters if ch.content]
        if not chapters_with_content:
            raise HTTPException(400, "No chapters with content to audit")

        detector = AITellDetector()
        voice_profile = VoiceProfile.from_dict(req.voice_profile) if req.voice_profile else None
        craft_standards = CraftStandards.from_dict(req.craft_standards) if req.craft_standards else None
        fingerprinter = StyleFingerprint()

        chapter_results = []
        total_ai_score = 0
        total_words = 0
        all_issues = []

        for ch in chapters_with_content:
            # AI-tell detection per chapter
            ai_result = detector.analyze(ch.content, req.language)
            word_count = len(ch.content.split())
            total_words += word_count
            total_ai_score += ai_result.get("ai_score", 0)

            chapter_results.append({
                "chapter_number": ch.number,
                "chapter_title": ch.title or f"Cap.{ch.number}",
                "word_count": word_count,
                "ai_tell_score": ai_result.get("ai_score", 0),
                "human_score": ai_result.get("human_score", 100),
                "issues": ai_result.get("issues", []),
                "warnings": ai_result.get("warnings", 0),
            })
            for issue in ai_result.get("issues", []):
                issue["chapter"] = ch.number
                all_issues.append(issue)

        # Cross-chapter style consistency analysis
        all_text = " ".join(ch.content for ch in chapters_with_content)
        overall_fingerprint = fingerprinter.analyze(all_text[:50000], "full_manuscript")

        avg_ai_score = total_ai_score / len(chapters_with_content) if chapters_with_content else 0

        # Identify worst chapters (highest AI score)
        worst_chapters = sorted(chapter_results, key=lambda x: x["ai_tell_score"], reverse=True)[:3]

        # Issue category summary
        category_counts = {}
        for issue in all_issues:
            cat = issue.get("category", "unknown")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        return {
            "project_id": project_id,
            "chapters_audited": len(chapters_with_content),
            "total_words": total_words,
            "avg_ai_tell_score": round(avg_ai_score, 1),
            "avg_human_score": round(100 - avg_ai_score, 1),
            "total_issues": len(all_issues),
            "issue_categories": category_counts,
            "worst_chapters": worst_chapters,
            "chapter_results": chapter_results,
            "manuscript_fingerprint": {
                "avg_sentence_length": overall_fingerprint.get("avg_sentence_length"),
                "vocabulary_diversity": overall_fingerprint.get("vocabulary_diversity_ttr"),
                "dialogue_ratio": overall_fingerprint.get("dialogue_ratio"),
            },
            "status": "ok"
        }

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Genre Profile =====

class GenreProfileRequest(BaseModel):
    content: Optional[str] = None
    chapter_id: Optional[str] = None
    language: str = "pt-br"


@router.post("/projects/{project_id}/genre-profile")
async def genre_profile(
    project_id: str,
    req: GenreProfileRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Analyze text to detect genre, sub-genre, and provide genre-specific
    writing recommendations. Rule-based analysis with LLM enhancement.
    Inspired by Inkos genre-profiler.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import GenreProfiler

        content = req.content
        if req.chapter_id and not content:
            chapter = db.query(Chapter).filter(Chapter.id == req.chapter_id).first()
            if not chapter or not chapter.content:
                raise HTTPException(404, "Chapter not found or empty")
            content = chapter.content

        if not content:
            # Use all chapters
            chapters = db.query(Chapter).filter(
                Chapter.project_id == project_id
            ).order_by(Chapter.number).all()
            content = " ".join(ch.content for ch in chapters if ch.content)

        if not content:
            raise HTTPException(400, "No content to analyze")

        profiler = GenreProfiler()
        result = profiler.analyze(content, req.language)
        result["project_genre"] = project.genre or ""
        return {"genre_profile": result, "status": "ok"}

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Chapter Comparison =====

class ChapterComparisonRequest(BaseModel):
    chapter_ids: Optional[List[str]] = None
    metrics: Optional[List[str]] = None  # "style", "ai_tell", "pacing", "vocabulary"
    language: str = "pt-br"


@router.post("/projects/{project_id}/chapter-comparison")
async def chapter_comparison(
    project_id: str,
    req: ChapterComparisonRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Compare chapters side-by-side on multiple dimensions:
    style fingerprint, AI-tell scores, pacing, vocabulary diversity.
    Useful for identifying inconsistencies across the manuscript.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        from novel_process import AITellDetector, StyleFingerprint

        if req.chapter_ids:
            chapters = db.query(Chapter).filter(
                Chapter.id.in_(req.chapter_ids),
                Chapter.project_id == project_id
            ).order_by(Chapter.number).all()
        else:
            chapters = db.query(Chapter).filter(
                Chapter.project_id == project_id
            ).order_by(Chapter.number).all()

        chapters_with_content = [ch for ch in chapters if ch.content]
        if len(chapters_with_content) < 2:
            raise HTTPException(400, "Need at least 2 chapters with content to compare")

        detector = AITellDetector()
        fingerprinter = StyleFingerprint()
        metrics = req.metrics or ["style", "ai_tell", "pacing", "vocabulary"]

        comparison = []
        for ch in chapters_with_content:
            entry = {
                "chapter_number": ch.number,
                "chapter_title": ch.title or f"Cap.{ch.number}",
                "word_count": len(ch.content.split()),
            }

            if "style" in metrics or "pacing" in metrics or "vocabulary" in metrics:
                fp = fingerprinter.analyze(ch.content, ch.title or f"Cap.{ch.number}")
                if "style" in metrics:
                    entry["avg_sentence_length"] = fp.get("avg_sentence_length", 0)
                    entry["sentence_length_std"] = fp.get("sentence_length_std_dev", 0)
                    entry["dialogue_ratio"] = fp.get("dialogue_ratio", 0)
                    entry["short_sentence_ratio"] = fp.get("short_sentence_ratio", 0)
                    entry["long_sentence_ratio"] = fp.get("long_sentence_ratio", 0)
                    entry["fragment_count"] = fp.get("fragment_count", 0)
                if "vocabulary" in metrics:
                    entry["vocabulary_diversity"] = fp.get("vocabulary_diversity_ttr", 0)
                if "pacing" in metrics:
                    entry["avg_paragraph_length"] = fp.get("avg_paragraph_length", 0)
                    entry["paragraph_range"] = fp.get("paragraph_range", {})

            if "ai_tell" in metrics:
                ai = detector.analyze(ch.content, req.language)
                entry["ai_tell_score"] = ai.get("ai_score", 0)
                entry["human_score"] = ai.get("human_score", 100)
                entry["ai_issues"] = ai.get("total_issues", 0)

            comparison.append(entry)

        # Calculate cross-chapter consistency metrics
        if len(comparison) >= 2:
            def _std(vals):
                if not vals:
                    return 0
                avg = sum(vals) / len(vals)
                return (sum((v - avg) ** 2 for v in vals) / len(vals)) ** 0.5

            consistency = {}
            if "style" in metrics:
                sent_lens = [c.get("avg_sentence_length", 0) for c in comparison]
                consistency["sentence_length_consistency"] = round(1 - min(1, _std(sent_lens) / max(1, sum(sent_lens) / len(sent_lens))), 2)
                dlg_ratios = [c.get("dialogue_ratio", 0) for c in comparison]
                consistency["dialogue_consistency"] = round(1 - min(1, _std(dlg_ratios) * 5), 2)
            if "vocabulary" in metrics:
                ttr_vals = [c.get("vocabulary_diversity", 0) for c in comparison]
                consistency["vocabulary_consistency"] = round(1 - min(1, _std(ttr_vals) * 5), 2)
            if "ai_tell" in metrics:
                ai_scores = [c.get("ai_tell_score", 0) for c in comparison]
                consistency["ai_tell_variance"] = round(_std(ai_scores), 1)

        return {
            "project_id": project_id,
            "chapters_compared": len(comparison),
            "metrics_used": metrics,
            "comparison": comparison,
            "consistency": consistency if len(comparison) >= 2 else {},
            "status": "ok"
        }

    except ImportError:
        return {"error": "novel_process module not available", "status": "unavailable"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()[:500]}


# ===== ENDPOINT: Novel Process Status =====

@router.get("/novel-process/status")
async def novel_process_status():
    """Check Novel Process module availability and features."""
    modules = {}

    for mod_name, classes in [
        ("novel_process", [
            "NovelProcessPipeline", "VoiceProfileBuilder", "VoiceProfile",
            "LivingStoryBible", "CraftStandards", "ChapterNotesGenerator",
            "VoiceComplianceAuditor", "SceneOutlineEngine",
            "AITellDetector", "StyleFingerprint", "MultiDimensionAuditor",
            "GenreProfiler",
        ]),
        ("god_mode", ["GodModeEngine", "HAS_NOVEL_PROCESS"]),
    ]:
        try:
            mod = __import__(mod_name)
            available = [cls for cls in classes if hasattr(mod, cls)]
            modules[mod_name] = {"status": "loaded", "classes": available}
        except ImportError as e:
            modules[mod_name] = {"status": "not_available", "error": str(e)}

    has_novel = modules.get("novel_process", {}).get("status") == "loaded"

    return {
        "version": "2.0",
        "novel_process_available": has_novel,
        "modules": modules,
        "features": [
            "voice_profile_builder_10d",
            "living_story_bible",
            "craft_standards",
            "scene_outline_engine",
            "chapter_notes",
            "voice_compliance_audit",
            "enhanced_generation_pipeline",
            "ai_tell_detection",
            "style_fingerprint",
            "multi_dimension_audit_33d",
            "batch_audit",
            "genre_profiler",
            "chapter_comparison",
        ] if has_novel else [],
        "sources": [
            "john-paul-ruf/a-novel-process (voice profile, craft standards, story bible)",
            "Narcooo/inkos (33-dim audit, AI-tell detection, style fingerprint, genre profiler)",
            "Alyan129/Automated-Book-Generation-System (approval workflow patterns)",
        ],
        "endpoints": [
            "GET  /api/novel-process/voice-interview",
            "POST /api/projects/{id}/voice-profile",
            "GET  /api/novel-process/craft-standards",
            "POST /api/projects/{id}/craft-standards",
            "POST /api/projects/{id}/chapters/{chId}/generate-enhanced",
            "POST /api/projects/{id}/living-story-bible",
            "POST /api/projects/{id}/voice-audit",
            "GET  /api/projects/{id}/chapters/{chId}/notes",
            "POST /api/projects/{id}/ai-tell-detect",
            "POST /api/novel-process/style-fingerprint",
            "POST /api/projects/{id}/full-audit",
            "POST /api/projects/{id}/batch-audit",
            "POST /api/projects/{id}/genre-profile",
            "POST /api/projects/{id}/chapter-comparison",
            "GET  /api/novel-process/status",
        ]
    }
