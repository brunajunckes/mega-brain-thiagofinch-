"""
God Mode v2 - Core AI Book Generation Engine
Multi-agent pipeline with Materials Integration, Language Support, RAG, and anti-repetition.
"""

import os
import re
import random
import hashlib
import json
import textwrap
from typing import Optional, List, Dict, Any, Tuple

# Long-form content (3000-4000 words/chapter)
try:
    from long_content import gen_long_from_materials, gen_long_nonfiction_from_materials, expand_paragraph
    HAS_LONG_CONTENT = True
except ImportError:
    HAS_LONG_CONTENT = False

# Novel Process — Advanced Writing Craft System
try:
    from novel_process import (
        NovelProcessPipeline, VoiceProfileBuilder, VoiceProfile,
        LivingStoryBible, CraftStandards, ChapterNotesGenerator,
        VoiceComplianceAuditor, SceneOutlineEngine,
        VOICE_INTERVIEW_QUESTIONS, VOICE_DEFAULTS,
    )
    HAS_NOVEL_PROCESS = True
except ImportError:
    HAS_NOVEL_PROCESS = False


# ===== LLM PROVIDER DETECTION =====

def get_available_provider() -> str:
    if os.getenv("DEEPSEEK_API_KEY"):
        return "deepseek"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.getenv("OPENROUTER_API_KEY"):
        return "openrouter"
    if os.getenv("OLLAMA_URL") or _check_ollama():
        return "ollama"
    return "template"


def _check_ollama() -> bool:
    try:
        import urllib.request
        url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        req = urllib.request.urlopen(f"{url}/api/tags", timeout=2)
        return req.status == 200
    except Exception:
        return False


# ===== LLM CALL =====

def call_llm(prompt: str, system: str = "", max_tokens: int = 2000, provider: str = None) -> str:
    if provider is None:
        provider = get_available_provider()
    if provider == "deepseek":
        return _call_deepseek(prompt, system, max_tokens)
    elif provider == "openai":
        return _call_openai(prompt, system, max_tokens)
    elif provider == "anthropic":
        return _call_anthropic(prompt, system, max_tokens)
    elif provider == "openrouter":
        return _call_openrouter(prompt, system, max_tokens)
    elif provider == "ollama":
        return _call_ollama(prompt, system, max_tokens)
    return None


def _call_openai(prompt: str, system: str, max_tokens: int) -> str:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=messages, max_tokens=max_tokens, temperature=0.8
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[GodMode] OpenAI error: {e}")
        return None


def _call_anthropic(prompt: str, system: str, max_tokens: int) -> str:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        kwargs = {"model": model, "max_tokens": max_tokens,
                  "messages": [{"role": "user", "content": prompt}]}
        if system:
            kwargs["system"] = system
        response = client.messages.create(**kwargs)
        return response.content[0].text
    except Exception as e:
        print(f"[GodMode] Anthropic error: {e}")
        return None


def _call_deepseek(prompt: str, system: str, max_tokens: int) -> str:
    """DeepSeek API — OpenAI-compatible endpoint, excellent for long-form writing."""
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com"
        )
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        response = client.chat.completions.create(
            model=model, messages=messages,
            max_tokens=max_tokens, temperature=0.8
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[GodMode] DeepSeek error: {e}")
        return None


def _call_openrouter(prompt: str, system: str, max_tokens: int) -> str:
    """OpenRouter API — access to multiple models via single key."""
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        )
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        model = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
        response = client.chat.completions.create(
            model=model, messages=messages,
            max_tokens=max_tokens, temperature=0.8
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[GodMode] OpenRouter error: {e}")
        return None


def _call_ollama(prompt: str, system: str, max_tokens: int) -> str:
    try:
        import urllib.request
        base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3.2")
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        payload = json.dumps({"model": model, "prompt": full_prompt,
                               "stream": False, "options": {"num_predict": max_tokens}}).encode()
        req = urllib.request.Request(f"{base_url}/api/generate", data=payload,
                                      headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=60)
        data = json.loads(resp.read())
        return data.get("response", "")
    except Exception as e:
        print(f"[GodMode] Ollama error: {e}")
        return None


# ===== VOICE BIBLE =====

class VoiceBible:
    DEFAULT_FICTION = {
        "pov": "terceira pessoa limitada",
        "tense": "passado",
        "tone": "imersivo e focado nos personagens",
        "sentence_variety": "mistura de frases curtas e impactantes com frases mais longas e fluidas",
        "dialogue_style": "realista, cada personagem tem voz distinta",
        "description": "detalhes sensoriais, mostrar ao invés de contar",
        "avoid": ["uso excessivo de advérbios", "voz passiva em excesso", "contar ao invés de mostrar"],
    }

    DEFAULT_NONFICTION = {
        "pov": "segunda pessoa ('você') ou primeira pessoa plural ('nós')",
        "tense": "presente",
        "tone": "autoritativo mas acessível",
        "sentence_variety": "frases-tópico claras, evidências de apoio, exemplos concretos",
        "structure": "problema-solução ou conceito-aplicação",
        "avoid": ["jargão sem explicação", "afirmações sem fundamentação", "generalidades vagas"],
    }

    DEFAULT_TECHNICAL = {
        "pov": "segunda pessoa instrucional",
        "tense": "presente",
        "tone": "preciso, passo a passo",
        "sentence_variety": "frases declarativas curtas preferidas",
        "structure": "passos numerados, exemplos de código, resultados esperados",
        "avoid": ["ambiguidade", "pular pré-requisitos", "siglas sem explicação"],
    }

    def __init__(self, genre: str, topic: str, custom_rules: Dict = None):
        genre_lower = genre.lower() if genre else ""
        if ("non-fiction" not in genre_lower and "não-ficção" not in genre_lower) and \
           any(g in genre_lower for g in ["fiction", "ficção", "fantasy", "fantasia", "romance",
                                           "thriller", "mystery", "mistério", "sci", "horror", "novel"]):
            self.rules = dict(self.DEFAULT_FICTION)
        elif any(g in genre_lower for g in ["technical", "técnico", "programming", "programação",
                                             "code", "código", "software"]):
            self.rules = dict(self.DEFAULT_TECHNICAL)
        else:
            self.rules = dict(self.DEFAULT_NONFICTION)
        self.rules["topic"] = topic
        self.rules["genre"] = genre
        if custom_rules:
            self.rules.update(custom_rules)

    def to_prompt_block(self) -> str:
        lines = ["STYLE BIBLE (siga exatamente):"]
        for k, v in self.rules.items():
            if isinstance(v, list):
                lines.append(f"  {k}: {', '.join(v)}")
            else:
                lines.append(f"  {k}: {v}")
        return "\n".join(lines)


# ===== MEMORY/RAG CONTEXT =====

class ChapterMemory:
    def __init__(self):
        self.summaries: List[Dict] = []
        self.characters: Dict[str, str] = {}
        self.locations: List[str] = []
        self.key_facts: List[str] = []
        self.banned_phrases: List[str] = []
        self.materials_context: str = ""

    def set_materials(self, materials_text: str):
        """Inject source materials for deep research context."""
        self.materials_context = materials_text
        # Extract key facts from materials
        if materials_text:
            sentences = re.split(r'[.!?\n]', materials_text)
            # Get substantive sentences as key facts
            for s in sentences[:50]:
                s = s.strip()
                if len(s) > 30 and len(s) < 300:
                    self.key_facts.append(s)

    def add_chapter(self, number: int, title: str, content: str):
        if not content:
            return
        summary = content[:500].replace("\n", " ").strip()
        self.summaries.append({"chapter": number, "title": title, "summary": summary})
        self._extract_entities(content)
        self._update_banned(content)

    def _extract_entities(self, text: str):
        # Extract capitalized proper nouns (works for PT and EN)
        words = re.findall(r'\b[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*\b', text)
        from collections import Counter
        counts = Counter(words)
        skip = {"The", "This", "That", "There", "They", "Chapter", "Capítulo",
                "Para", "Como", "Quando", "Onde", "Porque", "Então", "Depois",
                "Antes", "Ainda", "Também", "Muito", "Cada", "Todo", "Toda"}
        for word, count in counts.items():
            if count >= 2 and len(word) > 3 and word not in skip:
                if word not in self.characters:
                    self.characters[word] = f"mencionado no cap.{len(self.summaries)}"

    def _update_banned(self, text: str):
        phrases = re.findall(r'\b\w+\s+\w+\s+\w+\b', text.lower())
        from collections import Counter
        counts = Counter(phrases)
        for phrase, count in counts.items():
            if count >= 3 and phrase not in self.banned_phrases:
                self.banned_phrases.append(phrase)

    def to_context_block(self) -> str:
        lines = []
        if self.summaries:
            lines.append("CONTEXTO DOS CAPÍTULOS ANTERIORES (manter consistência):")
            for s in self.summaries[-5:]:
                lines.append(f"  Capítulo {s['chapter']} '{s['title']}': {s['summary'][:300]}")
        if self.characters:
            chars = list(self.characters.keys())[:10]
            lines.append("  Personagens/entidades estabelecidos: " + ", ".join(chars))
        if self.key_facts:
            lines.append("  Fatos-chave dos materiais de referência:")
            for fact in self.key_facts[:10]:
                lines.append(f"    - {fact}")
        return "\n".join(lines)

    def to_materials_block(self) -> str:
        """Return materials context for injection into prompts."""
        if not self.materials_context:
            return ""
        return f"""
MATERIAIS DE REFERÊNCIA DO AUTOR (use como base para o conteúdo):
=====================================================================
{self.materials_context[:8000]}
=====================================================================
IMPORTANTE: O conteúdo acima são os materiais fornecidos pelo autor. 
Use-os como fonte primária. Analise a cronologia, personagens, temas,
argumentos e dados contidos nos materiais. O livro deve ser baseado
NESTE conteúdo, não em conteúdo genérico inventado.
"""

    def to_ban_block(self) -> str:
        if not self.banned_phrases:
            return ""
        sample = self.banned_phrases[:15]
        return "EVITE estas frases já usadas em excesso (anti-repetição): " + \
               ", ".join(f'"{p}"' for p in sample)


# ===== LANGUAGE SUPPORT =====

def get_lang_instruction(language: str) -> str:
    """Return language instruction for prompts."""
    lang_map = {
        "pt-br": "IMPORTANTE: Escreva TUDO em português brasileiro. Todo o conteúdo do livro deve ser em PT-BR.",
        "pt": "IMPORTANTE: Escreva TUDO em português. Todo o conteúdo do livro deve ser em português.",
        "es": "IMPORTANTE: Escribe TODO en español. Todo el contenido del libro debe ser en español.",
        "en": "Write everything in English.",
        "fr": "IMPORTANT: Écrivez TOUT en français.",
    }
    return lang_map.get(language, lang_map.get("pt-br"))


# ===== MULTI-AGENT PIPELINE =====

class PlannerAgent:
    def run(self, chapter_title, chapter_number, project_title, genre, topic,
            target_audience, chapter_outline, memory, voice_bible, provider, language="pt-br"):
        lang_inst = get_lang_instruction(language)
        system = f"Você é um planejador de livros experiente. Cria roteiros detalhados para capítulos.\n{voice_bible.to_prompt_block()}\n{lang_inst}"
        context = memory.to_context_block()
        materials = memory.to_materials_block()
        prompt = f"""Livro: "{project_title}"
Gênero: {genre} | Tema: {topic} | Público: {target_audience}
Capítulo {chapter_number}: "{chapter_title}"
{f'Esboço do capítulo: {chapter_outline}' if chapter_outline else ''}

{context}
{materials}

Crie um roteiro MUITO detalhado (8-12 pontos) para este capítulo de 3000-4000 palavras.
BASEIE-SE NOS MATERIAIS DE REFERÊNCIA se disponíveis - extraia eventos, citações, dados reais.
Cada ponto = uma seção específica com 200-400 palavras, incluindo detalhes concretos.
O capítulo final deve ter 3000-4000 palavras para um livro total de 30-40 mil palavras.
{lang_inst}
Retorne APENAS os pontos do roteiro."""
        result = call_llm(prompt, system, max_tokens=1200, provider=provider)
        if result:
            return result
        return _template_outline_pt(chapter_title, chapter_number, genre, topic, memory)


class WriterAgent:
    def run(self, chapter_title, chapter_number, project_title, genre, topic,
            target_audience, chapter_outline, planner_outline, memory, voice_bible,
            provider, language="pt-br"):
        lang_inst = get_lang_instruction(language)
        system = f"Você é um autor best-seller. Escreve prosa vívida, envolvente e bem estruturada.\n{voice_bible.to_prompt_block()}\n{lang_inst}"
        context = memory.to_context_block()
        materials = memory.to_materials_block()
        ban_block = memory.to_ban_block()
        prompt = f"""Livro: "{project_title}"
Gênero: {genre} | Tema: {topic} | Público: {target_audience}
Capítulo {chapter_number}: "{chapter_title}"

ROTEIRO A SEGUIR:
{planner_outline}

{context}
{materials}
{ban_block}

Escreva o CAPÍTULO COMPLETO seguindo o roteiro acima.
REGRAS OBRIGATÓRIAS:
- Mínimo 3000 palavras, ideal 3000-4000 palavras (livro de 30-40 mil palavras total)
- {lang_inst}
- Se houver materiais de referência, USE-OS como fonte primária
- Analise cronologia, histórias, dados e argumentos dos materiais
- Siga a voice bible exatamente
- Detalhes ricos e específicos, exemplos concretos
- Abertura forte, fechamento satisfatório
- NÃO use frases genéricas de preenchimento
- Retorne APENAS o texto do capítulo"""
        result = call_llm(prompt, system, max_tokens=6000, provider=provider)
        if result:
            return result
        return None


class CriticAgent:
    def run(self, draft, chapter_title, genre, memory, provider, language="pt-br"):
        system = "Você é um crítico literário afiado. Identifica fraquezas específicas na prosa."
        prompt = f"""Capítulo: "{chapter_title}" | Gênero: {genre}

RASCUNHO:
{draft[:2000]}...

Revise este rascunho. Liste APENAS os 3 principais problemas (se houver).
Formato: uma linha por problema começando com "PROBLEMA: "
Se a qualidade for aceitável, escreva: "APROVADO"
Responda em menos de 200 palavras."""
        result = call_llm(prompt, system, max_tokens=300, provider=provider)
        if not result:
            return "APROVADO", []
        issues = [line.replace("PROBLEMA:", "").replace("ISSUE:", "").strip()
                  for line in result.split("\n") if line.startswith("PROBLEMA:") or line.startswith("ISSUE:")]
        verdict = "APROVADO" if ("APROVADO" in result or "PASS" in result) and not issues else "REVISÃO"
        return verdict, issues


class EditorAgent:
    def run(self, draft, issues, chapter_title, voice_bible, provider, language="pt-br"):
        if not issues:
            return draft
        lang_inst = get_lang_instruction(language)
        system = f"Você é um editor meticuloso. Corrige problemas específicos sem mudar a história.\n{voice_bible.to_prompt_block()}\n{lang_inst}"
        issues_text = "\n".join(f"- {issue}" for issue in issues)
        prompt = f"""Capítulo: "{chapter_title}"

PROBLEMAS A CORRIGIR:
{issues_text}

RASCUNHO:
{draft}

Corrija os problemas listados. Melhore fluidez e qualidade da prosa.
{lang_inst}
Retorne APENAS o texto revisado, mantenha o mesmo tamanho aproximado."""
        result = call_llm(prompt, system, max_tokens=3000, provider=provider)
        if result and len(result) > len(draft) * 0.5:
            return result
        return draft


# ===== TEMPLATE FALLBACK (PORTUGUESE) =====

def _template_outline_pt(title, num, genre, topic, memory=None):
    """Template outline in Portuguese."""
    has_materials = memory and memory.materials_context
    if has_materials:
        # Extract key themes from materials
        facts = memory.key_facts[:5]
        points = []
        for i, fact in enumerate(facts):
            points.append(f"• Explorar o tema: {fact[:80]}...")
        while len(points) < 6:
            points.append(f"• Desenvolver aspecto {len(points)+1} do tema '{title}' com base nos materiais")
        return "\n".join(points)
    
    genre_lower = genre.lower() if genre else ""
    is_fiction = ('non-fiction' not in genre_lower and 'não-ficção' not in genre_lower) and \
                 any(g in genre_lower for g in ["fiction", "ficção", "fantasy", "fantasia", "romance",
                                                  "thriller", "mystery", "mistério", "sci", "horror"])
    if is_fiction:
        return f"""• Cena de abertura: estabelecer o clima e as apostas para "{title}"
• Tensão dos personagens ou conflito interno emerge
• Momento incitante que impulsiona o capítulo
• Ação ascendente: complicações se aprofundam, novas informações reveladas
• Cena climática: pico de tensão ou revelação do capítulo
• Ação descendente: consequências imediatas, personagens processam eventos
• Gancho do capítulo: terminar com algo que exija ler o próximo"""
    else:
        return f"""• Abertura envolvente: por que esta parte de {topic} importa para o leitor
• Introdução do conceito central: definir a ideia-chave com clareza
• Evidências e dados: 2-3 pontos concretos de apoio ou exemplos
• Equívocos comuns abordados
• Aplicação prática: como o leitor pode usar este conhecimento
• Estudo de caso ou ilustração do mundo real
• Resumo do capítulo e ponte para o próximo conceito"""


def generate_template_content_pt(
    chapter_title: str, chapter_number: int, genre: str, topic: str,
    project_title: str, target_audience: str, chapter_outline: Optional[str],
    memory: ChapterMemory, language: str = "pt-br"
) -> str:
    """
    High-quality template content generation in Portuguese.
    When materials are available, synthesizes from them.
    """
    seed = hashlib.md5(
        f"{project_title}{chapter_title}{chapter_number}{genre}{topic}".encode()
    ).hexdigest()
    rng = random.Random(seed)
    
    genre_lower = genre.lower() if genre else "general"
    is_fiction = ('non-fiction' not in genre_lower and 'não-ficção' not in genre_lower) and \
                 any(g in genre_lower for g in ["fiction", "ficção", "fantasy", "fantasia", "romance",
                                                  "thriller", "mystery", "mistério", "sci", "horror", "novel"])
    is_technical = any(g in genre_lower for g in ["technical", "técnico", "programming", "programação",
                                                    "code", "código", "software"])
    
    has_materials = memory and memory.materials_context and len(memory.materials_context) > 100
    
    if has_materials and HAS_LONG_CONTENT:
        # Long-form generator: 3000-4000 words per chapter
        return gen_long_from_materials(
            rng, chapter_title, chapter_number, genre, topic,
            project_title,
            materials_text=memory.materials_context,
            key_facts=memory.key_facts if memory.key_facts else [],
            is_fiction=is_fiction,
            target_words=3500
        )
    elif has_materials:
        return _gen_from_materials(rng, chapter_title, chapter_number, genre, topic,
                                    project_title, memory, is_fiction, is_technical)
    elif is_fiction:
        return "\n\n".join(_gen_fiction_pt(rng, chapter_title, chapter_number, genre, topic,
                                            project_title, memory))
    elif is_technical:
        return "\n\n".join(_gen_technical_pt(rng, chapter_title, chapter_number, topic, project_title))
    else:
        return "\n\n".join(_gen_nonfiction_pt(rng, chapter_title, chapter_number, genre, topic,
                                               project_title, target_audience))


def _gen_from_materials(rng, title, num, genre, topic, project_title, memory, is_fiction, is_technical):
    """Generate chapter content BASED ON source materials."""
    materials = memory.materials_context
    facts = memory.key_facts
    
    # Split materials into chunks relevant to this chapter
    # Use chapter number to select different portions
    chunk_size = len(materials) // max(1, 10)  # Assume ~10 chapters
    start = min((num - 1) * chunk_size, len(materials) - chunk_size)
    relevant_chunk = materials[start:start + chunk_size * 2] if chunk_size > 0 else materials[:2000]
    
    # Extract sentences from relevant chunk
    sentences = [s.strip() for s in re.split(r'[.!?\n]+', relevant_chunk) if len(s.strip()) > 20]
    rng.shuffle(sentences)
    
    parts = []
    
    # Chapter header
    parts.append(f"## {title}")
    
    if is_fiction:
        # For fiction: weave materials into narrative
        parts.append(
            f"O que segue é construído sobre os eventos e relatos documentados nos materiais "
            f"de referência, reorganizados em uma narrativa coerente que respeita a cronologia "
            f"e os fatos originais."
        )
        
        # Use material sentences as narrative seeds
        for i, sent in enumerate(sentences[:8]):
            if i == 0:
                parts.append(f"Tudo começou quando {sent.lower() if not sent[0].isdigit() else sent}")
            elif i % 3 == 0:
                parts.append(f"O que poucos sabiam era que {sent.lower() if not sent[0].isdigit() else sent}")
            elif i % 3 == 1:
                parts.append(
                    f"Os eventos que se seguiram revelaram algo importante. {sent} "
                    f"Essa revelação mudou completamente o curso dos acontecimentos."
                )
            else:
                parts.append(sent)
        
        if facts:
            parts.append(
                f"Olhando para trás, os fatos eram claros: {facts[min(num, len(facts)-1)] if num < len(facts) else facts[-1]}. "
                f"Mas na época, ninguém poderia ter previsto as consequências."
            )
    else:
        # For non-fiction: synthesize and analyze materials
        parts.append(
            f"Este capítulo analisa em profundidade os temas centrais encontrados nos materiais "
            f"de referência, organizando as informações de forma estruturada e acessível."
        )
        
        # Opening with context from materials
        if sentences:
            parts.append(
                f"Para compreender {title.lower()}, é fundamental considerar o seguinte: "
                f"{sentences[0]}. Este ponto estabelece a base para toda a discussão que segue."
            )
        
        # Analysis sections based on material content
        section_count = min(6, len(sentences))
        for i in range(section_count):
            if i < len(sentences):
                sent = sentences[i]
                analysis_frames = [
                    f"### Ponto {i+1}: Análise\n\n{sent}\n\nEste aspecto merece atenção especial porque revela padrões fundamentais sobre {topic}. Quando analisamos os dados e relatos disponíveis, fica evidente que há uma conexão direta entre este ponto e os resultados observados na prática.",
                    
                    f"### Perspectiva {i+1}\n\nOs materiais de referência indicam que: {sent}\n\nEssa observação é particularmente relevante no contexto de {topic} porque desafia algumas suposições comuns. A evidência sugere que a realidade é mais nuançada do que a maioria das pessoas assume.",
                    
                    f"### Evidência {i+1}\n\nDe acordo com os materiais analisados: {sent}\n\nIsso tem implicações práticas significativas. Para quem trabalha com {topic}, esta informação oferece uma base sólida para tomada de decisões mais informadas.",
                ]
                parts.append(rng.choice(analysis_frames))
        
        # Key facts section
        if facts and len(facts) > 2:
            parts.append("### Fatos-Chave Identificados\n")
            for j, fact in enumerate(facts[:(num * 2) % len(facts) + 3]):
                parts.append(f"**{j+1}.** {fact}")
        
        # Practical implications
        parts.append(
            f"### Implicações Práticas\n\n"
            f"A análise apresentada neste capítulo tem consequências diretas para quem busca "
            f"compreender {topic} em profundidade. Os materiais de referência deixam claro que "
            f"o sucesso nesta área depende de uma compreensão integrada dos diversos fatores "
            f"apresentados, não de uma abordagem fragmentada."
        )
        
        # Bridge to next chapter
        parts.append(
            f"No próximo capítulo, aprofundaremos ainda mais esses conceitos, explorando "
            f"aspectos complementares que emergiram da análise dos materiais de referência."
        )
    
    return "\n\n".join(parts)


# ===== FICTION TEMPLATE (PT-BR) =====

_FICTION_OPENINGS_PT = [
    "O silêncio que recebeu {name} era do tipo mais pesado — o tipo que carrega peso, que pressiona o peito e transforma a respiração em um ato consciente.",
    "Há momentos na vida que dividem o tempo em antes e depois. {name} estava vivendo um desses momentos agora.",
    "A manhã chegou relutante, como se o próprio sol estivesse incerto sobre o que o dia traria.",
    "A mensagem chegou no pior momento possível, como mensagens importantes sempre chegam.",
    "Algo havia mudado durante a noite — imperceptivelmente a princípio, depois com a clareza súbita de um véu sendo removido.",
    "Cada escolha tem um custo. {name} sempre soube disso, mas entender intelectualmente era diferente de sentir o peso agora.",
    "Começou, como tantas coisas começam, com uma pergunta que parecia inocente o suficiente.",
]

_FICTION_SCENES_PT = [
    "O ar entre eles crepitava com palavras não ditas. {name} foi até a janela, ganhando alguns segundos de distância, alguns segundos para compor pensamentos que se recusavam a permanecer compostos. Lá fora, o mundo continuava seus assuntos indiferentes — carros passando, uma criança rindo em algum lugar da rua, a vida comum prosseguindo como se nada extraordinário estivesse acontecendo ali.",

    "A memória tem uma forma de emergir sem ser convidada. Um detalhe captura a luz de certo modo, ou um som carrega um eco de algo meio esquecido, e de repente o passado é presente novamente, vívido e imediato. {name} sentia isso agora — o passado colidindo com o presente, duas realidades ocupando o mesmo momento.",

    "O plano havia parecido sólido no abstrato. Planos sempre parecem. É apenas na execução que as lacunas se revelam — as suposições feitas, as contingências ignoradas, a simples imprevisibilidade humana que nenhuma quantidade de planejamento consegue explicar completamente. {name} encontrou a primeira lacuna rápido o suficiente. A segunda foi mais preocupante.",

    "Existe um tipo particular de confiança que se desenvolve entre pessoas que passaram por algo juntas — não a confiança fácil do prazer compartilhado, mas a confiança mais difícil e estranha que é forjada na dificuldade compartilhada. {name} entendia isso agora de maneiras que eram impossíveis de entender antes.",

    "A conversa virou, como todas as conversas importantes eventualmente viram, para aquilo que estava não dito. O silêncio antes havia sido um tipo de silêncio. O silêncio depois era algo completamente diferente — mais pesado, mais texturizado, carregando o peso específico da verdade reconhecida.",

    "Detalhes importam. Isso era algo que {name} havia aprendido, às vezes dolorosamente: a cor de uma porta, o jeito que uma pessoa segura a xícara de café, uma hesitação antes de responder uma pergunta. Esses detalhes não são decoração. São a estrutura sob a superfície, os ossos de uma história.",

    "As apostas nunca pareceram tão altas. Mas apostas altas clarificam as coisas, removem o não essencial e deixam apenas o núcleo do que importa. {name} sentia essa clareza agora — desconfortável, intransigente e estranhamente estabilizadora.",
]

_FICTION_DIALOGUES_PT = [
    '"{name} respirou fundo antes de falar. "Preciso que você entenda uma coisa," disse cuidadosamente. "O que estamos lidando aqui não é simples. Nada disso é simples."\n\n"Eu sei," veio a resposta. "Eu sei que não é." As palavras carregavam o peso específico de alguém que havia pensado sobre isso por muito tempo, sozinho, nas pequenas horas da noite.\n\n{name} assentiu. Às vezes as conversas mais difíceis são aquelas que contêm mais silêncio do que fala.',

    'A pergunta pairou no ar. {name} a considerou — realmente considerou, ao invés de buscar a primeira resposta disponível.\n\n"Isso não é algo que eu possa responder agora," {name} disse finalmente. "Mas estou começando a achar que a pergunta em si pode ser o ponto."\n\n"Talvez," a outra pessoa disse. "Ou talvez a pergunta seja apenas uma porta. E o que importa é o que está do outro lado."',

    '"Você poderia ter me contado antes," {name} disse. Não era uma acusação. Uma declaração, plana e factual.\n\n"Sim." Uma pausa. "Eu sei."\n\n"Então por que não contou?"\n\nO silêncio que se seguiu foi sua própria resposta — complicada e humana e cheia das coisas que são difíceis de dizer em voz alta.',
]

_FICTION_CLOSINGS_PT = [
    "Mais tarde, repassando tudo, {name} marcaria este como o dia em que tudo mudou. Não com um gesto dramático ou uma ruptura definitiva, mas com a mudança silenciosa e irrevogável de entender algo que não podia ser des-entendido.",
    "A noite não ofereceu respostas fáceis. Mas {name} estava começando a suspeitar que respostas fáceis não eram o que se precisava aqui. O que se precisava era algo mais difícil, e mais honesto, e completamente mais difícil de segurar.",
    "O sono viria, eventualmente. Mas primeiro havia o trabalho de sentar com o que havia acontecido — processá-lo, virá-lo de todos os lados, encontrar a forma dele no escuro.",
    "Amanhã exigiria decisões. Esta noite, havia apenas isso: a paz particular de ter enfrentado algo diretamente, o começo frágil de saber o que deve ser feito.",
]


def _gen_fiction_pt(rng, title, num, genre, topic, project_title, memory):
    parts = []
    char_names = list(memory.characters.keys()) if memory else []
    name = char_names[0] if char_names else "o protagonista"
    
    def fill(tmpl):
        return tmpl.replace("{name}", name).replace("{topic}", topic).replace("{title}", title)
    
    parts.append(fill(rng.choice(_FICTION_OPENINGS_PT)))
    
    scene_pool = _FICTION_SCENES_PT[:]
    rng.shuffle(scene_pool)
    for i, scene in enumerate(scene_pool[:rng.randint(4, 6)]):
        parts.append(fill(scene))
        if i % 2 == 0:
            parts.append(fill(rng.choice(_FICTION_DIALOGUES_PT)))
    
    parts.append(fill(rng.choice(_FICTION_CLOSINGS_PT)))
    return parts


# ===== NON-FICTION TEMPLATE (PT-BR) =====

_NONFICTION_SECTIONS_PT = [
    "Considere o que a maioria das pessoas entende errado sobre {topic}. A sabedoria convencional sustenta que {topic} é principalmente uma questão de {aspect} — acerte isso, e o resto segue naturalmente. Essa suposição, embora intuitivamente atraente, desmorona sob escrutínio. A evidência sugere um quadro mais complicado: {aspect} é necessário mas não suficiente.",

    "A literatura de pesquisa sobre {topic} acumulou um corpo de achados que, tomados em conjunto, pintam um retrato bastante claro do que funciona e do que não funciona. O desafio é que esses achados frequentemente contradizem a intuição. Somos programados para certos tipos de explicações — lineares, causais, limpas — e a dinâmica real de {topic} raramente é qualquer uma dessas coisas.",

    "Pense na última vez que você encontrou maestria genuína em {topic}. O que a distinguiu da mera competência? Os mestres de qualquer domínio compartilham certos traços: internalizaram os fundamentos tão profundamente que não precisam mais pensar neles. Isso libera sua atenção consciente para os problemas de ordem superior.",

    "Um dos preditores mais confiáveis de sucesso em {topic} é o que pesquisadores chamam de 'prática deliberada' — um termo que parece direto mas descreve algo específico e exigente. Não é simplesmente fazer as mesmas coisas com mais frequência. É engajar-se com a dificuldade de formas estruturadas, com feedback, com a intenção de melhorar aspectos específicos do desempenho.",

    "A perspectiva sistêmica oferece um framework útil aqui. Em vez de perguntar 'o que devo fazer?' — uma pergunta que implica uma lista de ações isoladas — a perspectiva sistêmica pergunta 'quais são os ciclos de feedback?' e 'onde estão os pontos de alavancagem?' Em {topic}, essas perguntas frequentemente revelam que pequenas mudanças em certos lugares produzem efeitos desproporcionalmente grandes.",

    "Contexto importa mais que princípios. Isso é difícil de aceitar para pessoas que amam frameworks e modelos, mas é empiricamente defensável. A mesma estratégia que produz excelentes resultados em um contexto produz resultados medíocres ou ruins em outro. Entender {topic} em profundidade significa desenvolver o julgamento para distinguir contextos.",
]

_NONFICTION_EXAMPLES_PT = [
    "Um exemplo concreto ilustra o princípio mais claramente que descrição abstrata. Imagine uma organização que implementou exatamente esse tipo de abordagem. Os resultados, embora não imediatamente dramáticos, se acumularam ao longo do tempo de maneiras que excederam as projeções iniciais.",
    "Os melhores praticantes em qualquer campo são distinguidos pela qualidade de seus modelos mentais — as representações simplificadas de realidades complexas que guiam seu julgamento sob incerteza.",
    "Quando examinamos estudos de caso de resultados excepcionais neste domínio, um padrão emerge. O sucesso raramente é atribuível a uma única decisão brilhante. É quase sempre o resultado de muitas decisões comuns feitas consistentemente bem ao longo do tempo.",
]


def _gen_nonfiction_pt(rng, title, num, genre, topic, project_title, audience):
    parts = []
    aspects = ["execução consistente", "pensamento claro", "feedback estruturado",
               "iteração deliberada", "julgamento contextual", "medição sistemática"]
    aspect = rng.choice(aspects)
    
    def fill(tmpl):
        return tmpl.replace("{topic}", topic).replace("{aspect}", aspect).replace("{title}", title)
    
    openers = [
        f"Este capítulo aborda uma das questões mais consequentes em {topic}: não as perguntas óbvias que todos fazem, mas as perguntas subjacentes para as quais essas perguntas óbvias realmente apontam.",
        f"O desafio central de {title.lower()} não é o que a maioria das pessoas pensa. A dificuldade superficial é real mas administrável. A dificuldade mais profunda é mais fundamental, e mais interessante.",
        f"Entender {topic} requer confrontar algumas verdades desconfortáveis sobre como tipicamente abordamos aprendizado e melhoria. As estratégias que parecem produtivas frequentemente não são. As abordagens que parecem lentas e difíceis são frequentemente as mais eficazes.",
    ]
    parts.append(rng.choice(openers))
    
    pool = _NONFICTION_SECTIONS_PT[:]
    rng.shuffle(pool)
    for tmpl in pool[:rng.randint(4, 5)]:
        parts.append(fill(tmpl))
        if rng.random() > 0.4:
            parts.append(fill(rng.choice(_NONFICTION_EXAMPLES_PT)))
    
    closings = [
        f"Os princípios delineados neste capítulo não são complicados, mas são exigentes. Simplicidade e facilidade não são a mesma coisa. O próximo capítulo se constrói sobre esses fundamentos.",
        f"Um exercício útil: antes de avançar para o próximo capítulo, dedique cinco minutos para identificar um lugar específico no seu trabalho com {topic} onde as ideias aqui se aplicam diretamente.",
        f"O que estabelecemos neste capítulo não é um quadro completo de {topic}. É um fundamento. Os capítulos subsequentes adicionarão camadas — complexidade, nuance, o tipo de complicações que surgem quando princípios encontram a realidade.",
    ]
    parts.append(rng.choice(closings))
    return parts


# ===== TECHNICAL TEMPLATE (PT-BR) =====

def _gen_technical_pt(rng, title, num, topic, project_title):
    parts = []
    parts.append(
        f"Este capítulo cobre {title}. Ao final, você entenderá os conceitos centrais, "
        f"saberá como implementá-los na prática e será capaz de evitar as armadilhas comuns."
    )
    parts.append(
        f"**Pré-requisitos:** Antes de mergulhar, certifique-se de ter um entendimento dos "
        f"conceitos fundamentais de {topic}. O material aqui se constrói diretamente sobre esses fundamentos."
    )
    parts.append(
        f"**Conceito Central: {title}**\n\n"
        f"Em sua essência, {title.lower()} trata de criar resultados previsíveis e reproduzíveis em {topic}. "
        f"O insight central é que confiabilidade vem não da complexidade, mas da simplicidade disciplinada — "
        f"fazer as coisas certas consistentemente ao invés de fazer muitas coisas ocasionalmente."
    )
    
    steps = [
        f"Comece estabelecendo uma linha de base clara. Você não pode melhorar o que não pode medir, e não pode medir o que não definiu.",
        f"Construa a implementação mais simples possível que alcance o resultado definido. Resista à tentação de adicionar sofisticação antes de validar os fundamentos.",
        f"Teste contra condições reais. O laboratório não é o campo. O que funciona em condições controladas frequentemente revela modos de falha inesperados.",
        f"Itere baseado no que você observa, não no que esperava. Os dados vão te contar coisas que seu modelo anterior não antecipou.",
    ]
    for i, step in enumerate(steps, 1):
        parts.append(f"**Passo {i}:** {step}")
    
    parts.append(
        f"**Armadilhas Comuns em {title}:**\n\n"
        f"O erro mais comum é confundir atividade com progresso. Em {topic}, é fácil "
        f"ficar ocupado fazendo coisas que parecem produtivas mas não movem as métricas principais."
    )
    parts.append(
        f"**Resumo**\n\n"
        f"Este capítulo apresentou {title.lower()} como um componente central de {topic}. "
        f"As conclusões-chave são: defina resultados com precisão, construa simples primeiro, "
        f"teste contra a realidade e itere baseado em evidências."
    )
    return parts


# ===== CONSISTENCY ENGINE =====

class ConsistencyChecker:
    def check(self, chapters):
        all_entities = {}
        issues = []
        for ch in chapters:
            if not ch.get("content"):
                continue
            entities = self._extract_entities(ch["content"])
            for entity, context in entities.items():
                if entity in all_entities:
                    all_entities[entity]["chapters"].append(ch["number"])
                else:
                    all_entities[entity] = {
                        "chapter": ch["number"], "chapters": [ch["number"]],
                        "context": context[:100]
                    }
        return {
            "status": "checked", "total_entities": len(all_entities),
            "entities": {k: v for k, v in list(all_entities.items())[:30]},
            "issues": issues,
            "chapters_checked": len([c for c in chapters if c.get("content")])
        }

    def _extract_entities(self, text):
        entities = {}
        skip = {"The", "This", "That", "There", "They", "Chapter", "Capítulo",
                "Para", "Como", "Quando", "Onde", "Porque", "Então", "Depois",
                "Antes", "Ainda", "Também", "Muito", "Cada", "Todo", "Toda",
                "Este", "Esta", "Esse", "Essa", "Aquele", "Aquela"}
        for m in re.finditer(r'\b([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)\b', text):
            word = m.group(1)
            if len(word) > 3 and word not in skip and word not in entities:
                start = max(0, m.start() - 40)
                end = min(len(text), m.end() + 40)
                entities[word] = text[start:end]
        return entities


# ===== MAIN GOD MODE ENGINE =====

class GodModeEngine:
    def __init__(self):
        self.planner = PlannerAgent()
        self.writer = WriterAgent()
        self.critic = CriticAgent()
        self.editor = EditorAgent()
        self.consistency_checker = ConsistencyChecker()
        self._provider = None

    @property
    def provider(self):
        if self._provider is None:
            self._provider = get_available_provider()
            print(f"[GodMode] Provider: {self._provider}")
        return self._provider

    def generate_chapter(
        self, project_title, chapter_title, chapter_number, genre, topic,
        target_audience, chapter_outline, previous_chapters,
        custom_voice_rules=None, materials_context="", language="pt-br"
    ) -> Dict:
        """Full multi-agent pipeline with materials integration."""
        memory = ChapterMemory()
        
        # Inject source materials
        if materials_context:
            memory.set_materials(materials_context)
            print(f"[GodMode] Materials injected: {len(materials_context)} chars, {len(memory.key_facts)} facts extracted")
        
        for prev in previous_chapters:
            memory.add_chapter(prev["number"], prev["title"], prev.get("content", ""))

        voice_bible = VoiceBible(genre, topic, custom_voice_rules)
        pipeline_steps = []
        provider = self.provider

        # Step 1: Planner
        print(f"[GodMode] Cap.{chapter_number} - Planner ({language})...")
        plan = self.planner.run(
            chapter_title, chapter_number, project_title, genre, topic,
            target_audience, chapter_outline, memory, voice_bible, provider, language
        )
        pipeline_steps.append({"agent": "planner", "status": "complete"})

        # Step 2: Writer
        print(f"[GodMode] Cap.{chapter_number} - Writer ({language})...")
        draft = self.writer.run(
            chapter_title, chapter_number, project_title, genre, topic,
            target_audience, chapter_outline, plan, memory, voice_bible, provider, language
        )

        if not draft:
            print(f"[GodMode] Writer LLM falhou, usando template em {language}...")
            draft = generate_template_content_pt(
                chapter_title, chapter_number, genre, topic, project_title,
                target_audience, chapter_outline, memory, language
            )
            provider = "template"
            pipeline_steps.append({"agent": "writer", "status": "template-fallback"})
        else:
            pipeline_steps.append({"agent": "writer", "status": "complete"})

        # Step 3: Critic
        issues = []
        if provider != "template":
            print(f"[GodMode] Cap.{chapter_number} - Critic...")
            verdict, issues = self.critic.run(draft, chapter_title, genre, memory, provider, language)
            pipeline_steps.append({"agent": "critic", "status": verdict, "issues": len(issues)})
            if issues:
                print(f"[GodMode] Cap.{chapter_number} - Editor corrigindo {len(issues)} problemas...")
                draft = self.editor.run(draft, issues, chapter_title, voice_bible, provider, language)
                pipeline_steps.append({"agent": "editor", "status": "complete"})
            else:
                pipeline_steps.append({"agent": "editor", "status": "skipped"})
        else:
            pipeline_steps.append({"agent": "critic", "status": "skipped"})
            pipeline_steps.append({"agent": "editor", "status": "skipped"})

        word_count = len(draft.split())
        print(f"[GodMode] Cap.{chapter_number} completo: {word_count} palavras via {provider} ({language})")

        return {
            "generated_text": draft,
            "word_count": word_count,
            "provider": provider,
            "language": language,
            "pipeline_steps": pipeline_steps,
            "memory_snapshot": {
                "previous_chapters_loaded": len(previous_chapters),
                "characters_tracked": len(memory.characters),
                "banned_phrases": len(memory.banned_phrases),
                "materials_loaded": bool(materials_context),
                "key_facts_extracted": len(memory.key_facts),
            }
        }

    def generate_book_outline(
        self, project_title, topic, genre, target_audience, description,
        num_chapters=12, materials_context="", language="pt-br"
    ) -> Dict:
        provider = self.provider
        lang_inst = get_lang_instruction(language)
        
        materials_block = ""
        if materials_context:
            materials_block = f"""
MATERIAIS DE REFERÊNCIA (use como base para o outline):
{materials_context[:5000]}

Baseie o outline nos temas, cronologia e conteúdo dos materiais acima.
"""
        
        system = f"Você é um planejador de livros experiente. {lang_inst}"
        prompt = f"""Crie um outline detalhado para um livro de {genre} chamado "{project_title}".
Tema: {topic}
Público-alvo: {target_audience}
Descrição: {description}
Número de capítulos: {num_chapters}
{materials_block}

Para cada capítulo forneça:
- Número do capítulo
- Título envolvente
- Descrição de 2-3 frases do que acontece / o que é coberto

Formato:
CAPÍTULO N: Título
Descrição: ...

{lang_inst}
O outline deve fluir logicamente. Cada capítulo deve construir sobre o anterior.
CADA CAPÍTULO terá 3000-4000 palavras. O livro completo terá 30.000-40.000 palavras."""

        result = call_llm(prompt, system, max_tokens=2000, provider=provider)
        if not result:
            result = self._template_outline_pt(project_title, topic, genre, num_chapters, materials_context)
            provider = "template"

        chapters = self._parse_outline(result, num_chapters)
        return {"outline_text": result, "chapters": chapters, "provider": provider}

    def _template_outline_pt(self, title, topic, genre, num_chapters, materials_context=""):
        genre_lower = genre.lower() if genre else ""
        is_fiction = ('non-fiction' not in genre_lower and 'não-ficção' not in genre_lower) and \
                     any(g in genre_lower for g in ["fiction", "ficção", "fantasy", "romance", "thriller",
                                                      "mystery", "sci", "horror"])
        lines = [f"Outline do Livro: {title}\n"]
        
        if materials_context:
            # Extract themes from materials for outline
            sentences = [s.strip() for s in re.split(r'[.!?\n]+', materials_context[:3000]) if len(s.strip()) > 20]
            for i in range(min(num_chapters, len(sentences))):
                lines.append(f"CAPÍTULO {i+1}: {sentences[i][:60]}")
                lines.append(f"Descrição: Exploração aprofundada baseada nos materiais de referência.\n")
            for i in range(len(sentences), num_chapters):
                lines.append(f"CAPÍTULO {i+1}: Análise Complementar {i+1-len(sentences)}")
                lines.append(f"Descrição: Desenvolvimento adicional dos temas de {topic}.\n")
        elif is_fiction:
            titles_pt = ["O Mundo Antes", "O Primeiro Sinal", "Rumo ao Desconhecido",
                         "Complicações Surgem", "Aliados e Inimigos", "O Ponto Sem Retorno",
                         "A Noite Escura", "Revelação", "O Preço da Verdade",
                         "Confronto Final", "Consequências", "O Novo Mundo"]
            for i in range(min(num_chapters, 12)):
                t = titles_pt[i] if i < len(titles_pt) else f"Capítulo {i+1}"
                lines.append(f"CAPÍTULO {i+1}: {t}")
                lines.append(f"Descrição: A história avança conforme eventos-chave relacionados a {topic} se desdobram.\n")
        else:
            titles_pt = [f"Introdução a {topic}", f"Os Fundamentos de {topic}",
                         "Princípios Centrais", "Erros Comuns a Evitar",
                         "Construindo Seu Framework", "Ferramentas e Técnicas",
                         "Estratégias Avançadas", "Medindo Sucesso",
                         "Resolução de Problemas", "Escalando Sua Abordagem",
                         "Estudos de Caso Reais", "O Caminho Adiante"]
            for i in range(min(num_chapters, 12)):
                t = titles_pt[i] if i < len(titles_pt) else f"Capítulo {i+1}: Tópicos Avançados"
                lines.append(f"CAPÍTULO {i+1}: {t}")
                lines.append(f"Descrição: Cobre aspectos essenciais de {topic} com exemplos práticos.\n")
        return "\n".join(lines)

    def _parse_outline(self, text, num_chapters):
        chapters = []
        pattern = re.compile(r'CAP[ÍI]TULO\s+(\d+)\s*[:\-]\s*(.+?)(?:\n|$)', re.IGNORECASE)
        if not pattern.search(text):
            pattern = re.compile(r'CHAPTER\s+(\d+)\s*[:\-]\s*(.+?)(?:\n|$)', re.IGNORECASE)
        
        matches = list(pattern.finditer(text))
        desc_pattern = re.compile(r'Descri[çc][ãa]o\s*:\s*(.+?)(?:\n\n|\nCAP|\nCHAPTER|\Z)',
                                   re.IGNORECASE | re.DOTALL)
        if not matches:
            desc_pattern = re.compile(r'Description\s*:\s*(.+?)(?:\n\n|\nCHAPTER|\Z)',
                                       re.IGNORECASE | re.DOTALL)
        
        for i, match in enumerate(matches):
            ch_num = int(match.group(1))
            ch_title = match.group(2).strip()
            desc_start = match.end()
            desc_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            desc_text = text[desc_start:desc_end]
            desc_match = desc_pattern.search(desc_text)
            description = desc_match.group(1).strip() if desc_match else ""
            chapters.append({"number": ch_num, "title": ch_title, "description": description})
        
        if not chapters:
            for i in range(1, num_chapters + 1):
                chapters.append({"number": i, "title": f"Capítulo {i}", "description": ""})
        return chapters[:num_chapters]

    def edit_chapter(self, chapter_title, current_content, instructions, genre, topic,
                     voice_bible=None, language="pt-br") -> Dict:
        provider = self.provider
        if voice_bible is None:
            voice_bible = VoiceBible(genre, topic)
        lang_inst = get_lang_instruction(language)
        system = f"Você é um editor habilidoso. Revisa texto conforme instruções específicas.\n{voice_bible.to_prompt_block()}\n{lang_inst}"
        prompt = f"""Capítulo: "{chapter_title}"

INSTRUÇÕES DE EDIÇÃO:
{instructions}

TEXTO ATUAL:
{current_content}

Aplique as instruções de edição com precisão. Preserve o que funciona.
{lang_inst}
Retorne APENAS o texto revisado."""
        result = call_llm(prompt, system, max_tokens=3000, provider=provider)
        if not result or len(result) < 100:
            return {"generated_text": current_content, "word_count": len(current_content.split()),
                    "provider": "unchanged"}
        return {"generated_text": result, "word_count": len(result.split()), "provider": provider}

    def check_consistency(self, chapters):
        return self.consistency_checker.check(chapters)

    # ===== NOVEL PROCESS ENHANCED METHODS =====

    def generate_chapter_enhanced(
        self, project_title, chapter_title, chapter_number, genre, topic,
        target_audience, chapter_outline, previous_chapters,
        custom_voice_rules=None, materials_context="", language="pt-br",
        voice_profile_data=None, craft_standards_data=None,
        story_bible_data=None, writing_samples=None,
        max_revisions=1
    ) -> Dict:
        """
        Full Novel Process pipeline: Voice Profile → Scene Outline → Write → Critique → Edit → Audit → Notes.
        Falls back to standard pipeline if novel_process module is unavailable.
        """
        if not HAS_NOVEL_PROCESS:
            return self.generate_chapter(
                project_title, chapter_title, chapter_number, genre, topic,
                target_audience, chapter_outline, previous_chapters,
                custom_voice_rules, materials_context, language
            )

        provider = self.provider
        print(f"[NovelProcess] Cap.{chapter_number} - Enhanced pipeline ({language})...")

        # Initialize pipeline
        pipeline = NovelProcessPipeline(
            genre=genre,
            topic=topic,
            project_title=project_title,
            provider=provider,
            language=language,
            voice_profile_data=voice_profile_data,
            craft_standards_data=craft_standards_data,
            story_bible_data=story_bible_data,
        )

        # Build voice profile from samples if provided
        if writing_samples and not voice_profile_data:
            print(f"[NovelProcess] Building voice profile from {len(writing_samples)} samples...")
            pipeline.build_voice_profile_from_samples(writing_samples)

        # Load materials
        if materials_context:
            pipeline.story_bible.set_materials(materials_context)
            print(f"[NovelProcess] Materials injected: {len(materials_context)} chars")

        # Load previous chapters into story bible
        for prev in previous_chapters:
            pipeline.story_bible.update_from_chapter(
                prev["number"], prev["title"], prev.get("content", ""),
                provider=provider
            )

        # Run full pipeline
        result = pipeline.generate_chapter(
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            chapter_outline=chapter_outline,
            target_audience=target_audience,
            max_revisions=max_revisions,
        )

        if not result.get("content"):
            print(f"[NovelProcess] Enhanced pipeline failed, falling back to standard...")
            return self.generate_chapter(
                project_title, chapter_title, chapter_number, genre, topic,
                target_audience, chapter_outline, previous_chapters,
                custom_voice_rules, materials_context, language
            )

        word_count = result.get("word_count", 0)
        audit_score = result.get("audit", {}).get("compliance_score", 0)
        print(f"[NovelProcess] Cap.{chapter_number} complete: {word_count} words, "
              f"voice compliance: {audit_score}%")

        return {
            "generated_text": result["content"],
            "word_count": word_count,
            "provider": provider,
            "language": language,
            "pipeline_steps": [
                {"agent": "scene_outline_engine", "status": "complete"},
                {"agent": "enhanced_writer", "status": "complete"},
                {"agent": "enhanced_critic", "status": "complete"},
                {"agent": "enhanced_editor", "status": "complete"},
                {"agent": "voice_auditor", "status": "complete", "score": audit_score},
                {"agent": "notes_generator", "status": "complete"},
            ],
            "novel_process": {
                "outline": result.get("outline", ""),
                "notes": result.get("notes", {}),
                "audit": result.get("audit", {}),
                "issues_found": result.get("issues_found", []),
                "story_bible": result.get("story_bible_snapshot", {}),
                "voice_profile": pipeline.get_voice_profile(),
                "craft_standards": pipeline.get_craft_standards(),
            },
            "memory_snapshot": {
                "characters_tracked": len(pipeline.story_bible.characters),
                "continuity_flags": len(pipeline.story_bible.continuity_flags),
                "locations_tracked": len(pipeline.story_bible.locations),
                "motifs_tracked": len(pipeline.story_bible.motifs),
                "materials_loaded": bool(materials_context),
            }
        }

    def build_voice_profile(self, genre, topic, writing_samples=None,
                            interview_responses=None) -> Dict:
        """Build a voice profile from writing samples or interview responses."""
        if not HAS_NOVEL_PROCESS:
            vb = VoiceBible(genre, topic)
            return {"profile": vb.rules, "source": "legacy_voice_bible"}

        builder = VoiceProfileBuilder(provider=self.provider)

        if writing_samples:
            profile = builder.from_writing_samples(writing_samples, genre, topic)
        elif interview_responses:
            profile = builder.from_interview_responses(interview_responses, genre, topic)
        else:
            profile = builder.from_genre_defaults(genre, topic)

        return {"profile": profile.to_dict(), "source": profile.source}

    def get_voice_interview_questions(self) -> List[str]:
        """Return the 4 voice interview questions for the author."""
        if HAS_NOVEL_PROCESS:
            return list(VOICE_INTERVIEW_QUESTIONS)
        return [
            "Descreva um cômodo em que você passou muito tempo quando criança.",
            "Conte sobre um momento em que você se sentiu completamente deslocado.",
            "O que a maioria das pessoas entende errado sobre um assunto que você conhece bem?",
            "Complete esta frase sem pensar: 'O problema de conseguir o que você quer é...'",
        ]

    def generate_story_bible(self, chapters, genre="", topic="") -> Dict:
        """Generate a full living story bible from existing chapters."""
        if not HAS_NOVEL_PROCESS:
            return self.check_consistency(chapters)

        bible = LivingStoryBible()
        for ch in chapters:
            if ch.get("content"):
                bible.update_from_chapter(
                    ch["number"], ch.get("title", f"Cap.{ch['number']}"),
                    ch["content"], provider=self.provider
                )

        return {
            "status": "complete",
            "bible": bible.to_full_bible(),
            "context_block": bible.to_context_block(),
            "characters": len(bible.characters),
            "locations": len(bible.locations),
            "motifs": len(bible.motifs),
            "continuity_flags": len(bible.continuity_flags),
            "timeline_entries": len(bible.timeline),
        }

    def audit_voice_compliance(self, content, genre="", topic="",
                                voice_profile_data=None) -> Dict:
        """Audit a chapter against voice profile for compliance."""
        if not HAS_NOVEL_PROCESS:
            return {"compliance_score": 0, "error": "novel_process not available"}

        if voice_profile_data:
            profile = VoiceProfile.from_dict(voice_profile_data)
        else:
            builder = VoiceProfileBuilder(provider=self.provider)
            profile = builder.from_genre_defaults(genre, topic)

        auditor = VoiceComplianceAuditor(provider=self.provider)
        return auditor.audit(content, profile)


_god_mode_engine = None

def get_god_mode_engine() -> GodModeEngine:
    global _god_mode_engine
    if _god_mode_engine is None:
        _god_mode_engine = GodModeEngine()
    return _god_mode_engine
