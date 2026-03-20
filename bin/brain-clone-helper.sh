#!/bin/bash

set -e

# Brain Factory Clone Helper
# Uso: ./brain-clone-helper.sh <youtube_url> <clone_slug> [last_n_videos]

if [ $# -lt 2 ]; then
  cat <<EOF
🧠 Brain Factory Clone Helper

Uso:
  ./brain-clone-helper.sh <youtube_url> <clone_slug> [last_n_videos]

Exemplos:
  ./brain-clone-helper.sh https://www.youtube.com/@AlexHormozi hormozi 20
  ./brain-clone-helper.sh https://www.youtube.com/watch?v=abc123 my_expert

Flags opcionais:
  [last_n_videos]  - Limitar a últimos N vídeos (default: 10)

EOF
  exit 1
fi

YOUTUBE_URL="$1"
CLONE_SLUG="$2"
LAST_N="${3:-10}"

echo "🚀 Iniciando clonagem de brain..."
echo "  URL: $YOUTUBE_URL"
echo "  Slug: $CLONE_SLUG"
echo "  Últimos: $LAST_N vídeos"
echo ""

# Pré-verificações
echo "⚙️  Verificando requisitos..."

if ! command -v aiox &> /dev/null; then
  echo "❌ 'aiox' CLI não encontrado. Instale com: npm install -g /srv/aiox"
  exit 1
fi

if ! command -v ollama &> /dev/null; then
  echo "⚠️  'ollama' não encontrado. Será necessário para querying."
fi

echo "✅ Requisitos OK"
echo ""

# Executar ingestão
echo "📥 Iniciando ingestão (pode levar 5-20 min)..."
aiox brain ingest --youtube "$YOUTUBE_URL" --clone "$CLONE_SLUG" --last "$LAST_N"

echo ""
echo "✅ Clonagem concluída!"
echo ""
echo "Próximos passos:"
echo "  1. Testar o clone:"
echo "     aiox brain ask --clone $CLONE_SLUG \"Sua pergunta aqui?\""
echo ""
echo "  2. Multi-turn conversation:"
echo "     aiox brain ask --clone $CLONE_SLUG \"Pergunta 1\" --session s1"
echo "     aiox brain ask --clone $CLONE_SLUG \"Pergunta 2\" --session s1"
echo "     aiox brain ask --clone $CLONE_SLUG --session s1 --history"
echo ""
echo "  3. Squad (múltiplos clones):"
echo "     aiox brain squad --ask \"Pergunta\" --synthesize"
echo ""
echo "  4. Monitor atualizações automáticas:"
echo "     aiox brain watch --channel \"$YOUTUBE_URL\" --clone $CLONE_SLUG"
echo ""

# Status
echo "📊 Status:"
aiox brain status

echo ""
echo "🧠 Clone '$CLONE_SLUG' pronto para uso!"
