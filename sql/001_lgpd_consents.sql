-- =============================================================
-- Migração 001 — Tabela de Consentimentos LGPD
-- Schema: agenda_sobral
-- Versão do app: 2.11.0
-- Data: 2026-07-22
-- =============================================================

-- Garante que o schema existe
CREATE SCHEMA IF NOT EXISTS agenda_sobral;

-- ---------------------------------------------------------------
-- Tabela principal de registros de consentimento
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agenda_sobral.lgpd_consents (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_timestamp timestamptz   NOT NULL DEFAULT now(),
  lgpd_accepted     boolean       NOT NULL DEFAULT false,
  privacy_accepted  boolean       NOT NULL DEFAULT false,
  cookies_accepted  boolean       NOT NULL DEFAULT false,
  ip_address        inet,
  user_agent        text,
  citizen_user_id   uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id        text,
  created_at        timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE agenda_sobral.lgpd_consents IS
  'Registro jurídico de aceites LGPD / Privacidade / Cookies dos cidadãos.';

-- Índices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_timestamp
  ON agenda_sobral.lgpd_consents (consent_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_lgpd_consents_citizen
  ON agenda_sobral.lgpd_consents (citizen_user_id)
  WHERE citizen_user_id IS NOT NULL;

-- ---------------------------------------------------------------
-- RLS (Row-Level Security)
-- ---------------------------------------------------------------
ALTER TABLE agenda_sobral.lgpd_consents ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (anon ou authenticated) pode inserir o próprio consentimento
CREATE POLICY "lgpd_insert_public"
  ON agenda_sobral.lgpd_consents
  FOR INSERT
  WITH CHECK (true);

-- Apenas usuários autenticados veem os próprios registros
CREATE POLICY "lgpd_select_own"
  ON agenda_sobral.lgpd_consents
  FOR SELECT
  USING (
    citizen_user_id IS NULL
    OR citizen_user_id = auth.uid()
  );

-- ---------------------------------------------------------------
-- Função RPC: log_consent
-- Chamada pelo frontend via fetch /rest/v1/rpc/log_consent
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION agenda_sobral.log_consent(
  p_consent_timestamp  timestamptz DEFAULT now(),
  p_lgpd_accepted      boolean     DEFAULT false,
  p_privacy_accepted   boolean     DEFAULT false,
  p_cookies_accepted   boolean     DEFAULT false,
  p_user_agent         text        DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = agenda_sobral, public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO agenda_sobral.lgpd_consents (
    consent_timestamp,
    lgpd_accepted,
    privacy_accepted,
    cookies_accepted,
    user_agent,
    citizen_user_id
  )
  VALUES (
    COALESCE(p_consent_timestamp, now()),
    p_lgpd_accepted,
    p_privacy_accepted,
    p_cookies_accepted,
    p_user_agent,
    auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION agenda_sobral.log_consent IS
  'Registra o consentimento LGPD/Privacidade/Cookies de um cidadão.';

-- Permissão de execução para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION agenda_sobral.log_consent TO anon, authenticated;
