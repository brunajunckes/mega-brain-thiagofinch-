"""
Plot Engine - Motor de Melhoria de Enredo + Geração Paralela de Capítulos
Inspirado em gpt-author (loop de melhoria) e parallel-book-generation (capítulos paralelos).

Funcionalidades:
1. PlotImprovementLoop - Gera múltiplas opções de enredo, avalia e refina
2. ParallelChapterGenerator - Gera capítulos em paralelo com contexto compartilhado
3. Fallback por template quando LLM não disponível
"""

import os
import re
import json
import random
import hashlib
import time
import logging
from typing import Optional, List, Dict, Any, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict

# Importações do god_mode
from god_mode import call_llm, generate_template_content_pt, get_available_provider, ChapterMemory

logger = logging.getLogger("plot_engine")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[PlotEngine] %(asctime)s %(levelname)s: %(message)s"))
    logger.addHandler(handler)


# ===== DATA CLASSES =====

@dataclass
class ChapterSummary:
    """Resumo de um capítulo no plano do enredo."""
    number: int
    title: str
    summary: str
    key_events: List[str] = field(default_factory=list)
    characters_involved: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class PlotOption:
    """Uma opção de enredo gerada pelo motor."""
    option_id: int
    title: str
    premise: str
    chapter_summaries: List[ChapterSummary] = field(default_factory=list)
    conflict: str = ""
    resolution: str = ""
    themes: List[str] = field(default_factory=list)
    target_chapters: int = 10
    score: float = 0.0
    evaluation_details: Dict[str, float] = field(default_factory=dict)
    improvement_suggestions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        d = asdict(self)
        return d


@dataclass
class SharedContext:
    """Contexto compartilhado para geração paralela de capítulos."""
    plot_outline: str
    character_profiles: str
    world_rules: str
    tone_guide: str
    timeline: str
    genre: str
    topic: str
    materials_excerpt: str = ""
    story_bible_excerpt: str = ""
    additional_notes: str = ""

    def to_prompt_block(self) -> str:
        """Converte o contexto compartilhado em bloco de texto para prompt."""
        sections = []
        sections.append("=== CONTEXTO COMPARTILHADO DO LIVRO ===\n")

        sections.append(f"## Gênero: {self.genre}")
        sections.append(f"## Tema: {self.topic}\n")

        sections.append("## Resumo do Enredo")
        sections.append(self.plot_outline + "\n")

        sections.append("## Perfis dos Personagens")
        sections.append(self.character_profiles + "\n")

        sections.append("## Regras do Mundo/Universo")
        sections.append(self.world_rules + "\n")

        sections.append("## Guia de Tom e Estilo")
        sections.append(self.tone_guide + "\n")

        sections.append("## Linha do Tempo")
        sections.append(self.timeline + "\n")

        if self.materials_excerpt:
            sections.append("## Materiais de Referência (Excerto)")
            sections.append(self.materials_excerpt + "\n")

        if self.story_bible_excerpt:
            sections.append("## Bíblia da História")
            sections.append(self.story_bible_excerpt + "\n")

        if self.additional_notes:
            sections.append("## Notas Adicionais")
            sections.append(self.additional_notes + "\n")

        sections.append("=== FIM DO CONTEXTO COMPARTILHADO ===")
        return "\n".join(sections)


@dataclass
class GeneratedChapter:
    """Capítulo gerado pelo motor paralelo."""
    chapter_number: int
    title: str
    content: str
    word_count: int = 0
    generation_time_seconds: float = 0.0
    provider_used: str = "template"

    def __post_init__(self):
        if self.content and self.word_count == 0:
            self.word_count = len(self.content.split())


# ===== PLOT IMPROVEMENT LOOP =====

class PlotImprovementLoop:
    """
    Motor de melhoria iterativa de enredo.

    Inspirado no gpt-author:
    1. Gera múltiplas opções de enredo/outline
    2. Avalia cada opção em múltiplos critérios
    3. Seleciona a melhor e sugere melhorias
    4. Refina o enredo selecionado com as melhorias

    Resultado: Um enredo otimizado e pronto para geração de capítulos.
    """

    # Critérios de avaliação com pesos
    EVALUATION_CRITERIA = {
        "originalidade": {
            "peso": 0.25,
            "descricao": "O quão único e inovador é o conceito do enredo"
        },
        "coerencia": {
            "peso": 0.30,
            "descricao": "A lógica interna, consistência e fluxo narrativo"
        },
        "engajamento": {
            "peso": 0.25,
            "descricao": "O potencial de prender a atenção do leitor"
        },
        "uso_materiais": {
            "peso": 0.20,
            "descricao": "Quão bem incorpora os materiais de referência fornecidos"
        }
    }

    # Templates de gênero para fallback
    GENRE_TEMPLATES = {
        "ficção": {
            "conflicts": [
                "O protagonista descobre um segredo que ameaça destruir tudo que conhece",
                "Uma força misteriosa começa a alterar a realidade do mundo",
                "O herói precisa enfrentar seu passado para salvar o futuro",
                "Uma conspiração oculta ameaça a ordem estabelecida",
                "O confronto entre dever e desejo pessoal atinge um ponto crítico",
            ],
            "resolutions": [
                "Após sacrifícios pessoais, o protagonista encontra uma verdade que transforma tudo",
                "A união improvável de antigos rivais resolve a crise maior",
                "O herói aceita sua verdadeira natureza e abraça seu destino",
                "A revelação final muda a perspectiva de todos os envolvidos",
                "Um ato de coragem inesperado quebra o ciclo de conflito",
            ],
            "themes": [
                "redenção", "identidade", "poder e responsabilidade",
                "amor e perda", "destino vs livre arbítrio", "transformação pessoal",
            ],
        },
        "não-ficção": {
            "conflicts": [
                "O paradigma atual é insuficiente para resolver os desafios modernos",
                "Existe uma lacuna crítica entre teoria e prática neste campo",
                "Os métodos tradicionais falham diante das novas demandas",
                "A desinformação cria barreiras para o progresso real",
                "A complexidade do tema exige uma abordagem radicalmente diferente",
            ],
            "resolutions": [
                "Um novo framework integra as melhores descobertas e práticas",
                "A aplicação prática dos conceitos gera resultados mensuráveis",
                "O leitor adquire ferramentas concretas para transformar sua realidade",
                "Uma síntese inovadora conecta campos aparentemente distintos",
                "O caminho se revela mais simples do que a complexidade sugeria",
            ],
            "themes": [
                "inovação", "aprendizado contínuo", "pensamento sistêmico",
                "aplicação prática", "transformação", "evidência e resultado",
            ],
        },
        "técnico": {
            "conflicts": [
                "As soluções existentes são ineficientes ou obsoletas para o problema",
                "A falta de padronização causa retrabalho e erros críticos",
                "A complexidade técnica impede a adoção em larga escala",
                "Os trade-offs entre performance e manutenibilidade são mal gerenciados",
                "A integração entre sistemas legados e modernos é o principal desafio",
            ],
            "resolutions": [
                "Uma arquitetura bem projetada resolve os problemas de forma elegante",
                "Padrões claros e automação eliminam as fontes de erro",
                "A abordagem incremental permite evolução sem riscos catastróficos",
                "O equilíbrio entre simplicidade e poder é encontrado através de abstrações corretas",
                "Ferramentas modernas integradas com práticas comprovadas garantem o resultado",
            ],
            "themes": [
                "arquitetura limpa", "automação", "qualidade de código",
                "escalabilidade", "manutenibilidade", "boas práticas",
            ],
        },
    }

    def __init__(self, max_retries: int = 2, timeout_per_call: int = 60):
        self.max_retries = max_retries
        self.timeout_per_call = timeout_per_call
        self.provider = get_available_provider()
        logger.info(f"PlotImprovementLoop inicializado | provider={self.provider}")

    def _classify_genre(self, genre: str) -> str:
        """Classifica o gênero em ficção, não-ficção ou técnico."""
        if not genre:
            return "não-ficção"
        g = genre.lower()
        if any(kw in g for kw in [
            "fiction", "ficção", "fantasy", "fantasia", "romance",
            "thriller", "mystery", "mistério", "sci", "horror", "novel", "conto"
        ]):
            return "ficção"
        if any(kw in g for kw in [
            "technical", "técnico", "programming", "programação",
            "code", "código", "software", "devops", "data"
        ]):
            return "técnico"
        return "não-ficção"

    def generate_plot_options(
        self,
        title: str,
        genre: str,
        topic: str,
        description: str,
        materials_context: str = "",
        num_options: int = 3
    ) -> List[PlotOption]:
        """
        Gera múltiplas opções de enredo/outline para o livro.

        Cada opção inclui: título, premissa, resumos de capítulos,
        conflito principal e resolução.

        Args:
            title: Título do livro
            genre: Gênero literário
            topic: Tema principal
            description: Descrição/sinopse fornecida pelo autor
            materials_context: Texto dos materiais de referência (opcional)
            num_options: Número de opções a gerar (padrão: 3)

        Returns:
            Lista de PlotOption com as opções geradas
        """
        logger.info(f"Gerando {num_options} opções de enredo para '{title}'")
        options = []

        for i in range(num_options):
            try:
                option = self._generate_single_option(
                    i + 1, title, genre, topic, description,
                    materials_context, num_options
                )
                options.append(option)
                logger.info(f"  Opção {i+1}/{num_options} gerada: '{option.title}'")
            except Exception as e:
                logger.error(f"  Erro ao gerar opção {i+1}: {e}")
                # Fallback: gerar por template
                fallback = self._generate_template_option(
                    i + 1, title, genre, topic, description, materials_context
                )
                options.append(fallback)
                logger.info(f"  Opção {i+1}/{num_options} gerada via template (fallback)")

        return options

    def _generate_single_option(
        self, option_id: int, title: str, genre: str, topic: str,
        description: str, materials_context: str, total_options: int
    ) -> PlotOption:
        """Gera uma única opção de enredo via LLM ou template."""

        # Tenta via LLM primeiro
        if self.provider != "template":
            result = self._generate_option_llm(
                option_id, title, genre, topic, description,
                materials_context, total_options
            )
            if result:
                return result

        # Fallback: template
        return self._generate_template_option(
            option_id, title, genre, topic, description, materials_context
        )

    def _generate_option_llm(
        self, option_id: int, title: str, genre: str, topic: str,
        description: str, materials_context: str, total_options: int
    ) -> Optional[PlotOption]:
        """Gera opção de enredo usando LLM."""
        materials_block = ""
        if materials_context:
            excerpt = materials_context[:3000]
            materials_block = f"\n\nMATERIAIS DE REFERÊNCIA:\n{excerpt}"

        system_prompt = (
            "Você é um roteirista e escritor profissional especializado em criar "
            "enredos envolventes e estruturas narrativas sólidas. "
            "Responda SEMPRE em português brasileiro. "
            "Formate sua resposta EXATAMENTE como JSON válido."
        )

        user_prompt = f"""Crie a opção de enredo #{option_id} de {total_options} para o seguinte livro.
Cada opção deve ser SIGNIFICATIVAMENTE DIFERENTE das outras em abordagem e estrutura.

LIVRO:
- Título: {title}
- Gênero: {genre}
- Tema: {topic}
- Descrição: {description}
{materials_block}

Para a opção #{option_id}, use uma abordagem {"clássica e direta" if option_id == 1 else "inovadora e não-convencional" if option_id == 2 else "híbrida e surpreendente"}.

Responda em JSON com EXATAMENTE esta estrutura:
{{
    "title": "Título refinado para esta versão",
    "premise": "Premissa detalhada em 2-3 parágrafos",
    "conflict": "Conflito principal da obra",
    "resolution": "Resolução/desfecho proposto",
    "themes": ["tema1", "tema2", "tema3"],
    "chapters": [
        {{
            "number": 1,
            "title": "Título do capítulo",
            "summary": "Resumo detalhado do capítulo (3-5 frases)",
            "key_events": ["evento1", "evento2"],
            "characters_involved": ["personagem1"]
        }}
    ]
}}

Gere entre 8 e 12 capítulos. Cada resumo deve ter pelo menos 3 frases."""

        for attempt in range(self.max_retries + 1):
            try:
                response = call_llm(
                    user_prompt, system=system_prompt,
                    max_tokens=3000, provider=self.provider
                )
                if not response:
                    continue

                # Extrair JSON da resposta
                parsed = self._extract_json(response)
                if not parsed:
                    logger.warning(f"  Tentativa {attempt+1}: JSON inválido na resposta LLM")
                    continue

                # Converter para PlotOption
                chapters = []
                for ch in parsed.get("chapters", []):
                    chapters.append(ChapterSummary(
                        number=ch.get("number", len(chapters) + 1),
                        title=ch.get("title", f"Capítulo {len(chapters) + 1}"),
                        summary=ch.get("summary", ""),
                        key_events=ch.get("key_events", []),
                        characters_involved=ch.get("characters_involved", [])
                    ))

                return PlotOption(
                    option_id=option_id,
                    title=parsed.get("title", title),
                    premise=parsed.get("premise", ""),
                    chapter_summaries=chapters,
                    conflict=parsed.get("conflict", ""),
                    resolution=parsed.get("resolution", ""),
                    themes=parsed.get("themes", []),
                    target_chapters=len(chapters)
                )

            except Exception as e:
                logger.warning(f"  Tentativa {attempt+1} falhou: {e}")
                if attempt == self.max_retries:
                    return None

        return None

    def _generate_template_option(
        self, option_id: int, title: str, genre: str, topic: str,
        description: str, materials_context: str
    ) -> PlotOption:
        """Gera opção de enredo usando templates (fallback sem LLM)."""
        genre_key = self._classify_genre(genre)
        templates = self.GENRE_TEMPLATES.get(genre_key, self.GENRE_TEMPLATES["não-ficção"])

        # Seed determinística por opção
        seed = hashlib.md5(f"{title}{genre}{topic}{option_id}".encode()).hexdigest()
        rng = random.Random(seed)

        # Selecionar conflito e resolução
        conflict = rng.choice(templates["conflicts"])
        resolution = rng.choice(templates["resolutions"])
        themes = rng.sample(templates["themes"], min(3, len(templates["themes"])))

        # Determinar número de capítulos
        num_chapters = rng.randint(8, 12)

        # Gerar resumos de capítulos
        chapters = self._generate_template_chapters(
            rng, title, genre_key, topic, description,
            num_chapters, materials_context
        )

        # Variações no título baseadas na opção
        title_variants = [
            title,
            f"{title}: Uma Nova Perspectiva",
            f"{title} — O Caminho Menos Percorrido",
        ]
        chosen_title = title_variants[min(option_id - 1, len(title_variants) - 1)]

        # Gerar premissa
        if materials_context:
            excerpt = materials_context[:500].replace("\n", " ").strip()
            premise = (
                f"Baseado nos materiais fornecidos, esta versão de '{title}' "
                f"explora o tema de {topic} através de uma abordagem "
                f"{'narrativa envolvente' if genre_key == 'ficção' else 'analítica e prática'}. "
                f"{conflict} "
                f"O material de referência indica: \"{excerpt[:200]}...\" "
                f"que serve como base para a construção desta obra."
            )
        else:
            premise = (
                f"'{chosen_title}' é uma obra de {genre} que aborda {topic} "
                f"de maneira {'cativante e imersiva' if genre_key == 'ficção' else 'clara e transformadora'}. "
                f"{conflict} "
                f"Ao longo de {num_chapters} capítulos, o leitor será guiado por uma jornada "
                f"que culmina em: {resolution}"
            )

        return PlotOption(
            option_id=option_id,
            title=chosen_title,
            premise=premise,
            chapter_summaries=chapters,
            conflict=conflict,
            resolution=resolution,
            themes=themes,
            target_chapters=num_chapters
        )

    def _generate_template_chapters(
        self, rng: random.Random, title: str, genre_key: str,
        topic: str, description: str, num_chapters: int,
        materials_context: str
    ) -> List[ChapterSummary]:
        """Gera resumos de capítulos via template."""
        chapters = []

        # Estruturas narrativas por gênero
        if genre_key == "ficção":
            arc_phases = [
                ("Introdução", "Apresentação do mundo, personagens e situação inicial"),
                ("Chamado", "O evento incidente que dispara a jornada"),
                ("Desenvolvimento", "Aprofundamento dos conflitos e relacionamentos"),
                ("Confronto", "Tensão crescente e obstáculos maiores"),
                ("Clímax", "O ponto de virada decisivo"),
                ("Resolução", "Consequências e novo equilíbrio"),
            ]
        elif genre_key == "técnico":
            arc_phases = [
                ("Fundamentos", "Conceitos base e pré-requisitos"),
                ("Configuração", "Setup do ambiente e ferramentas"),
                ("Implementação", "Construção passo a passo"),
                ("Avançado", "Técnicas e padrões avançados"),
                ("Integração", "Conectando componentes e sistemas"),
                ("Produção", "Deploy, monitoramento e manutenção"),
            ]
        else:
            arc_phases = [
                ("Contexto", "O cenário atual e por que este tema importa"),
                ("Fundamentos", "Os conceitos essenciais que o leitor precisa"),
                ("Análise", "Exploração profunda dos aspectos principais"),
                ("Prática", "Aplicação dos conceitos em situações reais"),
                ("Estratégia", "Framework e metodologia para resultados"),
                ("Transformação", "Síntese e caminho para implementação"),
            ]

        for i in range(num_chapters):
            phase_idx = min(int(i / num_chapters * len(arc_phases)), len(arc_phases) - 1)
            phase_name, phase_desc = arc_phases[phase_idx]

            ch_title = f"{phase_name}: {topic}" if i < 2 else f"Capítulo {i+1} — {phase_name}"

            # Enriquecer com materiais se disponíveis
            materials_note = ""
            if materials_context:
                chunk_size = max(200, len(materials_context) // num_chapters)
                start = i * chunk_size
                chunk = materials_context[start:start + chunk_size]
                sentences = [s.strip() for s in re.split(r'[.!?\n]+', chunk) if len(s.strip()) > 15]
                if sentences:
                    materials_note = f" Incorpora: {sentences[0][:100]}."

            summary = (
                f"{phase_desc}. "
                f"Este capítulo foca em {topic} sob a perspectiva de {phase_name.lower()}. "
                f"O leitor avança na compreensão através de exemplos concretos e "
                f"{'narrativa envolvente' if genre_key == 'ficção' else 'análise fundamentada'}."
                f"{materials_note}"
            )

            chapters.append(ChapterSummary(
                number=i + 1,
                title=ch_title,
                summary=summary,
                key_events=[f"Desenvolvimento de {phase_name.lower()}", f"Evolução do tema {topic}"],
                characters_involved=[]
            ))

        return chapters

    def evaluate_and_select(self, options: List[PlotOption]) -> PlotOption:
        """
        Avalia cada opção de enredo em múltiplos critérios e seleciona a melhor.

        Critérios: originalidade, coerência, engajamento, uso_materiais
        Cada critério tem peso diferente na pontuação final.

        Args:
            options: Lista de PlotOption para avaliar

        Returns:
            A melhor PlotOption com scores e sugestões de melhoria preenchidos
        """
        if not options:
            raise ValueError("Nenhuma opção de enredo para avaliar")

        if len(options) == 1:
            options[0].score = 7.0
            options[0].improvement_suggestions = ["Considere gerar mais opções para comparação"]
            return options[0]

        logger.info(f"Avaliando {len(options)} opções de enredo...")

        # Tenta avaliar via LLM
        if self.provider != "template":
            result = self._evaluate_llm(options)
            if result:
                return result

        # Fallback: avaliação heurística
        return self._evaluate_heuristic(options)

    def _evaluate_llm(self, options: List[PlotOption]) -> Optional[PlotOption]:
        """Avalia opções usando LLM."""
        options_text = ""
        for opt in options:
            ch_list = "\n".join([
                f"    Cap {ch.number}: {ch.title} — {ch.summary[:100]}..."
                for ch in opt.chapter_summaries[:5]
            ])
            options_text += f"""
--- OPÇÃO {opt.option_id}: {opt.title} ---
Premissa: {opt.premise[:300]}
Conflito: {opt.conflict}
Resolução: {opt.resolution}
Temas: {', '.join(opt.themes)}
Capítulos ({len(opt.chapter_summaries)}):
{ch_list}
"""

        system_prompt = (
            "Você é um editor literário experiente que avalia propostas de livros. "
            "Responda SEMPRE em português brasileiro. "
            "Formate sua resposta EXATAMENTE como JSON válido."
        )

        user_prompt = f"""Avalie as seguintes opções de enredo e selecione a melhor.

{options_text}

Para CADA opção, pontue de 0 a 10 nos seguintes critérios:
- originalidade (peso 25%): O quão único e inovador é o conceito
- coerencia (peso 30%): Lógica interna, consistência e fluxo narrativo
- engajamento (peso 25%): Potencial de prender a atenção do leitor
- uso_materiais (peso 20%): Quão bem incorpora os materiais de referência

Responda em JSON:
{{
    "evaluations": [
        {{
            "option_id": 1,
            "scores": {{
                "originalidade": 8.0,
                "coerencia": 7.5,
                "engajamento": 9.0,
                "uso_materiais": 6.0
            }},
            "weighted_score": 7.75,
            "strengths": ["ponto forte 1", "ponto forte 2"],
            "weaknesses": ["fraqueza 1"]
        }}
    ],
    "best_option_id": 1,
    "improvement_suggestions": [
        "sugestão de melhoria 1",
        "sugestão de melhoria 2",
        "sugestão de melhoria 3"
    ]
}}"""

        try:
            response = call_llm(
                user_prompt, system=system_prompt,
                max_tokens=2000, provider=self.provider
            )
            if not response:
                return None

            parsed = self._extract_json(response)
            if not parsed:
                return None

            best_id = parsed.get("best_option_id", 1)
            suggestions = parsed.get("improvement_suggestions", [])

            # Aplicar scores às opções
            for eval_data in parsed.get("evaluations", []):
                oid = eval_data.get("option_id", 0)
                for opt in options:
                    if opt.option_id == oid:
                        opt.evaluation_details = eval_data.get("scores", {})
                        opt.score = eval_data.get("weighted_score", 0.0)
                        break

            # Encontrar a melhor opção
            best = None
            for opt in options:
                if opt.option_id == best_id:
                    best = opt
                    break

            if not best:
                best = max(options, key=lambda o: o.score)

            best.improvement_suggestions = suggestions
            logger.info(f"Melhor opção (LLM): #{best.option_id} '{best.title}' (score: {best.score:.1f})")
            return best

        except Exception as e:
            logger.warning(f"Avaliação LLM falhou: {e}")
            return None

    def _evaluate_heuristic(self, options: List[PlotOption]) -> PlotOption:
        """Avalia opções usando heurísticas quando LLM não está disponível."""
        for opt in options:
            scores = {}

            # Originalidade: baseada na diversidade de temas e unicidade do título
            title_uniqueness = len(set(opt.title.lower().split())) / max(len(opt.title.split()), 1)
            theme_diversity = len(set(opt.themes)) / max(len(opt.themes), 1)
            scores["originalidade"] = min(10.0, (title_uniqueness + theme_diversity) * 5)

            # Coerência: baseada na completude dos capítulos
            chapters_complete = sum(
                1 for ch in opt.chapter_summaries
                if len(ch.summary) > 50 and ch.title
            ) / max(len(opt.chapter_summaries), 1)
            has_conflict = 1.0 if len(opt.conflict) > 20 else 0.5
            has_resolution = 1.0 if len(opt.resolution) > 20 else 0.5
            scores["coerencia"] = min(10.0, (chapters_complete + has_conflict + has_resolution) * 3.33)

            # Engajamento: baseado no comprimento e detalhamento
            premise_detail = min(1.0, len(opt.premise) / 300)
            chapter_detail = sum(
                len(ch.summary) for ch in opt.chapter_summaries
            ) / max(len(opt.chapter_summaries) * 100, 1)
            scores["engajamento"] = min(10.0, (premise_detail + min(1.0, chapter_detail)) * 5)

            # Uso de materiais: baseado em referências nos resumos
            scores["uso_materiais"] = 6.0  # Score padrão sem LLM

            opt.evaluation_details = scores

            # Score ponderado
            opt.score = sum(
                scores[k] * self.EVALUATION_CRITERIA[k]["peso"]
                for k in scores if k in self.EVALUATION_CRITERIA
            )

        # Selecionar melhor
        best = max(options, key=lambda o: o.score)
        best.improvement_suggestions = [
            "Aprofundar os conflitos entre personagens ou conceitos",
            "Adicionar mais detalhes sensoriais e contextuais nos resumos de capítulos",
            "Fortalecer a conexão entre o conflito principal e a resolução",
            "Garantir que cada capítulo avança a narrativa de forma significativa",
            "Considerar adicionar subtramas ou perspectivas alternativas",
        ]

        logger.info(f"Melhor opção (heurística): #{best.option_id} '{best.title}' (score: {best.score:.1f})")
        return best

    def refine_plot(self, selected_plot: PlotOption, improvements: List[str]) -> PlotOption:
        """
        Refina o enredo selecionado aplicando as melhorias sugeridas.

        Args:
            selected_plot: O PlotOption selecionado pela avaliação
            improvements: Lista de sugestões de melhoria a aplicar

        Returns:
            PlotOption refinado com melhorias aplicadas
        """
        logger.info(f"Refinando enredo '{selected_plot.title}' com {len(improvements)} melhorias")

        # Tenta refinar via LLM
        if self.provider != "template":
            refined = self._refine_llm(selected_plot, improvements)
            if refined:
                return refined

        # Fallback: refinamento por template
        return self._refine_template(selected_plot, improvements)

    def _refine_llm(self, plot: PlotOption, improvements: List[str]) -> Optional[PlotOption]:
        """Refina o enredo usando LLM."""
        chapters_text = "\n".join([
            f"  Cap {ch.number}: {ch.title} — {ch.summary}"
            for ch in plot.chapter_summaries
        ])

        improvements_text = "\n".join([f"  - {imp}" for imp in improvements])

        system_prompt = (
            "Você é um editor literário que refina e melhora enredos de livros. "
            "Responda SEMPRE em português brasileiro. "
            "Formate sua resposta EXATAMENTE como JSON válido."
        )

        user_prompt = f"""Refine o seguinte enredo aplicando TODAS as melhorias listadas.

ENREDO ATUAL:
Título: {plot.title}
Premissa: {plot.premise}
Conflito: {plot.conflict}
Resolução: {plot.resolution}
Temas: {', '.join(plot.themes)}
Capítulos:
{chapters_text}

MELHORIAS A APLICAR:
{improvements_text}

Responda em JSON com a estrutura refinada:
{{
    "title": "Título (pode manter ou melhorar)",
    "premise": "Premissa refinada e expandida",
    "conflict": "Conflito aprofundado",
    "resolution": "Resolução mais satisfatória",
    "themes": ["tema1", "tema2", "tema3"],
    "chapters": [
        {{
            "number": 1,
            "title": "Título do capítulo",
            "summary": "Resumo refinado e detalhado (4-6 frases)",
            "key_events": ["evento1", "evento2"],
            "characters_involved": ["personagem1"]
        }}
    ],
    "refinement_notes": "Explicação breve das melhorias aplicadas"
}}"""

        try:
            response = call_llm(
                user_prompt, system=system_prompt,
                max_tokens=3500, provider=self.provider
            )
            if not response:
                return None

            parsed = self._extract_json(response)
            if not parsed:
                return None

            chapters = []
            for ch in parsed.get("chapters", []):
                chapters.append(ChapterSummary(
                    number=ch.get("number", len(chapters) + 1),
                    title=ch.get("title", f"Capítulo {len(chapters) + 1}"),
                    summary=ch.get("summary", ""),
                    key_events=ch.get("key_events", []),
                    characters_involved=ch.get("characters_involved", [])
                ))

            refined = PlotOption(
                option_id=plot.option_id,
                title=parsed.get("title", plot.title),
                premise=parsed.get("premise", plot.premise),
                chapter_summaries=chapters if chapters else plot.chapter_summaries,
                conflict=parsed.get("conflict", plot.conflict),
                resolution=parsed.get("resolution", plot.resolution),
                themes=parsed.get("themes", plot.themes),
                target_chapters=len(chapters) if chapters else plot.target_chapters,
                score=plot.score + 0.5,  # Bonus por refinamento
                evaluation_details=plot.evaluation_details,
                improvement_suggestions=[]
            )

            logger.info(f"Enredo refinado via LLM: '{refined.title}' ({len(refined.chapter_summaries)} capítulos)")
            return refined

        except Exception as e:
            logger.warning(f"Refinamento LLM falhou: {e}")
            return None

    def _refine_template(self, plot: PlotOption, improvements: List[str]) -> PlotOption:
        """Refina o enredo via template quando LLM não está disponível."""
        # Expandir resumos dos capítulos
        refined_chapters = []
        for ch in plot.chapter_summaries:
            expanded_summary = ch.summary
            # Adicionar detalhes baseados nas melhorias
            if "conflitos" in " ".join(improvements).lower():
                expanded_summary += (
                    f" Neste ponto, tensões subjacentes emergem, "
                    f"criando camadas adicionais de complexidade."
                )
            if "sensoriais" in " ".join(improvements).lower() or "detalhes" in " ".join(improvements).lower():
                expanded_summary += (
                    f" Os detalhes visuais, sonoros e emocionais deste momento "
                    f"são cuidadosamente construídos para imersão total."
                )

            refined_chapters.append(ChapterSummary(
                number=ch.number,
                title=ch.title,
                summary=expanded_summary,
                key_events=ch.key_events + ["Desenvolvimento aprofundado"],
                characters_involved=ch.characters_involved
            ))

        # Expandir premissa
        refined_premise = plot.premise
        if len(refined_premise) < 200:
            refined_premise += (
                f" Esta obra se distingue por sua abordagem única ao tema, "
                f"combinando rigor com acessibilidade, "
                f"e oferecendo ao leitor uma experiência transformadora do início ao fim."
            )

        refined = PlotOption(
            option_id=plot.option_id,
            title=plot.title,
            premise=refined_premise,
            chapter_summaries=refined_chapters,
            conflict=plot.conflict,
            resolution=plot.resolution,
            themes=plot.themes,
            target_chapters=plot.target_chapters,
            score=plot.score + 0.3,
            evaluation_details=plot.evaluation_details,
            improvement_suggestions=[]
        )

        logger.info(f"Enredo refinado via template: '{refined.title}'")
        return refined

    def full_pipeline(
        self,
        title: str,
        genre: str,
        topic: str,
        description: str,
        materials_context: str = "",
        num_options: int = 3
    ) -> PlotOption:
        """
        Executa o pipeline completo de melhoria de enredo:
        1. Gera múltiplas opções
        2. Avalia e seleciona a melhor
        3. Refina com as melhorias sugeridas

        Args:
            title: Título do livro
            genre: Gênero literário
            topic: Tema principal
            description: Descrição/sinopse
            materials_context: Materiais de referência (opcional)
            num_options: Número de opções a gerar

        Returns:
            PlotOption final refinado e otimizado
        """
        logger.info(f"=== PIPELINE COMPLETO DE ENREDO ===")
        logger.info(f"Livro: '{title}' | Gênero: {genre} | Opções: {num_options}")
        start_time = time.time()

        # Fase 1: Gerar opções
        options = self.generate_plot_options(
            title, genre, topic, description,
            materials_context, num_options
        )
        logger.info(f"Fase 1 concluída: {len(options)} opções geradas")

        # Fase 2: Avaliar e selecionar
        best = self.evaluate_and_select(options)
        logger.info(f"Fase 2 concluída: Opção #{best.option_id} selecionada (score: {best.score:.1f})")

        # Fase 3: Refinar
        refined = self.refine_plot(best, best.improvement_suggestions)
        elapsed = time.time() - start_time
        logger.info(f"Fase 3 concluída: Enredo refinado em {elapsed:.1f}s")
        logger.info(f"=== PIPELINE COMPLETO | {len(refined.chapter_summaries)} capítulos | {elapsed:.1f}s ===")

        return refined

    @staticmethod
    def _extract_json(text: str) -> Optional[Dict]:
        """Extrai JSON de uma resposta que pode conter texto extra."""
        if not text:
            return None
        # Tentar parse direto
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        # Procurar bloco JSON com regex
        patterns = [
            r'```json\s*(.*?)\s*```',
            r'```\s*(.*?)\s*```',
            r'(\{[\s\S]*\})',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    continue
        return None


# ===== PARALLEL CHAPTER GENERATOR =====

class ParallelChapterGenerator:
    """
    Gerador paralelo de capítulos com contexto compartilhado.

    Inspirado no parallel-book-generation:
    1. Constrói contexto compartilhado (plot, personagens, mundo, tom, timeline)
    2. Injeta esse contexto em CADA geração de capítulo
    3. Usa ThreadPoolExecutor para gerar todos os capítulos em paralelo
    4. Fallback: usa template generators em paralelo quando LLM não disponível

    Benefícios:
    - Consistência: todos os capítulos compartilham o mesmo contexto
    - Velocidade: geração paralela reduz tempo total significativamente
    - Qualidade: contexto rico previne contradições entre capítulos
    """

    DEFAULT_MAX_WORKERS = 4
    DEFAULT_WORDS_PER_CHAPTER = 3000

    def __init__(self, max_workers: int = None, words_per_chapter: int = None):
        self.max_workers = max_workers or self.DEFAULT_MAX_WORKERS
        self.words_per_chapter = words_per_chapter or self.DEFAULT_WORDS_PER_CHAPTER
        self.provider = get_available_provider()
        logger.info(
            f"ParallelChapterGenerator inicializado | "
            f"workers={self.max_workers} | palavras/cap={self.words_per_chapter} | "
            f"provider={self.provider}"
        )

    def build_shared_context(
        self,
        plot: PlotOption,
        materials_context: str = "",
        story_bible: str = "",
        genre: str = "",
        topic: str = ""
    ) -> SharedContext:
        """
        Constrói o contexto compartilhado para injeção em todos os capítulos.

        Este documento abrangente inclui: outline do enredo, perfis de personagens,
        regras do mundo, guia de tom, e timeline. É injetado integralmente em
        cada prompt de geração de capítulo.

        Args:
            plot: O PlotOption refinado (saída do PlotImprovementLoop)
            materials_context: Texto dos materiais de referência
            story_bible: Bíblia da história (regras de consistência)
            genre: Gênero do livro
            topic: Tema principal

        Returns:
            SharedContext pronto para uso na geração paralela
        """
        logger.info("Construindo contexto compartilhado...")

        # Outline do enredo
        plot_outline_parts = [
            f"Título: {plot.title}",
            f"Premissa: {plot.premise}",
            f"Conflito Principal: {plot.conflict}",
            f"Resolução: {plot.resolution}",
            f"Temas: {', '.join(plot.themes)}",
            "",
            "Sequência de Capítulos:"
        ]
        for ch in plot.chapter_summaries:
            plot_outline_parts.append(
                f"  {ch.number}. {ch.title}: {ch.summary}"
            )
        plot_outline = "\n".join(plot_outline_parts)

        # Perfis de personagens (extraídos dos capítulos)
        all_characters = set()
        for ch in plot.chapter_summaries:
            all_characters.update(ch.characters_involved)

        if all_characters:
            char_profiles = "\n".join([
                f"- {char}: Personagem presente na narrativa, com papel relevante no desenvolvimento do enredo."
                for char in sorted(all_characters)
            ])
        else:
            char_profiles = (
                "Personagens serão desenvolvidos organicamente conforme a narrativa. "
                "Manter consistência de voz, motivação e arco de cada personagem introduzido."
            )

        # Regras do mundo
        genre_key = PlotImprovementLoop(max_retries=0)._classify_genre(genre)
        if genre_key == "ficção":
            world_rules = (
                "O mundo desta narrativa segue regras internas consistentes. "
                "Elementos fantásticos ou fictícios devem ser coerentes com o que foi estabelecido. "
                "Referências culturais e geográficas devem ser consistentes ao longo de todos os capítulos. "
                "As leis da física e da lógica aplicam-se a menos que explicitamente quebradas pela premissa."
            )
        elif genre_key == "técnico":
            world_rules = (
                "Todo código e exemplos técnicos devem ser funcionais e testáveis. "
                "Versões de ferramentas e bibliotecas devem ser consistentes em todos os capítulos. "
                "Cada conceito deve ser explicado antes de ser utilizado. "
                "Exemplos devem seguir boas práticas e padrões atualizados da indústria."
            )
        else:
            world_rules = (
                "Todas as afirmações devem ser fundamentadas em evidências ou referências. "
                "O tom deve ser acessível sem perder rigor intelectual. "
                "Conceitos devem ser construídos progressivamente, do simples ao complexo. "
                "Exemplos práticos devem acompanhar cada conceito teórico apresentado."
            )

        # Guia de tom
        tone_guide = (
            f"Gênero: {genre}\n"
            f"Tom geral: {'Imersivo, com detalhes sensoriais e emocionais' if genre_key == 'ficção' else 'Claro, autoritativo e acessível'}\n"
            f"Linguagem: Português brasileiro, fluido e natural\n"
            f"Narração: {'Terceira pessoa, tempo passado' if genre_key == 'ficção' else 'Segunda pessoa instrucional' if genre_key == 'técnico' else 'Voz autoral, segunda pessoa amigável'}\n"
            f"Evitar: Repetição excessiva, jargões não explicados, generalidades vazias\n"
            f"Buscar: Clareza, engajamento, profundidade, originalidade"
        )

        # Timeline
        timeline_parts = ["Progressão narrativa por capítulo:"]
        total = len(plot.chapter_summaries)
        for ch in plot.chapter_summaries:
            pct = int((ch.number / total) * 100) if total > 0 else 0
            phase = (
                "ABERTURA" if pct < 15 else
                "DESENVOLVIMENTO INICIAL" if pct < 35 else
                "DESENVOLVIMENTO" if pct < 55 else
                "TENSÃO CRESCENTE" if pct < 75 else
                "CLÍMAX" if pct < 90 else
                "RESOLUÇÃO"
            )
            timeline_parts.append(f"  Cap {ch.number} ({pct}%): [{phase}] {ch.title}")
        timeline = "\n".join(timeline_parts)

        # Materiais (excerto limitado para não estourar contexto)
        materials_excerpt = ""
        if materials_context:
            materials_excerpt = materials_context[:5000]
            if len(materials_context) > 5000:
                materials_excerpt += "\n[... materiais truncados para contexto ...]"

        context = SharedContext(
            plot_outline=plot_outline,
            character_profiles=char_profiles,
            world_rules=world_rules,
            tone_guide=tone_guide,
            timeline=timeline,
            genre=genre,
            topic=topic,
            materials_excerpt=materials_excerpt,
            story_bible_excerpt=story_bible[:3000] if story_bible else ""
        )

        logger.info(
            f"Contexto compartilhado construído | "
            f"{len(context.to_prompt_block())} caracteres | "
            f"{len(plot.chapter_summaries)} capítulos mapeados"
        )
        return context

    def generate_chapter_parallel(
        self,
        shared_context: SharedContext,
        chapter_outline: ChapterSummary,
        chapter_number: int,
        provider: str = None
    ) -> GeneratedChapter:
        """
        Gera um único capítulo — chamado pelo ThreadPoolExecutor.

        Cada capítulo recebe: contexto compartilhado + outline específico + número.

        Args:
            shared_context: SharedContext construído por build_shared_context
            chapter_outline: ChapterSummary com detalhes deste capítulo
            chapter_number: Número sequencial do capítulo
            provider: Provider LLM a usar (auto-detectado se None)

        Returns:
            GeneratedChapter com conteúdo gerado
        """
        start_time = time.time()
        used_provider = provider or self.provider

        logger.info(f"  Gerando capítulo {chapter_number}: '{chapter_outline.title}' [{used_provider}]")

        content = None

        # Tentar via LLM
        if used_provider != "template":
            content = self._generate_chapter_llm(
                shared_context, chapter_outline, chapter_number, used_provider
            )

        # Fallback: template
        if not content:
            content = self._generate_chapter_template(
                shared_context, chapter_outline, chapter_number
            )
            used_provider = "template"

        elapsed = time.time() - start_time

        result = GeneratedChapter(
            chapter_number=chapter_number,
            title=chapter_outline.title,
            content=content,
            generation_time_seconds=round(elapsed, 2),
            provider_used=used_provider
        )

        logger.info(
            f"  Capítulo {chapter_number} concluído | "
            f"{result.word_count} palavras | {elapsed:.1f}s | {used_provider}"
        )
        return result

    def _generate_chapter_llm(
        self,
        shared_context: SharedContext,
        chapter_outline: ChapterSummary,
        chapter_number: int,
        provider: str
    ) -> Optional[str]:
        """Gera capítulo via LLM com contexto compartilhado."""
        context_block = shared_context.to_prompt_block()

        key_events_str = ""
        if chapter_outline.key_events:
            key_events_str = "\nEventos-chave: " + ", ".join(chapter_outline.key_events)

        characters_str = ""
        if chapter_outline.characters_involved:
            characters_str = "\nPersonagens neste capítulo: " + ", ".join(chapter_outline.characters_involved)

        system_prompt = (
            "Você é um escritor profissional de livros. "
            "Escreva SEMPRE em português brasileiro, com alta qualidade literária. "
            "Use parágrafos bem construídos, transições suaves, e detalhes vívidos. "
            f"Meta: aproximadamente {self.words_per_chapter} palavras por capítulo."
        )

        user_prompt = f"""{context_block}

=== TAREFA: ESCREVER CAPÍTULO {chapter_number} ===

Título do Capítulo: {chapter_outline.title}
Resumo/Outline: {chapter_outline.summary}
{key_events_str}
{characters_str}

INSTRUÇÕES:
1. Siga RIGOROSAMENTE o contexto compartilhado acima
2. Mantenha consistência com o tom, personagens e mundo estabelecidos
3. Este é o capítulo {chapter_number} — respeite a posição na narrativa
4. Escreva aproximadamente {self.words_per_chapter} palavras
5. Comece diretamente com o conteúdo do capítulo (sem repetir o título)
6. Use seções e sub-seções quando apropriado ao gênero
7. Termine de forma que conecte naturalmente ao próximo capítulo

Escreva o capítulo completo agora:"""

        try:
            response = call_llm(
                user_prompt, system=system_prompt,
                max_tokens=4000, provider=provider
            )
            if response and len(response) > 200:
                return f"## {chapter_outline.title}\n\n{response}"
        except Exception as e:
            logger.warning(f"LLM falhou para capítulo {chapter_number}: {e}")

        return None

    def _generate_chapter_template(
        self,
        shared_context: SharedContext,
        chapter_outline: ChapterSummary,
        chapter_number: int
    ) -> str:
        """Gera capítulo via template (fallback) usando generate_template_content_pt."""
        memory = ChapterMemory()
        if shared_context.materials_excerpt:
            memory.set_materials(shared_context.materials_excerpt)

        content = generate_template_content_pt(
            chapter_title=chapter_outline.title,
            chapter_number=chapter_number,
            genre=shared_context.genre,
            topic=shared_context.topic,
            project_title=chapter_outline.title,
            target_audience="Leitor geral",
            chapter_outline=chapter_outline.summary,
            memory=memory,
            language="pt-br"
        )

        return content

    def generate_all_chapters(
        self,
        shared_context: SharedContext,
        chapter_outlines: List[ChapterSummary],
        provider: str = None
    ) -> List[GeneratedChapter]:
        """
        Gera TODOS os capítulos em paralelo usando ThreadPoolExecutor.

        Cada thread recebe o contexto compartilhado completo + o outline
        específico do seu capítulo. Resultados são ordenados por número.

        Args:
            shared_context: SharedContext construído por build_shared_context
            chapter_outlines: Lista de ChapterSummary com outlines de cada capítulo
            provider: Provider LLM (auto-detectado se None)

        Returns:
            Lista de GeneratedChapter ordenada por número do capítulo
        """
        if not chapter_outlines:
            logger.warning("Nenhum outline de capítulo fornecido")
            return []

        used_provider = provider or self.provider
        num_chapters = len(chapter_outlines)
        effective_workers = min(self.max_workers, num_chapters)

        logger.info(
            f"=== GERAÇÃO PARALELA DE CAPÍTULOS ===\n"
            f"  Capítulos: {num_chapters} | Workers: {effective_workers} | "
            f"Provider: {used_provider}"
        )
        start_time = time.time()

        chapters: List[GeneratedChapter] = []
        errors: List[Dict] = []

        with ThreadPoolExecutor(max_workers=effective_workers) as executor:
            # Submeter todas as tarefas
            future_to_chapter = {}
            for outline in chapter_outlines:
                future = executor.submit(
                    self.generate_chapter_parallel,
                    shared_context,
                    outline,
                    outline.number,
                    used_provider
                )
                future_to_chapter[future] = outline

            # Coletar resultados conforme completam
            for future in as_completed(future_to_chapter):
                outline = future_to_chapter[future]
                try:
                    result = future.result(timeout=300)  # 5 min timeout por capítulo
                    chapters.append(result)
                except Exception as e:
                    logger.error(f"Erro no capítulo {outline.number} '{outline.title}': {e}")
                    errors.append({
                        "chapter": outline.number,
                        "title": outline.title,
                        "error": str(e)
                    })
                    # Gerar fallback para capítulos com erro
                    fallback = GeneratedChapter(
                        chapter_number=outline.number,
                        title=outline.title,
                        content=f"## {outline.title}\n\n[Conteúdo em geração — erro temporário: {e}]",
                        provider_used="error_fallback"
                    )
                    chapters.append(fallback)

        # Ordenar por número do capítulo
        chapters.sort(key=lambda c: c.chapter_number)

        elapsed = time.time() - start_time
        total_words = sum(c.word_count for c in chapters)

        logger.info(
            f"=== GERAÇÃO PARALELA CONCLUÍDA ===\n"
            f"  Capítulos: {len(chapters)}/{num_chapters} | "
            f"Palavras total: {total_words:,} | "
            f"Tempo total: {elapsed:.1f}s | "
            f"Erros: {len(errors)}"
        )

        if errors:
            logger.warning(f"Capítulos com erro: {[e['chapter'] for e in errors]}")

        return chapters


# ===== FUNÇÕES UTILITÁRIAS =====

def run_full_book_pipeline(
    title: str,
    genre: str,
    topic: str,
    description: str,
    materials_context: str = "",
    story_bible: str = "",
    num_plot_options: int = 3,
    max_workers: int = 4,
    words_per_chapter: int = 3000
) -> Dict[str, Any]:
    """
    Pipeline completo: Melhoria de Enredo → Geração Paralela de Capítulos.

    Combina PlotImprovementLoop e ParallelChapterGenerator em um único fluxo.

    Args:
        title: Título do livro
        genre: Gênero literário
        topic: Tema principal
        description: Descrição/sinopse
        materials_context: Materiais de referência
        story_bible: Bíblia da história
        num_plot_options: Opções de enredo a gerar
        max_workers: Workers paralelos para capítulos
        words_per_chapter: Palavras-alvo por capítulo

    Returns:
        Dicionário com plot final, capítulos gerados e métricas
    """
    logger.info("=" * 60)
    logger.info("PIPELINE COMPLETO: ENREDO + CAPÍTULOS PARALELOS")
    logger.info("=" * 60)
    pipeline_start = time.time()

    # Fase 1: Melhoria de Enredo
    plot_engine = PlotImprovementLoop()
    final_plot = plot_engine.full_pipeline(
        title, genre, topic, description,
        materials_context, num_plot_options
    )

    # Fase 2: Contexto Compartilhado
    chapter_gen = ParallelChapterGenerator(
        max_workers=max_workers,
        words_per_chapter=words_per_chapter
    )
    shared_ctx = chapter_gen.build_shared_context(
        plot=final_plot,
        materials_context=materials_context,
        story_bible=story_bible,
        genre=genre,
        topic=topic
    )

    # Fase 3: Geração Paralela
    chapters = chapter_gen.generate_all_chapters(
        shared_context=shared_ctx,
        chapter_outlines=final_plot.chapter_summaries
    )

    pipeline_elapsed = time.time() - pipeline_start
    total_words = sum(c.word_count for c in chapters)

    result = {
        "plot": final_plot.to_dict(),
        "chapters": [
            {
                "number": c.chapter_number,
                "title": c.title,
                "content": c.content,
                "word_count": c.word_count,
                "generation_time": c.generation_time_seconds,
                "provider": c.provider_used
            }
            for c in chapters
        ],
        "metrics": {
            "total_chapters": len(chapters),
            "total_words": total_words,
            "pipeline_time_seconds": round(pipeline_elapsed, 2),
            "avg_words_per_chapter": round(total_words / max(len(chapters), 1)),
            "provider": chapter_gen.provider,
            "plot_score": final_plot.score,
            "workers_used": chapter_gen.max_workers,
        }
    }

    logger.info(f"PIPELINE COMPLETO em {pipeline_elapsed:.1f}s | {total_words:,} palavras | {len(chapters)} capítulos")
    return result


# ===== VERIFICAÇÃO DE IMPORTAÇÃO =====

if __name__ == "__main__":
    print("=== Plot Engine — Teste de Importação ===")
    print(f"Provider detectado: {get_available_provider()}")

    # Teste rápido do pipeline
    loop = PlotImprovementLoop()
    print(f"PlotImprovementLoop: OK (provider={loop.provider})")

    gen = ParallelChapterGenerator()
    print(f"ParallelChapterGenerator: OK (workers={gen.max_workers})")

    # Teste de geração de opções via template
    options = loop.generate_plot_options(
        title="Teste de Enredo",
        genre="Ficção",
        topic="Aventura",
        description="Um teste básico do motor de enredo",
        num_options=2
    )
    print(f"Opções geradas: {len(options)}")

    best = loop.evaluate_and_select(options)
    print(f"Melhor opção: #{best.option_id} '{best.title}' (score: {best.score:.1f})")

    refined = loop.refine_plot(best, best.improvement_suggestions)
    print(f"Enredo refinado: '{refined.title}' ({len(refined.chapter_summaries)} capítulos)")

    print("\n=== Todos os testes passaram ===")
