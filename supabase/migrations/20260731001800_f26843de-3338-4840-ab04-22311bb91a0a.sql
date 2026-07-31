DROP POLICY IF EXISTS certificats_etalonnage_select ON storage.objects;
CREATE POLICY certificats_etalonnage_select ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'certificats-etalonnage' AND (owner = auth.uid() OR public.can_write_business()));