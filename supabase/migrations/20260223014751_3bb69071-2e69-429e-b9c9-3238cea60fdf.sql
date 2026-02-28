
CREATE TABLE public.documents_administratifs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  document_url TEXT,
  document_nom TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents_administratifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents_administratifs"
  ON public.documents_administratifs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert documents_administratifs"
  ON public.documents_administratifs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents_administratifs"
  ON public.documents_administratifs FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete documents_administratifs"
  ON public.documents_administratifs FOR DELETE
  TO authenticated USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('documents-administratifs', 'documents-administratifs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents administratifs"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'documents-administratifs');

CREATE POLICY "Anyone can view documents administratifs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents-administratifs');

CREATE POLICY "Authenticated users can delete documents administratifs"
  ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'documents-administratifs');
