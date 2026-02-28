
-- Table principale: Liste du matériel
CREATE TABLE public.materiel_laboratoire (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  reference TEXT,
  numero_serie TEXT,
  categorie TEXT NOT NULL DEFAULT 'general',
  marque TEXT,
  modele TEXT,
  date_acquisition DATE,
  etat TEXT NOT NULL DEFAULT 'operationnel',
  localisation TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.materiel_laboratoire ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on materiel_laboratoire" ON public.materiel_laboratoire FOR SELECT USING (true);
CREATE POLICY "Allow public insert on materiel_laboratoire" ON public.materiel_laboratoire FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on materiel_laboratoire" ON public.materiel_laboratoire FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on materiel_laboratoire" ON public.materiel_laboratoire FOR DELETE USING (true);

-- Table: Affectation matériel
CREATE TABLE public.affectation_materiel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materiel_id UUID NOT NULL REFERENCES public.materiel_laboratoire(id) ON DELETE CASCADE,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  intervenant_id UUID REFERENCES public.intervenants(id) ON DELETE SET NULL,
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE,
  statut TEXT NOT NULL DEFAULT 'en_cours',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affectation_materiel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on affectation_materiel" ON public.affectation_materiel FOR SELECT USING (true);
CREATE POLICY "Allow public insert on affectation_materiel" ON public.affectation_materiel FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on affectation_materiel" ON public.affectation_materiel FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on affectation_materiel" ON public.affectation_materiel FOR DELETE USING (true);

-- Table: Étalonnage matériel
CREATE TABLE public.etalonnage_materiel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materiel_id UUID NOT NULL REFERENCES public.materiel_laboratoire(id) ON DELETE CASCADE,
  date_etalonnage DATE NOT NULL DEFAULT CURRENT_DATE,
  date_prochain_etalonnage DATE,
  organisme TEXT,
  numero_certificat TEXT,
  resultat TEXT NOT NULL DEFAULT 'conforme',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.etalonnage_materiel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on etalonnage_materiel" ON public.etalonnage_materiel FOR SELECT USING (true);
CREATE POLICY "Allow public insert on etalonnage_materiel" ON public.etalonnage_materiel FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on etalonnage_materiel" ON public.etalonnage_materiel FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on etalonnage_materiel" ON public.etalonnage_materiel FOR DELETE USING (true);

-- Table: Maintenance matériel
CREATE TABLE public.maintenance_materiel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materiel_id UUID NOT NULL REFERENCES public.materiel_laboratoire(id) ON DELETE CASCADE,
  type_maintenance TEXT NOT NULL DEFAULT 'preventive',
  date_maintenance DATE NOT NULL DEFAULT CURRENT_DATE,
  date_prochaine_maintenance DATE,
  description TEXT,
  cout NUMERIC,
  prestataire TEXT,
  statut TEXT NOT NULL DEFAULT 'planifie',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_materiel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on maintenance_materiel" ON public.maintenance_materiel FOR SELECT USING (true);
CREATE POLICY "Allow public insert on maintenance_materiel" ON public.maintenance_materiel FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on maintenance_materiel" ON public.maintenance_materiel FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on maintenance_materiel" ON public.maintenance_materiel FOR DELETE USING (true);

-- Triggers updated_at
CREATE TRIGGER update_materiel_laboratoire_updated_at BEFORE UPDATE ON public.materiel_laboratoire FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affectation_materiel_updated_at BEFORE UPDATE ON public.affectation_materiel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_etalonnage_materiel_updated_at BEFORE UPDATE ON public.etalonnage_materiel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_materiel_updated_at BEFORE UPDATE ON public.maintenance_materiel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
