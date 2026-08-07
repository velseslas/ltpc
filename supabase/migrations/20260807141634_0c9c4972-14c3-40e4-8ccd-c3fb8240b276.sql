CREATE TABLE IF NOT EXISTS public.render_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  report_kind text NOT NULL,
  resource_id uuid,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 minutes'),
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS render_tokens_expires_idx ON public.render_tokens (expires_at);

REVOKE ALL ON public.render_tokens FROM anon, authenticated;
GRANT ALL ON public.render_tokens TO service_role;

ALTER TABLE public.render_tokens ENABLE ROW LEVEL SECURITY;
-- Aucune policy : seule la clé de service (edge functions) accède à la table.