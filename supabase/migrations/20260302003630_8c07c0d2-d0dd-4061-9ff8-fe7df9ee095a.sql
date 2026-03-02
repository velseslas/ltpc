CREATE TABLE public.prix_essais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_essai TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'autre',
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  unite TEXT NOT NULL DEFAULT 'essai',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prix_essais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage prix_essais" ON public.prix_essais
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');