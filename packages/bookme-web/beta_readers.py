"""
Beta Readers AI - Sistema de Leitores Beta com IA
Três personas distintas que revisam capítulos e livros completos,
fornecendo feedback consolidado com scores e recomendações.
"""

import re
import json
import math
from typing import List, Dict, Any, Optional
from collections import Counter

try:
    from god_mode import call_llm
    HAS_LLM = True
except ImportError:
    HAS_LLM = False
    def call_llm(prompt, system="", max_tokens=2000, provider=None):
        return None


# ===== CONFIGURAÇÃO DAS PERSONAS =====

PERSONAS = {
    "super_reader": {
        "nome": "SuperReader",
        "titulo": "Leitor Apaixonado",
        "foco": "Engajamento emocional, ritmo, qualidade de 'virar páginas'",
        "personalidade": (
            "Você é um leitor voraz e apaixonado por livros. Lê mais de 100 livros por ano "
            "e sabe reconhecer quando uma história prende de verdade. Você se emociona facilmente "
            "com boas narrativas e fica genuinamente frustrado quando uma história desperdiça seu potencial. "
            "Avalia com o coração, mas tem critério refinado pelo volume de leitura."
        ),
        "criterios": [
            "gancho_inicial",
            "ressonancia_emocional",
            "ritmo_narrativo",
            "vontade_de_continuar",
            "conexao_personagens",
        ],
        "criterios_desc": {
            "gancho_inicial": "Força do gancho - O capítulo prende desde o início?",
            "ressonancia_emocional": "Ressonância emocional - O texto provoca sentimentos reais?",
            "ritmo_narrativo": "Ritmo narrativo - A história flui bem, sem arrastar?",
            "vontade_de_continuar": "Desejo de continuar - Você viraria a página?",
            "conexao_personagens": "Conexão com personagens - Os personagens são cativantes?",
        },
        "tom": "entusiasmado mas honesto",
    },
    "harsh_critic": {
        "nome": "HarshCritic",
        "titulo": "Crítico Literário",
        "foco": "Buracos no enredo, inconsistências, clichês, prosa fraca",
        "personalidade": (
            "Você é um crítico literário extremamente exigente com décadas de experiência. "
            "Já resenhou centenas de obras e não tolera mediocridade. Identifica problemas "
            "estruturais, furos de enredo, clichês disfarçados e prosa preguiçosa com precisão cirúrgica. "
            "Não é cruel por prazer, mas acredita que só feedback honesto e duro melhora a escrita. "
            "Sempre aponta o problema E sugere como corrigir."
        ),
        "criterios": [
            "originalidade",
            "qualidade_prosa",
            "integridade_estrutural",
            "consistencia_interna",
            "profundidade_tematica",
        ],
        "criterios_desc": {
            "originalidade": "Originalidade - O texto traz algo novo ou recicla fórmulas?",
            "qualidade_prosa": "Qualidade da prosa - A escrita é precisa, elegante, com voz própria?",
            "integridade_estrutural": "Integridade estrutural - A construção do capítulo funciona?",
            "consistencia_interna": "Consistência interna - Há contradições ou furos lógicos?",
            "profundidade_tematica": "Profundidade temática - O texto vai além da superfície?",
        },
        "tom": "direto, exigente, construtivo",
    },
    "casual_reader": {
        "nome": "CasualReader",
        "titulo": "Leitor Casual",
        "foco": "Clareza, valor de entretenimento, acessibilidade",
        "personalidade": (
            "Você é um leitor casual que lê por prazer nas horas vagas. Não tem formação literária "
            "e não se importa com técnicas sofisticadas - quer apenas uma história que faça sentido, "
            "seja divertida e fácil de acompanhar. Quando se confunde ou se entedia, para de ler. "
            "Representa o leitor médio que compra livros por recomendação ou capa interessante."
        ),
        "criterios": [
            "facilidade_leitura",
            "entretenimento",
            "clareza",
            "pontos_confusos",
            "pontos_entediantes",
        ],
        "criterios_desc": {
            "facilidade_leitura": "Facilidade de leitura - O texto flui naturalmente?",
            "entretenimento": "Valor de entretenimento - É divertido/interessante de ler?",
            "clareza": "Clareza - Tudo faz sentido sem precisar reler?",
            "pontos_confusos": "Ausência de confusão - Não há trechos que confundem?",
            "pontos_entediantes": "Ausência de tédio - Não há partes que dá vontade de pular?",
        },
        "tom": "informal, sincero, sem rodeios",
    },
}


# ===== ANÁLISE TEMPLATE (FALLBACK SEM LLM) =====

class TemplateAnalyzer:
    """Análise baseada em heurísticas quando não há LLM disponível."""

    @staticmethod
    def analyze_text(text: str) -> Dict[str, Any]:
        """Análise completa de métricas textuais."""
        if not text or not text.strip():
            return TemplateAnalyzer._empty_metrics()

        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

        word_count = len(words)
        sentence_count = max(len(sentences), 1)
        paragraph_count = max(len(paragraphs), 1)

        # Comprimento médio de sentenças
        avg_sentence_length = word_count / sentence_count

        # Comprimento médio de parágrafos (em sentenças)
        sentences_per_paragraph = sentence_count / paragraph_count

        # Variação de comprimento de sentenças
        sentence_lengths = [len(s.split()) for s in sentences]
        if len(sentence_lengths) > 1:
            mean_len = sum(sentence_lengths) / len(sentence_lengths)
            variance = sum((l - mean_len) ** 2 for l in sentence_lengths) / len(sentence_lengths)
            sentence_variety = min(math.sqrt(variance) / max(mean_len, 1), 1.0)
        else:
            sentence_variety = 0.0

        # Porcentagem de diálogo
        dialogue_lines = re.findall(r'["""\u201c\u201d].*?["""\u201c\u201d]|—\s*.*?(?:\n|$)', text)
        dialogue_words = sum(len(d.split()) for d in dialogue_lines)
        dialogue_ratio = dialogue_words / max(word_count, 1)

        # Taxa de repetição (palavras repetidas excessivamente)
        word_freq = Counter(w.lower().strip('.,!?;:"""\u201c\u201d') for w in words)
        stopwords_pt = {
            'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da',
            'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com',
            'sem', 'sob', 'sobre', 'e', 'ou', 'mas', 'que', 'se', 'não', 'é',
            'foi', 'era', 'ser', 'ter', 'como', 'mais', 'muito', 'seu', 'sua',
            'ele', 'ela', 'eles', 'elas', 'isso', 'isto', 'esse', 'essa',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
            'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be',
            'has', 'had', 'have', 'he', 'she', 'it', 'they', 'we', 'you',
            'that', 'this', 'not', 'from', 'his', 'her', 'its', 'my',
        }
        content_words = {w: c for w, c in word_freq.items()
                         if w not in stopwords_pt and len(w) > 3}
        if content_words:
            total_content = sum(content_words.values())
            max_freq = max(content_words.values())
            repetition_rate = max_freq / max(total_content, 1)
        else:
            repetition_rate = 0.0

        # Diversidade vocabular (type-token ratio)
        unique_words = len(set(w.lower() for w in words))
        vocab_diversity = unique_words / max(word_count, 1)

        # Palavras por parágrafo
        avg_paragraph_words = word_count / paragraph_count

        # Detecção de adjetivos excessivos (heurística simples)
        adverb_patterns = re.findall(r'\b\w+mente\b', text, re.IGNORECASE)
        adverb_rate = len(adverb_patterns) / max(sentence_count, 1)

        return {
            "word_count": word_count,
            "sentence_count": sentence_count,
            "paragraph_count": paragraph_count,
            "avg_sentence_length": round(avg_sentence_length, 1),
            "sentences_per_paragraph": round(sentences_per_paragraph, 1),
            "sentence_variety": round(sentence_variety, 3),
            "dialogue_ratio": round(dialogue_ratio, 3),
            "repetition_rate": round(repetition_rate, 3),
            "vocab_diversity": round(vocab_diversity, 3),
            "avg_paragraph_words": round(avg_paragraph_words, 1),
            "adverb_rate": round(adverb_rate, 3),
        }

    @staticmethod
    def _empty_metrics() -> Dict[str, Any]:
        return {
            "word_count": 0, "sentence_count": 0, "paragraph_count": 0,
            "avg_sentence_length": 0, "sentences_per_paragraph": 0,
            "sentence_variety": 0, "dialogue_ratio": 0, "repetition_rate": 0,
            "vocab_diversity": 0, "avg_paragraph_words": 0, "adverb_rate": 0,
        }

    @staticmethod
    def score_from_metrics(metrics: Dict[str, Any], persona_key: str) -> Dict[str, Any]:
        """Gera score e feedback baseado em métricas para cada persona."""
        score = 5.0  # Base
        strengths = []
        issues = []
        feedback_parts = []

        wc = metrics["word_count"]
        asl = metrics["avg_sentence_length"]
        sv = metrics["sentence_variety"]
        dr = metrics["dialogue_ratio"]
        rr = metrics["repetition_rate"]
        vd = metrics["vocab_diversity"]
        apw = metrics["avg_paragraph_words"]
        ar = metrics["adverb_rate"]

        # ---- Regras comuns ----
        if wc < 500:
            score -= 1.5
            issues.append("Capítulo muito curto — pode deixar o leitor insatisfeito")
        elif wc > 2000:
            score += 0.5
            strengths.append("Capítulo com bom volume de conteúdo")

        if rr > 0.15:
            score -= 1.0
            issues.append(f"Repetição excessiva de palavras (taxa: {rr:.1%})")
        elif rr < 0.05:
            score += 0.5
            strengths.append("Boa variedade lexical, sem repetições notáveis")

        # ---- SuperReader: foco em engajamento ----
        if persona_key == "super_reader":
            if sv > 0.4:
                score += 1.0
                strengths.append("Ritmo variado e dinâmico — mantém a leitura interessante")
            elif sv < 0.15:
                score -= 1.0
                issues.append("Sentenças com comprimento muito uniforme — ritmo monótono")

            if dr > 0.2:
                score += 0.8
                strengths.append("Boa proporção de diálogo — dá vida aos personagens")
            elif dr < 0.05 and wc > 1000:
                score -= 0.5
                issues.append("Pouco diálogo — o texto pode parecer denso demais")

            if asl < 20:
                score += 0.3
                strengths.append("Sentenças concisas que mantêm o leitor engajado")
            elif asl > 35:
                score -= 0.8
                issues.append("Sentenças longas demais — dificulta manter o ritmo")

            feedback_parts.append(
                f"Como leitor apaixonado, analisei {wc} palavras deste capítulo. "
                f"O ritmo {'me prendeu' if sv > 0.3 else 'poderia ser mais dinâmico'}. "
                f"{'Os diálogos dão vida à narrativa.' if dr > 0.15 else 'Senti falta de mais diálogos para quebrar a densidade.'}"
            )

        # ---- HarshCritic: foco em qualidade técnica ----
        elif persona_key == "harsh_critic":
            if vd < 0.3:
                score -= 1.5
                issues.append(f"Vocabulário limitado (diversidade: {vd:.1%}) — prosa preguiçosa")
            elif vd > 0.5:
                score += 1.0
                strengths.append("Vocabulário rico e diversificado")

            if ar > 0.5:
                score -= 1.0
                issues.append(f"Excesso de advérbios em -mente ({ar:.2f}/sentença) — enfraquece a prosa")
            elif ar < 0.1:
                score += 0.5
                strengths.append("Uso contido de advérbios — boa prática de escrita")

            if asl > 30 and sv < 0.2:
                score -= 1.0
                issues.append("Parágrafos longos com sentenças uniformes — estrutura pesada")

            if apw > 200:
                score -= 0.5
                issues.append("Parágrafos excessivamente longos — quebrar em blocos menores")

            feedback_parts.append(
                f"Análise técnica de {wc} palavras. "
                f"Diversidade vocabular: {vd:.1%} ({'aceitável' if vd > 0.4 else 'insuficiente'}). "
                f"Estrutura sentencial {'variada' if sv > 0.3 else 'monótona'} com média de {asl:.0f} palavras/sentença. "
                f"{'Advérbios dentro do aceitável.' if ar < 0.3 else 'Corte os advérbios desnecessários.'}"
            )

        # ---- CasualReader: foco em acessibilidade ----
        elif persona_key == "casual_reader":
            if asl > 25:
                score -= 1.2
                issues.append("Frases longas demais — perdi o fio da meada várias vezes")
            elif asl < 18:
                score += 0.8
                strengths.append("Fácil de ler — as frases fluem naturalmente")

            if apw > 150:
                score -= 0.8
                issues.append("Parágrafos enormes — dá preguiça de ler")
            elif apw < 80:
                score += 0.5
                strengths.append("Parágrafos no tamanho certo — confortável de ler")

            if dr > 0.25:
                score += 0.5
                strengths.append("Bastante diálogo — faz a leitura render rápido")

            if vd > 0.55:
                score -= 0.3
                issues.append("Algumas palavras difíceis — tive que reler uns trechos")

            feedback_parts.append(
                f"Li as {wc} palavras e {'foi tranquilo' if asl < 20 else 'achei meio pesado'}. "
                f"{'Entendi tudo de primeira.' if asl < 22 else 'Algumas partes tive que reler.'} "
                f"{'Bastante diálogo, o que ajuda.' if dr > 0.2 else 'Poderia ter mais conversa entre os personagens.'}"
            )

        # Limitar score entre 1 e 10
        score = max(1.0, min(10.0, round(score, 1)))

        # Garantir pelo menos um item em cada lista
        if not strengths:
            strengths.append("Texto adequado para leitura sem problemas graves")
        if not issues:
            issues.append("Sem problemas significativos detectados nesta análise")

        return {
            "score": score,
            "strengths": strengths,
            "issues": issues,
            "specific_feedback": " ".join(feedback_parts),
            "metrics": metrics,
        }


# ===== LEITORES BETA INDIVIDUAIS =====

class BetaReader:
    """Um leitor beta individual com persona definida."""

    def __init__(self, persona_key: str):
        if persona_key not in PERSONAS:
            raise ValueError(f"Persona desconhecida: {persona_key}. Opções: {list(PERSONAS.keys())}")
        self.key = persona_key
        self.config = PERSONAS[persona_key]
        self.analyzer = TemplateAnalyzer()

    @property
    def nome(self) -> str:
        return self.config["nome"]

    @property
    def titulo(self) -> str:
        return self.config["titulo"]

    def review_chapter(
        self,
        chapter_text: str,
        chapter_title: str = "",
        genre: str = "",
        chapter_number: int = 1,
        story_bible_context: str = "",
    ) -> Dict[str, Any]:
        """Revisa um capítulo e retorna feedback estruturado."""

        # Tentar com LLM primeiro
        if HAS_LLM:
            llm_result = self._review_with_llm(
                chapter_text, chapter_title, genre, chapter_number, story_bible_context
            )
            if llm_result is not None:
                return llm_result

        # Fallback: análise por template
        return self._review_with_template(chapter_text, chapter_title, chapter_number)

    def _build_review_prompt(
        self,
        chapter_text: str,
        chapter_title: str,
        genre: str,
        chapter_number: int,
        story_bible_context: str,
    ) -> tuple:
        """Constrói system prompt e user prompt para a review."""

        criterios_text = "\n".join(
            f"  - {desc}" for desc in self.config["criterios_desc"].values()
        )

        system = (
            f"Você é {self.config['nome']} ({self.config['titulo']}). "
            f"{self.config['personalidade']}\n\n"
            f"Seu tom é: {self.config['tom']}.\n"
            f"Seus critérios de avaliação:\n{criterios_text}\n\n"
            f"FORMATO DE RESPOSTA OBRIGATÓRIO (JSON válido):\n"
            f'{{\n'
            f'  "score": <número de 1 a 10>,\n'
            f'  "strengths": ["ponto forte 1", "ponto forte 2", ...],\n'
            f'  "issues": ["problema 1", "problema 2", ...],\n'
            f'  "specific_feedback": "seu feedback detalhado em texto corrido",\n'
            f'  "criteria_scores": {{\n'
            f'    "<criterio>": <score 1-10>,\n'
            f'    ...\n'
            f'  }}\n'
            f'}}\n\n'
            f"Responda APENAS com o JSON, sem texto adicional."
        )

        context_section = ""
        if story_bible_context:
            context_section = f"\n\nCONTEXTO DA HISTÓRIA (Bíblia da história):\n{story_bible_context}\n"

        genre_section = f"\nGÊNERO: {genre}" if genre else ""
        title_section = f"\nTÍTULO: {chapter_title}" if chapter_title else ""

        prompt = (
            f"Revise o capítulo {chapter_number} a seguir como {self.config['titulo']}."
            f"{title_section}{genre_section}{context_section}\n\n"
            f"TEXTO DO CAPÍTULO:\n\n{chapter_text[:12000]}"
        )

        return system, prompt

    def _review_with_llm(
        self,
        chapter_text: str,
        chapter_title: str,
        genre: str,
        chapter_number: int,
        story_bible_context: str,
    ) -> Optional[Dict[str, Any]]:
        """Tenta review via LLM. Retorna None se falhar."""
        system, prompt = self._build_review_prompt(
            chapter_text, chapter_title, genre, chapter_number, story_bible_context
        )

        try:
            raw = call_llm(prompt, system=system, max_tokens=2000)
            if not raw:
                return None

            # Extrair JSON da resposta
            parsed = self._parse_llm_response(raw)
            if parsed is None:
                return None

            # Validar e normalizar
            return self._normalize_result(parsed)

        except Exception as e:
            print(f"[BetaReader:{self.nome}] Erro LLM: {e}")
            return None

    def _parse_llm_response(self, raw: str) -> Optional[Dict]:
        """Extrai JSON da resposta do LLM."""
        # Tentar parse direto
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Tentar extrair JSON de blocos de código
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Tentar encontrar o primeiro { ... } válido
        brace_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', raw, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        return None

    def _normalize_result(self, parsed: Dict) -> Dict[str, Any]:
        """Normaliza o resultado do LLM para formato padrão."""
        score = parsed.get("score", 5)
        if isinstance(score, str):
            try:
                score = float(score)
            except ValueError:
                score = 5.0
        score = max(1.0, min(10.0, float(score)))

        strengths = parsed.get("strengths", [])
        if isinstance(strengths, str):
            strengths = [strengths]

        issues = parsed.get("issues", [])
        if isinstance(issues, str):
            issues = [issues]

        feedback = parsed.get("specific_feedback", "")
        if not isinstance(feedback, str):
            feedback = str(feedback)

        criteria_scores = parsed.get("criteria_scores", {})

        return {
            "score": round(score, 1),
            "strengths": strengths[:10],
            "issues": issues[:10],
            "specific_feedback": feedback,
            "criteria_scores": criteria_scores,
            "source": "llm",
        }

    def _review_with_template(
        self, chapter_text: str, chapter_title: str, chapter_number: int
    ) -> Dict[str, Any]:
        """Review por análise de métricas (fallback sem LLM)."""
        metrics = self.analyzer.analyze_text(chapter_text)
        result = self.analyzer.score_from_metrics(metrics, self.key)
        result["reader"] = self.nome
        result["reader_title"] = self.titulo
        result["chapter_number"] = chapter_number
        result["chapter_title"] = chapter_title
        result["source"] = "template"
        return result


# ===== PAINEL DE LEITORES BETA =====

class BetaReaderPanel:
    """
    Painel consolidado com 3 leitores beta AI.
    Orquestra reviews individuais e consolida feedback.
    """

    def __init__(self):
        self.readers = {
            "super_reader": BetaReader("super_reader"),
            "harsh_critic": BetaReader("harsh_critic"),
            "casual_reader": BetaReader("casual_reader"),
        }

    def review_chapter(
        self,
        chapter_text: str,
        chapter_title: str = "",
        genre: str = "",
        chapter_number: int = 1,
        story_bible_context: str = "",
    ) -> Dict[str, Any]:
        """
        Revisa um capítulo com todos os 3 leitores beta.
        Retorna feedback consolidado com scores e recomendações.
        """
        reviews = {}
        for key, reader in self.readers.items():
            review = reader.review_chapter(
                chapter_text=chapter_text,
                chapter_title=chapter_title,
                genre=genre,
                chapter_number=chapter_number,
                story_bible_context=story_bible_context,
            )
            review["reader"] = reader.nome
            review["reader_title"] = reader.titulo
            reviews[key] = review

        # Consolidar resultados
        consolidated = self._consolidate_reviews(reviews, chapter_title, chapter_number)
        return consolidated

    def review_book(self, chapters_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Revisa um livro inteiro (lista de capítulos).
        Cada item: {"text": str, "title": str, "number": int}
        Opcionais: "genre", "story_bible_context"
        
        Retorna análise por capítulo + visão geral do livro.
        """
        if not chapters_list:
            return {
                "book_score": 0,
                "chapter_reviews": [],
                "book_summary": "Nenhum capítulo fornecido para análise.",
                "flow_analysis": {},
                "priority_fixes": [],
            }

        chapter_reviews = []
        all_scores = []
        all_issues = []
        all_strengths = []

        genre = chapters_list[0].get("genre", "")
        bible = chapters_list[0].get("story_bible_context", "")

        for ch in chapters_list:
            review = self.review_chapter(
                chapter_text=ch.get("text", ""),
                chapter_title=ch.get("title", f"Capítulo {ch.get('number', '?')}"),
                genre=ch.get("genre", genre),
                chapter_number=ch.get("number", 1),
                story_bible_context=ch.get("story_bible_context", bible),
            )
            chapter_reviews.append(review)
            all_scores.append(review["average_score"])
            all_issues.extend(review.get("consensus_issues", []))
            all_strengths.extend(review.get("consensus_strengths", []))

        # Score geral do livro
        book_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

        # Análise de fluxo (tendência dos scores)
        flow_analysis = self._analyze_flow(all_scores)

        # Issues mais frequentes no livro todo
        issue_counter = Counter(all_issues)
        recurring_issues = [
            {"issue": issue, "occurrences": count}
            for issue, count in issue_counter.most_common(10)
            if count >= 2
        ]

        # Pontos fortes consistentes
        strength_counter = Counter(all_strengths)
        consistent_strengths = [
            s for s, c in strength_counter.most_common(5) if c >= 2
        ]

        # Fixes prioritários para o livro
        priority_fixes = self._generate_book_priority_fixes(
            chapter_reviews, recurring_issues, flow_analysis
        )

        # Sumário do livro
        book_summary = self._generate_book_summary(
            book_score, len(chapters_list), recurring_issues,
            consistent_strengths, flow_analysis
        )

        return {
            "book_score": book_score,
            "total_chapters": len(chapters_list),
            "chapter_reviews": chapter_reviews,
            "book_summary": book_summary,
            "flow_analysis": flow_analysis,
            "recurring_issues": recurring_issues,
            "consistent_strengths": consistent_strengths,
            "priority_fixes": priority_fixes,
        }

    def _consolidate_reviews(
        self, reviews: Dict[str, Dict], chapter_title: str, chapter_number: int
    ) -> Dict[str, Any]:
        """Consolida as 3 reviews em um resultado unificado."""
        scores = []
        all_strengths = []
        all_issues = []

        for key, review in reviews.items():
            scores.append(review.get("score", 5))
            all_strengths.extend(review.get("strengths", []))
            all_issues.extend(review.get("issues", []))

        average_score = round(sum(scores) / len(scores), 1) if scores else 0

        # Issues de consenso (encontradas por 2+ leitores)
        issue_counter = Counter(all_issues)
        consensus_issues = [
            issue for issue, count in issue_counter.items() if count >= 2
        ]

        # Strengths de consenso
        strength_counter = Counter(all_strengths)
        consensus_strengths = [
            s for s, c in strength_counter.items() if c >= 2
        ]

        # Fixes prioritários
        priority_fixes = self._generate_priority_fixes(reviews, consensus_issues)

        # Classificação geral
        if average_score >= 8:
            verdict = "EXCELENTE"
            verdict_desc = "Capítulo forte — pronto para publicação com ajustes menores."
        elif average_score >= 6:
            verdict = "BOM"
            verdict_desc = "Capítulo sólido — necessita revisão em pontos específicos."
        elif average_score >= 4:
            verdict = "REGULAR"
            verdict_desc = "Capítulo com potencial — requer reescrita significativa."
        else:
            verdict = "FRACO"
            verdict_desc = "Capítulo precisa de reformulação substancial."

        return {
            "chapter_number": chapter_number,
            "chapter_title": chapter_title,
            "average_score": average_score,
            "verdict": verdict,
            "verdict_description": verdict_desc,
            "individual_reviews": reviews,
            "consensus_issues": consensus_issues,
            "consensus_strengths": consensus_strengths,
            "all_issues": all_issues,
            "all_strengths": all_strengths,
            "priority_fixes": priority_fixes,
            "score_breakdown": {
                reader.nome: reviews[key].get("score", 0)
                for key, reader in self.readers.items()
            },
        }

    def _generate_priority_fixes(
        self, reviews: Dict[str, Dict], consensus_issues: List[str]
    ) -> List[Dict[str, str]]:
        """Gera lista de correções prioritárias ordenadas por impacto."""
        fixes = []

        # Consensus issues são prioridade máxima
        for issue in consensus_issues:
            fixes.append({
                "priority": "ALTA",
                "issue": issue,
                "reason": "Identificado por múltiplos leitores",
            })

        # Issues do HarshCritic que não são consenso (prioridade média)
        harsh_review = reviews.get("harsh_critic", {})
        for issue in harsh_review.get("issues", []):
            if issue not in consensus_issues:
                fixes.append({
                    "priority": "MÉDIA",
                    "issue": issue,
                    "reason": f"Identificado pelo {PERSONAS['harsh_critic']['titulo']}",
                })

        # Issues do CasualReader que não são consenso (acessibilidade)
        casual_review = reviews.get("casual_reader", {})
        for issue in casual_review.get("issues", []):
            if issue not in consensus_issues and issue not in [f["issue"] for f in fixes]:
                fixes.append({
                    "priority": "BAIXA",
                    "issue": issue,
                    "reason": f"Acessibilidade — identificado pelo {PERSONAS['casual_reader']['titulo']}",
                })

        return fixes[:15]  # Limitar a 15 fixes

    def _analyze_flow(self, scores: List[float]) -> Dict[str, Any]:
        """Analisa o fluxo de qualidade ao longo dos capítulos."""
        if len(scores) < 2:
            return {
                "trend": "insuficiente",
                "description": "Poucos capítulos para análise de tendência.",
                "weakest_chapter": 1 if scores else 0,
                "strongest_chapter": 1 if scores else 0,
            }

        # Tendência (subindo, descendo, estável)
        first_half = scores[:len(scores)//2]
        second_half = scores[len(scores)//2:]
        avg_first = sum(first_half) / len(first_half)
        avg_second = sum(second_half) / len(second_half)
        diff = avg_second - avg_first

        if diff > 0.5:
            trend = "ascendente"
            desc = "A qualidade melhora ao longo do livro — bom sinal de desenvolvimento."
        elif diff < -0.5:
            trend = "descendente"
            desc = "A qualidade cai na segunda metade — revise os capítulos finais com atenção."
        else:
            trend = "estável"
            desc = "Qualidade consistente ao longo do livro."

        weakest = scores.index(min(scores)) + 1
        strongest = scores.index(max(scores)) + 1

        # Detectar quedas bruscas
        drops = []
        for i in range(1, len(scores)):
            if scores[i] < scores[i-1] - 2.0:
                drops.append({
                    "from_chapter": i,
                    "to_chapter": i + 1,
                    "score_drop": round(scores[i-1] - scores[i], 1),
                })

        return {
            "trend": trend,
            "description": desc,
            "weakest_chapter": weakest,
            "strongest_chapter": strongest,
            "score_range": {
                "min": round(min(scores), 1),
                "max": round(max(scores), 1),
            },
            "sudden_drops": drops,
        }

    def _generate_book_priority_fixes(
        self,
        chapter_reviews: List[Dict],
        recurring_issues: List[Dict],
        flow_analysis: Dict,
    ) -> List[Dict[str, str]]:
        """Gera fixes prioritários para o livro inteiro."""
        fixes = []

        # Issues recorrentes são prioridade máxima
        for item in recurring_issues[:5]:
            fixes.append({
                "priority": "CRÍTICA",
                "issue": item["issue"],
                "reason": f"Aparece em {item['occurrences']} capítulos",
                "action": "Revisar e corrigir em todos os capítulos afetados",
            })

        # Capítulo mais fraco
        if flow_analysis.get("weakest_chapter"):
            fixes.append({
                "priority": "ALTA",
                "issue": f"Capítulo {flow_analysis['weakest_chapter']} é o mais fraco do livro",
                "reason": "Score mais baixo entre todos os capítulos",
                "action": "Reescrever ou reestruturar este capítulo",
            })

        # Quedas bruscas
        for drop in flow_analysis.get("sudden_drops", []):
            fixes.append({
                "priority": "ALTA",
                "issue": f"Queda brusca de qualidade do capítulo {drop['from_chapter']} para {drop['to_chapter']}",
                "reason": f"Score caiu {drop['score_drop']} pontos",
                "action": "Revisar transição e qualidade do capítulo posterior",
            })

        # Tendência descendente
        if flow_analysis.get("trend") == "descendente":
            fixes.append({
                "priority": "MÉDIA",
                "issue": "Qualidade geral cai na segunda metade do livro",
                "reason": "Tendência descendente detectada",
                "action": "Dar atenção especial à revisão dos capítulos finais",
            })

        return fixes[:10]

    def _generate_book_summary(
        self,
        book_score: float,
        total_chapters: int,
        recurring_issues: List[Dict],
        consistent_strengths: List[str],
        flow_analysis: Dict,
    ) -> str:
        """Gera sumário textual da análise do livro."""
        parts = []

        # Veredicto geral
        if book_score >= 8:
            parts.append(
                f"Livro excelente com score médio de {book_score}/10 "
                f"em {total_chapters} capítulos analisados. "
                f"Pronto para publicação com ajustes pontuais."
            )
        elif book_score >= 6:
            parts.append(
                f"Livro sólido com score médio de {book_score}/10 "
                f"em {total_chapters} capítulos. "
                f"Necessita revisão focada nos pontos identificados."
            )
        elif book_score >= 4:
            parts.append(
                f"Livro com potencial mas que precisa de trabalho significativo. "
                f"Score médio: {book_score}/10 em {total_chapters} capítulos."
            )
        else:
            parts.append(
                f"Livro precisa de reformulação substancial. "
                f"Score médio: {book_score}/10 em {total_chapters} capítulos."
            )

        # Tendência
        if flow_analysis.get("description"):
            parts.append(flow_analysis["description"])

        # Issues recorrentes
        if recurring_issues:
            issue_list = ", ".join(item["issue"] for item in recurring_issues[:3])
            parts.append(f"Problemas recorrentes: {issue_list}.")

        # Pontos fortes
        if consistent_strengths:
            strength_list = ", ".join(consistent_strengths[:3])
            parts.append(f"Pontos fortes consistentes: {strength_list}.")

        return " ".join(parts)

    def get_readers_info(self) -> List[Dict[str, str]]:
        """Retorna informações sobre os leitores do painel."""
        return [
            {
                "key": key,
                "nome": reader.nome,
                "titulo": reader.titulo,
                "foco": reader.config["foco"],
                "tom": reader.config["tom"],
            }
            for key, reader in self.readers.items()
        ]


# ===== FUNÇÕES UTILITÁRIAS =====

def quick_review(chapter_text: str, genre: str = "", title: str = "") -> Dict[str, Any]:
    """Atalho para review rápida de um capítulo."""
    panel = BetaReaderPanel()
    return panel.review_chapter(
        chapter_text=chapter_text,
        chapter_title=title,
        genre=genre,
    )


def get_reader_names() -> List[str]:
    """Retorna nomes dos leitores disponíveis."""
    return [p["nome"] for p in PERSONAS.values()]


def single_reader_review(
    reader_key: str,
    chapter_text: str,
    chapter_title: str = "",
    genre: str = "",
    chapter_number: int = 1,
) -> Dict[str, Any]:
    """Review com um único leitor específico."""
    reader = BetaReader(reader_key)
    return reader.review_chapter(
        chapter_text=chapter_text,
        chapter_title=chapter_title,
        genre=genre,
        chapter_number=chapter_number,
    )


# ===== MÓDULO INFO =====

__version__ = "1.0.0"
__author__ = "BookMe AI"
__description__ = "Sistema de Leitores Beta com IA — 3 personas para feedback consolidado"

if __name__ == "__main__":
    # Teste rápido
    sample = (
        "O vento cortava como navalha quando Maria abriu a porta do sótão. "
        "Há vinte anos não subia ali. Vinte anos desde que encontrou o diário. "
        "Seus dedos tremiam — não pelo frio, mas pela memória do que havia lido "
        "naquelas páginas amareladas. 'Não devia ter voltado', sussurrou para si mesma, "
        "mas seus pés já a levavam escada acima, como se tivessem vontade própria.\n\n"
        "O sótão estava exatamente como na sua lembrança. Caixas empilhadas, móveis cobertos "
        "por lençóis brancos que pareciam fantasmas vigilantes. E lá, no canto mais escuro, "
        "a escrivaninha de mogno do avô. Maria aproximou-se devagar, o coração martelando "
        "no peito. A gaveta estava entreaberta — alguém estivera ali antes dela."
    )
    panel = BetaReaderPanel()
    result = panel.review_chapter(sample, "O Diário do Sótão", "suspense", 1)
    print(f"\nScore médio: {result['average_score']}/10")
    print(f"Veredicto: {result['verdict']} — {result['verdict_description']}")
    print(f"\nIssues de consenso: {result['consensus_issues']}")
    print(f"Fixes prioritários: {len(result['priority_fixes'])}")
    for fix in result['priority_fixes'][:3]:
        print(f"  [{fix['priority']}] {fix['issue']}")
