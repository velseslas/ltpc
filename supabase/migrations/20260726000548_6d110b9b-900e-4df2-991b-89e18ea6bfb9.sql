-- 1) documents_administratifs : supprimer les 2 politiques SELECT totalement ouvertes
DROP POLICY IF EXISTS "Authenticated users can view documents_administratifs" ON public.documents_administratifs;
DROP POLICY IF EXISTS "documents_administratifs_std_select" ON public.documents_administratifs;

CREATE POLICY "documents_administratifs_select_scoped"
ON public.documents_administratifs
FOR SELECT
TO authenticated
USING (public.can_write_business());

-- 2) storage: contrats — lecture réservée admin/manager/technicien
DROP POLICY IF EXISTS "contrats_select" ON storage.objects;
CREATE POLICY "contrats_select_scoped"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'contrats' AND public.can_write_business());

-- 3) storage: documents-administratifs — même règle
DROP POLICY IF EXISTS "documents_administratifs_select" ON storage.objects;
CREATE POLICY "documents_administratifs_select_scoped"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents-administratifs' AND public.can_write_business());