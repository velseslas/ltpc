
-- Table pour Lettres d'engagement
CREATE TABLE public.lettres_engagement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  numero TEXT,
  titre TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  montant NUMERIC(12,2),
  observations TEXT,
  document_url TEXT,
  document_nom TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour Offres de service
CREATE TABLE public.offres_service (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  numero TEXT,
  titre TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  observations TEXT,
  document_url TEXT,
  document_nom TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour Offres de prix
CREATE TABLE public.offres_prix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  numero TEXT,
  titre TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  montant_ht NUMERIC(12,2),
  montant_ttc NUMERIC(12,2),
  observations TEXT,
  document_url TEXT,
  document_nom TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour Attestations de bonne exécution
CREATE TABLE public.attestations_bonne_execution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  numero TEXT,
  titre TEXT NOT NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  date_debut DATE,
  date_fin DATE,
  observations TEXT,
  document_url TEXT,
  document_nom TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lettres_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offres_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offres_prix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations_bonne_execution ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can manage lettres_engagement" ON public.lettres_engagement FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage offres_service" ON public.offres_service FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage offres_prix" ON public.offres_prix FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage attestations_bonne_execution" ON public.attestations_bonne_execution FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at triggers
CREATE TRIGGER update_lettres_engagement_updated_at BEFORE UPDATE ON public.lettres_engagement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offres_service_updated_at BEFORE UPDATE ON public.offres_service FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offres_prix_updated_at BEFORE UPDATE ON public.offres_prix FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attestations_bonne_execution_updated_at BEFORE UPDATE ON public.attestations_bonne_execution FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
