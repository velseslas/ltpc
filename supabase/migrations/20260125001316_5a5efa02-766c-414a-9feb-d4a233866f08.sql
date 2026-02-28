
-- Create sequences first
CREATE SEQUENCE IF NOT EXISTS public.echantillons_affaissement_numero_seq;
CREATE SEQUENCE IF NOT EXISTS public.echantillons_temperature_numero_seq;
CREATE SEQUENCE IF NOT EXISTS public.echantillons_temps_prise_numero_seq;
CREATE SEQUENCE IF NOT EXISTS public.echantillons_teneur_air_numero_seq;

-- 1. Affaissement (Slump test) - NF EN 12350-2
CREATE TABLE public.echantillons_affaissement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('public.echantillons_affaissement_numero_seq'::regclass),
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  centrale_id UUID REFERENCES public.centrales_beton(id),
  formulation_id UUID REFERENCES public.formulations(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_prelevement TIME,
  temperature_beton NUMERIC,
  temperature_air NUMERIC,
  classe_consistance TEXT,
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Température - NF EN 12350-1
CREATE TABLE public.echantillons_temperature (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('public.echantillons_temperature_numero_seq'::regclass),
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  centrale_id UUID REFERENCES public.centrales_beton(id),
  formulation_id UUID REFERENCES public.formulations(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_prelevement TIME,
  temperature_ambiante NUMERIC,
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Temps de Prise - NF EN 480-2
CREATE TABLE public.echantillons_temps_prise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('public.echantillons_temps_prise_numero_seq'::regclass),
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  centrale_id UUID REFERENCES public.centrales_beton(id),
  formulation_id UUID REFERENCES public.formulations(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_prelevement TIME,
  temperature_beton NUMERIC,
  temperature_air NUMERIC,
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Teneur en Air - NF EN 12350-7
CREATE TABLE public.echantillons_teneur_air (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('public.echantillons_teneur_air_numero_seq'::regclass),
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  centrale_id UUID REFERENCES public.centrales_beton(id),
  formulation_id UUID REFERENCES public.formulations(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_prelevement TIME,
  temperature_beton NUMERIC,
  temperature_air NUMERIC,
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.echantillons_affaissement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echantillons_temperature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echantillons_temps_prise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echantillons_teneur_air ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for echantillons_affaissement
CREATE POLICY "Allow public read on echantillons_affaissement" ON public.echantillons_affaissement FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_affaissement" ON public.echantillons_affaissement FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_affaissement" ON public.echantillons_affaissement FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_affaissement" ON public.echantillons_affaissement FOR DELETE USING (true);

-- Create RLS policies for echantillons_temperature
CREATE POLICY "Allow public read on echantillons_temperature" ON public.echantillons_temperature FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_temperature" ON public.echantillons_temperature FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_temperature" ON public.echantillons_temperature FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_temperature" ON public.echantillons_temperature FOR DELETE USING (true);

-- Create RLS policies for echantillons_temps_prise
CREATE POLICY "Allow public read on echantillons_temps_prise" ON public.echantillons_temps_prise FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_temps_prise" ON public.echantillons_temps_prise FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_temps_prise" ON public.echantillons_temps_prise FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_temps_prise" ON public.echantillons_temps_prise FOR DELETE USING (true);

-- Create RLS policies for echantillons_teneur_air
CREATE POLICY "Allow public read on echantillons_teneur_air" ON public.echantillons_teneur_air FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_teneur_air" ON public.echantillons_teneur_air FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_teneur_air" ON public.echantillons_teneur_air FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_teneur_air" ON public.echantillons_teneur_air FOR DELETE USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_echantillons_affaissement_updated_at
  BEFORE UPDATE ON public.echantillons_affaissement
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_echantillons_temperature_updated_at
  BEFORE UPDATE ON public.echantillons_temperature
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_echantillons_temps_prise_updated_at
  BEFORE UPDATE ON public.echantillons_temps_prise
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_echantillons_teneur_air_updated_at
  BEFORE UPDATE ON public.echantillons_teneur_air
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
