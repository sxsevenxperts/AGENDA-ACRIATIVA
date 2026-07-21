-- ============================================================
-- Agenda Cadeia Criativa — Acessos ADM + Consentimentos (LGPD)
-- Cole este SQL no SQL Editor do Supabase (self-hosted / EasyPanel)
-- ============================================================

-- 1) Senhas de acesso administrativo (por PAPEL, não por departamento)
--    Papéis: 'super' (Diretoria/Joyce), 'coordenadora' (Joyla),
--            'assistente', 'musica' (Silton)
CREATE TABLE IF NOT EXISTS public.admin_passwords (
  dept_id    text PRIMARY KEY,          -- id do papel de acesso
  password   text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Apaga acessos antigos e cria os 4 atuais (distintos entre si)
DELETE FROM public.admin_passwords;
INSERT INTO public.admin_passwords (dept_id, password) VALUES
  ('super',        'Diretoria!Joyce2026'),   -- ADM Diretoria — Joyce
  ('coordenadora', 'Artic!Joyla2026'),       -- ADM Articulação e Conectividade — Coordenação (Joyla)
  ('assistente',   'Artic!Assist2026'),      -- ADM Articulação e Conectividade — Assistente
  ('musica',       'Studio!Silton2026');     -- ADM Stúdio Musical — Silton

-- 2) Livro de consentimentos (LGPD) — segurança jurídica
CREATE TABLE IF NOT EXISTS public.consents (
  id             text PRIMARY KEY,
  source         text,                  -- 'gate' (pop-up) ou 'formulario'
  version        text,                  -- versão das políticas aceitas
  terms          boolean,
  lgpd           boolean,
  privacy_policy boolean,
  user_id        text,
  user_email     text,
  user_agent     text,
  accepted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consents_accepted_at ON public.consents (accepted_at);
CREATE INDEX IF NOT EXISTS idx_consents_user_email  ON public.consents (user_email);
