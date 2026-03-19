CREATE TABLE public.echantillons_densitometre (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL NOT NULL,
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  type_sol TEXT NOT NULL DEFAULT 'Non spécifié',
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT now(),
  statut TEXT NOT NULL DEFAULT 'a-faire',
  resultats JSONB,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.echantillons_densitometre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.echantillons_densitometre
  FOR ALL TO authenticated USING (true) WITH CHECK (true);