"""
epub_export.py - EPUB Export + Deep Revision System for BookMe AI
Exportação EPUB e sistema de revisão profunda em 3 passes.

Gera arquivos EPUB 2.0 válidos usando apenas zipfile (sem dependências externas).
Sistema de revisão inspirado no AuthorClaw com análise estrutural, cênica e linear.
"""

import io
import re
import uuid
import zipfile
import html
import math
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter


# =============================================================================
# EPUB EXPORTER
# =============================================================================

class EPUBExporter:
    """
    Gera arquivos EPUB 2.0 válidos a partir de capítulos de livro.
    
    Estrutura EPUB:
        mimetype
        META-INF/container.xml
        OEBPS/
            content.opf
            toc.ncx
            chapter1.xhtml ... chapterN.xhtml
            styles.css
    """

    DEFAULT_CSS = """
body {
    font-family: Georgia, "Times New Roman", serif;
    margin: 5%;
    text-align: justify;
    line-height: 1.6;
    color: #222;
}

h1 {
    font-size: 1.8em;
    text-align: center;
    margin-top: 2em;
    margin-bottom: 1em;
    color: #333;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.3em;
}

h2 {
    font-size: 1.4em;
    margin-top: 1.5em;
    margin-bottom: 0.8em;
    color: #444;
}

h3 {
    font-size: 1.2em;
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    color: #555;
}

p {
    margin-bottom: 0.8em;
    text-indent: 1.5em;
}

p:first-of-type {
    text-indent: 0;
}

blockquote {
    margin: 1em 2em;
    padding-left: 1em;
    border-left: 3px solid #ccc;
    font-style: italic;
    color: #555;
}

em {
    font-style: italic;
}

strong {
    font-weight: bold;
}

.chapter-title {
    text-align: center;
    font-size: 1.6em;
    margin-top: 3em;
    margin-bottom: 2em;
    page-break-before: always;
}

.separator {
    text-align: center;
    margin: 2em 0;
    color: #999;
}
"""

    CONTAINER_XML = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"""

    def __init__(self):
        """Inicializa o exportador EPUB."""
        self.book_uid = str(uuid.uuid4())

    def _escape_xml(self, text: str) -> str:
        """Escapa caracteres especiais para XML/HTML."""
        return html.escape(text, quote=True)

    def _markdown_to_html(self, text: str) -> str:
        """
        Converte markdown básico para HTML.
        Suporta: headers (## e ###), negrito, itálico, separadores, parágrafos.
        """
        lines = text.split("\n")
        html_lines = []
        in_paragraph = False

        for line in lines:
            stripped = line.strip()

            # Linha vazia - fecha parágrafo
            if not stripped:
                if in_paragraph:
                    html_lines.append("</p>")
                    in_paragraph = False
                continue

            # Headers
            if stripped.startswith("### "):
                if in_paragraph:
                    html_lines.append("</p>")
                    in_paragraph = False
                header_text = self._escape_xml(stripped[4:])
                html_lines.append(f"<h3>{header_text}</h3>")
                continue

            if stripped.startswith("## "):
                if in_paragraph:
                    html_lines.append("</p>")
                    in_paragraph = False
                header_text = self._escape_xml(stripped[3:])
                html_lines.append(f"<h2>{header_text}</h2>")
                continue

            if stripped.startswith("# "):
                if in_paragraph:
                    html_lines.append("</p>")
                    in_paragraph = False
                header_text = self._escape_xml(stripped[2:])
                html_lines.append(f"<h1>{header_text}</h1>")
                continue

            # Separadores (--- ou ***)
            if re.match(r'^[-*]{3,}$', stripped):
                if in_paragraph:
                    html_lines.append("</p>")
                    in_paragraph = False
                html_lines.append('<div class="separator">* * *</div>')
                continue

            # Texto normal - escapa e aplica formatação inline
            escaped = self._escape_xml(stripped)
            # Negrito: **text** ou __text__
            escaped = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', escaped)
            escaped = re.sub(r'__(.+?)__', r'<strong>\1</strong>', escaped)
            # Itálico: *text* ou _text_
            escaped = re.sub(r'\*(.+?)\*', r'<em>\1</em>', escaped)
            escaped = re.sub(r'(?<!\w)_(.+?)_(?!\w)', r'<em>\1</em>', escaped)

            if not in_paragraph:
                html_lines.append(f"<p>{escaped}")
                in_paragraph = True
            else:
                html_lines.append(f" {escaped}")

        if in_paragraph:
            html_lines.append("</p>")

        return "\n".join(html_lines)

    def _build_content_opf(
        self,
        title: str,
        author: str,
        chapters: List[Dict],
        genre: str = "",
        description: str = "",
        language: str = "pt-BR"
    ) -> str:
        """Gera o arquivo content.opf (metadados do pacote EPUB)."""
        escaped_title = self._escape_xml(title)
        escaped_author = self._escape_xml(author)
        escaped_desc = self._escape_xml(description) if description else escaped_title
        escaped_genre = self._escape_xml(genre) if genre else "Ficção"
        now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        manifest_items = []
        spine_items = []

        manifest_items.append(
            '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
        )
        manifest_items.append(
            '    <item id="css" href="styles.css" media-type="text/css"/>'
        )

        for ch in chapters:
            ch_id = f"chapter{ch['number']}"
            ch_file = f"chapter{ch['number']}.xhtml"
            manifest_items.append(
                f'    <item id="{ch_id}" href="{ch_file}" media-type="application/xhtml+xml"/>'
            )
            spine_items.append(f'    <itemref idref="{ch_id}"/>')

        manifest_str = "\n".join(manifest_items)
        spine_str = "\n".join(spine_items)

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>{escaped_title}</dc:title>
    <dc:creator opf:role="aut">{escaped_author}</dc:creator>
    <dc:identifier id="BookId">urn:uuid:{self.book_uid}</dc:identifier>
    <dc:language>{language}</dc:language>
    <dc:description>{escaped_desc}</dc:description>
    <dc:subject>{escaped_genre}</dc:subject>
    <dc:date>{now}</dc:date>
    <dc:publisher>BookMe AI</dc:publisher>
    <dc:rights>Todos os direitos reservados</dc:rights>
    <meta name="generator" content="BookMe AI EPUB Exporter"/>
  </metadata>
  <manifest>
{manifest_str}
  </manifest>
  <spine toc="ncx">
{spine_str}
  </spine>
</package>"""

    def _build_toc_ncx(self, title: str, chapters: List[Dict]) -> str:
        """Gera o arquivo toc.ncx (tabela de conteúdo para navegação)."""
        escaped_title = self._escape_xml(title)

        nav_points = []
        for i, ch in enumerate(chapters):
            ch_title = self._escape_xml(ch.get("title", f"Capítulo {ch['number']}"))
            ch_file = f"chapter{ch['number']}.xhtml"
            nav_points.append(f"""    <navPoint id="navPoint-{i+1}" playOrder="{i+1}">
      <navLabel>
        <text>{ch_title}</text>
      </navLabel>
      <content src="{ch_file}"/>
    </navPoint>""")

        nav_str = "\n".join(nav_points)

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:{self.book_uid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>{escaped_title}</text>
  </docTitle>
  <navMap>
{nav_str}
  </navMap>
</ncx>"""

    def _build_chapter_xhtml(self, chapter: Dict) -> str:
        """Gera o arquivo XHTML de um capítulo."""
        ch_number = chapter.get("number", 1)
        ch_title = self._escape_xml(chapter.get("title", f"Capítulo {ch_number}"))
        content = chapter.get("content", "")
        html_content = self._markdown_to_html(content)

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt">
<head>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8"/>
  <title>{ch_title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1 class="chapter-title">Capítulo {ch_number}: {ch_title}</h1>
{html_content}
</body>
</html>"""

    def export_epub(
        self,
        project_title: str,
        author: str,
        chapters: List[Dict],
        genre: str = "",
        description: str = ""
    ) -> bytes:
        """
        Exporta um livro como EPUB 2.0.
        
        Args:
            project_title: Título do livro
            author: Nome do autor
            chapters: Lista de dicts com {number, title, content}
            genre: Gênero literário (opcional)
            description: Descrição do livro (opcional)
            
        Returns:
            bytes: Conteúdo do arquivo EPUB (ZIP)
        """
        if not chapters:
            raise ValueError("É necessário pelo menos um capítulo para gerar o EPUB.")

        if not project_title:
            raise ValueError("O título do projeto é obrigatório.")

        if not author:
            author = "Autor Desconhecido"

        # Gera novo UUID para cada exportação
        self.book_uid = str(uuid.uuid4())

        # Ordena capítulos por número
        sorted_chapters = sorted(chapters, key=lambda c: c.get("number", 0))

        buffer = io.BytesIO()

        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            # mimetype DEVE ser o primeiro arquivo e sem compressão
            zf.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)

            # META-INF/container.xml
            zf.writestr("META-INF/container.xml", self.CONTAINER_XML)

            # OEBPS/content.opf
            content_opf = self._build_content_opf(
                project_title, author, sorted_chapters, genre, description
            )
            zf.writestr("OEBPS/content.opf", content_opf)

            # OEBPS/toc.ncx
            toc_ncx = self._build_toc_ncx(project_title, sorted_chapters)
            zf.writestr("OEBPS/toc.ncx", toc_ncx)

            # OEBPS/styles.css
            zf.writestr("OEBPS/styles.css", self.DEFAULT_CSS)

            # Capítulos XHTML
            for ch in sorted_chapters:
                ch_filename = f"OEBPS/chapter{ch['number']}.xhtml"
                ch_xhtml = self._build_chapter_xhtml(ch)
                zf.writestr(ch_filename, ch_xhtml)

        return buffer.getvalue()

    def export_mobi(
        self,
        project_title: str,
        author: str,
        chapters: List[Dict],
        genre: str = "",
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Stub para exportação MOBI.
        
        MOBI requer o Calibre (ebook-convert) para conversão adequada.
        Retorna o EPUB com nota informativa.
        
        Args:
            project_title: Título do livro
            author: Nome do autor
            chapters: Lista de dicts com {number, title, content}
            genre: Gênero literário (opcional)
            description: Descrição do livro (opcional)
            
        Returns:
            dict com epub_bytes, mensagem e instruções
        """
        epub_bytes = self.export_epub(project_title, author, chapters, genre, description)

        return {
            "format": "epub",
            "bytes": epub_bytes,
            "message": (
                "Exportação MOBI requer o Calibre (ebook-convert) instalado no servidor. "
                "O arquivo EPUB foi gerado e pode ser convertido manualmente com: "
                "ebook-convert livro.epub livro.mobi"
            ),
            "instructions": [
                "1. Baixe o arquivo EPUB gerado",
                "2. Instale o Calibre: https://calibre-ebook.com",
                "3. Execute: ebook-convert livro.epub livro.mobi",
                "4. Ou use o Kindle Previewer da Amazon para conversão",
            ],
            "filename_suggestion": f"{project_title.replace(' ', '_')}.epub",
        }

    def validate_epub_structure(self, epub_bytes: bytes) -> Dict[str, Any]:
        """
        Valida a estrutura básica de um arquivo EPUB.
        
        Args:
            epub_bytes: Bytes do arquivo EPUB
            
        Returns:
            dict com resultado da validação
        """
        issues = []
        info = {"valid": True, "files": [], "chapters": 0}

        try:
            buffer = io.BytesIO(epub_bytes)
            with zipfile.ZipFile(buffer, "r") as zf:
                names = zf.namelist()
                info["files"] = names

                # Verifica mimetype
                if "mimetype" not in names:
                    issues.append("Arquivo 'mimetype' ausente")
                else:
                    mimetype = zf.read("mimetype").decode("utf-8").strip()
                    if mimetype != "application/epub+zip":
                        issues.append(f"Mimetype inválido: {mimetype}")

                # Verifica container.xml
                if "META-INF/container.xml" not in names:
                    issues.append("META-INF/container.xml ausente")

                # Verifica content.opf
                if "OEBPS/content.opf" not in names:
                    issues.append("OEBPS/content.opf ausente")

                # Verifica toc.ncx
                if "OEBPS/toc.ncx" not in names:
                    issues.append("OEBPS/toc.ncx ausente")

                # Verifica styles.css
                if "OEBPS/styles.css" not in names:
                    issues.append("OEBPS/styles.css ausente")

                # Conta capítulos
                chapter_files = [n for n in names if re.match(r"OEBPS/chapter\d+\.xhtml", n)]
                info["chapters"] = len(chapter_files)

                if len(chapter_files) == 0:
                    issues.append("Nenhum capítulo encontrado")

        except zipfile.BadZipFile:
            issues.append("Arquivo ZIP inválido")
            info["valid"] = False
        except Exception as e:
            issues.append(f"Erro ao validar: {str(e)}")
            info["valid"] = False

        if issues:
            info["valid"] = False
        info["issues"] = issues

        return info


# =============================================================================
# DEEP REVISION ENGINE
# =============================================================================

# Stopwords em Português para filtragem de palavras repetidas
PT_STOPWORDS = {
    "a", "o", "e", "é", "de", "do", "da", "dos", "das", "em", "no", "na",
    "nos", "nas", "um", "uma", "uns", "umas", "com", "por", "para", "se",
    "que", "não", "mais", "mas", "como", "eu", "ele", "ela", "nós", "eles",
    "elas", "você", "vocês", "seu", "sua", "seus", "suas", "meu", "minha",
    "meus", "minhas", "este", "esta", "estes", "estas", "esse", "essa",
    "esses", "essas", "aquele", "aquela", "aqueles", "aquelas", "isto",
    "isso", "aquilo", "ao", "aos", "à", "às", "pelo", "pela", "pelos",
    "pelas", "num", "numa", "nuns", "numas", "dum", "duma", "duns", "dumas",
    "ou", "já", "também", "muito", "muita", "muitos", "muitas", "pouco",
    "pouca", "poucos", "poucas", "todo", "toda", "todos", "todas", "outro",
    "outra", "outros", "outras", "mesmo", "mesma", "mesmos", "mesmas",
    "qual", "quais", "quando", "onde", "quem", "ter", "ser", "estar",
    "ir", "vir", "fazer", "poder", "dever", "haver", "foi", "era",
    "tem", "está", "há", "são", "têm", "estão", "seria", "tinha",
    "sobre", "entre", "depois", "antes", "sem", "até", "desde", "durante",
    "ainda", "então", "assim", "bem", "só", "já", "nem", "sim",
    "me", "te", "lhe", "nos", "vos", "lhes", "lo", "la", "los", "las",
    "the", "and", "is", "of", "to", "in", "it", "that", "was", "for",
}

# Palavras sensoriais em Português
PT_SENSORY_WORDS = {
    # Visão
    "viu", "olhou", "enxergou", "observou", "avistou", "contemplou",
    "fitou", "mirou", "brilhou", "reluziu", "cintilou", "ofuscou",
    "escureceu", "iluminou", "clareou", "sombra", "luz", "cor",
    "vermelho", "azul", "verde", "branco", "negro", "dourado",
    "prateado", "colorido", "opaco", "translúcido", "brilhante",
    # Audição
    "ouviu", "escutou", "sussurrou", "gritou", "murmurou", "ecoou",
    "soou", "ressoou", "estrondou", "chiou", "rangeu", "estralou",
    "ruído", "som", "barulho", "silêncio", "melodia", "ritmo",
    "trovão", "sussurro", "grito", "murmúrio", "eco",
    # Tato
    "tocou", "sentiu", "acariciou", "apertou", "segurou", "abraçou",
    "roçou", "arranhou", "queimou", "gelou", "arrepiou", "tremeu",
    "suave", "áspero", "macio", "duro", "quente", "frio", "morno",
    "gelado", "escaldante", "aveludado", "pegajoso", "liso", "rugoso",
    # Olfato
    "cheirou", "fedia", "perfumou", "exalou", "aspirou", "inalou",
    "aroma", "perfume", "fedor", "cheiro", "fragrância", "odor",
    "acre", "doce", "pútrido", "fresco", "nauseante",
    # Paladar
    "provou", "saboreou", "degustou", "mastigou", "engoliu",
    "cuspiu", "lambia", "mordeu", "doce", "amargo", "salgado",
    "azedo", "picante", "insosso", "apimentado", "ácido",
    "sabor", "gosto",
}

# Indicadores de voz passiva em Português
PT_PASSIVE_INDICATORS = [
    "foi", "eram", "foram", "era", "sendo", "sido",
    "é feito", "foi feito", "foram feitos", "era feito",
    "é feita", "foi feita", "foram feitas", "era feita",
    "é dito", "foi dito", "foram ditos",
    "é visto", "foi visto", "foram vistos",
    "é usado", "foi usado", "foram usados",
    "é chamado", "foi chamado", "foram chamados",
    "é considerado", "foi considerado", "foram considerados",
]


class DeepRevisionEngine:
    """
    Motor de revisão profunda em 3 passes, inspirado no AuthorClaw.
    
    Pass 1 - Revisão Estrutural:
        Equilíbrio de capítulos, progressão de arco, ritmo narrativo.
        
    Pass 2 - Revisão de Cena:
        Proporção de diálogo, show-vs-tell, densidade sensorial.
        
    Pass 3 - Revisão de Linha:
        Variedade de sentenças, repetição de palavras, voz passiva.
    """

    # Limites para análise
    MIN_CHAPTER_WORDS = 800
    MAX_CHAPTER_WORDS = 8000
    IDEAL_DIALOGUE_MIN = 20  # % mínima de diálogo
    IDEAL_DIALOGUE_MAX = 55  # % máxima de diálogo
    IDEAL_SENTENCE_LENGTH = 15  # palavras por sentença (média ideal)
    MAX_SENTENCE_LENGTH = 40  # sentença muito longa
    MIN_SENSORY_DENSITY = 2.0  # palavras sensoriais por 1000 palavras
    MAX_ADVERB_DENSITY = 3.0  # advérbios -mente por 1000 palavras
    MAX_PASSIVE_DENSITY = 5.0  # voz passiva por 1000 palavras

    def __init__(self):
        """Inicializa o motor de revisão."""
        self.stopwords = PT_STOPWORDS
        self.sensory_words = PT_SENSORY_WORDS
        self.passive_indicators = PT_PASSIVE_INDICATORS

    def _count_words(self, text: str) -> int:
        """Conta palavras em um texto."""
        return len(text.split())

    def _split_sentences(self, text: str) -> List[str]:
        """Divide texto em sentenças."""
        # Divide por pontuação final, preservando abreviações comuns
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 2]

    def _split_paragraphs(self, text: str) -> List[str]:
        """Divide texto em parágrafos."""
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]

    def _is_dialogue_line(self, line: str) -> bool:
        """Verifica se uma linha contém diálogo."""
        stripped = line.strip()
        # Diálogo com aspas
        if '"' in stripped or '\u201c' in stripped or '\u201d' in stripped:
            return True
        # Diálogo com travessão (estilo PT-BR)
        if stripped.startswith("—") or stripped.startswith("–") or stripped.startswith("-"):
            # Verifica se não é separador (---)
            if not re.match(r'^[-—–]{2,}$', stripped):
                return True
        return False

    def _count_sensory_words(self, text: str) -> int:
        """Conta palavras sensoriais no texto."""
        words = text.lower().split()
        count = 0
        for word in words:
            # Remove pontuação
            clean = re.sub(r'[^\w]', '', word)
            if clean in self.sensory_words:
                count += 1
        return count

    def _count_adverbs(self, text: str) -> Tuple[int, List[str]]:
        """Conta advérbios terminados em -mente."""
        words = text.lower().split()
        adverbs = []
        for word in words:
            clean = re.sub(r'[^\w]', '', word)
            if clean.endswith("mente") and len(clean) > 6:
                adverbs.append(clean)
        return len(adverbs), adverbs

    def _count_passive_voice(self, text: str) -> int:
        """Conta indicadores de voz passiva."""
        text_lower = text.lower()
        count = 0
        for indicator in self.passive_indicators:
            # Conta ocorrências como palavras inteiras
            pattern = r'\b' + re.escape(indicator) + r'\b'
            matches = re.findall(pattern, text_lower)
            count += len(matches)
        return count

    def _get_most_repeated(self, text: str, top_n: int = 15) -> List[Tuple[str, int]]:
        """Retorna as palavras mais repetidas (excluindo stopwords)."""
        words = re.findall(r'\b\w+\b', text.lower())
        filtered = [w for w in words if w not in self.stopwords and len(w) > 2]
        counter = Counter(filtered)
        return counter.most_common(top_n)

    def _calculate_score(self, issues: List[Dict], max_issues: int = 10) -> float:
        """
        Calcula score de 1 a 10 baseado na quantidade e severidade de issues.
        """
        if not issues:
            return 10.0

        severity_weights = {"alta": 1.5, "média": 1.0, "baixa": 0.5}
        total_weight = sum(
            severity_weights.get(issue.get("severity", "média"), 1.0)
            for issue in issues
        )

        # Score decresce com mais issues
        score = max(1.0, 10.0 - (total_weight * 10.0 / max_issues))
        return round(score, 1)

    # =========================================================================
    # PASS 1 - REVISÃO ESTRUTURAL
    # =========================================================================

    def structural_pass(self, chapters: List[Dict]) -> Dict[str, Any]:
        """
        Pass 1 - Revisão Estrutural.
        
        Analisa: equilíbrio de capítulos, progressão de arco, ritmo.
        
        Args:
            chapters: Lista de dicts com {number, title, content}
            
        Returns:
            dict com score, issues, suggestions e metrics
        """
        issues = []
        suggestions = []
        metrics = {}

        if not chapters:
            return {
                "pass": "structural",
                "pass_name": "Revisão Estrutural",
                "score": 1.0,
                "issues": [{"type": "critical", "severity": "alta",
                           "message": "Nenhum capítulo fornecido"}],
                "suggestions": ["Adicione pelo menos um capítulo ao livro."],
                "metrics": {},
            }

        # Métricas por capítulo
        chapter_stats = []
        for ch in chapters:
            content = ch.get("content", "")
            word_count = self._count_words(content)
            paragraph_count = len(self._split_paragraphs(content))
            sentence_count = len(self._split_sentences(content))
            chapter_stats.append({
                "number": ch.get("number", 0),
                "title": ch.get("title", ""),
                "words": word_count,
                "paragraphs": paragraph_count,
                "sentences": sentence_count,
            })

        word_counts = [s["words"] for s in chapter_stats]
        total_words = sum(word_counts)
        avg_words = total_words / len(word_counts) if word_counts else 0
        min_words = min(word_counts) if word_counts else 0
        max_words = max(word_counts) if word_counts else 0

        metrics["total_words"] = total_words
        metrics["total_chapters"] = len(chapters)
        metrics["avg_chapter_words"] = round(avg_words, 0)
        metrics["min_chapter_words"] = min_words
        metrics["max_chapter_words"] = max_words
        metrics["chapter_stats"] = chapter_stats

        # Check 1: Equilíbrio de capítulos
        if avg_words > 0:
            std_dev = math.sqrt(
                sum((w - avg_words) ** 2 for w in word_counts) / len(word_counts)
            )
            cv = std_dev / avg_words  # Coeficiente de variação
            metrics["word_count_std_dev"] = round(std_dev, 0)
            metrics["word_count_cv"] = round(cv, 2)

            if cv > 0.5:
                issues.append({
                    "type": "balance",
                    "severity": "alta",
                    "message": (
                        f"Desequilíbrio significativo entre capítulos. "
                        f"CV={cv:.2f} (maior={max_words}, menor={min_words})."
                    ),
                })
                suggestions.append(
                    "Redistribua conteúdo entre capítulos para maior equilíbrio. "
                    "Capítulos muito curtos podem ser combinados, e muito longos divididos."
                )
            elif cv > 0.3:
                issues.append({
                    "type": "balance",
                    "severity": "média",
                    "message": (
                        f"Variação moderada no tamanho dos capítulos (CV={cv:.2f})."
                    ),
                })

        # Check 2: Capítulos muito curtos ou longos
        for stat in chapter_stats:
            if stat["words"] < self.MIN_CHAPTER_WORDS:
                issues.append({
                    "type": "length",
                    "severity": "média",
                    "message": (
                        f"Capítulo {stat['number']} ('{stat['title']}') muito curto: "
                        f"{stat['words']} palavras (mínimo recomendado: {self.MIN_CHAPTER_WORDS})."
                    ),
                })
                suggestions.append(
                    f"Expanda o Capítulo {stat['number']} com mais detalhes, "
                    "descrições ou desenvolvimento de cenas."
                )
            elif stat["words"] > self.MAX_CHAPTER_WORDS:
                issues.append({
                    "type": "length",
                    "severity": "baixa",
                    "message": (
                        f"Capítulo {stat['number']} ('{stat['title']}') extenso: "
                        f"{stat['words']} palavras (máximo recomendado: {self.MAX_CHAPTER_WORDS})."
                    ),
                })
                suggestions.append(
                    f"Considere dividir o Capítulo {stat['number']} em dois "
                    "para melhor ritmo de leitura."
                )

        # Check 3: Progressão de arco (verificação por tamanho dos capítulos)
        if len(word_counts) >= 5:
            # O meio deve tender a ser mais longo (clímax)
            third = len(word_counts) // 3
            beginning = word_counts[:third]
            middle = word_counts[third:2*third]
            end = word_counts[2*third:]

            avg_begin = sum(beginning) / len(beginning) if beginning else 0
            avg_middle = sum(middle) / len(middle) if middle else 0
            avg_end = sum(end) / len(end) if end else 0

            metrics["arc_beginning_avg"] = round(avg_begin, 0)
            metrics["arc_middle_avg"] = round(avg_middle, 0)
            metrics["arc_end_avg"] = round(avg_end, 0)

            # Meio muito mais curto que início ou final pode indicar problema
            if avg_middle < avg_begin * 0.6 and avg_middle < avg_end * 0.6:
                issues.append({
                    "type": "arc",
                    "severity": "média",
                    "message": (
                        "O meio do livro parece subdensenvolvido comparado ao "
                        "início e fim. Isso pode indicar arco narrativo fraco."
                    ),
                })
                suggestions.append(
                    "Desenvolva mais o segundo ato do livro. Adicione complicações, "
                    "subtramas ou aprofunde conflitos existentes."
                )

        # Check 4: Ritmo (variação de tamanho de parágrafo)
        for stat in chapter_stats:
            if stat["paragraphs"] > 0:
                avg_para_size = stat["words"] / stat["paragraphs"]
                if avg_para_size > 200:
                    issues.append({
                        "type": "pacing",
                        "severity": "baixa",
                        "message": (
                            f"Capítulo {stat['number']}: parágrafos muito longos "
                            f"(média {avg_para_size:.0f} palavras). Pode prejudicar o ritmo."
                        ),
                    })
                    suggestions.append(
                        f"Quebre parágrafos longos no Capítulo {stat['number']} "
                        "para melhorar o ritmo de leitura."
                    )

        score = self._calculate_score(issues, max_issues=12)

        return {
            "pass": "structural",
            "pass_name": "Revisão Estrutural",
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "metrics": metrics,
        }

    # =========================================================================
    # PASS 2 - REVISÃO DE CENA
    # =========================================================================

    def scene_pass(self, chapter_text: str) -> Dict[str, Any]:
        """
        Pass 2 - Revisão de Cena.
        
        Analisa: proporção de diálogo, show-vs-tell, densidade sensorial,
        variedade de parágrafos.
        
        Args:
            chapter_text: Texto do capítulo
            
        Returns:
            dict com score, issues, suggestions e metrics
        """
        issues = []
        suggestions = []
        metrics = {}

        if not chapter_text or not chapter_text.strip():
            return {
                "pass": "scene",
                "pass_name": "Revisão de Cena",
                "score": 1.0,
                "issues": [{"type": "critical", "severity": "alta",
                           "message": "Texto do capítulo vazio"}],
                "suggestions": ["Forneça o texto do capítulo para análise."],
                "metrics": {},
            }

        lines = chapter_text.split("\n")
        total_lines = len([l for l in lines if l.strip()])
        word_count = self._count_words(chapter_text)

        # Check 1: Proporção de diálogo
        dialogue_lines = sum(1 for l in lines if l.strip() and self._is_dialogue_line(l))
        dialogue_pct = (dialogue_lines / total_lines * 100) if total_lines > 0 else 0

        metrics["total_lines"] = total_lines
        metrics["dialogue_lines"] = dialogue_lines
        metrics["dialogue_percentage"] = round(dialogue_pct, 1)

        if dialogue_pct < self.IDEAL_DIALOGUE_MIN:
            issues.append({
                "type": "dialogue",
                "severity": "média",
                "message": (
                    f"Proporção de diálogo baixa: {dialogue_pct:.1f}% "
                    f"(recomendado: {self.IDEAL_DIALOGUE_MIN}-{self.IDEAL_DIALOGUE_MAX}%). "
                    "Pode indicar excesso de narração."
                ),
            })
            suggestions.append(
                "Adicione mais diálogos para tornar a cena mais dinâmica. "
                "Converta trechos de narração expositiva em conversas entre personagens."
            )
        elif dialogue_pct > self.IDEAL_DIALOGUE_MAX:
            issues.append({
                "type": "dialogue",
                "severity": "baixa",
                "message": (
                    f"Proporção de diálogo alta: {dialogue_pct:.1f}% "
                    f"(recomendado: {self.IDEAL_DIALOGUE_MIN}-{self.IDEAL_DIALOGUE_MAX}%). "
                    "Pode faltar contexto narrativo."
                ),
            })
            suggestions.append(
                "Equilibre diálogos com descrições de ações, pensamentos e cenário. "
                "Adicione beats narrativos entre falas."
            )

        # Check 2: Densidade sensorial
        sensory_count = self._count_sensory_words(chapter_text)
        sensory_density = (sensory_count / word_count * 1000) if word_count > 0 else 0

        metrics["sensory_words"] = sensory_count
        metrics["sensory_density_per_1000"] = round(sensory_density, 1)

        if sensory_density < self.MIN_SENSORY_DENSITY:
            issues.append({
                "type": "sensory",
                "severity": "média",
                "message": (
                    f"Densidade sensorial baixa: {sensory_density:.1f}/1000 palavras "
                    f"(mínimo recomendado: {self.MIN_SENSORY_DENSITY}/1000). "
                    "O texto pode parecer 'telling' em vez de 'showing'."
                ),
            })
            suggestions.append(
                "Adicione mais detalhes sensoriais: o que o personagem vê, ouve, "
                "sente, cheira e saboreia. Isso enriquece a experiência do leitor."
            )

        # Check 3: Variedade de parágrafos
        paragraphs = self._split_paragraphs(chapter_text)
        if paragraphs:
            para_lengths = [self._count_words(p) for p in paragraphs]
            avg_para = sum(para_lengths) / len(para_lengths)
            para_std = math.sqrt(
                sum((l - avg_para) ** 2 for l in para_lengths) / len(para_lengths)
            ) if len(para_lengths) > 1 else 0

            metrics["total_paragraphs"] = len(paragraphs)
            metrics["avg_paragraph_words"] = round(avg_para, 1)
            metrics["paragraph_std_dev"] = round(para_std, 1)

            # Parágrafos muito uniformes = ritmo monótono
            if avg_para > 0:
                para_cv = para_std / avg_para
                metrics["paragraph_cv"] = round(para_cv, 2)

                if para_cv < 0.2 and len(paragraphs) > 3:
                    issues.append({
                        "type": "variety",
                        "severity": "baixa",
                        "message": (
                            "Parágrafos com tamanho muito uniforme. "
                            "Isso pode criar um ritmo monótono de leitura."
                        ),
                    })
                    suggestions.append(
                        "Varie o comprimento dos parágrafos: intercale curtos "
                        "(impacto/tensão) com longos (descrição/reflexão)."
                    )

        # Check 4: Show vs Tell - indicadores de "telling"
        telling_patterns = [
            r'\b(?:sentiu|sentia)\s+(?:que|como)\b',
            r'\b(?:pensou|pensava)\s+(?:que|em)\b',
            r'\b(?:sabia|soube)\s+que\b',
            r'\b(?:percebeu|percebia)\s+que\b',
            r'\b(?:lembrou|lembrava)\s+(?:que|de)\b',
            r'\b(?:estava|ficou)\s+(?:triste|feliz|com\s+raiva|nervoso|ansioso|preocupado)\b',
        ]

        telling_count = 0
        for pattern in telling_patterns:
            telling_count += len(re.findall(pattern, chapter_text.lower()))

        telling_density = (telling_count / word_count * 1000) if word_count > 0 else 0
        metrics["telling_indicators"] = telling_count
        metrics["telling_density_per_1000"] = round(telling_density, 1)

        if telling_density > 5.0:
            issues.append({
                "type": "show_vs_tell",
                "severity": "média",
                "message": (
                    f"Alto uso de 'telling': {telling_count} indicadores detectados "
                    f"({telling_density:.1f}/1000 palavras). "
                    "Prefira 'showing' através de ações e detalhes sensoriais."
                ),
            })
            suggestions.append(
                "Substitua construções como 'ele sentiu que...' por ações físicas: "
                "'Suas mãos tremeram', 'O estômago embrulhou'. "
                "Mostre emoções através de comportamento, não declaração."
            )

        score = self._calculate_score(issues, max_issues=8)

        return {
            "pass": "scene",
            "pass_name": "Revisão de Cena",
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "metrics": metrics,
        }

    # =========================================================================
    # PASS 3 - REVISÃO DE LINHA
    # =========================================================================

    def line_pass(self, chapter_text: str) -> Dict[str, Any]:
        """
        Pass 3 - Revisão de Linha.
        
        Analisa: variedade de sentenças, repetição de palavras, voz passiva,
        abuso de advérbios.
        
        Args:
            chapter_text: Texto do capítulo
            
        Returns:
            dict com score, issues, suggestions e metrics
        """
        issues = []
        suggestions = []
        metrics = {}

        if not chapter_text or not chapter_text.strip():
            return {
                "pass": "line",
                "pass_name": "Revisão de Linha",
                "score": 1.0,
                "issues": [{"type": "critical", "severity": "alta",
                           "message": "Texto do capítulo vazio"}],
                "suggestions": ["Forneça o texto do capítulo para análise."],
                "metrics": {},
            }

        word_count = self._count_words(chapter_text)
        sentences = self._split_sentences(chapter_text)

        # Check 1: Variedade de comprimento de sentença
        if sentences:
            sentence_lengths = [self._count_words(s) for s in sentences]
            avg_len = sum(sentence_lengths) / len(sentence_lengths)
            std_dev = math.sqrt(
                sum((l - avg_len) ** 2 for l in sentence_lengths) / len(sentence_lengths)
            ) if len(sentence_lengths) > 1 else 0

            metrics["total_sentences"] = len(sentences)
            metrics["avg_sentence_length"] = round(avg_len, 1)
            metrics["sentence_std_dev"] = round(std_dev, 1)

            # Sentenças muito uniformes
            if avg_len > 0:
                sent_cv = std_dev / avg_len
                metrics["sentence_cv"] = round(sent_cv, 2)

                if sent_cv < 0.3 and len(sentences) > 5:
                    issues.append({
                        "type": "sentence_variety",
                        "severity": "média",
                        "message": (
                            f"Sentenças com comprimento uniforme (média={avg_len:.1f}, "
                            f"desvio={std_dev:.1f}). Varie entre curtas e longas."
                        ),
                    })
                    suggestions.append(
                        "Alterne sentenças curtas (impacto, tensão) com longas "
                        "(descrição, reflexão). Exemplo: 'Correu. O coração disparou "
                        "enquanto os passos ecoavam...'"
                    )

            # Sentenças muito longas
            long_sentences = [
                (i + 1, l) for i, l in enumerate(sentence_lengths)
                if l > self.MAX_SENTENCE_LENGTH
            ]
            if long_sentences:
                metrics["long_sentences_count"] = len(long_sentences)
                issues.append({
                    "type": "long_sentences",
                    "severity": "baixa",
                    "message": (
                        f"{len(long_sentences)} sentenças com mais de "
                        f"{self.MAX_SENTENCE_LENGTH} palavras. "
                        "Sentenças muito longas podem dificultar a compreensão."
                    ),
                })
                suggestions.append(
                    "Quebre sentenças longas com pontos ou ponto-e-vírgula. "
                    "O leitor respira nas pausas da pontuação."
                )

        # Check 2: Palavras mais repetidas
        most_repeated = self._get_most_repeated(chapter_text, top_n=15)
        metrics["most_repeated_words"] = [
            {"word": w, "count": c} for w, c in most_repeated
        ]

        # Identifica repetições excessivas (>0.5% do total de palavras)
        excessive_repeats = [
            (w, c) for w, c in most_repeated
            if word_count > 0 and c / word_count > 0.005 and c > 5
        ]
        if excessive_repeats:
            words_list = ", ".join(
                f"'{w}' ({c}x)" for w, c in excessive_repeats[:5]
            )
            issues.append({
                "type": "word_repetition",
                "severity": "média",
                "message": (
                    f"Palavras excessivamente repetidas: {words_list}."
                ),
            })
            suggestions.append(
                "Use sinônimos ou reformule frases para evitar repetição. "
                "Um bom exercício: sublinhe a palavra repetida e tente substituir "
                "por alternativas em pelo menos 50% das ocorrências."
            )

        # Check 3: Voz passiva
        passive_count = self._count_passive_voice(chapter_text)
        passive_density = (passive_count / word_count * 1000) if word_count > 0 else 0

        metrics["passive_voice_count"] = passive_count
        metrics["passive_density_per_1000"] = round(passive_density, 1)

        if passive_density > self.MAX_PASSIVE_DENSITY:
            issues.append({
                "type": "passive_voice",
                "severity": "média",
                "message": (
                    f"Uso excessivo de voz passiva: {passive_count} ocorrências "
                    f"({passive_density:.1f}/1000 palavras). "
                    f"Recomendado: máximo {self.MAX_PASSIVE_DENSITY}/1000."
                ),
            })
            suggestions.append(
                "Prefira voz ativa: em vez de 'A porta foi aberta por ela', "
                "escreva 'Ela abriu a porta'. Voz ativa é mais direta e envolvente."
            )

        # Check 4: Advérbios (-mente)
        adverb_count, adverb_list = self._count_adverbs(chapter_text)
        adverb_density = (adverb_count / word_count * 1000) if word_count > 0 else 0

        metrics["adverb_count"] = adverb_count
        metrics["adverb_density_per_1000"] = round(adverb_density, 1)

        if adverb_density > self.MAX_ADVERB_DENSITY:
            # Mostra os mais comuns
            adverb_counter = Counter(adverb_list)
            top_adverbs = adverb_counter.most_common(5)
            adverb_str = ", ".join(f"'{a}' ({c}x)" for a, c in top_adverbs)

            issues.append({
                "type": "adverb_overuse",
                "severity": "baixa",
                "message": (
                    f"Advérbios em -mente em excesso: {adverb_count} ocorrências "
                    f"({adverb_density:.1f}/1000 palavras). "
                    f"Mais usados: {adverb_str}."
                ),
            })
            suggestions.append(
                "Stephen King: 'O advérbio não é amigo do escritor.' "
                "Substitua 'correu rapidamente' por 'disparou' ou 'voou'. "
                "Use verbos mais fortes em vez de advérbios."
            )

        # Check 5: Início de sentenças repetitivo
        if sentences and len(sentences) > 5:
            first_words = []
            for s in sentences:
                words = s.split()
                if words:
                    first_words.append(words[0].lower().strip("\"'—–-"))

            first_word_counter = Counter(first_words)
            repetitive_starts = [
                (w, c) for w, c in first_word_counter.most_common(5)
                if c > len(sentences) * 0.15 and c > 3
            ]

            if repetitive_starts:
                starts_str = ", ".join(
                    f"'{w}' ({c}x)" for w, c in repetitive_starts
                )
                metrics["repetitive_starts"] = [
                    {"word": w, "count": c} for w, c in repetitive_starts
                ]
                issues.append({
                    "type": "repetitive_starts",
                    "severity": "baixa",
                    "message": (
                        f"Início de sentenças repetitivo: {starts_str}."
                    ),
                })
                suggestions.append(
                    "Varie o início das sentenças. Em vez de sempre começar com "
                    "o sujeito, use: advérbio temporal, gerúndio, oração "
                    "subordinada, complemento circunstancial."
                )

        score = self._calculate_score(issues, max_issues=10)

        return {
            "pass": "line",
            "pass_name": "Revisão de Linha",
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "metrics": metrics,
        }

    # =========================================================================
    # REVISÃO COMPLETA
    # =========================================================================

    def full_revision(self, chapters: List[Dict]) -> Dict[str, Any]:
        """
        Executa revisão completa em 3 passes.
        
        Args:
            chapters: Lista de dicts com {number, title, content}
            
        Returns:
            dict com resultado completo de todos os 3 passes
        """
        if not chapters:
            return {
                "revision_type": "full",
                "total_score": 1.0,
                "passes": [],
                "summary": "Nenhum capítulo fornecido para revisão.",
                "total_issues": 0,
                "total_suggestions": 0,
            }

        # Pass 1: Estrutural (todos os capítulos)
        structural_result = self.structural_pass(chapters)

        # Pass 2 e 3: Cena e Linha (por capítulo)
        scene_results = []
        line_results = []

        for ch in chapters:
            content = ch.get("content", "")
            ch_number = ch.get("number", 0)
            ch_title = ch.get("title", f"Capítulo {ch_number}")

            scene_result = self.scene_pass(content)
            scene_result["chapter_number"] = ch_number
            scene_result["chapter_title"] = ch_title
            scene_results.append(scene_result)

            line_result = self.line_pass(content)
            line_result["chapter_number"] = ch_number
            line_result["chapter_title"] = ch_title
            line_results.append(line_result)

        # Agregação de scores
        scene_scores = [r["score"] for r in scene_results]
        line_scores = [r["score"] for r in line_results]

        avg_scene = sum(scene_scores) / len(scene_scores) if scene_scores else 0
        avg_line = sum(line_scores) / len(line_scores) if line_scores else 0

        # Score total ponderado: estrutural 30%, cena 35%, linha 35%
        total_score = round(
            structural_result["score"] * 0.30
            + avg_scene * 0.35
            + avg_line * 0.35,
            1
        )

        # Conta total de issues e suggestions
        total_issues = len(structural_result["issues"])
        total_suggestions = len(structural_result["suggestions"])
        for r in scene_results + line_results:
            total_issues += len(r["issues"])
            total_suggestions += len(r["suggestions"])

        # Gera sumário textual
        summary = self._generate_summary(
            total_score, structural_result, scene_results, line_results,
            total_issues
        )

        return {
            "revision_type": "full",
            "total_score": total_score,
            "total_issues": total_issues,
            "total_suggestions": total_suggestions,
            "summary": summary,
            "passes": {
                "structural": structural_result,
                "scene": {
                    "avg_score": round(avg_scene, 1),
                    "chapters": scene_results,
                },
                "line": {
                    "avg_score": round(avg_line, 1),
                    "chapters": line_results,
                },
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "engine": "BookMe DeepRevision v1.0",
        }

    def _generate_summary(
        self,
        total_score: float,
        structural: Dict,
        scene_results: List[Dict],
        line_results: List[Dict],
        total_issues: int
    ) -> str:
        """Gera sumário textual da revisão."""
        lines = []
        lines.append(f"=== RELATÓRIO DE REVISÃO PROFUNDA ===")
        lines.append(f"Score Total: {total_score}/10")
        lines.append("")

        # Classificação
        if total_score >= 8.5:
            lines.append("Classificação: EXCELENTE - Texto maduro e bem trabalhado.")
        elif total_score >= 7.0:
            lines.append("Classificação: BOM - Texto sólido com oportunidades de melhoria.")
        elif total_score >= 5.0:
            lines.append("Classificação: REGULAR - Necessita revisão significativa.")
        elif total_score >= 3.0:
            lines.append("Classificação: FRACO - Revisão profunda necessária.")
        else:
            lines.append("Classificação: CRÍTICO - Reescrita recomendada.")

        lines.append("")
        lines.append(f"--- Pass 1: Estrutural (Score: {structural['score']}/10) ---")
        if structural["issues"]:
            for issue in structural["issues"][:3]:
                lines.append(f"  • {issue['message']}")
        else:
            lines.append("  Nenhum problema estrutural detectado.")

        lines.append("")
        scene_scores = [r["score"] for r in scene_results]
        avg_scene = sum(scene_scores) / len(scene_scores) if scene_scores else 0
        lines.append(f"--- Pass 2: Cena (Score Médio: {avg_scene:.1f}/10) ---")

        worst_scene = min(scene_results, key=lambda r: r["score"]) if scene_results else None
        if worst_scene and worst_scene["issues"]:
            lines.append(
                f"  Capítulo com mais issues: {worst_scene.get('chapter_number', '?')} "
                f"(Score: {worst_scene['score']}/10)"
            )
            for issue in worst_scene["issues"][:2]:
                lines.append(f"  • {issue['message']}")

        lines.append("")
        line_scores_list = [r["score"] for r in line_results]
        avg_line = sum(line_scores_list) / len(line_scores_list) if line_scores_list else 0
        lines.append(f"--- Pass 3: Linha (Score Médio: {avg_line:.1f}/10) ---")

        worst_line = min(line_results, key=lambda r: r["score"]) if line_results else None
        if worst_line and worst_line["issues"]:
            lines.append(
                f"  Capítulo com mais issues: {worst_line.get('chapter_number', '?')} "
                f"(Score: {worst_line['score']}/10)"
            )
            for issue in worst_line["issues"][:2]:
                lines.append(f"  • {issue['message']}")

        lines.append("")
        lines.append(f"Total de problemas encontrados: {total_issues}")
        lines.append("")
        lines.append("Gerado por BookMe DeepRevision Engine v1.0")

        return "\n".join(lines)


# =============================================================================
# FUNÇÕES AUXILIARES DE CONVENIÊNCIA
# =============================================================================

def export_book_epub(
    project_title: str,
    author: str,
    chapters: List[Dict],
    genre: str = "",
    description: str = ""
) -> bytes:
    """Função de conveniência para exportar EPUB."""
    exporter = EPUBExporter()
    return exporter.export_epub(project_title, author, chapters, genre, description)


def revise_book(chapters: List[Dict]) -> Dict[str, Any]:
    """Função de conveniência para revisão completa."""
    engine = DeepRevisionEngine()
    return engine.full_revision(chapters)


def quick_chapter_review(chapter_text: str) -> Dict[str, Any]:
    """
    Revisão rápida de um único capítulo (passes 2 e 3 apenas).
    
    Args:
        chapter_text: Texto do capítulo
        
    Returns:
        dict com resultados de cena e linha
    """
    engine = DeepRevisionEngine()
    scene = engine.scene_pass(chapter_text)
    line = engine.line_pass(chapter_text)

    combined_score = round((scene["score"] + line["score"]) / 2, 1)

    return {
        "type": "quick_review",
        "combined_score": combined_score,
        "scene": scene,
        "line": line,
        "total_issues": len(scene["issues"]) + len(line["issues"]),
        "total_suggestions": len(scene["suggestions"]) + len(line["suggestions"]),
    }
