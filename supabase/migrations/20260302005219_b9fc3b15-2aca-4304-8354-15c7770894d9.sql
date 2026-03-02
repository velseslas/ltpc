
-- Table prestataires
CREATE TABLE public.prestataires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  ville TEXT,
  specialite TEXT,
  statut TEXT NOT NULL DEFAULT 'actif',
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prestataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prestataires" ON public.prestataires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert prestataires" ON public.prestataires FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update prestataires" ON public.prestataires FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete prestataires" ON public.prestataires FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_prestataires_updated_at BEFORE UPDATE ON public.prestataires FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table bons de commande prestataire
CREATE TABLE public.bons_commande_prestataire (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
  date_commande DATE NOT NULL DEFAULT CURRENT_DATE,
  objet TEXT,
  montant_ht NUMERIC NOT NULL DEFAULT 0,
  taux_tva NUMERIC NOT NULL DEFAULT 19,
  montant_tva NUMERIC NOT NULL DEFAULT 0,
  montant_ttc NUMERIC NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bons_commande_prestataire ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bons_commande_prestataire" ON public.bons_commande_prestataire FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bons_commande_prestataire" ON public.bons_commande_prestataire FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bons_commande_prestataire" ON public.bons_commande_prestataire FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete bons_commande_prestataire" ON public.bons_commande_prestataire FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_bons_commande_prestataire_updated_at BEFORE UPDATE ON public.bons_commande_prestataire FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
