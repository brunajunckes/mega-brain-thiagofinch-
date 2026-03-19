class Classifier {
  static SIMPLE_KEYWORDS = [
    'ler', 'read', 'summarize', 'summary', 'listar', 'list',
    'buscar', 'search', 'find', 'explain', 'describe', 'quote',
  ];

  static COMPLEX_KEYWORDS = [
    'implementar', 'implement', 'design', 'architect', 'refactor',
    'otimizar', 'optimize', 'debug', 'fix bug', 'criar', 'create',
    'generate', 'write code', 'build', 'schema', 'database', 'security',
  ];

  static classify(text) {
    let score = 3;
    const lower = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    const lineCount = text.split('\n').length;

    if (wordCount < 15) score -= 0.5;
    if (wordCount > 200) score += 1;
    if (lineCount > 10) score += 1;

    const simpleMatches = this.SIMPLE_KEYWORDS.filter(kw => lower.includes(kw)).length;
    const complexMatches = this.COMPLEX_KEYWORDS.filter(kw => lower.includes(kw)).length;

    score -= simpleMatches * 0.3;
    score += complexMatches * 1.0;

    if (lower.includes('arquivo') || lower.includes('file')) score += 0.5;
    if (lower.includes('teste') || lower.includes('test')) score += 0.5;
    if (lower.includes('story')) score += 0.3;

    return Math.max(1, Math.min(5, Math.round(score * 2) / 2));
  }

  static getCategory(score) {
    if (score <= 1.5) return 'TRIVIAL';
    if (score <= 2.5) return 'SIMPLE';
    if (score <= 3.5) return 'MEDIUM';
    if (score <= 4.5) return 'COMPLEX';
    return 'CRITICAL';
  }

  static recommendModel(score, threshold = 3) {
    return score <= threshold ? 'ollama' : 'claude';
  }
}

module.exports = Classifier;
