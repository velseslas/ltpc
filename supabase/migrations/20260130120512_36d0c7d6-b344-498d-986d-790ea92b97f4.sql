-- Create table for splitting tensile test samples (Traction par Fendage)
CREATE TABLE public.echantillons_traction_fendage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  centrale_id UUID REFERENCES public.centrales_beton(id),
  formulation_id UUID REFERENCES public.formulations(id),
  operateur_id UUID REFERENCES public.intervenants(id),
  ouvrage TEXT,
  destination_beton TEXT,
  condition_cure TEXT DEFAULT 'standard',
  type_eprouvette TEXT DEFAULT 'cylindre',
  dimension_eprouvette TEXT DEFAULT '16x32',
  nombre_eprouvettes INTEGER DEFAULT 3,
  jours_essai JSONB,
  date_coulage DATE,
  temperature_beton NUMERIC,
  temperature_air NUMERIC,
  classe_consistance TEXT,
  essai_convenance BOOLEAN DEFAULT false,
  essai_convenance_details TEXT,
  statut TEXT DEFAULT 'a-faire' CHECK (statut IN ('a-faire', 'en-cours', 'termine')),
  observations TEXT,
  resultats JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.echantillons_traction_fendage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for full access (can be refined later based on user roles)
CREATE POLICY "Allow read access to all users"
  ON public.echantillons_traction_fendage
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to all users"
  ON public.echantillons_traction_fendage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to all users"
  ON public.echantillons_traction_fendage
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete access to all users"
  ON public.echantillons_traction_fendage
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_echantillons_traction_fendage_updated_at
  BEFORE UPDATE ON public.echantillons_traction_fendage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();