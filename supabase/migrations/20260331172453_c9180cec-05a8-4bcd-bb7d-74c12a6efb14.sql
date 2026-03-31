
CREATE TABLE public.echantillons_carottage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  date_essai DATE,
  ouvrage TEXT,
  partie_ouvrage TEXT,
  localisation TEXT,
  diametre_carotte TEXT,
  longueur_carotte NUMERIC,
  direction_carottage TEXT,
  presence_armatures BOOLEAN DEFAULT false,
  etat_surface TEXT,
  classe_resistance TEXT,
  observations TEXT,
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.echantillons_carottage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to echantillons_carottage"
  ON public.echantillons_carottage
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_echantillons_carottage_updated_at
  BEFORE UPDATE ON public.echantillons_carottage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
