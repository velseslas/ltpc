
DROP POLICY IF EXISTS "Authenticated can list logos" ON storage.objects;
-- No SELECT policy on storage.objects for logos: public CDN URLs still work for known paths,
-- but the listing API no longer exposes the full bucket contents.
