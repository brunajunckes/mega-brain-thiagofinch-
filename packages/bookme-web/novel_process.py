"""
Novel Process Integration — Advanced Writing Craft System
Inspired by:
- john-paul-ruf/a-novel-process (Verity agent + Claude Opus 4)
- Narcooo/inkos (33-dimension audit, AI-tell detection, style fingerprint)
- Alyan129/Automated-Book-Generation-System (approval workflow, iterative generation)

Implements:
1. VoiceProfileBuilder — 10-dimension voice profiling with interview + auto-analysis
2. LivingStoryBible — Auto-updated character/timeline/motif/continuity tracking
3. CraftStandards — Customizable writing rules (scene construction, dialogue, interiority)
4. SceneOutlineEngine — Beat-by-beat outlines with turns, POV tracking, event counters
5. ChapterNotes — Separated author notes, continuity flags, off-voice markers
6. VoiceComplianceAuditor — Self-audit drafts against voice profile
7. AITellDetector — Rule-based AI-generated text pattern detection (from Inkos)
8. StyleFingerprint — Statistical text analysis for style imitation (from Inkos)
9. MultiDimensionAuditor — 33-dimension quality audit system (from Inkos)
"""

import re
import json
import hashlib
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field, asdict
from collections import Counter

try:
    from god_mode import call_llm, get_available_provider
    HAS_LLM = True
except ImportError:
    HAS_LLM = False
    def call_llm(prompt, system="", max_tokens=2000, provider=None):
        return None
    def get_available_provider():
        return "template"


# =============================================================================
# 1. VOICE PROFILE BUILDER (10 dimensions — replaces VoiceBible's 3 presets)
# =============================================================================

VOICE_DIMENSIONS = [
    "sentence_rhythm",
    "vocabulary_register",
    "dialogue_style",
    "emotional_temperature",
    "interiority_depth",
    "punctuation_habits",
    "structural_instincts",
    "tonal_anchors",
    "pov_and_tense",
    "avoid",
]

VOICE_INTERVIEW_QUESTIONS = [
    "Descreva um cômodo em que você passou muito tempo quando criança.",
    "Conte sobre um momento em que você se sentiu completamente deslocado.",
    "O que a maioria das pessoas entende errado sobre um assunto que você conhece bem?",
    "Complete esta frase sem pensar: 'O problema de conseguir o que você quer é...'",
]

VOICE_DIMENSION_DESCRIPTIONS = {
    "sentence_rhythm": "Padrão de ritmo das frases (curtas vs longas, fragmentos, fluxo)",
    "vocabulary_register": "Registro de vocabulário (literário, coloquial, técnico, misto)",
    "dialogue_style": "Estilo de diálogo (naturalista, estilizado, subtexto, interrupções)",
    "emotional_temperature": "Temperatura emocional (frio/distante, quente/íntimo, guardado)",
    "interiority_depth": "Profundidade de interioridade (monólogo interno, superficial, misto)",
    "punctuation_habits": "Hábitos de pontuação (travessões, ponto e vírgula, fragmentos)",
    "structural_instincts": "Instintos estruturais (linear, não-linear, in medias res)",
    "tonal_anchors": "Âncoras tonais (referências de tom — autores, filmes, estilos)",
    "pov_and_tense": "POV e tempo verbal (1a/3a pessoa, passado/presente, limitado/onisciente)",
    "avoid": "Lista de elementos a evitar (construções, vícios, padrões proibidos)",
}

# Genre-specific defaults (expanded from VoiceBible's 3 presets)
VOICE_DEFAULTS = {
    "fiction": {
        "sentence_rhythm": "Variado e instintivo. Frases médias dominam, interrompidas por socos declarativos curtos para ênfase. Fragmentos como pensamento interior.",
        "vocabulary_register": "Coloquial-inteligente. Nunca pretensioso, nunca simplório. Termos técnicos usados casualmente.",
        "dialogue_style": "Naturalista e econômico. Personagens dizem apenas o necessário. Subtexto carregado por ações e detalhes físicos. 'Disse' e 'perguntou' preferidos.",
        "emotional_temperature": "Calor sombrio. Superfície cínica sobre um núcleo sincero. Personagens guardados mas observadores.",
        "interiority_depth": "Muito profundo — modo narrativo padrão. Pensamentos renderizados como monólogo interno direto sem itálico.",
        "punctuation_habits": "Pontos para ênfase. Fragmentos em pensamento interior. Ponto e vírgula raro na ficção.",
        "structural_instincts": "Cronológico linear com intercortes naturais de reflexão e backstory. Alternância fluida entre cena e sumário.",
        "tonal_anchors": "Pragmatismo sonhador — calcula as chances, depois assina o contrato mesmo assim. Cinismo distópico com esperança teimosa.",
        "pov_and_tense": "Terceira pessoa limitada, tempo passado.",
        "avoid": [
            "Prosa roxa/pretensiosa",
            "Sentimentalismo não conquistado",
            "Acúmulo de advérbios",
            "Construção passiva",
            "Verbos de fala além de 'disse' e 'perguntou'",
            "Exposição não filtrada pela consciência do personagem",
            "Polissíndeto (encadear cláusulas com 'e' repetido)",
            "'De repente' ou 'subitamente'",
            "Construções recursivas 'e o X era o Y'",
        ],
    },
    "nonfiction": {
        "sentence_rhythm": "Frases-tópico claras seguidas de evidências e exemplos. Variar comprimento para manter engajamento.",
        "vocabulary_register": "Acessível mas autoritativo. Evitar jargão sem explicação. Analogias para conceitos complexos.",
        "dialogue_style": "Citações diretas de fontes quando disponíveis. Diálogo recreado com nota de contexto.",
        "emotional_temperature": "Quente mas objetivo. Engajar o leitor sem manipular emocionalmente.",
        "interiority_depth": "Reflexões do autor pontuais. Narrativa em segunda pessoa ('você') para envolver o leitor.",
        "punctuation_habits": "Limpa e funcional. Dois-pontos para introduzir listas. Travessões para apartes.",
        "structural_instincts": "Problema-solução ou conceito-aplicação. Cada capítulo com abertura-corpo-fechamento claro.",
        "tonal_anchors": "Professor apaixonado — conhecimento profundo entregue com entusiasmo genuíno.",
        "pov_and_tense": "Segunda pessoa ('você') ou primeira pessoa plural ('nós'), tempo presente.",
        "avoid": [
            "Jargão sem explicação",
            "Afirmações sem fundamentação",
            "Generalidades vagas",
            "Tom condescendente",
            "Repetição de estruturas de parágrafo",
            "Transições preguiçosas ('Além disso', 'Ademais')",
        ],
    },
    "technical": {
        "sentence_rhythm": "Frases declarativas curtas. Passo a passo claro. Exemplos de código intercalados.",
        "vocabulary_register": "Preciso e técnico. Definir termos na primeira ocorrência.",
        "dialogue_style": "N/A — usar blocos de código e outputs esperados.",
        "emotional_temperature": "Neutro e objetivo. Entusiasmo moderado por soluções elegantes.",
        "interiority_depth": "Mínimo — foco em instruções claras e reproduzíveis.",
        "punctuation_habits": "Minimalista. Listas numeradas. Headers para navegação.",
        "structural_instincts": "Sequencial e incremental. Pré-requisitos → Conceito → Implementação → Teste → Armadilhas.",
        "tonal_anchors": "Mentor paciente — guia o leitor sem assumir conhecimento prévio.",
        "pov_and_tense": "Segunda pessoa instrucional, tempo presente.",
        "avoid": [
            "Ambiguidade",
            "Pular pré-requisitos",
            "Siglas sem explicação",
            "Código sem contexto",
            "Instruções vagas",
        ],
    },
}


@dataclass
class VoiceProfile:
    """Complete 10-dimension voice profile for a project."""
    sentence_rhythm: str = ""
    vocabulary_register: str = ""
    dialogue_style: str = ""
    emotional_temperature: str = ""
    interiority_depth: str = ""
    punctuation_habits: str = ""
    structural_instincts: str = ""
    tonal_anchors: str = ""
    pov_and_tense: str = ""
    avoid: list = field(default_factory=list)
    # Metadata
    genre: str = ""
    topic: str = ""
    source: str = "default"  # "default", "interview", "samples", "custom"
    custom_rules: dict = field(default_factory=dict)

    def to_prompt_block(self) -> str:
        """Generate a comprehensive prompt block for LLM consumption."""
        lines = ["VOICE PROFILE (seguir EXATAMENTE — a voz do autor é sagrada):"]
        lines.append(f"  Ritmo de Frases: {self.sentence_rhythm}")
        lines.append(f"  Registro de Vocabulário: {self.vocabulary_register}")
        lines.append(f"  Estilo de Diálogo: {self.dialogue_style}")
        lines.append(f"  Temperatura Emocional: {self.emotional_temperature}")
        lines.append(f"  Profundidade de Interioridade: {self.interiority_depth}")
        lines.append(f"  Hábitos de Pontuação: {self.punctuation_habits}")
        lines.append(f"  Instintos Estruturais: {self.structural_instincts}")
        lines.append(f"  Âncoras Tonais: {self.tonal_anchors}")
        lines.append(f"  POV e Tempo Verbal: {self.pov_and_tense}")
        if self.avoid:
            lines.append(f"  EVITAR: {'; '.join(self.avoid)}")
        if self.custom_rules:
            for k, v in self.custom_rules.items():
                lines.append(f"  {k}: {v}")
        return "\n".join(lines)

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'VoiceProfile':
        if not data:
            return cls()
        known = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in known}
        return cls(**filtered)


class VoiceProfileBuilder:
    """
    Builds a 10-dimension voice profile from writing samples or interview responses.
    Replaces the old 3-preset VoiceBible system.
    """

    def __init__(self, provider: str = None):
        self.provider = provider or get_available_provider()

    def from_genre_defaults(self, genre: str, topic: str = "") -> VoiceProfile:
        """Create profile from genre defaults (upgraded VoiceBible behavior)."""
        genre_key = self._classify_genre(genre)
        defaults = VOICE_DEFAULTS.get(genre_key, VOICE_DEFAULTS["fiction"])
        profile = VoiceProfile(
            sentence_rhythm=defaults["sentence_rhythm"],
            vocabulary_register=defaults["vocabulary_register"],
            dialogue_style=defaults["dialogue_style"],
            emotional_temperature=defaults["emotional_temperature"],
            interiority_depth=defaults["interiority_depth"],
            punctuation_habits=defaults["punctuation_habits"],
            structural_instincts=defaults["structural_instincts"],
            tonal_anchors=defaults["tonal_anchors"],
            pov_and_tense=defaults["pov_and_tense"],
            avoid=list(defaults["avoid"]),
            genre=genre,
            topic=topic,
            source="default",
        )
        return profile

    def from_writing_samples(self, samples: List[str], genre: str = "", topic: str = "") -> VoiceProfile:
        """
        Analyze 2-5 writing samples to build a voice profile.
        Uses LLM to detect patterns across all 10 dimensions.
        """
        if not samples:
            return self.from_genre_defaults(genre, topic)

        combined = "\n\n---\n\n".join(samples[:5])

        system = (
            "Você é um analista de voz literária especializado. Analise amostras de escrita "
            "e extraia um perfil de voz detalhado em 10 dimensões. Seja específico e concreto "
            "— cite exemplos das amostras para fundamentar cada dimensão."
        )

        prompt = f"""Analise estas amostras de escrita e crie um perfil de voz detalhado:

AMOSTRAS:
{combined[:6000]}

Para cada dimensão, forneça uma descrição ESPECÍFICA baseada nas amostras (não genérica):

1. SENTENCE_RHYTHM: (padrão de comprimento, uso de fragmentos, ritmo)
2. VOCABULARY_REGISTER: (nível vocabular, formalidade, termos recorrentes)
3. DIALOGUE_STYLE: (naturalista/estilizado, uso de tags, subtexto)
4. EMOTIONAL_TEMPERATURE: (distante/íntimo, guardado/aberto)
5. INTERIORITY_DEPTH: (profundidade do monólogo interno)
6. PUNCTUATION_HABITS: (travessões, fragmentos, vírgulas, ponto e vírgula)
7. STRUCTURAL_INSTINCTS: (linear/não-linear, aberturas, transições)
8. TONAL_ANCHORS: (tom predominante, referências tonais)
9. POV_AND_TENSE: (pessoa, tempo verbal, limitado/onisciente)
10. AVOID: (lista de 5-10 elementos que o autor claramente evita ou deveria evitar)

Responda em JSON com estas 10 chaves. Para "avoid", use uma lista de strings."""

        result = call_llm(prompt, system, max_tokens=2000, provider=self.provider)

        if result:
            try:
                # Extract JSON from response
                json_match = re.search(r'\{[\s\S]*\}', result)
                if json_match:
                    data = json.loads(json_match.group())
                    profile = VoiceProfile(
                        sentence_rhythm=data.get("SENTENCE_RHYTHM", data.get("sentence_rhythm", "")),
                        vocabulary_register=data.get("VOCABULARY_REGISTER", data.get("vocabulary_register", "")),
                        dialogue_style=data.get("DIALOGUE_STYLE", data.get("dialogue_style", "")),
                        emotional_temperature=data.get("EMOTIONAL_TEMPERATURE", data.get("emotional_temperature", "")),
                        interiority_depth=data.get("INTERIORITY_DEPTH", data.get("interiority_depth", "")),
                        punctuation_habits=data.get("PUNCTUATION_HABITS", data.get("punctuation_habits", "")),
                        structural_instincts=data.get("STRUCTURAL_INSTINCTS", data.get("structural_instincts", "")),
                        tonal_anchors=data.get("TONAL_ANCHORS", data.get("tonal_anchors", "")),
                        pov_and_tense=data.get("POV_AND_TENSE", data.get("pov_and_tense", "")),
                        avoid=data.get("AVOID", data.get("avoid", [])),
                        genre=genre,
                        topic=topic,
                        source="samples",
                    )
                    return profile
            except (json.JSONDecodeError, KeyError):
                pass

        return self.from_genre_defaults(genre, topic)

    def from_interview_responses(self, responses: List[str], genre: str = "", topic: str = "") -> VoiceProfile:
        """
        Analyze voice interview responses (4 questions) to build profile.
        Questions are defined in VOICE_INTERVIEW_QUESTIONS.
        """
        if not responses:
            return self.from_genre_defaults(genre, topic)

        # Treat interview responses as writing samples
        return self.from_writing_samples(responses, genre, topic)

    def get_interview_questions(self) -> List[str]:
        """Return the 4 voice interview questions."""
        return list(VOICE_INTERVIEW_QUESTIONS)

    def merge_custom_rules(self, profile: VoiceProfile, custom_rules: Dict) -> VoiceProfile:
        """Merge custom rules into an existing profile."""
        for key, value in custom_rules.items():
            if hasattr(profile, key) and key != "avoid":
                setattr(profile, key, value)
            elif key == "avoid" and isinstance(value, list):
                profile.avoid.extend(value)
            else:
                profile.custom_rules[key] = value
        return profile

    def _classify_genre(self, genre: str) -> str:
        if not genre:
            return "nonfiction"
        g = genre.lower()
        if any(kw in g for kw in [
            "fiction", "ficção", "fantasy", "fantasia", "romance",
            "thriller", "mystery", "mistério", "sci", "horror", "novel", "conto"
        ]):
            return "fiction"
        if any(kw in g for kw in [
            "technical", "técnico", "programming", "programação",
            "code", "código", "software"
        ]):
            return "technical"
        return "nonfiction"


# =============================================================================
# 2. LIVING STORY BIBLE (auto-updated per chapter)
# =============================================================================

@dataclass
class Character:
    """Full character tracking — Novel Process style."""
    name: str
    physical_description: str = ""
    age: str = ""
    speech_patterns: str = ""
    arc: str = ""
    wound: str = ""
    first_appearance: int = 0  # chapter number
    chapters_present: list = field(default_factory=list)
    status: str = "alive"  # alive, dead, unknown

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class TimelineEntry:
    """Timeline event tracking."""
    chapter: int
    time_marker: str = ""
    alive_count: int = 0
    key_events: list = field(default_factory=list)
    deaths: list = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class Location:
    """Location tracking."""
    name: str
    description: str = ""
    key_details: str = ""
    scenes_set: list = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class Motif:
    """Motif and symbol tracking."""
    element: str
    first_introduction: int = 0  # chapter
    appearances: list = field(default_factory=list)
    thematic_function: str = ""

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ContinuityFlag:
    """Continuity tracking to prevent contradictions."""
    item: str
    established_fact: str
    established_in: int = 0  # chapter
    potential_conflict: str = ""
    resolved: bool = False

    def to_dict(self) -> Dict:
        return asdict(self)


class LivingStoryBible:
    """
    Auto-updated story bible that tracks characters, timeline, locations,
    motifs, and continuity flags across the entire manuscript.

    Replaces the basic ChapterMemory with Novel Process-style tracking.
    """

    def __init__(self):
        self.characters: Dict[str, Character] = {}
        self.timeline: List[TimelineEntry] = []
        self.locations: Dict[str, Location] = {}
        self.motifs: Dict[str, Motif] = {}
        self.continuity_flags: List[ContinuityFlag] = []
        self.death_count_tracker: List[Dict] = []  # [{chapter, count, who}]
        self.initial_count: int = 0
        self.current_alive: int = 0
        # Backward compat with ChapterMemory
        self.summaries: List[Dict] = []
        self.key_facts: List[str] = []
        self.banned_phrases: List[str] = []
        self.materials_context: str = ""

    def set_initial_count(self, count: int):
        """Set initial character count (e.g., 47 colonists)."""
        self.initial_count = count
        self.current_alive = count

    def set_materials(self, materials_text: str):
        """Inject source materials (backward compat with ChapterMemory)."""
        self.materials_context = materials_text
        if materials_text:
            sentences = re.split(r'[.!?\n]', materials_text)
            for s in sentences[:50]:
                s = s.strip()
                if 30 < len(s) < 300:
                    self.key_facts.append(s)

    def update_from_chapter(self, chapter_number: int, title: str, content: str,
                            provider: str = None):
        """
        Auto-update all bible sections from a generated chapter.
        Uses LLM when available for deep extraction, falls back to regex.
        """
        if not content:
            return

        # Basic tracking (always works)
        summary = content[:500].replace("\n", " ").strip()
        self.summaries.append({"chapter": chapter_number, "title": title, "summary": summary})
        self._extract_entities_basic(content, chapter_number)
        self._update_banned(content)

        # LLM-powered deep extraction
        if HAS_LLM and provider != "template":
            self._extract_deep(chapter_number, title, content, provider)

    def _extract_deep(self, chapter_number: int, title: str, content: str,
                      provider: str = None):
        """Use LLM to extract characters, events, locations, motifs from chapter."""
        system = (
            "Você é um analista literário. Extraia informações estruturadas de um capítulo. "
            "Responda APENAS em JSON válido."
        )
        prompt = f"""Analise este capítulo e extraia:

CAPÍTULO {chapter_number}: "{title}"
{content[:4000]}

Retorne JSON com:
{{
  "characters": [
    {{"name": "...", "description": "...", "speech_pattern": "...", "status": "alive|dead"}}
  ],
  "events": ["evento 1", "evento 2"],
  "deaths": ["nome da pessoa que morreu"],
  "locations": [{{"name": "...", "description": "..."}}],
  "motifs": [{{"element": "...", "function": "..."}}],
  "continuity_notes": ["nota sobre fato estabelecido que deve ser mantido"],
  "time_marker": "indicação temporal do capítulo"
}}"""

        result = call_llm(prompt, system, max_tokens=1500, provider=provider)
        if not result:
            return

        try:
            json_match = re.search(r'\{[\s\S]*\}', result)
            if not json_match:
                return
            data = json.loads(json_match.group())

            # Update characters
            for char_data in data.get("characters", []):
                name = char_data.get("name", "")
                if not name:
                    continue
                if name not in self.characters:
                    self.characters[name] = Character(
                        name=name,
                        physical_description=char_data.get("description", ""),
                        speech_patterns=char_data.get("speech_pattern", ""),
                        first_appearance=chapter_number,
                        status=char_data.get("status", "alive"),
                    )
                self.characters[name].chapters_present.append(chapter_number)
                if char_data.get("status") == "dead":
                    self.characters[name].status = "dead"

            # Update deaths
            deaths = data.get("deaths", [])
            if deaths:
                self.current_alive -= len(deaths)
                self.death_count_tracker.append({
                    "chapter": chapter_number,
                    "deaths": deaths,
                    "alive_after": self.current_alive,
                })

            # Update timeline
            self.timeline.append(TimelineEntry(
                chapter=chapter_number,
                time_marker=data.get("time_marker", ""),
                alive_count=self.current_alive,
                key_events=data.get("events", []),
                deaths=deaths,
            ))

            # Update locations
            for loc_data in data.get("locations", []):
                name = loc_data.get("name", "")
                if name and name not in self.locations:
                    self.locations[name] = Location(
                        name=name,
                        description=loc_data.get("description", ""),
                    )
                if name in self.locations:
                    self.locations[name].scenes_set.append(chapter_number)

            # Update motifs
            for motif_data in data.get("motifs", []):
                element = motif_data.get("element", "")
                if not element:
                    continue
                if element not in self.motifs:
                    self.motifs[element] = Motif(
                        element=element,
                        first_introduction=chapter_number,
                        thematic_function=motif_data.get("function", ""),
                    )
                self.motifs[element].appearances.append(chapter_number)

            # Update continuity flags
            for note in data.get("continuity_notes", []):
                self.continuity_flags.append(ContinuityFlag(
                    item=note[:80],
                    established_fact=note,
                    established_in=chapter_number,
                ))

        except (json.JSONDecodeError, KeyError, TypeError):
            pass

    def _extract_entities_basic(self, text: str, chapter_number: int):
        """Basic entity extraction (no LLM needed)."""
        words = re.findall(r'\b[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*\b', text)
        counts = Counter(words)
        skip = {"The", "This", "That", "There", "They", "Chapter", "Capítulo",
                "Para", "Como", "Quando", "Onde", "Porque", "Então", "Depois",
                "Antes", "Ainda", "Também", "Muito", "Cada", "Todo", "Toda"}
        for word, count in counts.items():
            if count >= 2 and len(word) > 3 and word not in skip:
                if word not in self.characters:
                    self.characters[word] = Character(
                        name=word,
                        first_appearance=chapter_number,
                    )
                if chapter_number not in self.characters[word].chapters_present:
                    self.characters[word].chapters_present.append(chapter_number)

    def _update_banned(self, text: str):
        """Track overused phrases for anti-repetition."""
        phrases = re.findall(r'\b\w+\s+\w+\s+\w+\b', text.lower())
        counts = Counter(phrases)
        for phrase, count in counts.items():
            if count >= 3 and phrase not in self.banned_phrases:
                self.banned_phrases.append(phrase)

    def to_context_block(self) -> str:
        """Generate context block for injection into writing prompts."""
        lines = []

        # Character summaries
        if self.characters:
            lines.append("STORY BIBLE — PERSONAGENS:")
            for name, char in list(self.characters.items())[:15]:
                status = f" [{char.status.upper()}]" if char.status != "alive" else ""
                desc = f" — {char.physical_description[:80]}" if char.physical_description else ""
                speech = f" | Fala: {char.speech_patterns[:60]}" if char.speech_patterns else ""
                lines.append(f"  {name}{status}{desc}{speech}")

        # Death tracker
        if self.death_count_tracker:
            last = self.death_count_tracker[-1]
            lines.append(f"\nCONTAGEM: {self.current_alive} vivos de {self.initial_count} originais")
            lines.append(f"  Última morte: Cap.{last['chapter']} — {', '.join(last['deaths'])}")

        # Recent timeline
        if self.timeline:
            lines.append("\nTIMELINE RECENTE:")
            for entry in self.timeline[-5:]:
                events = "; ".join(entry.key_events[:3]) if entry.key_events else "—"
                lines.append(f"  Cap.{entry.chapter} ({entry.time_marker}): {events}")

        # Chapter summaries (backward compat)
        if self.summaries:
            lines.append("\nRESUMOS DOS CAPÍTULOS ANTERIORES:")
            for s in self.summaries[-5:]:
                lines.append(f"  Cap.{s['chapter']} '{s['title']}': {s['summary'][:200]}")

        # Continuity flags
        if self.continuity_flags:
            lines.append("\nFLAGS DE CONTINUIDADE (manter consistência):")
            for flag in self.continuity_flags[-10:]:
                lines.append(f"  [Cap.{flag.established_in}] {flag.established_fact[:100]}")

        # Locations
        if self.locations:
            loc_names = [f"{name} (Cap.{','.join(str(c) for c in loc.scenes_set[:3])})"
                        for name, loc in list(self.locations.items())[:8]]
            lines.append(f"\nLOCAIS: {'; '.join(loc_names)}")

        # Motifs
        if self.motifs:
            motif_strs = [f"{m.element} (desde Cap.{m.first_introduction})"
                         for m in list(self.motifs.values())[:5]]
            lines.append(f"\nMOTIVOS/SÍMBOLOS: {'; '.join(motif_strs)}")

        return "\n".join(lines)

    def to_materials_block(self) -> str:
        """Return materials context (backward compat)."""
        if not self.materials_context:
            return ""
        return f"""
MATERIAIS DE REFERÊNCIA DO AUTOR:
=====================================================================
{self.materials_context[:8000]}
=====================================================================
IMPORTANTE: Use estes materiais como fonte primária."""

    def to_ban_block(self) -> str:
        """Return banned phrases (backward compat)."""
        if not self.banned_phrases:
            return ""
        sample = self.banned_phrases[:15]
        return "EVITE estas frases já usadas em excesso: " + ", ".join(f'"{p}"' for p in sample)

    def to_full_bible(self) -> Dict:
        """Export complete story bible as dict."""
        return {
            "characters": {k: v.to_dict() for k, v in self.characters.items()},
            "timeline": [t.to_dict() for t in self.timeline],
            "locations": {k: v.to_dict() for k, v in self.locations.items()},
            "motifs": {k: v.to_dict() for k, v in self.motifs.items()},
            "continuity_flags": [f.to_dict() for f in self.continuity_flags],
            "death_tracker": self.death_count_tracker,
            "initial_count": self.initial_count,
            "current_alive": self.current_alive,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'LivingStoryBible':
        """Reconstruct from saved dict."""
        bible = cls()
        if not data:
            return bible
        for name, char_data in data.get("characters", {}).items():
            bible.characters[name] = Character(**char_data)
        for t_data in data.get("timeline", []):
            bible.timeline.append(TimelineEntry(**t_data))
        for name, loc_data in data.get("locations", {}).items():
            bible.locations[name] = Location(**loc_data)
        for elem, motif_data in data.get("motifs", {}).items():
            bible.motifs[elem] = Motif(**motif_data)
        for flag_data in data.get("continuity_flags", []):
            bible.continuity_flags.append(ContinuityFlag(**flag_data))
        bible.death_count_tracker = data.get("death_tracker", [])
        bible.initial_count = data.get("initial_count", 0)
        bible.current_alive = data.get("current_alive", 0)
        return bible


# =============================================================================
# 3. CRAFT STANDARDS (customizable per project)
# =============================================================================

DEFAULT_CRAFT_STANDARDS = {
    "scene_construction": {
        "entry_point": "Comece cada cena o mais tarde possível — entre no meio da ação.",
        "turn": "Cada cena DEVE ter uma virada — expectativa violada, emoção muda, informação revelada ou retida.",
        "exit_point": "Saia antes que a cena se explique — o leitor deve inclinar-se para frente.",
        "minimum_purposes": 2,
        "purposes": ["avançar enredo", "aprofundar personagem", "aumentar stakes", "revelar tema", "mudar compreensão do leitor"],
    },
    "dialogue": {
        "tags": "Use apenas 'disse' e 'perguntou' até serem invisíveis. Use ações ao invés de tags quando possível.",
        "subtext": "Cada linha de diálogo deve: revelar personagem, avançar conflito, conter subtexto, ou estabelecer voz.",
        "read_aloud": "Leia todo diálogo em voz alta. Se você nunca diria isso, corte.",
        "avoid_said_bookisms": True,
    },
    "interiority": {
        "rule": "Pensamentos do personagem NÃO devem narrar o que o leitor já sabe. Devem revelar o que o personagem está mentindo para si mesmo, tem medo de admitir, ou nota quando não deveria.",
        "physical_correlate": "Evite resumir emoção. Encontre o correlato físico. Encontre o pensamento específico que a produz.",
    },
    "description": {
        "through_character": "Descreva através da consciência do personagem. O que o personagem nota nos diz quem ele é.",
        "specificity": "Um detalhe surpreendente e específico vale um parágrafo de descrição genérica.",
        "adjective_limit": "Limite adjetivos. Substantivos e verbos carregam mais peso.",
    },
    "openings": {
        "rule": "A primeira frase deve conquistar a atenção do leitor: estabelecer voz, criar uma pergunta na mente do leitor, ou colocar o leitor imediatamente em sensação ou ação.",
        "avoid": "Nunca comece com o clima, a menos que o clima seja o antagonista.",
    },
    "endings": {
        "short_fiction": "Termine em ressonância, não resolução. A história deve continuar na mente do leitor.",
        "novel_chapter": "Honre a promessa da premissa. Termine com algo que exija ler o próximo capítulo.",
        "novel_final": "O final não é o destino — é a reverberação.",
    },
    "pacing": {
        "rule": "Frases longas desaceleram o leitor. Frases curtas aceleram. Ritmo não é decoração — é significado.",
    },
    "line_polish": {
        "steps": [
            "Corte toda palavra que não conquista nada.",
            "Afie a primeira e última frase de cada cena.",
            "Leia diálogo em voz alta. Se nunca diria, corte.",
            "Verifique repetição involuntária de palavras incomuns.",
            "Verifique que primeira e última linhas do manuscrito fazem trabalho máximo.",
        ],
    },
}


class CraftStandards:
    """
    Customizable writing craft standards per project.
    Inspired by AGENTS.md's Verity persona.
    """

    def __init__(self, standards: Dict = None):
        self.standards = dict(DEFAULT_CRAFT_STANDARDS)
        if standards:
            self._deep_merge(self.standards, standards)

    def _deep_merge(self, base: Dict, override: Dict):
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value

    def to_prompt_block(self) -> str:
        """Generate craft standards block for writing prompts."""
        lines = ["CRAFT STANDARDS (regras de escrita obrigatórias):"]

        sc = self.standards.get("scene_construction", {})
        lines.append(f"\n  CONSTRUÇÃO DE CENA:")
        lines.append(f"    Entrada: {sc.get('entry_point', '')}")
        lines.append(f"    Virada: {sc.get('turn', '')}")
        lines.append(f"    Saída: {sc.get('exit_point', '')}")
        min_p = sc.get('minimum_purposes', 2)
        lines.append(f"    Cada cena DEVE fazer pelo menos {min_p} coisas: {', '.join(sc.get('purposes', []))}")

        dl = self.standards.get("dialogue", {})
        lines.append(f"\n  DIÁLOGO:")
        lines.append(f"    Tags: {dl.get('tags', '')}")
        lines.append(f"    Subtexto: {dl.get('subtext', '')}")

        it = self.standards.get("interiority", {})
        lines.append(f"\n  INTERIORIDADE:")
        lines.append(f"    {it.get('rule', '')}")
        lines.append(f"    {it.get('physical_correlate', '')}")

        desc = self.standards.get("description", {})
        lines.append(f"\n  DESCRIÇÃO:")
        lines.append(f"    {desc.get('through_character', '')}")
        lines.append(f"    {desc.get('specificity', '')}")

        op = self.standards.get("openings", {})
        lines.append(f"\n  ABERTURAS: {op.get('rule', '')}")

        end = self.standards.get("endings", {})
        lines.append(f"\n  ENCERRAMENTOS: {end.get('novel_chapter', '')}")

        pac = self.standards.get("pacing", {})
        lines.append(f"\n  RITMO: {pac.get('rule', '')}")

        return "\n".join(lines)

    def to_line_polish_block(self) -> str:
        """Generate line polish checklist for editor agent."""
        lp = self.standards.get("line_polish", {})
        steps = lp.get("steps", [])
        if not steps:
            return ""
        lines = ["LINE POLISH — Checklist Final:"]
        for i, step in enumerate(steps, 1):
            lines.append(f"  {i}. {step}")
        return "\n".join(lines)

    def to_dict(self) -> Dict:
        return dict(self.standards)

    @classmethod
    def from_dict(cls, data: Dict) -> 'CraftStandards':
        return cls(standards=data)


# =============================================================================
# 4. SCENE OUTLINE ENGINE (beat-by-beat with turns and POV)
# =============================================================================

@dataclass
class SceneBeat:
    """A single beat in a scene outline."""
    number: int
    description: str
    pov: str = ""
    purpose: str = ""  # Which purposes this beat serves

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class SceneOutline:
    """Complete scene-by-scene outline for a chapter."""
    chapter_number: int
    chapter_title: str
    pov: str = ""
    when: str = ""
    where: str = ""
    beats: list = field(default_factory=list)
    turn: str = ""  # The key turn/revelation in the chapter
    alive_count: int = 0
    event_tracker: dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return asdict(self)

    def to_prompt_block(self) -> str:
        """Convert to prompt block for WriterAgent."""
        lines = [f"SCENE OUTLINE — Capítulo {self.chapter_number}: \"{self.chapter_title}\""]
        if self.pov:
            lines.append(f"POV: {self.pov}")
        if self.when:
            lines.append(f"QUANDO: {self.when}")
        if self.where:
            lines.append(f"ONDE: {self.where}")
        if self.alive_count:
            lines.append(f"CONTAGEM: {self.alive_count} vivos")
        lines.append("")

        for beat in self.beats:
            purpose = f" [{beat.get('purpose', '')}]" if isinstance(beat, dict) and beat.get('purpose') else ""
            if isinstance(beat, dict):
                lines.append(f"  Beat {beat.get('number', '?')}{purpose}: {beat.get('description', '')}")
            elif isinstance(beat, SceneBeat):
                p = f" [{beat.purpose}]" if beat.purpose else ""
                lines.append(f"  Beat {beat.number}{p}: {beat.description}")

        if self.turn:
            lines.append(f"\n  VIRADA: {self.turn}")

        return "\n".join(lines)


class SceneOutlineEngine:
    """
    Generates beat-by-beat scene outlines with turns, POV tracking, and event counters.
    Replaces PlannerAgent's flat outline with structured beats.
    """

    def __init__(self, provider: str = None):
        self.provider = provider or get_available_provider()

    def generate(self, chapter_number: int, chapter_title: str, genre: str,
                 topic: str, project_title: str, story_bible: LivingStoryBible = None,
                 voice_profile: VoiceProfile = None, craft_standards: CraftStandards = None,
                 chapter_outline: str = "", language: str = "pt-br") -> SceneOutline:
        """Generate a full scene outline with beats and turns."""

        bible_context = story_bible.to_context_block() if story_bible else ""
        voice_block = voice_profile.to_prompt_block() if voice_profile else ""
        craft_block = craft_standards.to_prompt_block() if craft_standards else ""

        system = (
            "Você é um arquiteto narrativo mestre. Cria outlines cena-por-cena com beats, "
            "viradas e tracking de POV. Cada cena DEVE fazer pelo menos 2 coisas.\n"
            f"{voice_block}\n{craft_block}"
        )

        prompt = f"""Crie um outline beat-by-beat para:

Livro: "{project_title}" | Gênero: {genre} | Tema: {topic}
Capítulo {chapter_number}: "{chapter_title}"
{f'Esboço do capítulo: {chapter_outline}' if chapter_outline else ''}

{bible_context}

Retorne em JSON:
{{
  "pov": "nome do personagem POV",
  "when": "marcador temporal",
  "where": "localização",
  "beats": [
    {{"number": 1, "description": "descrição detalhada do beat", "purpose": "avança enredo + aprofunda personagem"}},
    {{"number": 2, "description": "...", "purpose": "..."}}
  ],
  "turn": "A virada chave do capítulo — o momento que muda tudo",
  "alive_count": {story_bible.current_alive if story_bible else 0}
}}

REGRAS:
- 4-8 beats por capítulo
- Cada beat deve servir pelo menos 2 propósitos
- A virada é o coração do capítulo — NUNCA pule
- Beat 1 = entrada (comece tarde), último beat = saída (saia cedo)"""

        result = call_llm(prompt, system, max_tokens=1500, provider=self.provider)

        if result:
            try:
                json_match = re.search(r'\{[\s\S]*\}', result)
                if json_match:
                    data = json.loads(json_match.group())
                    return SceneOutline(
                        chapter_number=chapter_number,
                        chapter_title=chapter_title,
                        pov=data.get("pov", ""),
                        when=data.get("when", ""),
                        where=data.get("where", ""),
                        beats=data.get("beats", []),
                        turn=data.get("turn", ""),
                        alive_count=data.get("alive_count", 0),
                    )
            except (json.JSONDecodeError, KeyError):
                pass

        # Fallback outline
        return self._template_outline(chapter_number, chapter_title, genre, topic)

    def _template_outline(self, chapter_number: int, chapter_title: str,
                          genre: str, topic: str) -> SceneOutline:
        """Template fallback when LLM is unavailable."""
        return SceneOutline(
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            beats=[
                {"number": 1, "description": f"Entrada: estabelecer clima e stakes para '{chapter_title}'", "purpose": "avança enredo + estabelece tom"},
                {"number": 2, "description": "Tensão dos personagens ou conflito interno emerge", "purpose": "aprofunda personagem + aumenta stakes"},
                {"number": 3, "description": "Momento incitante que impulsiona o capítulo", "purpose": "avança enredo + revela tema"},
                {"number": 4, "description": "Complicações se aprofundam, novas informações reveladas", "purpose": "aumenta stakes + muda compreensão"},
                {"number": 5, "description": "Pico de tensão ou revelação do capítulo", "purpose": "avança enredo + aprofunda personagem"},
                {"number": 6, "description": "Consequências e gancho para o próximo capítulo", "purpose": "avança enredo + aumenta stakes"},
            ],
            turn="Revelação ou mudança que redefine o capítulo",
        )


# =============================================================================
# 5. CHAPTER NOTES (separated from prose)
# =============================================================================

@dataclass
class ChapterNotes:
    """
    Author notes for a chapter — ALWAYS separate from the draft.
    As per Novel Process: draft.md contains prose only, notes.md contains everything else.
    """
    chapter_number: int
    chapter_title: str
    voice_decisions: list = field(default_factory=list)
    structural_choices: list = field(default_factory=list)
    off_voice_flags: list = field(default_factory=list)
    continuity_notes: list = field(default_factory=list)
    revision_suggestions: list = field(default_factory=list)
    word_count: int = 0

    def to_dict(self) -> Dict:
        return asdict(self)

    def to_display(self) -> str:
        """Format notes for display (never included in draft)."""
        lines = [f"NOTES — Capítulo {self.chapter_number}: \"{self.chapter_title}\""]
        lines.append(f"Contagem de palavras: {self.word_count}")

        if self.voice_decisions:
            lines.append("\nDecisões de Voz:")
            for d in self.voice_decisions:
                lines.append(f"  - {d}")

        if self.structural_choices:
            lines.append("\nEscolhas Estruturais:")
            for s in self.structural_choices:
                lines.append(f"  - {s}")

        if self.off_voice_flags:
            lines.append("\nFlags Off-Voice (revisar):")
            for f in self.off_voice_flags:
                lines.append(f"  ⚠ {f}")

        if self.continuity_notes:
            lines.append("\nNotas de Continuidade:")
            for c in self.continuity_notes:
                lines.append(f"  📌 {c}")

        if self.revision_suggestions:
            lines.append("\nSugestões de Revisão:")
            for r in self.revision_suggestions:
                lines.append(f"  → {r}")

        return "\n".join(lines)

    @classmethod
    def from_dict(cls, data: Dict) -> 'ChapterNotes':
        if not data:
            return cls(chapter_number=0, chapter_title="")
        known = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in known}
        return cls(**filtered)


class ChapterNotesGenerator:
    """Generates structured chapter notes from a draft."""

    def __init__(self, provider: str = None):
        self.provider = provider or get_available_provider()

    def generate(self, chapter_number: int, chapter_title: str, content: str,
                 voice_profile: VoiceProfile = None, story_bible: LivingStoryBible = None) -> ChapterNotes:
        """Generate notes for a chapter, analyzing voice compliance and continuity."""
        word_count = len(content.split()) if content else 0

        notes = ChapterNotes(
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            word_count=word_count,
        )

        if not content or not HAS_LLM:
            return notes

        voice_block = voice_profile.to_prompt_block() if voice_profile else ""

        system = (
            "Você é um editor que analisa capítulos e gera notas estruturadas. "
            "Identifique decisões de voz, flags off-voice e notas de continuidade."
        )

        prompt = f"""Analise este capítulo e gere notas:

CAPÍTULO {chapter_number}: "{chapter_title}"
{content[:3000]}

{voice_block}

Retorne JSON:
{{
  "voice_decisions": ["decisão de voz consciente feita no capítulo"],
  "structural_choices": ["escolha estrutural que diverge do outline e por quê"],
  "off_voice_flags": ["passagem que parece off-voice — cite a frase e explique"],
  "continuity_notes": ["fato estabelecido que deve ser mantido em capítulos futuros"],
  "revision_suggestions": ["sugestão específica de melhoria"]
}}

Seja conciso. Max 3-5 itens por categoria."""

        result = call_llm(prompt, system, max_tokens=1000, provider=self.provider)
        if result:
            try:
                json_match = re.search(r'\{[\s\S]*\}', result)
                if json_match:
                    data = json.loads(json_match.group())
                    notes.voice_decisions = data.get("voice_decisions", [])
                    notes.structural_choices = data.get("structural_choices", [])
                    notes.off_voice_flags = data.get("off_voice_flags", [])
                    notes.continuity_notes = data.get("continuity_notes", [])
                    notes.revision_suggestions = data.get("revision_suggestions", [])
            except (json.JSONDecodeError, KeyError):
                pass

        return notes


# =============================================================================
# 6. VOICE COMPLIANCE AUDITOR
# =============================================================================

class VoiceComplianceAuditor:
    """
    Self-audit drafts against the voice profile.
    Identifies the top 3-5 passages that feel most off-voice.
    """

    def __init__(self, provider: str = None):
        self.provider = provider or get_available_provider()

    def audit(self, content: str, voice_profile: VoiceProfile,
              craft_standards: CraftStandards = None) -> Dict:
        """
        Audit a chapter against voice profile and craft standards.
        Returns compliance score (0-100) and specific issues.
        """
        if not content or not HAS_LLM:
            return self._basic_audit(content, voice_profile)

        voice_block = voice_profile.to_prompt_block()
        craft_block = craft_standards.to_prompt_block() if craft_standards else ""

        system = (
            "Você é um auditor de voz literária. Compare o texto contra o perfil "
            "de voz e identifique violações. Seja cirúrgico e específico."
        )

        prompt = f"""Audite este texto contra o perfil de voz:

{voice_block}

{craft_block}

TEXTO A AUDITAR:
{content[:4000]}

Retorne JSON:
{{
  "compliance_score": 85,
  "dimensions_checked": {{
    "sentence_rhythm": {{"score": 90, "note": "..."}},
    "vocabulary_register": {{"score": 80, "note": "..."}},
    "dialogue_style": {{"score": 85, "note": "..."}},
    "emotional_temperature": {{"score": 90, "note": "..."}},
    "interiority_depth": {{"score": 75, "note": "..."}}
  }},
  "off_voice_passages": [
    {{"passage": "trecho exato do texto", "issue": "por que está off-voice", "suggestion": "como corrigir"}}
  ],
  "avoid_violations": ["item da lista 'avoid' que foi violado"],
  "craft_issues": ["violação de craft standards encontrada"],
  "strengths": ["aspecto que está excelente"]
}}"""

        result = call_llm(prompt, system, max_tokens=1500, provider=self.provider)
        if result:
            try:
                json_match = re.search(r'\{[\s\S]*\}', result)
                if json_match:
                    return json.loads(json_match.group())
            except (json.JSONDecodeError, KeyError):
                pass

        return self._basic_audit(content, voice_profile)

    def _basic_audit(self, content: str, voice_profile: VoiceProfile) -> Dict:
        """Basic rule-based audit when LLM is unavailable."""
        issues = []
        score = 80

        if not content:
            return {"compliance_score": 0, "issues": ["No content to audit"]}

        # Check avoid list
        avoid_violations = []
        for avoid_item in voice_profile.avoid:
            avoid_lower = avoid_item.lower()
            # Check for common patterns
            if "advérbio" in avoid_lower and re.findall(r'\w+mente\b', content):
                adverbs = re.findall(r'\w+mente\b', content)
                if len(adverbs) > len(content.split()) * 0.02:  # >2% adverbs
                    avoid_violations.append(f"Excesso de advérbios ({len(adverbs)} encontrados)")
                    score -= 5

            if "passiv" in avoid_lower:
                passive = re.findall(r'\b(?:foi|era|foram|é|são|ser|sido)\s+\w+[oa]d[oa]s?\b', content, re.I)
                if len(passive) > 5:
                    avoid_violations.append(f"Construções passivas excessivas ({len(passive)})")
                    score -= 5

            if "repente" in avoid_lower or "subitamente" in avoid_lower:
                if re.search(r'\b(?:de repente|subitamente|suddenly)\b', content, re.I):
                    avoid_violations.append("Uso de 'de repente' ou 'subitamente'")
                    score -= 3

        # Check sentence variety
        sentences = re.split(r'[.!?]+', content)
        lengths = [len(s.split()) for s in sentences if s.strip()]
        if lengths:
            avg = sum(lengths) / len(lengths)
            std = (sum((l - avg) ** 2 for l in lengths) / len(lengths)) ** 0.5
            if std < 3:
                issues.append("Baixa variedade de comprimento de frases")
                score -= 5

        return {
            "compliance_score": max(0, min(100, score)),
            "avoid_violations": avoid_violations,
            "craft_issues": issues,
            "strengths": [],
            "off_voice_passages": [],
            "dimensions_checked": {},
        }


# =============================================================================
# 7. ENHANCED AGENTS (upgraded PlannerAgent, WriterAgent, CriticAgent, EditorAgent)
# =============================================================================

class EnhancedPlannerAgent:
    """PlannerAgent upgraded with SceneOutlineEngine."""

    def run(self, chapter_title, chapter_number, project_title, genre, topic,
            target_audience, chapter_outline, story_bible, voice_profile,
            craft_standards, provider, language="pt-br") -> str:
        """Generate a beat-by-beat outline with turns and POV."""
        engine = SceneOutlineEngine(provider=provider)
        outline = engine.generate(
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            genre=genre,
            topic=topic,
            project_title=project_title,
            story_bible=story_bible,
            voice_profile=voice_profile,
            craft_standards=craft_standards,
            chapter_outline=chapter_outline,
            language=language,
        )
        return outline.to_prompt_block()


class EnhancedWriterAgent:
    """WriterAgent upgraded with voice profile, craft standards, and story bible."""

    def run(self, chapter_title, chapter_number, project_title, genre, topic,
            target_audience, chapter_outline, planner_outline, story_bible,
            voice_profile, craft_standards, provider, language="pt-br") -> str:
        """Write a chapter following voice profile and craft standards."""

        voice_block = voice_profile.to_prompt_block() if voice_profile else ""
        craft_block = craft_standards.to_prompt_block() if craft_standards else ""
        bible_context = story_bible.to_context_block() if story_bible else ""
        materials = story_bible.to_materials_block() if story_bible else ""
        ban_block = story_bible.to_ban_block() if story_bible else ""

        lang_map = {
            "pt-br": "Escreva TUDO em português brasileiro.",
            "pt": "Escreva TUDO em português.",
            "en": "Write everything in English.",
            "es": "Escribe TODO en español.",
        }
        lang_inst = lang_map.get(language, lang_map["pt-br"])

        system = f"""Você é um ghostwriter mestre de ficção. Sua única função é escrever prosa que soe autenticamente como o autor — não como você. Você desaparece na voz deles.

{voice_block}

{craft_block}

{lang_inst}"""

        prompt = f"""Livro: "{project_title}"
Gênero: {genre} | Tema: {topic} | Público: {target_audience}
Capítulo {chapter_number}: "{chapter_title}"

OUTLINE A SEGUIR:
{planner_outline}

{bible_context}
{materials}
{ban_block}

REGRAS OBRIGATÓRIAS:
- Mínimo 3000 palavras, ideal 3000-4000 palavras
- Siga o VOICE PROFILE exatamente — a voz do autor é sagrada
- Siga os CRAFT STANDARDS — cada cena faz pelo menos 2 coisas
- Se houver materiais de referência, USE-OS como fonte primária
- Diálogo: apenas 'disse' e 'perguntou', use ações ao invés de tags
- Interioridade profunda — viva dentro da cabeça do personagem
- Descrição filtrada pela consciência do personagem
- NÃO use frases genéricas de preenchimento
- Retorne APENAS o texto do capítulo, sem notas ou meta-comentário"""

        result = call_llm(prompt, system, max_tokens=6000, provider=provider)
        return result


class EnhancedCriticAgent:
    """CriticAgent upgraded with voice compliance and craft-aware review."""

    def run(self, draft, chapter_title, genre, story_bible, voice_profile,
            craft_standards, provider, language="pt-br") -> Tuple[str, list]:
        """Review draft against voice profile, craft standards, and story bible."""

        voice_block = voice_profile.to_prompt_block() if voice_profile else ""
        craft_block = craft_standards.to_prompt_block() if craft_standards else ""
        bible_context = story_bible.to_context_block() if story_bible else ""

        system = f"""Você é Verity — um crítico literário com os instintos combinados de editor de desenvolvimento, romancista e leitor voraz. Você verifica:
1. Conformidade com o Voice Profile
2. Conformidade com os Craft Standards
3. Consistência com a Story Bible
4. Qualidade da prosa, diálogo e interioridade"""

        prompt = f"""Capítulo: "{chapter_title}" | Gênero: {genre}

{voice_block}
{craft_block}
{bible_context}

RASCUNHO:
{draft[:3000]}...

ANALISE:
1. Voice Compliance — o texto soa como o autor?
2. Craft Standards — cada cena faz 2+ coisas? Diálogos com subtexto? Interioridade profunda?
3. Continuidade — consistente com personagens/timeline/locais estabelecidos?
4. Prosa — há construções da lista 'avoid'? Adverb stacking? Said-bookisms?

Formato: "PROBLEMA: [descrição]" para cada issue (max 5).
Se a qualidade for aceitável: "APROVADO"
Responda em menos de 300 palavras."""

        result = call_llm(prompt, system, max_tokens=500, provider=provider)
        if not result:
            return "APROVADO", []

        issues = [
            line.replace("PROBLEMA:", "").replace("ISSUE:", "").strip()
            for line in result.split("\n")
            if line.strip().startswith("PROBLEMA:") or line.strip().startswith("ISSUE:")
        ]
        verdict = "APROVADO" if ("APROVADO" in result or "PASS" in result) and not issues else "REVISÃO"
        return verdict, issues


class EnhancedEditorAgent:
    """EditorAgent upgraded with voice profile compliance and line polish."""

    def run(self, draft, issues, chapter_title, voice_profile, craft_standards,
            provider, language="pt-br") -> str:
        """Edit draft fixing issues while maintaining voice profile compliance."""
        if not issues:
            return draft

        voice_block = voice_profile.to_prompt_block() if voice_profile else ""
        line_polish = craft_standards.to_line_polish_block() if craft_standards else ""

        lang_map = {
            "pt-br": "Escreva TUDO em português brasileiro.",
            "en": "Write everything in English.",
        }
        lang_inst = lang_map.get(language, lang_map.get("pt-br"))

        system = f"""Você é um editor meticuloso que corrige problemas específicos sem mudar a voz do autor.

{voice_block}

{line_polish}

{lang_inst}"""

        issues_text = "\n".join(f"- {issue}" for issue in issues)
        prompt = f"""Capítulo: "{chapter_title}"

PROBLEMAS A CORRIGIR:
{issues_text}

RASCUNHO:
{draft}

Corrija os problemas listados. Aplique o LINE POLISH checklist.
Mantenha o VOICE PROFILE exatamente — a voz do autor é sagrada.
{lang_inst}
Retorne APENAS o texto revisado, mantenha o mesmo tamanho aproximado."""

        result = call_llm(prompt, system, max_tokens=6000, provider=provider)
        if result and len(result) > len(draft) * 0.5:
            return result
        return draft


# =============================================================================
# 8. ORCHESTRATOR — Full Novel Process Pipeline
# =============================================================================

class NovelProcessPipeline:
    """
    Full writing pipeline integrating all Novel Process components.
    Replaces the basic multi-agent pipeline with craft-aware generation.
    """

    def __init__(self, genre: str, topic: str, project_title: str,
                 provider: str = None, language: str = "pt-br",
                 voice_profile_data: Dict = None,
                 craft_standards_data: Dict = None,
                 story_bible_data: Dict = None):
        self.provider = provider or get_available_provider()
        self.language = language
        self.project_title = project_title
        self.genre = genre
        self.topic = topic

        # Initialize components
        builder = VoiceProfileBuilder(provider=self.provider)
        if voice_profile_data:
            self.voice_profile = VoiceProfile.from_dict(voice_profile_data)
        else:
            self.voice_profile = builder.from_genre_defaults(genre, topic)

        self.craft_standards = CraftStandards.from_dict(craft_standards_data) if craft_standards_data else CraftStandards()

        if story_bible_data:
            self.story_bible = LivingStoryBible.from_dict(story_bible_data)
        else:
            self.story_bible = LivingStoryBible()

        # Agents
        self.planner = EnhancedPlannerAgent()
        self.writer = EnhancedWriterAgent()
        self.critic = EnhancedCriticAgent()
        self.editor = EnhancedEditorAgent()
        self.notes_generator = ChapterNotesGenerator(provider=self.provider)
        self.auditor = VoiceComplianceAuditor(provider=self.provider)

    def generate_chapter(self, chapter_number: int, chapter_title: str,
                         chapter_outline: str = "", target_audience: str = "",
                         max_revisions: int = 1) -> Dict:
        """
        Full pipeline: Plan → Write → Critique → Edit → Audit → Notes

        Returns dict with: content, notes, audit, outline, story_bible_update
        """
        # Phase 1: Plan (beat-by-beat outline)
        outline = self.planner.run(
            chapter_title=chapter_title,
            chapter_number=chapter_number,
            project_title=self.project_title,
            genre=self.genre,
            topic=self.topic,
            target_audience=target_audience,
            chapter_outline=chapter_outline,
            story_bible=self.story_bible,
            voice_profile=self.voice_profile,
            craft_standards=self.craft_standards,
            provider=self.provider,
            language=self.language,
        )

        # Phase 2: Write
        draft = self.writer.run(
            chapter_title=chapter_title,
            chapter_number=chapter_number,
            project_title=self.project_title,
            genre=self.genre,
            topic=self.topic,
            target_audience=target_audience,
            chapter_outline=chapter_outline,
            planner_outline=outline,
            story_bible=self.story_bible,
            voice_profile=self.voice_profile,
            craft_standards=self.craft_standards,
            provider=self.provider,
            language=self.language,
        )

        if not draft:
            return {"content": None, "error": "Writer agent returned no content"}

        # Phase 3: Critique + Edit loop
        final_draft = draft
        all_issues = []
        for revision in range(max_revisions):
            verdict, issues = self.critic.run(
                draft=final_draft,
                chapter_title=chapter_title,
                genre=self.genre,
                story_bible=self.story_bible,
                voice_profile=self.voice_profile,
                craft_standards=self.craft_standards,
                provider=self.provider,
                language=self.language,
            )
            all_issues.extend(issues)

            if verdict == "APROVADO" or not issues:
                break

            final_draft = self.editor.run(
                draft=final_draft,
                issues=issues,
                chapter_title=chapter_title,
                voice_profile=self.voice_profile,
                craft_standards=self.craft_standards,
                provider=self.provider,
                language=self.language,
            )

        # Phase 4: Voice compliance audit
        audit = self.auditor.audit(
            content=final_draft,
            voice_profile=self.voice_profile,
            craft_standards=self.craft_standards,
        )

        # Phase 5: Generate chapter notes (separate from prose)
        notes = self.notes_generator.generate(
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            content=final_draft,
            voice_profile=self.voice_profile,
            story_bible=self.story_bible,
        )

        # Phase 6: Update story bible
        self.story_bible.update_from_chapter(
            chapter_number=chapter_number,
            title=chapter_title,
            content=final_draft,
            provider=self.provider,
        )

        return {
            "content": final_draft,
            "outline": outline,
            "notes": notes.to_dict(),
            "audit": audit,
            "issues_found": all_issues,
            "story_bible_snapshot": self.story_bible.to_full_bible(),
            "word_count": len(final_draft.split()) if final_draft else 0,
        }

    def build_voice_profile_from_samples(self, samples: List[str]) -> VoiceProfile:
        """Build and set voice profile from writing samples."""
        builder = VoiceProfileBuilder(provider=self.provider)
        self.voice_profile = builder.from_writing_samples(samples, self.genre, self.topic)
        return self.voice_profile

    def get_voice_interview_questions(self) -> List[str]:
        """Return the 4 voice interview questions."""
        return VOICE_INTERVIEW_QUESTIONS

    def get_story_bible(self) -> Dict:
        """Export current story bible."""
        return self.story_bible.to_full_bible()

    def get_voice_profile(self) -> Dict:
        """Export current voice profile."""
        return self.voice_profile.to_dict()

    def get_craft_standards(self) -> Dict:
        """Export current craft standards."""
        return self.craft_standards.to_dict()


# =============================================================================
# 9. AI-TELL DETECTOR (from Inkos — rule-based, no LLM needed)
# =============================================================================

# Hedge/filler words common in AI-generated text (PT-BR + EN)
HEDGE_WORDS_PT = [
    "de certa forma", "de alguma maneira", "em certo sentido", "até certo ponto",
    "de algum modo", "possivelmente", "talvez", "provavelmente", "aparentemente",
    "é importante notar que", "vale ressaltar que", "é fundamental destacar",
    "não se pode negar que", "indubitavelmente", "sem dúvida alguma",
]

HEDGE_WORDS_EN = [
    "perhaps", "maybe", "somewhat", "arguably", "it's worth noting",
    "it's important to note", "it should be noted", "fundamentally",
    "essentially", "basically", "in a sense", "to some extent",
]

# Formulaic transition words (AI overuses these)
TRANSITION_WORDS_PT = [
    "no entanto", "todavia", "contudo", "além disso", "ademais",
    "por outro lado", "nesse sentido", "diante disso", "com isso em mente",
    "é interessante notar", "curiosamente", "surpreendentemente",
]

TRANSITION_WORDS_EN = [
    "however", "moreover", "furthermore", "additionally", "nevertheless",
    "consequently", "on the other hand", "interestingly", "surprisingly",
    "it's worth mentioning", "notably",
]


@dataclass
class AITellIssue:
    """A detected AI-tell pattern."""
    severity: str  # "warning" | "info"
    category: str
    description: str
    suggestion: str

    def to_dict(self) -> Dict:
        return asdict(self)


class AITellDetector:
    """
    Rule-based AI-generated text detection (inspired by Inkos ai-tells.ts).
    Detects:
    - Paragraph length uniformity (low variance = AI pattern)
    - Hedge/filler word density
    - Formulaic transition repetition
    - List-like structure (consecutive same-prefix sentences)
    - Adverb stacking
    - Said-bookism detection
    """

    def analyze(self, content: str, language: str = "pt-br") -> Dict:
        """Analyze text for AI-tell patterns. Returns issues and score."""
        if not content:
            return {"issues": [], "ai_score": 0, "human_score": 100}

        issues = []
        is_pt = language.startswith("pt")

        # 1. Paragraph length uniformity
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        if len(paragraphs) >= 3:
            lengths = [len(p) for p in paragraphs]
            mean = sum(lengths) / len(lengths)
            if mean > 0:
                variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
                std_dev = variance ** 0.5
                cv = std_dev / mean
                if cv < 0.15:
                    issues.append(AITellIssue(
                        severity="warning",
                        category="paragraph_uniformity",
                        description=f"Coeficiente de variação dos parágrafos = {cv:.3f} (limiar <0.15). Parágrafos muito uniformes = padrão AI.",
                        suggestion="Varie o comprimento: parágrafos curtos para impacto, longos para imersão.",
                    ))

        # 2. Hedge/filler word density
        hedge_words = HEDGE_WORDS_PT if is_pt else HEDGE_WORDS_EN
        total_words = len(content.split())
        if total_words > 0:
            hedge_count = sum(content.lower().count(w) for w in hedge_words)
            hedge_density = hedge_count / (total_words / 1000)
            if hedge_density > 3:
                issues.append(AITellIssue(
                    severity="warning",
                    category="hedge_density",
                    description=f"Densidade de palavras de preenchimento = {hedge_density:.1f}/1000 palavras (limiar >3).",
                    suggestion="Substitua por afirmações diretas. 'Talvez' → afirme. 'É importante notar' → delete.",
                ))

        # 3. Formulaic transition repetition
        transitions = TRANSITION_WORDS_PT if is_pt else TRANSITION_WORDS_EN
        repeated = []
        for word in transitions:
            count = content.lower().count(word)
            if count >= 3:
                repeated.append(f'"{word}" x{count}')
        if repeated:
            issues.append(AITellIssue(
                severity="warning",
                category="formulaic_transitions",
                description=f"Transições repetitivas: {', '.join(repeated)}.",
                suggestion="Use transições naturais: ação, mudança de tempo, corte de cena.",
            ))

        # 4. Consecutive same-prefix sentences (list-like structure)
        sentences = [s.strip() for s in re.split(r'[.!?。！？\n]', content) if len(s.strip()) > 5]
        if len(sentences) >= 3:
            max_consecutive = 1
            current = 1
            for i in range(1, len(sentences)):
                prefix_len = min(3, len(sentences[i]), len(sentences[i-1]))
                if sentences[i][:prefix_len] == sentences[i-1][:prefix_len]:
                    current += 1
                    max_consecutive = max(max_consecutive, current)
                else:
                    current = 1
            if max_consecutive >= 4:
                issues.append(AITellIssue(
                    severity="warning",
                    category="list_structure",
                    description=f"{max_consecutive} frases consecutivas com mesmo prefixo = estrutura de lista AI.",
                    suggestion="Varie as aberturas das frases. Use ação, diálogo, descrição alternados.",
                ))

        # 5. Adverb stacking (for Portuguese)
        if is_pt:
            adverbs = re.findall(r'\b\w+mente\b', content)
            if total_words > 0 and len(adverbs) / total_words > 0.02:
                issues.append(AITellIssue(
                    severity="info",
                    category="adverb_stacking",
                    description=f"{len(adverbs)} advérbios em -mente ({len(adverbs)/total_words*100:.1f}% das palavras).",
                    suggestion="Corte advérbios desnecessários. Use verbos mais precisos.",
                ))

        # 6. Said-bookism detection
        said_bookisms_pt = re.findall(
            r'\b(exclamou|murmurou|sussurrou|gritou|rosnou|bufou|gemeu|balbuciou|vociferou|berrou)\b',
            content, re.I
        )
        said_bookisms_en = re.findall(
            r'\b(exclaimed|murmured|whispered|growled|snarled|breathed|gasped|hissed|bellowed)\b',
            content, re.I
        )
        bookisms = said_bookisms_pt if is_pt else said_bookisms_en
        if len(bookisms) > 5:
            issues.append(AITellIssue(
                severity="info",
                category="said_bookisms",
                description=f"{len(bookisms)} said-bookisms encontrados. Use 'disse'/'perguntou' e ações.",
                suggestion="Substitua por 'disse', 'perguntou', ou action beats.",
            ))

        # Calculate AI score (0=human, 100=AI)
        warning_count = sum(1 for i in issues if i.severity == "warning")
        info_count = sum(1 for i in issues if i.severity == "info")
        ai_score = min(100, warning_count * 20 + info_count * 5)

        return {
            "issues": [i.to_dict() for i in issues],
            "ai_score": ai_score,
            "human_score": 100 - ai_score,
            "total_issues": len(issues),
            "warnings": warning_count,
            "info": info_count,
        }


# =============================================================================
# 10. STYLE FINGERPRINT (from Inkos — pure text analysis, no LLM)
# =============================================================================

class StyleFingerprint:
    """
    Statistical text analysis for style imitation (inspired by Inkos style-analyzer.ts).
    Extracts: sentence length distribution, vocabulary diversity, paragraph patterns,
    rhetorical features, and opening patterns.
    """

    def analyze(self, text: str, source_name: str = "") -> Dict:
        """Analyze reference text and extract style fingerprint."""
        if not text:
            return {"error": "No text to analyze"}

        sentences = [s.strip() for s in re.split(r'[.!?。！？\n]', text) if s.strip()]
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        words = text.split()

        # Sentence length stats
        sent_lengths = [len(s.split()) for s in sentences]
        avg_sent = sum(sent_lengths) / len(sent_lengths) if sent_lengths else 0
        std_sent = (sum((l - avg_sent) ** 2 for l in sent_lengths) / max(1, len(sent_lengths))) ** 0.5

        # Paragraph length stats
        para_lengths = [len(p.split()) for p in paragraphs]
        avg_para = sum(para_lengths) / len(para_lengths) if para_lengths else 0

        # Vocabulary diversity (Type-Token Ratio)
        unique_words = set(w.lower() for w in words)
        ttr = len(unique_words) / len(words) if words else 0

        # Sentence opening patterns (first 2-3 words)
        openings = Counter()
        for s in sentences:
            w = s.split()[:2]
            if len(w) >= 2:
                openings[" ".join(w)] += 1
        top_openings = [f"{p} ({c}x)" for p, c in openings.most_common(5) if c >= 3]

        # Dialogue ratio
        dialogue_lines = len(re.findall(r'["""\'].*?["""\']', text))
        dialogue_ratio = dialogue_lines / max(1, len(sentences))

        # Short vs long sentence ratio
        short = sum(1 for l in sent_lengths if l <= 8)
        long = sum(1 for l in sent_lengths if l >= 25)
        short_ratio = short / max(1, len(sent_lengths))
        long_ratio = long / max(1, len(sent_lengths))

        # Fragment count (sentences < 5 words)
        fragments = sum(1 for l in sent_lengths if l <= 4)

        return {
            "source_name": source_name,
            "total_words": len(words),
            "total_sentences": len(sentences),
            "total_paragraphs": len(paragraphs),
            "avg_sentence_length": round(avg_sent, 1),
            "sentence_length_std_dev": round(std_sent, 1),
            "avg_paragraph_length": round(avg_para),
            "paragraph_range": {
                "min": min(para_lengths) if para_lengths else 0,
                "max": max(para_lengths) if para_lengths else 0,
            },
            "vocabulary_diversity_ttr": round(ttr, 3),
            "top_openings": top_openings,
            "dialogue_ratio": round(dialogue_ratio, 2),
            "short_sentence_ratio": round(short_ratio, 2),
            "long_sentence_ratio": round(long_ratio, 2),
            "fragment_count": fragments,
            "style_guide": self._generate_style_guide(
                avg_sent, std_sent, short_ratio, long_ratio, dialogue_ratio, ttr, fragments
            ),
        }

    def _generate_style_guide(self, avg_sent, std_sent, short_ratio, long_ratio,
                               dialogue_ratio, ttr, fragments) -> str:
        """Generate a human-readable style guide from fingerprint data."""
        lines = ["STYLE FINGERPRINT (imite este padrão estatístico):"]

        # Sentence rhythm
        if short_ratio > 0.3:
            lines.append(f"  Ritmo: Predominantemente frases curtas ({short_ratio:.0%}). Staccato, impactante.")
        elif long_ratio > 0.3:
            lines.append(f"  Ritmo: Predominantemente frases longas ({long_ratio:.0%}). Fluido, imersivo.")
        else:
            lines.append(f"  Ritmo: Misto (curtas {short_ratio:.0%}, longas {long_ratio:.0%}). Variado.")

        lines.append(f"  Comprimento médio: {avg_sent:.0f} palavras/frase (desvio: {std_sent:.0f})")

        if fragments > 5:
            lines.append(f"  Fragmentos: {fragments} — usa fragmentos para ênfase e pensamento interior.")

        if dialogue_ratio > 0.2:
            lines.append(f"  Diálogo: Alto ({dialogue_ratio:.0%}). Cenas com muito diálogo.")
        elif dialogue_ratio < 0.05:
            lines.append(f"  Diálogo: Baixo ({dialogue_ratio:.0%}). Narrativa predominantemente interna.")

        if ttr > 0.6:
            lines.append(f"  Vocabulário: Rico e diverso (TTR {ttr:.2f}).")
        elif ttr < 0.3:
            lines.append(f"  Vocabulário: Restrito e repetitivo (TTR {ttr:.2f}).")

        return "\n".join(lines)


# =============================================================================
# 11. MULTI-DIMENSION AUDITOR (inspired by Inkos 33-dimension system)
# =============================================================================

# Audit dimensions adapted from Inkos for Western fiction (EN/PT)
AUDIT_DIMENSIONS = {
    1: {"name": "OOC Check", "desc": "Personagem age fora do caráter estabelecido"},
    2: {"name": "Timeline", "desc": "Inconsistência temporal ou cronológica"},
    3: {"name": "Setting Conflict", "desc": "Contradição com regras do mundo estabelecidas"},
    4: {"name": "Power Scaling", "desc": "Inconsistência de poder/habilidade dos personagens"},
    5: {"name": "Continuity", "desc": "Fatos estabelecidos contraditos"},
    6: {"name": "Foreshadowing", "desc": "Pistas plantadas sem resolução ou resolução sem setup"},
    7: {"name": "Pacing", "desc": "Ritmo arrasta ou acelera demais"},
    8: {"name": "Voice Consistency", "desc": "Voz narrativa inconsistente com perfil"},
    9: {"name": "Info Breach", "desc": "Personagem age com informação que não deveria ter"},
    10: {"name": "Word Fatigue", "desc": "Repetição excessiva de palavras ou construções"},
    11: {"name": "Motivation Chain", "desc": "Ações sem motivação clara ou lógica"},
    12: {"name": "Anachronism", "desc": "Elemento fora de época ou contexto temporal"},
    13: {"name": "Supporting Cast IQ", "desc": "Personagens secundários agem de forma irracional"},
    14: {"name": "Supporting Cast Agency", "desc": "Personagens secundários existem apenas como ferramentas"},
    15: {"name": "Tension Dilution", "desc": "Momentos de tensão resolvidos sem impacto"},
    16: {"name": "Dialogue Authenticity", "desc": "Diálogo soa artificial ou exposicional"},
    17: {"name": "Pacing Monotony", "desc": "Fluxo narrativo sem variação de ritmo"},
    18: {"name": "Show Don't Tell", "desc": "Excesso de narração explícita vs demonstração"},
    19: {"name": "POV Consistency", "desc": "Mudança de ponto de vista sem sinalização"},
    20: {"name": "Paragraph Uniformity", "desc": "Parágrafos com comprimento muito uniforme (AI pattern)"},
    21: {"name": "Hedge Density", "desc": "Excesso de palavras de preenchimento/hesitação"},
    22: {"name": "Formulaic Transitions", "desc": "Transições repetitivas e mecânicas"},
    23: {"name": "List Structure", "desc": "Estrutura de lista com frases de mesmo prefixo"},
    24: {"name": "Subplot Stagnation", "desc": "Subtramas sem progresso"},
    25: {"name": "Arc Flatness", "desc": "Arco de personagem sem desenvolvimento"},
    26: {"name": "Emotional Arc", "desc": "Temperatura emocional sem variação"},
    27: {"name": "Scene Purpose", "desc": "Cena que não serve pelo menos 2 propósitos"},
    28: {"name": "Opening Strength", "desc": "Abertura fraca que não prende o leitor"},
    29: {"name": "Closing Hook", "desc": "Final de capítulo sem gancho para o próximo"},
    30: {"name": "Interiority Depth", "desc": "Falta de profundidade no monólogo interno"},
    31: {"name": "Description Through Character", "desc": "Descrição não filtrada pela consciência do personagem"},
    32: {"name": "Adverb Overuse", "desc": "Excesso de advérbios"},
    33: {"name": "Said Bookisms", "desc": "Uso excessivo de verbos de fala elaborados"},
}


class MultiDimensionAuditor:
    """
    Multi-dimension quality audit combining:
    - AI-tell detection (rule-based, from Inkos)
    - Craft standards verification (from Novel Process)
    - Continuity checks (from Novel Process)
    - Voice compliance (from Novel Process)

    Uses both rule-based checks and LLM-powered analysis.
    """

    def __init__(self, provider: str = None):
        self.provider = provider or get_available_provider()
        self.ai_detector = AITellDetector()
        self.voice_auditor = VoiceComplianceAuditor(provider=self.provider)

    def full_audit(self, content: str, voice_profile: VoiceProfile = None,
                   craft_standards: CraftStandards = None,
                   story_bible: LivingStoryBible = None,
                   language: str = "pt-br",
                   dimensions: List[int] = None) -> Dict:
        """
        Run a full multi-dimension audit on a chapter.
        Returns per-dimension results with overall score.
        """
        results = {
            "dimensions_checked": [],
            "issues": [],
            "passed_dimensions": 0,
            "failed_dimensions": 0,
            "warnings": 0,
            "overall_score": 0,
        }

        active_dims = dimensions or list(AUDIT_DIMENSIONS.keys())

        # Phase 1: Rule-based AI-tell detection (dims 20-23, 32-33)
        ai_result = self.ai_detector.analyze(content, language)
        for issue in ai_result.get("issues", []):
            cat = issue.get("category", "")
            dim_map = {
                "paragraph_uniformity": 20, "hedge_density": 21,
                "formulaic_transitions": 22, "list_structure": 23,
                "adverb_stacking": 32, "said_bookisms": 33,
            }
            dim_id = dim_map.get(cat, 0)
            if dim_id in active_dims:
                results["issues"].append({
                    "dimension": dim_id,
                    "dimension_name": AUDIT_DIMENSIONS.get(dim_id, {}).get("name", cat),
                    **issue,
                })

        # Phase 2: Voice compliance audit (dim 8)
        if voice_profile and 8 in active_dims:
            voice_result = self.voice_auditor.audit(content, voice_profile, craft_standards)
            score = voice_result.get("compliance_score", 100)
            if score < 70:
                results["issues"].append({
                    "dimension": 8,
                    "dimension_name": "Voice Consistency",
                    "severity": "warning",
                    "description": f"Voice compliance score: {score}/100",
                    "suggestion": "Review off-voice passages and adjust to match profile.",
                    "details": voice_result,
                })

        # Phase 3: LLM-powered deep audit for remaining dimensions
        if HAS_LLM and self.provider != "template":
            llm_dims = [d for d in active_dims if d not in [20, 21, 22, 23, 32, 33, 8]]
            if llm_dims and content:
                llm_issues = self._llm_audit(content, llm_dims, story_bible, language)
                results["issues"].extend(llm_issues)

        # Calculate scores
        warning_dims = set(i.get("dimension") for i in results["issues"] if i.get("severity") == "warning")
        info_dims = set(i.get("dimension") for i in results["issues"] if i.get("severity") == "info")
        results["failed_dimensions"] = len(warning_dims)
        results["warnings"] = len(info_dims)
        results["passed_dimensions"] = len(active_dims) - len(warning_dims)
        results["overall_score"] = max(0, 100 - len(warning_dims) * 5 - len(info_dims) * 2)
        results["dimensions_checked"] = active_dims
        results["ai_tell_score"] = ai_result.get("ai_score", 0)

        return results

    def _llm_audit(self, content: str, dimensions: List[int],
                   story_bible: LivingStoryBible = None, language: str = "pt-br") -> List[Dict]:
        """Use LLM for deep quality checks on specific dimensions."""
        dim_descriptions = "\n".join(
            f"  {d}. {AUDIT_DIMENSIONS[d]['name']}: {AUDIT_DIMENSIONS[d]['desc']}"
            for d in dimensions if d in AUDIT_DIMENSIONS
        )

        bible_context = story_bible.to_context_block() if story_bible else ""

        system = "Você é um auditor literário multi-dimensional. Analise o texto e identifique problemas específicos."

        prompt = f"""Audite este texto nas seguintes dimensões:

{dim_descriptions}

{bible_context}

TEXTO:
{content[:4000]}

Para cada problema encontrado, retorne JSON array:
[
  {{"dimension": N, "severity": "warning|info", "description": "...", "suggestion": "..."}}
]

Se nenhum problema, retorne: []
Seja cirúrgico — aponte apenas problemas reais, não genéricos."""

        result = call_llm(prompt, system, max_tokens=1500, provider=self.provider)
        if not result:
            return []

        try:
            json_match = re.search(r'\[[\s\S]*\]', result)
            if json_match:
                issues = json.loads(json_match.group())
                for issue in issues:
                    dim_id = issue.get("dimension", 0)
                    issue["dimension_name"] = AUDIT_DIMENSIONS.get(dim_id, {}).get("name", f"dim_{dim_id}")
                return issues
        except (json.JSONDecodeError, KeyError):
            pass
        return []


# =============================================================================
# 12. GENRE PROFILER (inspired by Inkos genre-profiler — rule-based + LLM)
# =============================================================================

# Genre markers: keywords, patterns, and structural indicators
GENRE_MARKERS = {
    "literary_fiction": {
        "keywords_pt": ["consciência", "memória", "silêncio", "solidão", "existência", "vazio", "alma", "destino", "melancolia"],
        "keywords_en": ["consciousness", "memory", "silence", "solitude", "existence", "void", "soul", "fate", "melancholy"],
        "structural": {"avg_sentence_length_min": 15, "interiority_ratio_min": 0.3, "dialogue_ratio_max": 0.3},
        "recommendations": [
            "Priorize profundidade de interioridade sobre ação externa.",
            "Use imagens sensoriais específicas ao invés de abstrações.",
            "Cada cena deve revelar algo sobre a condição humana.",
            "Subverta expectativas narrativas — nem tudo precisa resolver.",
        ],
    },
    "thriller": {
        "keywords_pt": ["perigo", "fuga", "perseguição", "arma", "ameaça", "refém", "bomba", "tempo", "urgência", "sobreviver"],
        "keywords_en": ["danger", "escape", "chase", "weapon", "threat", "hostage", "bomb", "clock", "urgent", "survive"],
        "structural": {"avg_sentence_length_max": 12, "short_sentence_ratio_min": 0.3, "pacing": "fast"},
        "recommendations": [
            "Frases curtas para cenas de ação. Ritmo acelerado.",
            "Cada capítulo deve terminar com um cliffhanger ou revelação.",
            "Mantenha o leitor em tensão constante — informação dosada.",
            "Countdown/timer elements aumentam urgência.",
            "Múltiplos POVs podem criar tensão por informação assimétrica.",
        ],
    },
    "romance": {
        "keywords_pt": ["coração", "beijo", "amor", "paixão", "desejo", "olhar", "toque", "sentimento", "abraço", "saudade"],
        "keywords_en": ["heart", "kiss", "love", "passion", "desire", "gaze", "touch", "feeling", "embrace", "longing"],
        "structural": {"dialogue_ratio_min": 0.2, "emotional_density": "high"},
        "recommendations": [
            "Tensão romântica vem de obstáculos, não declarações.",
            "Diálogo com subtexto — o que NÃO é dito importa mais.",
            "Detalhes sensoriais do ponto de vista do personagem apaixonado.",
            "Ritmo: slow burn > rush. Adie a resolução romântica.",
            "Cada cena de interação deve evoluir a dinâmica do casal.",
        ],
    },
    "fantasy": {
        "keywords_pt": ["magia", "reino", "dragão", "feitiço", "profecia", "espada", "trono", "poder", "criatura", "mundo"],
        "keywords_en": ["magic", "kingdom", "dragon", "spell", "prophecy", "sword", "throne", "power", "creature", "realm"],
        "structural": {"worldbuilding_density": "high", "avg_paragraph_length_min": 80},
        "recommendations": [
            "Worldbuilding através da experiência dos personagens, não info dumps.",
            "Sistema de magia com regras claras e custos.",
            "Nomes e terminologia consistentes — mantenha um glossário.",
            "Cada cultura/raça deve ter lógica interna coerente.",
            "Mapeie poder dos personagens para evitar escalação descontrolada.",
        ],
    },
    "mystery": {
        "keywords_pt": ["pista", "suspeito", "crime", "investigação", "detetive", "vítima", "assassinato", "segredo", "testemunha"],
        "keywords_en": ["clue", "suspect", "crime", "investigation", "detective", "victim", "murder", "secret", "witness"],
        "structural": {"foreshadowing_density": "high"},
        "recommendations": [
            "Plante pistas justas — o leitor deve poder resolver antes da revelação.",
            "Red herrings devem ter explicação lógica quando revelados.",
            "Cada capítulo deve revelar algo E esconder algo.",
            "POV do investigador: mostre o processo de dedução.",
            "Cronologia precisa — mistérios dependem de timeline apertada.",
        ],
    },
    "scifi": {
        "keywords_pt": ["nave", "planeta", "inteligência artificial", "tecnologia", "futuro", "espaço", "colônia", "androide", "holograma"],
        "keywords_en": ["ship", "planet", "artificial intelligence", "technology", "future", "space", "colony", "android", "hologram"],
        "structural": {"technical_density": "medium"},
        "recommendations": [
            "Tecnologia serve a narrativa, não o contrário.",
            "Extrapole de ciência real quando possível — hard sci-fi ganha credibilidade.",
            "Consequências sociais da tecnologia são mais interessantes que specs.",
            "Worldbuilding: mostre como a tecnologia mudou o cotidiano.",
            "Evite technobabble sem propósito narrativo.",
        ],
    },
    "horror": {
        "keywords_pt": ["medo", "escuridão", "sombra", "morte", "sangue", "grito", "terror", "pesadelo", "criatura", "fantasma"],
        "keywords_en": ["fear", "darkness", "shadow", "death", "blood", "scream", "terror", "nightmare", "creature", "ghost"],
        "structural": {"pacing": "varied", "tension_build": "gradual"},
        "recommendations": [
            "Medo vem do desconhecido — revele o monstro lentamente.",
            "Use todos os sentidos, não apenas visual.",
            "Normalidade antes do horror amplifica o impacto.",
            "Protagonistas devem ter razão para não fugir.",
            "Ritmo: longos períodos de tensão crescente, picos curtos de horror.",
        ],
    },
    "nonfiction": {
        "keywords_pt": ["pesquisa", "estudo", "dados", "evidência", "análise", "conclusão", "metodologia", "resultado", "prática"],
        "keywords_en": ["research", "study", "data", "evidence", "analysis", "conclusion", "methodology", "result", "practice"],
        "structural": {"structure": "analytical", "avg_paragraph_length_min": 60},
        "recommendations": [
            "Toda afirmação precisa de evidência ou fonte.",
            "Use analogias para conceitos complexos.",
            "Abra cada capítulo com um gancho: história, dado surpreendente, ou pergunta.",
            "Alterne entre teoria e exemplo prático.",
            "Encerre com takeaways acionáveis.",
        ],
    },
}


class GenreProfiler:
    """
    Rule-based genre detection and recommendation engine.
    Analyzes text patterns, vocabulary, and structure to identify genre
    and provide genre-specific writing recommendations.
    Inspired by Inkos genre-profiler.
    """

    def analyze(self, content: str, language: str = "pt-br") -> Dict:
        """Analyze content and return genre profile with recommendations."""
        if not content:
            return {"error": "No content to analyze"}

        is_pt = language.startswith("pt")
        words = content.lower().split()
        total_words = len(words)

        if total_words < 50:
            return {"error": "Content too short for reliable genre detection (min 50 words)"}

        # Score each genre by keyword matches
        genre_scores = {}
        for genre, markers in GENRE_MARKERS.items():
            keyword_list = markers.get("keywords_pt" if is_pt else "keywords_en", [])
            score = 0
            matched_keywords = []
            for kw in keyword_list:
                count = content.lower().count(kw)
                if count > 0:
                    score += min(count, 5)  # Cap per-keyword contribution
                    matched_keywords.append(f"{kw} ({count}x)")
            genre_scores[genre] = {
                "score": score,
                "matched_keywords": matched_keywords,
            }

        # Structural analysis
        sentences = [s.strip() for s in re.split(r'[.!?]', content) if s.strip()]
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

        sent_lengths = [len(s.split()) for s in sentences]
        avg_sent = sum(sent_lengths) / len(sent_lengths) if sent_lengths else 0
        short_ratio = sum(1 for l in sent_lengths if l <= 8) / max(1, len(sent_lengths))

        para_lengths = [len(p.split()) for p in paragraphs]
        avg_para = sum(para_lengths) / len(para_lengths) if para_lengths else 0

        # Dialogue ratio
        dialogue_lines = len(re.findall(r'["""\'].*?["""\']', content))
        dialogue_ratio = dialogue_lines / max(1, len(sentences))

        # Structural scoring bonuses
        for genre, markers in GENRE_MARKERS.items():
            structural = markers.get("structural", {})
            bonus = 0
            if "avg_sentence_length_max" in structural and avg_sent <= structural["avg_sentence_length_max"]:
                bonus += 3
            if "avg_sentence_length_min" in structural and avg_sent >= structural["avg_sentence_length_min"]:
                bonus += 3
            if "short_sentence_ratio_min" in structural and short_ratio >= structural["short_sentence_ratio_min"]:
                bonus += 3
            if "dialogue_ratio_min" in structural and dialogue_ratio >= structural["dialogue_ratio_min"]:
                bonus += 2
            if "dialogue_ratio_max" in structural and dialogue_ratio <= structural["dialogue_ratio_max"]:
                bonus += 2
            if "avg_paragraph_length_min" in structural and avg_para >= structural["avg_paragraph_length_min"]:
                bonus += 2
            genre_scores[genre]["score"] += bonus
            genre_scores[genre]["structural_bonus"] = bonus

        # Sort by score
        ranked = sorted(genre_scores.items(), key=lambda x: x[1]["score"], reverse=True)

        primary_genre = ranked[0][0] if ranked[0][1]["score"] > 0 else "general"
        secondary_genres = [
            {"genre": g, "score": s["score"], "keywords": s["matched_keywords"][:3]}
            for g, s in ranked[1:4] if s["score"] > 0
        ]

        # Get recommendations for primary genre
        primary_markers = GENRE_MARKERS.get(primary_genre, {})
        recommendations = primary_markers.get("recommendations", [])

        # Add cross-genre recommendations if secondary genres are strong
        cross_recs = []
        if secondary_genres and secondary_genres[0]["score"] > ranked[0][1]["score"] * 0.5:
            sg = secondary_genres[0]["genre"]
            sg_recs = GENRE_MARKERS.get(sg, {}).get("recommendations", [])
            if sg_recs:
                cross_recs.append(f"Elementos de {sg} detectados: {sg_recs[0]}")

        return {
            "primary_genre": primary_genre,
            "confidence": min(100, ranked[0][1]["score"] * 5) if ranked[0][1]["score"] > 0 else 0,
            "secondary_genres": secondary_genres,
            "genre_scores": {g: s["score"] for g, s in ranked if s["score"] > 0},
            "recommendations": recommendations,
            "cross_genre_recommendations": cross_recs,
            "structural_analysis": {
                "avg_sentence_length": round(avg_sent, 1),
                "short_sentence_ratio": round(short_ratio, 2),
                "avg_paragraph_length": round(avg_para),
                "dialogue_ratio": round(dialogue_ratio, 2),
                "total_words": total_words,
            },
        }
