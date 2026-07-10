
-- =========================================================
-- PHASE RC2 — SECURITY PATCH
-- =========================================================

-- 1) DOCUMENT ARCHIVES : retirer l'accès public direct
DROP POLICY IF EXISTS "archives_public_verify" ON public.document_archives;
REVOKE SELECT ON public.document_archives FROM anon;

-- Nouvelle policy authentifiée uniquement (lecture large côté back office)
CREATE POLICY "archives_read_auth" ON public.document_archives
  FOR SELECT TO authenticated USING (true);

-- 1.a) RPC publique — vérification limitée par jeton
CREATE OR REPLACE FUNCTION public.verify_archive_by_token(
  _token TEXT,
  _max_age_days INTEGER DEFAULT NULL
)
RETURNS TABLE (
  document_type TEXT,
  numero TEXT,
  version INTEGER,
  created_at TIMESTAMPTZ,
  generated_by_nom TEXT,
  pdf_size INTEGER,
  sha256 TEXT,
  status TEXT,
  pdf_path TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.document_type,
    a.numero,
    a.version,
    a.created_at,
    a.generated_by_nom,
    a.pdf_size,
    a.sha256,
    a.status,
    a.pdf_url AS pdf_path
  FROM public.document_archives a
  WHERE a.qr_token = _token
    AND a.status = 'active'
    AND (_max_age_days IS NULL OR a.created_at > now() - make_interval(days => _max_age_days))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_archive_by_token(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_archive_by_token(TEXT, INTEGER) TO anon, authenticated;

-- 1.b) RPC publique — URL signée limitée par jeton (via edge function côté client)
-- Note : Postgres ne peut pas signer d'URL storage. L'URL signée est obtenue
-- côté Edge Function 'verify-archive' à partir du pdf_path renvoyé par la RPC.

-- 2) STORAGE POLICIES — rapports-techniques : ownership strict
DROP POLICY IF EXISTS "rapports_tech_bucket_read" ON storage.objects;
DROP POLICY IF EXISTS "rapports_tech_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "rapports_tech_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "rapports_tech_bucket_delete" ON storage.objects;

-- Convention de chemin : "{rapport_id}/{filename}"
-- Un utilisateur ne peut manipuler un objet que si le rapport correspondant
-- est visible pour lui via les RLS existantes de public.rapports_techniques.

CREATE POLICY "rapports_tech_read_scoped" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rapports-techniques'
    AND EXISTS (
      SELECT 1 FROM public.rapports_techniques r
      WHERE r.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "rapports_tech_insert_scoped" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rapports-techniques'
    AND EXISTS (
      SELECT 1 FROM public.rapports_techniques r
      WHERE r.id::text = (storage.foldername(name))[1]
    )
    AND public.can_write_business()
  );

CREATE POLICY "rapports_tech_update_scoped" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'rapports-techniques'
    AND EXISTS (
      SELECT 1 FROM public.rapports_techniques r
      WHERE r.id::text = (storage.foldername(name))[1]
    )
    AND public.can_write_business()
  );

CREATE POLICY "rapports_tech_delete_scoped" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'rapports-techniques'
    AND EXISTS (
      SELECT 1 FROM public.rapports_techniques r
      WHERE r.id::text = (storage.foldername(name))[1]
    )
    AND public.can_write_business()
  );

-- 3) HYGIÈNE SQL — search_path explicite sur fonctions manquantes
ALTER FUNCTION public.generate_chantier_sample_number() SET search_path = public;
ALTER FUNCTION public.set_movement_numero() SET search_path = public;
ALTER FUNCTION public.next_movement_numero(public.mouvement_type) SET search_path = public;
ALTER FUNCTION public.block_delete() SET search_path = public;
