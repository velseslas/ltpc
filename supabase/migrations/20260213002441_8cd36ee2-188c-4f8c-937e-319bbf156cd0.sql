
-- ============================================
-- ESSAIS GÉOTECHNIQUES - 16 TABLES
-- ============================================

-- === IDENTIFICATION ===

CREATE SEQUENCE IF NOT EXISTS echantillons_limites_atterberg_numero_seq;
CREATE TABLE public.echantillons_limites_atterberg (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_limites_atterberg_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_limites_atterberg ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_limites_atterberg" ON public.echantillons_limites_atterberg FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_limites_atterberg" ON public.echantillons_limites_atterberg FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_limites_atterberg" ON public.echantillons_limites_atterberg FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_limites_atterberg" ON public.echantillons_limites_atterberg FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_limites_atterberg_updated_at BEFORE UPDATE ON public.echantillons_limites_atterberg FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_granulometrie_sol_numero_seq;
CREATE TABLE public.echantillons_granulometrie_sol (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_granulometrie_sol_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_granulometrie_sol ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_granulometrie_sol" ON public.echantillons_granulometrie_sol FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_granulometrie_sol" ON public.echantillons_granulometrie_sol FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_granulometrie_sol" ON public.echantillons_granulometrie_sol FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_granulometrie_sol" ON public.echantillons_granulometrie_sol FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_granulometrie_sol_updated_at BEFORE UPDATE ON public.echantillons_granulometrie_sol FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_teneur_eau_sol_numero_seq;
CREATE TABLE public.echantillons_teneur_eau_sol (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_teneur_eau_sol_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_teneur_eau_sol ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_teneur_eau_sol" ON public.echantillons_teneur_eau_sol FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_teneur_eau_sol" ON public.echantillons_teneur_eau_sol FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_teneur_eau_sol" ON public.echantillons_teneur_eau_sol FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_teneur_eau_sol" ON public.echantillons_teneur_eau_sol FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_teneur_eau_sol_updated_at BEFORE UPDATE ON public.echantillons_teneur_eau_sol FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_classification_sol_numero_seq;
CREATE TABLE public.echantillons_classification_sol (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_classification_sol_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_classification_sol ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_classification_sol" ON public.echantillons_classification_sol FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_classification_sol" ON public.echantillons_classification_sol FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_classification_sol" ON public.echantillons_classification_sol FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_classification_sol" ON public.echantillons_classification_sol FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_classification_sol_updated_at BEFORE UPDATE ON public.echantillons_classification_sol FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === COMPACTAGE ===

CREATE SEQUENCE IF NOT EXISTS echantillons_proctor_normal_numero_seq;
CREATE TABLE public.echantillons_proctor_normal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_proctor_normal_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_proctor_normal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_proctor_normal" ON public.echantillons_proctor_normal FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_proctor_normal" ON public.echantillons_proctor_normal FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_proctor_normal" ON public.echantillons_proctor_normal FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_proctor_normal" ON public.echantillons_proctor_normal FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_proctor_normal_updated_at BEFORE UPDATE ON public.echantillons_proctor_normal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_proctor_modifie_numero_seq;
CREATE TABLE public.echantillons_proctor_modifie (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_proctor_modifie_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_proctor_modifie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_proctor_modifie" ON public.echantillons_proctor_modifie FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_proctor_modifie" ON public.echantillons_proctor_modifie FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_proctor_modifie" ON public.echantillons_proctor_modifie FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_proctor_modifie" ON public.echantillons_proctor_modifie FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_proctor_modifie_updated_at BEFORE UPDATE ON public.echantillons_proctor_modifie FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_cbr_numero_seq;
CREATE TABLE public.echantillons_cbr (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_cbr_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_cbr ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_cbr" ON public.echantillons_cbr FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_cbr" ON public.echantillons_cbr FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_cbr" ON public.echantillons_cbr FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_cbr" ON public.echantillons_cbr FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_cbr_updated_at BEFORE UPDATE ON public.echantillons_cbr FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_densite_place_numero_seq;
CREATE TABLE public.echantillons_densite_place (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_densite_place_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_densite_place ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_densite_place" ON public.echantillons_densite_place FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_densite_place" ON public.echantillons_densite_place FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_densite_place" ON public.echantillons_densite_place FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_densite_place" ON public.echantillons_densite_place FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_densite_place_updated_at BEFORE UPDATE ON public.echantillons_densite_place FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === MÉCANIQUES ===

CREATE SEQUENCE IF NOT EXISTS echantillons_cisaillement_numero_seq;
CREATE TABLE public.echantillons_cisaillement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_cisaillement_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_cisaillement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_cisaillement" ON public.echantillons_cisaillement FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_cisaillement" ON public.echantillons_cisaillement FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_cisaillement" ON public.echantillons_cisaillement FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_cisaillement" ON public.echantillons_cisaillement FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_cisaillement_updated_at BEFORE UPDATE ON public.echantillons_cisaillement FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_compression_simple_numero_seq;
CREATE TABLE public.echantillons_compression_simple (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_compression_simple_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_compression_simple ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_compression_simple" ON public.echantillons_compression_simple FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_compression_simple" ON public.echantillons_compression_simple FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_compression_simple" ON public.echantillons_compression_simple FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_compression_simple" ON public.echantillons_compression_simple FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_compression_simple_updated_at BEFORE UPDATE ON public.echantillons_compression_simple FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_triaxial_numero_seq;
CREATE TABLE public.echantillons_triaxial (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_triaxial_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_triaxial ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_triaxial" ON public.echantillons_triaxial FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_triaxial" ON public.echantillons_triaxial FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_triaxial" ON public.echantillons_triaxial FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_triaxial" ON public.echantillons_triaxial FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_triaxial_updated_at BEFORE UPDATE ON public.echantillons_triaxial FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_oedometrique_numero_seq;
CREATE TABLE public.echantillons_oedometrique (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_oedometrique_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_oedometrique ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_oedometrique" ON public.echantillons_oedometrique FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_oedometrique" ON public.echantillons_oedometrique FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_oedometrique" ON public.echantillons_oedometrique FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_oedometrique" ON public.echantillons_oedometrique FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_oedometrique_updated_at BEFORE UPDATE ON public.echantillons_oedometrique FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === IN-SITU ===

CREATE SEQUENCE IF NOT EXISTS echantillons_penetrometre_numero_seq;
CREATE TABLE public.echantillons_penetrometre (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_penetrometre_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_penetrometre ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_penetrometre" ON public.echantillons_penetrometre FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_penetrometre" ON public.echantillons_penetrometre FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_penetrometre" ON public.echantillons_penetrometre FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_penetrometre" ON public.echantillons_penetrometre FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_penetrometre_updated_at BEFORE UPDATE ON public.echantillons_penetrometre FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_pressiometre_numero_seq;
CREATE TABLE public.echantillons_pressiometre (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_pressiometre_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_pressiometre ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_pressiometre" ON public.echantillons_pressiometre FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_pressiometre" ON public.echantillons_pressiometre FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_pressiometre" ON public.echantillons_pressiometre FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_pressiometre" ON public.echantillons_pressiometre FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_pressiometre_updated_at BEFORE UPDATE ON public.echantillons_pressiometre FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_plaque_numero_seq;
CREATE TABLE public.echantillons_plaque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_plaque_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_plaque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_plaque" ON public.echantillons_plaque FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_plaque" ON public.echantillons_plaque FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_plaque" ON public.echantillons_plaque FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_plaque" ON public.echantillons_plaque FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_plaque_updated_at BEFORE UPDATE ON public.echantillons_plaque FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS echantillons_sondage_numero_seq;
CREATE TABLE public.echantillons_sondage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('echantillons_sondage_numero_seq'),
  chantier_id UUID REFERENCES public.chantiers(id),
  client_id UUID REFERENCES public.clients(id),
  type_sol TEXT NOT NULL,
  profondeur TEXT,
  date_prelevement DATE NOT NULL DEFAULT CURRENT_DATE,
  operateur_id UUID REFERENCES public.intervenants(id),
  resultats JSONB,
  statut TEXT NOT NULL DEFAULT 'a-faire',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.echantillons_sondage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on echantillons_sondage" ON public.echantillons_sondage FOR SELECT USING (true);
CREATE POLICY "Allow public insert on echantillons_sondage" ON public.echantillons_sondage FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on echantillons_sondage" ON public.echantillons_sondage FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on echantillons_sondage" ON public.echantillons_sondage FOR DELETE USING (true);
CREATE TRIGGER update_echantillons_sondage_updated_at BEFORE UPDATE ON public.echantillons_sondage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
