ALTER TABLE public.etalonnage_materiel
  ADD COLUMN IF NOT EXISTS certificat_url text,
  ADD COLUMN IF NOT EXISTS certificat_nom text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificats-etalonnage', 'certificats-etalonnage', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read certificats etalonnage"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificats-etalonnage');

CREATE POLICY "Public insert certificats etalonnage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificats-etalonnage');

CREATE POLICY "Public update certificats etalonnage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificats-etalonnage');

CREATE POLICY "Public delete certificats etalonnage"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificats-etalonnage');