DROP POLICY IF EXISTS signatures_select ON storage.objects;
CREATE POLICY signatures_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'signatures'
  AND (owner = auth.uid() OR public.is_admin_or_manager())
);