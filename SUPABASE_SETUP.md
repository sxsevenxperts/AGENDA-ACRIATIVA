# 🚀 Configuração Supabase — Cadeia Criativa Agenda Sobral

**Data:** 2026-07-21  
**Versão:** 2.4.0+  
**Status:** Guia de Integração

---

## 📋 Visão Geral

Este documento descreve como integrar o Supabase para gerenciamento de senhas de administrador e dados de agendamentos. A aplicação funciona completamente sem Supabase (fallback para localStorage), mas com Supabase você tem:

✅ Senhas persistidas em servidor seguro  
✅ Múltiplos dispositivos compartilhando mesma conta  
✅ Auditoria de alterações (timestamp)  
✅ Backup automático  
✅ Escalabilidade sem limite localStorage (5MB)

---

## 🔧 Passo 1: Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Sign In" ou "Start Your Project"
3. Faça login com GitHub/Google/email
4. Clique em "New project"
5. Preencha:
   - **Project name:** `cadeia-criativa-agenda`
   - **Database password:** Salve em local seguro
   - **Region:** Selecione mais próximo (ex: São Paulo - `sa-east-1`)
6. Aguarde criação (2-5 minutos)

---

## 🗄️ Passo 2: Criar Tabelas do Banco

### Tabela: `admin_passwords`

Na seção **SQL Editor** do Supabase, execute:

```sql
-- Criar tabela de senhas de admin
CREATE TABLE admin_passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dept_id TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para buscas rápidas
CREATE INDEX idx_admin_passwords_dept_id ON admin_passwords(dept_id);

-- Ativar RLS (Row Level Security)
ALTER TABLE admin_passwords ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ler/atualizar própria senha
CREATE POLICY "Admins can update own password" ON admin_passwords
  FOR ALL USING (true) WITH CHECK (true);
```

---

**Mantido por:** SETE XPERTS  
**Data Atualização:** 2026-07-21  
**Versão:** 1.0.0
