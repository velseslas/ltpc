ALTER TYPE public.notification_category ADD VALUE IF NOT EXISTS 'echeance_compression';
ALTER TYPE public.notification_category ADD VALUE IF NOT EXISTS 'message_recu';

CREATE TABLE IF NOT EXISTS public.echeances_push_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  echantillon_id uuid NOT NULL,
  echeance_type text NOT NULL,
  echeance_key text NOT NULL,
  notification_id uuid,
  push_sent integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT echeances_push_log_unique UNIQUE (user_id, echantillon_id, echeance_type, echeance_key)
);

GRANT SELECT ON public.echeances_push_log TO authenticated;
GRANT ALL ON public.echeances_push_log TO service_role;

ALTER TABLE public.echeances_push_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own echeance log"
  ON public.echeances_push_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_echeances_push_log_user ON public.echeances_push_log (user_id, created_at DESC);