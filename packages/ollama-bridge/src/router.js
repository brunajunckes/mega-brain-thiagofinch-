class Router {
  static decide(score, config) {
    if (config.routing?.forceOllama) return 'ollama';
    if (config.routing?.forceClaude) return 'claude';
    const threshold = config.ollama?.complexityThreshold || 3;
    return score <= threshold ? 'ollama' : 'claude';
  }

  static getModel(model, useOllama) {
    if (useOllama) return model || 'llama3.2';
    return 'claude-opus-4-6';
  }

  static validate(decision, score) {
    return ['ollama', 'claude'].includes(decision) && score >= 1 && score <= 5;
  }
}

module.exports = Router;
