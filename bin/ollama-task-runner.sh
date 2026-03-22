#!/bin/bash
# AIOX Ollama Task Runner - Fallback quando API Anthropic atingir rate limit
# Uso: ./ollama-task-runner.sh "nome-da-task" "prompt" [model]

TASK_NAME="${1:-task}"
PROMPT="${2:-}"
MODEL="${3:-qwen2.5:7b}"
LOG_DIR="/srv/aiox/.claude/terminal-history"
LOG_FILE="$LOG_DIR/ollama-task-$(date +%Y%m%d-%H%M%S)-${TASK_NAME}.log"

mkdir -p "$LOG_DIR"

echo "=== AIOX Ollama Task Runner ===" | tee "$LOG_FILE"
echo "Task: $TASK_NAME" | tee -a "$LOG_FILE"
echo "Model: $MODEL" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "===============================" | tee -a "$LOG_FILE"

if [ -z "$PROMPT" ]; then
  echo "ERRO: Prompt vazio" | tee -a "$LOG_FILE"
  exit 1
fi

# Verificar Ollama disponivel
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "ERRO: Ollama nao esta rodando" | tee -a "$LOG_FILE"
  exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "--- Executando via Ollama ($MODEL) ---" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Rodar via Ollama
ollama run "$MODEL" "$PROMPT" 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}
echo "" | tee -a "$LOG_FILE"
echo "=== Finalizado: $(date) | Exit: $EXIT_CODE ===" | tee -a "$LOG_FILE"

exit $EXIT_CODE
