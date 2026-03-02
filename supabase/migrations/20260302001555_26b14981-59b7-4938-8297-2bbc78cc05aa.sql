
-- Table Factures
CREATE TABLE public.factures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  montant_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 19,
  montant_tva NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_paye NUMERIC(12,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table Devis
CREATE TABLE public.devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_validite DATE,
  montant_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 19,
  montant_tva NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table Bons de commande
CREATE TABLE public.bons_commande (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  chantier_id UUID REFERENCES public.chantiers(id),
  date_commande DATE NOT NULL DEFAULT CURRENT_DATE,
  montant_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 19,
  montant_tva NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table Paiements Virement
CREATE TABLE public.paiements_virement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  facture_id UUID REFERENCES public.factures(id),
  montant NUMERIC(12,2) NOT NULL,
  date_virement DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_virement TEXT,
  banque TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add facture_id to paiements_espece
ALTER TABLE public.paiements_espece ADD COLUMN IF NOT EXISTS facture_id UUID REFERENCES public.factures(id);

-- Lignes de facture
CREATE TABLE public.lignes_facture (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite NUMERIC(10,2) NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant NUMERIC(12,2) NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lignes de devis
CREATE TABLE public.lignes_devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  devis_id UUID NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite NUMERIC(10,2) NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant NUMERIC(12,2) NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lignes de bon de commande
CREATE TABLE public.lignes_bon_commande (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bon_commande_id UUID NOT NULL REFERENCES public.bons_commande(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite NUMERIC(10,2) NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant NUMERIC(12,2) NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Triggers updated_at
CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bons_commande_updated_at BEFORE UPDATE ON public.bons_commande FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_paiements_virement_updated_at BEFORE UPDATE ON public.paiements_virement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements_virement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_facture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_bon_commande ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage factures" ON public.factures FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage devis" ON public.devis FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage bons_commande" ON public.bons_commande FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage paiements_virement" ON public.paiements_virement FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage lignes_facture" ON public.lignes_facture FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage lignes_devis" ON public.lignes_devis FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage lignes_bon_commande" ON public.lignes_bon_commande FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
