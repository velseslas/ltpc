
CREATE POLICY "docs_officiels_read_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents-officiels');

CREATE POLICY "docs_officiels_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents-officiels' AND auth.uid() = owner);
