-- Create table for Module d'Élasticité samples (NF EN 12390-13)
CREATE TABLE public.echantillons_module_elasticite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  centrale_id UUID REFERENCES public.centrales_beton(id) ON DELETE SET NULL,
  formulation_id UUID REFERENCES public.formulations(id) ON DELETE SET NULL,
  operateur_id UUID REFERENCES public.intervenants(id) ON DELETE SET NULL,
  ouvrage TEXT,
  destination_beton TEXT,
  condition_cure TEXT DEFAULT 'eau',
  type_eprouvette TEXT DEFAULT 'cylindrique',
  dimension_eprouvette TEXT DEFAULT '160x320',
  nombre_eprouvettes INTEGER DEFAULT 3,
  jours_essai JSONB DEFAULT '[{"jour": 28, "nombre": 3}]',
  date_coulage DATE,
  temperature_beton NUMERIC(5,1),
  temperature_air NUMERIC(5,1),
  classe_consistance TEXT,
  essai_convenance BOOLEAN NOT NULL DEFAULT false,
  essai_convenance_details TEXT,
  statut TEXT NOT NULL DEFAULT 'en-attente',
  observations TEXT,
  resultats JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Perméabilité samples (NF EN 12390-8)
CREATE TABLE public.echantillons_permeabilite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  centrale_id UUID REFERENCES public.centrales_beton(id) ON DELETE SET NULL,
  formulation_id UUID REFERENCES public.formulations(id) ON DELETE SET NULL,
  operateur_id UUID REFERENCES public.intervenants(id) ON DELETE SET NULL,
  ouvrage TEXT,
  destination_beton TEXT,
  condition_cure TEXT DEFAULT 'eau',
  type_eprouvette TEXT DEFAULT 'cylindrique',
  dimension_eprouvette TEXT DEFAULT '150x300',
  nombre_eprouvettes INTEGER DEFAULT 3,
  jours_essai JSONB DEFAULT '[{"jour": 28, "nombre": 3}]',
  date_coulage DATE,
  temperature_beton NUMERIC(5,1),
  temperature_air NUMERIC(5,1),
  classe_consistance TEXT,
  pression_essai NUMERIC(5,1) DEFAULT 500,
  duree_essai INTEGER DEFAULT 72,
  essai_convenance BOOLEAN NOT NULL DEFAULT false,
  essai_convenance_details TEXT,
  statut TEXT NOT NULL DEFAULT 'en-attente',
  observations TEXT,
  resultats JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.echantillons_module_elasticite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echantillons_permeabilite ENABLE ROW LEVEL SECURITY;

-- RLS policies for Module d'Élasticité
CREATE POLICY "Allow all operations on echantillons_module_elasticite" 
ON public.echantillons_module_elasticite 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- RLS policies for Perméabilité
CREATE POLICY "Allow all operations on echantillons_permeabilite" 
ON public.echantillons_permeabilite 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_echantillons_module_elasticite_updated_at
  BEFORE UPDATE ON public.echantillons_module_elasticite
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_echantillons_permeabilite_updated_at
  BEFORE UPDATE ON public.echantillons_permeabilite
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();