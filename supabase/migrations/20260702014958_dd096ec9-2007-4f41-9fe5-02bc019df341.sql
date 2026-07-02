
ALTER TABLE public.rapports_techniques
  ADD COLUMN IF NOT EXISTS entreprise text,
  ADD COLUMN IF NOT EXISTS projet text,
  ADD COLUMN IF NOT EXISTS contexte_auto jsonb,
  ADD COLUMN IF NOT EXISTS prompt_utilisateur text,
  ADD COLUMN IF NOT EXISTS metadonnees jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_autosave_at timestamptz;
