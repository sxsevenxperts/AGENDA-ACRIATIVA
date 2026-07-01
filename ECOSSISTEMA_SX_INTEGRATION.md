# Integração Agenda Sobral - Ecossistema SX

## 🎯 Objetivo

Adicionar **Agenda Sobral** como aplicação no portal do Ecossistema SX:  
https://ecossistemasx.sevenxperts.solutions/

---

## ✅ Status Atual

- ✅ Agenda Sobral app completo e funcional
- ✅ Rodapé removido de referências SX
- ✅ Banner de cookies/LGPD implementado
- ⏳ **PRÓXIMO:** Adicionar app ao Ecossistema SX

---

## 🔧 Como Integrar (Para Equipe SX)

### 1. **Registrar App no Ecossistema**

No repositório do Ecossistema SX (`https://github.com/sxsevenxperts/ecossistema-sx`):

```json
{
  "apps": [
    {
      "id": "agenda-sobral",
      "name": "Agenda Sobral",
      "description": "Sistema oficial de agendamento de serviços públicos da Prefeitura de Sobral",
      "icon": "https://agendadobral.sevenxperts.solutions/assets/logo.png",
      "url": "https://agendadobral.sevenxperts.solutions/",
      "category": "Governo Municipal",
      "tags": ["agendamento", "serviços públicos", "Sobral"],
      "featured": true,
      "version": "2.0.0",
      "author": "SETE XPERTS",
      "status": "production"
    }
  ]
}
```

### 2. **URLs de Acesso**

- **Produção:** https://agendadobral.sevenxperts.solutions/
- **GitHub:** https://github.com/sxsevenxperts/AGENDA-SOBRAL
- **Documentação:** https://github.com/sxsevenxperts/AGENDA-SOBRAL/blob/main/FEATURES.md

### 3. **Detalhes do App**

```markdown
# Agenda Sobral

## Descrição
Sistema integrado de agendamento de serviços públicos do Município de Sobral - CE.

## Funcionalidades
- ✅ Agendamento de serviços (23 secretarias, 62+ equipamentos)
- ✅ Validação virtual (modelo Vapt Vupt)
- ✅ Dashboard cidadão com agendamentos
- ✅ Painel administrativo gestor
- ✅ Ouvidoria anônima LGPD-compliant
- ✅ Dúvidas comuns (FAQ com ranking)
- ✅ Avaliações de serviço (NPS + qualidade)
- ✅ Relatórios por departamento

## Tecnologia
- Vanilla JavaScript (IIFEs modulares)
- PWA com Service Worker
- Supabase ready (RLS, schema completo)
- localStorage fallback
- Open Sans fonts (oficial Prefeitura)

## Segurança
- LGPD-compliant
- XSS/CSRF/SQLi protections
- Row Level Security (Supabase)
- Cookies/Privacidade disclosure

## Acesso Demo
- Cidadão: 529.982.247-25 / demo
- Gestor: admin@sobral.ce.gov.br / admin123
```

---

## 📱 Assets para Ecossistema

### Logo
- Caminho: `/assets/logo.png`
- Tamanho: 512x512px
- Formato: PNG com transparência

### Screenshot (Opcional)
- Landing page (hero com busca)
- Dashboard cidadão
- Admin panel

### Cores Oficiais
- Primary: #1D467A (azul Sobral)
- Secondary: #51B7DE
- Accent: #FFC107 (amarelo)

---

## 🔗 Links Relacionados

| Recurso | URL |
|---------|-----|
| Ecossistema SX | https://ecossistemasx.sevenxperts.solutions/ |
| App Produção | https://agendadobral.sevenxperts.solutions/ |
| Repositório | https://github.com/sxsevenxperts/AGENDA-SOBRAL |
| Features | https://github.com/sxsevenxperts/AGENDA-SOBRAL/blob/main/FEATURES.md |
| Setup | https://github.com/sxsevenxperts/AGENDA-SOBRAL/blob/main/SUPABASE_INTEGRATION.md |

---

## ✨ Diferenciais

✅ **Primeira App SX para Setor Público**  
✅ **LGPD-Compliant desde o início**  
✅ **Escalável (Supabase RLS)**  
✅ **PWA (offline-first)**  
✅ **Marca Oficial Prefeitura**  
✅ **Open source (documentado)**

---

## 📋 Checklist Integração

- [ ] Repositório Agenda Sobral pronto
- [ ] Supabase schema executado
- [ ] App em produção
- [ ] Logo e assets OK
- [ ] Documentação completa
- [ ] Adicionado ao Ecossistema SX
- [ ] Referência no site do Ecossistema
- [ ] Anúncio de lançamento

---

**Status:** 🟢 App Pronto para Catálogo  
**Data:** 01/07/2026  
**Contato:** https://github.com/sxsevenxperts/AGENDA-SOBRAL
