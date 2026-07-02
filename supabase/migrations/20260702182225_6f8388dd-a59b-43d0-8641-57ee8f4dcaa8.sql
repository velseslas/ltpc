
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.ai_alerts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  severity text not null check (severity in ('info','warning','critique')),
  title text not null,
  message text not null,
  source_type text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','dismissed','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  unique(code, source_type, source_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_status_created ON public.ai_alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_severity ON public.ai_alerts(severity);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_alerts TO authenticated;
GRANT ALL ON public.ai_alerts TO service_role;
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read alerts"
  ON public.ai_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can update alerts"
  ON public.ai_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "service_role manages alerts"
  ON public.ai_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_ai_alerts_updated
  BEFORE UPDATE ON public.ai_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.ai_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  summary_date date not null unique,
  contenu text not null,
  stats jsonb not null default '{}'::jsonb,
  alerts_count integer not null default 0,
  generated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_daily_summaries TO authenticated;
GRANT ALL ON public.ai_daily_summaries TO service_role;
ALTER TABLE public.ai_daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read summaries"
  ON public.ai_daily_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_role manages summaries"
  ON public.ai_daily_summaries FOR ALL TO service_role USING (true) WITH CHECK (true);
