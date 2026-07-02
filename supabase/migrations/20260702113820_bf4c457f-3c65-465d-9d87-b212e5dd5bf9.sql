
-- Phase 5: Generic Document Generation Engine — archives + review audit

CREATE TABLE IF NOT EXISTS public.document_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,               -- 'rapport_technique', 'non_conformite', 'audit', ...
  document_id UUID NOT NULL,                 -- ID of the source document
  numero TEXT,                               -- Copied for search
  version INTEGER NOT NULL DEFAULT 1,        -- Immutable version counter per document
  template_id UUID,                          -- Which template was used
  pdf_url TEXT NOT NULL,                     -- Storage path in 'documents-officiels'
  pdf_size INTEGER,
  sha256 TEXT NOT NULL,                      -- Document hash for integrity check
  qr_token TEXT NOT NULL UNIQUE,             -- Public token for /verification/:token
  variables JSONB DEFAULT '{}'::jsonb,       -- Snapshot of variables used
  contenu_snapshot JSONB,                    -- Immutable content snapshot
  generated_by UUID REFERENCES auth.users(id),
  generated_by_nom TEXT,
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'revoked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_archives_doc ON public.document_archives(document_type, document_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_doc_archives_token ON public.document_archives(qr_token);

GRANT SELECT, INSERT ON public.document_archives TO authenticated;
GRANT SELECT ON public.document_archives TO anon;  -- verification page public read
GRANT ALL ON public.document_archives TO service_role;

ALTER TABLE public.document_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "archives_public_verify" ON public.document_archives
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "archives_insert_auth" ON public.document_archives
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = generated_by);

-- Prevent updates/deletes: archives are immutable
CREATE TRIGGER doc_archives_no_delete BEFORE DELETE ON public.document_archives
  FOR EACH ROW EXECUTE FUNCTION public.block_delete();

-- AI Review audit
CREATE TABLE IF NOT EXISTS public.rapport_ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID NOT NULL REFERENCES public.rapports_techniques(id) ON DELETE CASCADE,
  observations JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{severity, category, message}]
  score INTEGER,                                     -- 0-100 quality score
  model TEXT,
  duration_ms INTEGER,
  tokens_total INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_rapport ON public.rapport_ai_reviews(rapport_id, created_at DESC);

GRANT SELECT, INSERT ON public.rapport_ai_reviews TO authenticated;
GRANT ALL ON public.rapport_ai_reviews TO service_role;

ALTER TABLE public.rapport_ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_reviews_read_auth" ON public.rapport_ai_reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_reviews_insert_auth" ON public.rapport_ai_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
