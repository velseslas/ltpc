
CREATE TABLE IF NOT EXISTS public.rapport_ai_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id uuid REFERENCES public.rapports_techniques(id) ON DELETE CASCADE,
  operation text NOT NULL,
  provider text NOT NULL DEFAULT 'lovable-ai',
  model text NOT NULL,
  prompt_system text,
  prompt_user text,
  raw_response text,
  parsed_json jsonb,
  duration_ms integer,
  tokens_input integer,
  tokens_output integer,
  tokens_total integer,
  cost_credits numeric,
  status text NOT NULL DEFAULT 'success',
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.rapport_ai_calls TO authenticated;
GRANT ALL ON public.rapport_ai_calls TO service_role;

ALTER TABLE public.rapport_ai_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_calls_select_own_or_admin" ON public.rapport_ai_calls
FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_admin_only());

CREATE POLICY "ai_calls_insert_self" ON public.rapport_ai_calls
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE INDEX IF NOT EXISTS idx_rapport_ai_calls_rapport ON public.rapport_ai_calls(rapport_id, created_at DESC);

ALTER TABLE public.rapport_questions_ia
  ADD COLUMN IF NOT EXISTS reponse_utilisateur text,
  ADD COLUMN IF NOT EXISTS repondu_at timestamptz;
