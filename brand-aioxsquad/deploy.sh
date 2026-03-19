#!/bin/bash

# Deploy script para alan.hubme.tech
# Uso: ./deploy.sh [ssh|docker|local]

set -e

DOMAIN="alan.hubme.tech"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/brand.aioxsquad.ai"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-$DOMAIN}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html}"

MODE="${1:-ssh}"

echo "🚀 Deploy para $DOMAIN"
echo "Modo: $MODE"
echo ""

case $MODE in
  ssh)
    echo "📦 Enviando arquivos via SSH/SCP..."
    echo "Usuário: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

    # Criar diretório remoto
    ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" \
      "mkdir -p $REMOTE_PATH && rm -rf $REMOTE_PATH/*"

    # Copiar arquivos
    scp -r -o StrictHostKeyChecking=no \
      "$LOCAL_DIR"/* "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

    # Copiar nginx config se necessário
    scp -o StrictHostKeyChecking=no \
      "$(dirname "${BASH_SOURCE[0]}")/nginx.conf" \
      "$REMOTE_USER@$REMOTE_HOST:/tmp/nginx.conf"

    echo "✅ Deploy SSH concluído!"
    echo "📍 Acesse: http://$DOMAIN"
    ;;

  docker)
    echo "🐳 Construindo Docker image..."
    cd "$(dirname "${BASH_SOURCE[0]}")"

    docker build -t brand-aioxsquad:latest .

    echo "🚀 Iniciando container..."
    docker rm -f brand-aioxsquad 2>/dev/null || true
    docker run -d \
      --name brand-aioxsquad \
      -p 80:80 \
      -p 443:443 \
      brand-aioxsquad:latest

    echo "✅ Docker deploy concluído!"
    echo "📍 Acesse: http://localhost"
    echo "🛑 Para parar: docker stop brand-aioxsquad"
    ;;

  local)
    echo "🌐 Iniciando servidor local..."
    cd "$LOCAL_DIR"
    python3 -m http.server 8080
    ;;

  *)
    echo "❌ Modo desconhecido: $MODE"
    echo "Usos:"
    echo "  ./deploy.sh ssh     - Deploy via SSH (requer SSH configurado)"
    echo "  ./deploy.sh docker  - Deploy via Docker"
    echo "  ./deploy.sh local   - Servidor local (desenvolvimento)"
    exit 1
    ;;
esac
