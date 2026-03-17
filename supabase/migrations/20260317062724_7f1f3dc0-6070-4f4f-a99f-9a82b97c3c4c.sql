
-- Table for Scléromètre samples
CREATE TABLE public.echantillons_sclerometre (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  element_teste TEXT,
  localisation TEXT,
  orientation TEXT DEFAULT 'horizontale',
  date_essai DATE NOT NULL DEFAULT CURRENT_DATE,
  age_beton_jours INTEGER,
  classe_resistance TEXT,
  observations TEXT,
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Ultrason samples
CREATE TABLE public.echantillons_ultrason (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  element_teste TEXT,
  localisation TEXT,
  mode_transmission TEXT DEFAULT 'direct',
  frequence_khz NUMERIC,
  date_essai DATE NOT NULL DEFAULT CURRENT_DATE,
  age_beton_jours INTEGER,
  classe_resistance TEXT,
  observations TEXT,
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.echantillons_sclerometre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echantillons_ultrason ENABLE ROW LEVEL SECURITY;

-- RLS policies for sclerometre
CREATE POLICY "Authenticated users can view sclerometre samples" ON public.echantillons_sclerometre FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sclerometre samples" ON public.echantillons_sclerometre FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sclerometre samples" ON public.echantillons_sclerometre FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete sclerometre samples" ON public.echantillons_sclerometre FOR DELETE TO authenticated USING (true);

-- RLS policies for ultrason
CREATE POLICY "Authenticated users can view ultrason samples" ON public.echantillons_ultrason FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ultrason samples" ON public.echantillons_ultrason FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ultrason samples" ON public.echantillons_ultrason FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete ultrason samples" ON public.echantillons_ultrason FOR DELETE TO authenticated USING (true);
