-- Add signature_url column to intervenants table
ALTER TABLE public.intervenants ADD COLUMN IF NOT EXISTS signature_url text;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signatures bucket
CREATE POLICY "Signatures are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete signatures"
ON storage.objects FOR DELETE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');