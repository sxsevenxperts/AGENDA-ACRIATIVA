#!/bin/bash

# ========================================
# CADEIA CRIATIVA - Deploy Script
# ========================================

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ Erro: arquivo .env não encontrado"
  echo "📝 Copie .env.example para .env e preencha as credenciais"
  exit 1
fi

echo "🚀 Iniciando Deploy - Cadeia Criativa v${APP_VERSION}"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Validate environment
echo -e "${YELLOW}📋 Validando ambiente...${NC}"
if [ -z "$EASYPANEL_API_KEY" ]; then
  echo -e "${RED}❌ EASYPANEL_API_KEY não configurada${NC}"
  exit 1
fi
if [ -z "$EASYPANEL_DEPLOY_URL" ]; then
  echo -e "${RED}❌ EASYPANEL_DEPLOY_URL não configurada${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Ambiente validado${NC}"

# 2. Check git status
echo -e "${YELLOW}📦 Verificando status do repositório...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}❌ Há mudanças não commitadas${NC}"
  git status
  exit 1
fi
echo -e "${GREEN}✅ Repositório limpo${NC}"

# 3. Get latest commit info
COMMIT=$(git rev-parse HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

echo -e "${YELLOW}📝 Informações do Commit:${NC}"
echo "   Branch: $BRANCH"
echo "   Commit: $COMMIT"
echo "   Mensagem: $COMMIT_MSG"

# 4. Deploy via Easypanel
echo -e "${YELLOW}🌐 Iniciando deploy via Easypanel...${NC}"

DEPLOY_PAYLOAD=$(cat <<EOF
{
  "branch": "$BRANCH",
  "commit": "$COMMIT",
  "version": "$APP_VERSION",
  "environment": "$NODE_ENV",
  "service": "agenda-cadeia-criativa"
}
EOF
)

echo "📤 Enviando para: $EASYPANEL_DEPLOY_URL"
echo "🔑 Usando API Key (primeiros 16 chars): ${EASYPANEL_API_KEY:0:16}..."

RESPONSE=$(curl -s -X POST "$EASYPANEL_DEPLOY_URL" \
  -H "Authorization: Bearer $EASYPANEL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$DEPLOY_PAYLOAD")

echo "📨 Resposta do servidor:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# 5. Check if deploy was successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Deploy enviado com sucesso!${NC}"
  echo ""
  echo "🎉 Informações do Deploy:"
  echo "   URL: $EASYPANEL_DEPLOY_URL"
  echo "   Version: $APP_VERSION"
  echo "   Status: Processando..."
  echo ""
  echo "📊 Dashboard Easypanel:"
  echo "   $EASYPANEL_DASHBOARD"
  exit 0
elif echo "$RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Deploy enviado!${NC}"
  exit 0
else
  echo -e "${RED}❌ Erro ao fazer deploy${NC}"
  echo "$RESPONSE"
  exit 1
fi
