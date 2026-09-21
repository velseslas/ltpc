DROP POLICY IF EXISTS contrats_update ON storage.objects;
CREATE POLICY contrats_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'contrats' AND ((owner = auth.uid()) OR is_admin_or_manager()))
WITH CHECK (bucket_id = 'contrats' AND ((owner = auth.uid()) OR is_admin_or_manager()));

DROP POLICY IF EXISTS documents_administratifs_update ON storage.objects;
CREATE POLICY documents_administratifs_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documents-administratifs' AND ((owner = auth.uid()) OR is_admin_or_manager()))
WITH CHECK (bucket_id = 'documents-administratifs' AND ((owner = auth.uid()) OR is_admin_or_manager()));

DROP POLICY IF EXISTS certificats_etalonnage_update ON storage.objects;
CREATE POLICY certificats_etalonnage_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'certificats-etalonnage' AND ((owner = auth.uid()) OR is_admin_or_manager()))
WITH CHECK (bucket_id = 'certificats-etalonnage' AND ((owner = auth.uid()) OR is_admin_or_manager()));