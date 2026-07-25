ALTER TABLE public.rapport_ai_calls
  ADD COLUMN IF NOT EXISTS rag_sources jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.rapport_ai_calls.rag_sources IS
  'Sources RAG réellement récupérées et transmises au modèle pour cet appel (traçabilité P1/9). Jamais renseigné a posteriori.';