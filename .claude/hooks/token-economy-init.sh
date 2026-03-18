#!/bin/bash
# Token Economy Initialization
# Execute ao iniciar uma sessão importante: source .claude/hooks/token-economy-init.sh

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🎯 Token Economy Mode — Máxima Economia             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 1. Alerta: Status token da semana
echo "📊 Seu gasto de tokens (se configurado):"
echo "   Use: claude /usage para ver gastos detalhados"
echo ""

# 2. Verificar .claudeignore
if [ ! -f ".claudeignore" ]; then
  echo "⚠️  .claudeignore não encontrado — criando..."
  curl -s https://raw.githubusercontent.com/anthropics/claude-code/main/.claudeignore > .claudeignore 2>/dev/null || echo "node_modules/" > .claudeignore
fi
echo "✅ .claudeignore ativo — pesados ignorados"
echo ""

# 3. Tamanho do CLAUDE.md
if [ -f "CLAUDE.md" ]; then
  SIZE=$(wc -l < CLAUDE.md)
  if [ "$SIZE" -gt 300 ]; then
    echo "⚠️  CLAUDE.md tem $SIZE linhas (pesado!)"
    echo "   Dica: mova regras detalhadas para .claude/rules/"
  else
    echo "✅ CLAUDE.md otimizado ($SIZE linhas)"
  fi
fi
echo ""

# 4. Limpeza automática (sem destruir)
rm -rf /tmp/claude-* 2>/dev/null
find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null

echo "🧹 Limpeza realizada (logs antigos removidos)"
echo ""

# 5. Próximas ações
echo "─── RECOMENDAÇÕES PARA ESTA SESSÃO ───"
echo ""
echo "Model: Use 'haiku' para tarefas simples"
echo "  /model claude-haiku-4-5-20251001"
echo ""
echo "Compactação: Se a conversa ficar longa"
echo "  /compact (salva contexto, limpa histórico)"
echo ""
echo "Contexto: Solicitar apenas o necessário"
echo "  'Leia linhas 50-100 de X.js' (não arquivo inteiro)"
echo ""
echo "Checklist: Antes de fazer commit"
echo "  rm -rf dist/ build/ node_modules/.cache/"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✨ Session iniciada em modo economia"
echo "═══════════════════════════════════════════════════════"
echo ""
