DROP POLICY IF EXISTS rapports_tech_read_scoped ON storage.objects;
CREATE POLICY rapports_tech_read_scoped ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'rapports-techniques'
  AND public.can_access_rapport(((storage.foldername(name))[1])::uuid)
);