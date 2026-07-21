# 🚀 Deployment Guide - Cadeia Criativa

**Versão:** 2.1.1  
**Data:** 2026-07-20  
**Status:** Production Ready

---

## 📋 Pré-requisitos

- Docker & Docker Compose (v20.10+)
- Node.js 18+ (opcional, para desenvolvimento)
- Acesso ao Easypanel (164.68.116.21:3000)
- Credenciais Supabase
- Token GitHub PAT

---

## 🔧 Configuração Local

### 1. Preparar Ambiente

```bash
# Clone o repositório
git clone https://github.com/sxsevenxperts/AGENDA-ACRIATIVA.git
cd AGENDA-ACRIATIVA

# Crie arquivo .env (copie de .env.example)
cp .env.example .env

# Edite .env com as credenciais reais
nano .env
```

**Variáveis Obrigatórias:**
```
EASYPANEL_API_KEY=<sua-api-key>
EASYPANEL_DEPLOY_URL=<seu-deploy-url>
GITHUB_TOKEN=<seu-github-token>
SUPABASE_ANON_KEY=<sua-anon-key>
SUPABASE_SERVICE_KEY=<sua-service-key>
```

### 2. Testes Locais com Docker

```bash
# Build da imagem
docker build -t agenda-cadeia-criativa:2.1.1 .

# Teste local
docker run -p 3001:3000 agenda-cadeia-criativa:2.1.1

# Acesse: http://localhost:3001
```

### 3. Deploy com Docker Compose

```bash
# Build
docker-compose build

# Inicie os serviços
docker-compose up -d

# Verifique status
docker-compose ps

# Logs
docker-compose logs -f app
```

---

## 📦 Deploy via Easypanel

### 1. Script Automatizado

```bash
# Dê permissão de execução
chmod +x scripts/deploy.sh

# Execute o deploy
./scripts/deploy.sh
```

**O script irá:**
- ✅ Validar ambiente e credenciais
- ✅ Verificar se repositório está limpo
- ✅ Recuperar commit info
- ✅ Enviar para Easypanel API
- ✅ Exibir status do deploy

### 2. Deploy Manual

```bash
# Através do dashboard Easypanel
# URL: http://164.68.116.21:3000/projects/xpert-backend/compose/supabase/deployments

# Ou via API:
curl -X POST http://164.68.116.21:3000/api/deploy/19e3a2d294ed2a25f8e8d8b784c8cd0b321d3a3502b60e05 \
  -H "Authorization: Bearer c1b39378f5a1673aae13e386fd9be7eb32a5263edc7554a945379a77595389fc" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "claude/ux-ui-funcionalidades-b8bu2a",
    "version": "2.1.1",
    "environment": "production"
  }'
```

---

## 🌐 Infraestrutura

### Arquitetura

```
┌──────────────┐
│   Internet   │
└──────┬───────┘
       │
       │ HTTP/HTTPS
       ▼
┌──────────────────┐
│  Nginx Proxy     │ (Port 80/443)
│  (Reverse Proxy) │
└────────┬─────────┘
         │
         │ HTTP
         ▼
┌──────────────────┐
│  Node App Server │ (Port 3000)
│  (Cadeia         │
│   Criativa)      │
└────────┬─────────┘
         │
         │ TCP/HTTP
         ▼
┌──────────────────┐
│  Supabase        │ (PostgreSQL)
│  (Database)      │
└──────────────────┘
```

### Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Orquestração de containers |
| `Dockerfile` | Build da aplicação |
| `.dockerignore` | Arquivos ignorados no build |
| `nginx.conf` | Configuração do reverse proxy |

---

## 📊 Health Checks

### Verificar Status

```bash
# Health check da aplicação
curl http://localhost/health

# Health check do Docker
docker-compose ps

# Logs
docker-compose logs app

# Estatísticas
docker stats
```

### Monitoramento

```bash
# Ver logs em tempo real
docker-compose logs -f app nginx

# Seguir container específico
docker-compose logs -f app

# Ver últimas N linhas
docker-compose logs --tail=50 app
```

---

## 🔒 Segurança

### SSL/TLS (HTTPS)

1. **Gere certificados:**
```bash
# Com Let's Encrypt
docker run --rm -v $(pwd)/ssl:/etc/letsencrypt -v $(pwd)/ssl:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot -d seu-dominio.com
```

2. **Descomente seção HTTPS em nginx.conf**

3. **Reinicie Nginx:**
```bash
docker-compose restart nginx
```

### Headers de Segurança

✅ **Implementados em nginx.conf:**
- Strict-Transport-Security (HSTS)
- X-Frame-Options (Clickjacking)
- X-Content-Type-Options (MIME Sniffing)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### Rate Limiting

✅ **Configurado:**
- API: 10 req/s com burst de 5
- Geral: 50 req/s com burst de 20

---

## 🚨 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker-compose logs app

# Reiniciar
docker-compose down
docker-compose up -d

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Conexão recusada

```bash
# Verificar porta
lsof -i :80
lsof -i :3000

# Liberar porta (Linux)
fuser -k 80/tcp
```

### Deploy falha

```bash
# Verificar variáveis de ambiente
cat .env | grep -v '^#'

# Validar JSON
jq . .env.example

# Teste de conexão
curl -v http://164.68.116.21:3000/api/deploy/...
```

---

## 📈 Performance

### Otimizações Implementadas

✅ **Frontend:**
- CSS/JS minificados
- Cache de recursos estáticos (1 ano)
- Gzip compression
- Assets optimizados

✅ **Backend:**
- Node.js v18 Alpine (18MB base image)
- Multi-stage Docker build
- Health checks configurados
- Non-root user para segurança

✅ **Nginx:**
- Reverse proxy caching
- Conexões persistentes
- Buffer otimizado
- Worker processes automáticos

---

## 🔄 CI/CD

### GitHub Actions (Sugerido)

```yaml
name: Deploy to Production

on:
  push:
    branches: [claude/ux-ui-funcionalidades-b8bu2a]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: |
          curl -X POST ${{ secrets.EASYPANEL_DEPLOY_URL }} \
            -H "Authorization: Bearer ${{ secrets.EASYPANEL_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"branch":"main","version":"2.1.1"}'
```

---

## 📝 Logs de Deploy

### Padrão de Log

```
2026-07-20 02:45:00 [INFO] Iniciando deploy v2.1.1
2026-07-20 02:45:05 [INFO] Build: 290 linhas adicionadas
2026-07-20 02:45:30 [INFO] Docker image built: agenda-cadeia-criativa:2.1.1
2026-07-20 02:45:35 [INFO] Containers iniciados
2026-07-20 02:45:40 [INFO] Health check: OK
2026-07-20 02:45:45 [SUCCESS] Deploy concluído
```

---

## 📞 Suporte

- **Easypanel Dashboard:** http://164.68.116.21:3000/projects/xpert-backend
- **GitHub Repo:** https://github.com/sxsevenxperts/AGENDA-ACRIATIVA
- **Issues:** GitHub Issues
- **Email:** support@sxsevenxperts.com

---

**Versão:** 2.1.1  
**Mantido por:** SETE XPERTS  
**Data:** 2026-07-20
