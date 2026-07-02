
DO $$ BEGIN
  CREATE TYPE public.rapport_statut AS ENUM (
    'brouillon','en_cours','a_completer','en_attente_validation','valide','refuse','archive'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.rapport_gravite AS ENUM ('faible','moderee','elevee','critique');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.rapport_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icone TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rapport_categories TO authenticated;
GRANT ALL ON public.rapport_categories TO service_role;
ALTER TABLE public.rapport_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_read" ON public.rapport_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat_admin" ON public.rapport_categories FOR ALL TO authenticated
  USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());
CREATE TRIGGER trg_cat_upd BEFORE UPDATE ON public.rapport_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.rapport_modeles_bibliotheque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie_id UUID REFERENCES public.rapport_categories(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  prompt_template TEXT,
  structure_default JSONB NOT NULL DEFAULT '{}'::jsonb,
  ordre INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rapport_modeles_bibliotheque TO authenticated;
GRANT ALL ON public.rapport_modeles_bibliotheque TO service_role;
ALTER TABLE public.rapport_modeles_bibliotheque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mod_read" ON public.rapport_modeles_bibliotheque FOR SELECT TO authenticated USING (true);
CREATE POLICY "mod_admin" ON public.rapport_modeles_bibliotheque FOR ALL TO authenticated
  USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());
CREATE TRIGGER trg_mod_upd BEFORE UPDATE ON public.rapport_modeles_bibliotheque
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.rapports_techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE,
  titre TEXT,
  description_probleme TEXT NOT NULL,
  categorie_id UUID REFERENCES public.rapport_categories(id) ON DELETE SET NULL,
  modele_id UUID REFERENCES public.rapport_modeles_bibliotheque(id) ON DELETE SET NULL,
  sous_type TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  materiau TEXT,
  date_probleme DATE,
  statut public.rapport_statut NOT NULL DEFAULT 'brouillon',
  analyse_ia JSONB DEFAULT '{}'::jsonb,
  gravite public.rapport_gravite,
  contenu_rapport JSONB DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  technicien_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ingenieur_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  soumis_at TIMESTAMPTZ,
  valide_at TIMESTAMPTZ,
  refuse_at TIMESTAMPTZ,
  motif_refus TEXT,
  pdf_url TEXT,
  qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rapports_statut ON public.rapports_techniques(statut);
CREATE INDEX IF NOT EXISTS idx_rapports_client ON public.rapports_techniques(client_id);
CREATE INDEX IF NOT EXISTS idx_rapports_chantier ON public.rapports_techniques(chantier_id);
CREATE INDEX IF NOT EXISTS idx_rapports_tech ON public.rapports_techniques(technicien_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rapports_techniques TO authenticated;
GRANT ALL ON public.rapports_techniques TO service_role;
ALTER TABLE public.rapports_techniques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rap_read" ON public.rapports_techniques FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'manager')
    OR public.has_role(auth.uid(),'ingenieur')
    OR technicien_id = auth.uid()
    OR created_by = auth.uid()
  );
CREATE POLICY "rap_insert" ON public.rapports_techniques FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "rap_update" ON public.rapports_techniques FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'manager')
    OR public.has_role(auth.uid(),'ingenieur')
    OR (technicien_id = auth.uid() AND statut IN ('brouillon','a_completer','en_cours'))
    OR (created_by = auth.uid() AND statut IN ('brouillon','a_completer','en_cours'))
  );
CREATE POLICY "rap_delete" ON public.rapports_techniques FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );
CREATE TRIGGER trg_rap_upd BEFORE UPDATE ON public.rapports_techniques
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.next_rapport_numero()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_year TEXT := to_char(now(),'YYYY');
  v_n INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(numero,'^RAPP-'||v_year||'-',''),'')::int),0)+1
    INTO v_n FROM public.rapports_techniques
    WHERE numero LIKE 'RAPP-'||v_year||'-%';
  RETURN 'RAPP-'||v_year||'-'||lpad(v_n::text,4,'0');
END $$;

CREATE OR REPLACE FUNCTION public.assign_rapport_numero()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.statut = 'valide' AND (NEW.numero IS NULL OR NEW.numero = '') THEN
    NEW.numero := public.next_rapport_numero();
    IF NEW.valide_at IS NULL THEN NEW.valide_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_assign_rap_num BEFORE INSERT OR UPDATE ON public.rapports_techniques
  FOR EACH ROW EXECUTE FUNCTION public.assign_rapport_numero();

CREATE TABLE IF NOT EXISTS public.rapport_pieces_jointes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID NOT NULL REFERENCES public.rapports_techniques(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  nom TEXT NOT NULL,
  url TEXT,
  storage_path TEXT,
  essai_ref TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pj_rapport ON public.rapport_pieces_jointes(rapport_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rapport_pieces_jointes TO authenticated;
GRANT ALL ON public.rapport_pieces_jointes TO service_role;
ALTER TABLE public.rapport_pieces_jointes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pj_read" ON public.rapport_pieces_jointes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));
CREATE POLICY "pj_ins" ON public.rapport_pieces_jointes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));
CREATE POLICY "pj_upd" ON public.rapport_pieces_jointes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));
CREATE POLICY "pj_del" ON public.rapport_pieces_jointes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));

CREATE TABLE IF NOT EXISTS public.rapport_questions_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID NOT NULL REFERENCES public.rapports_techniques(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  reponse TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_q_rapport ON public.rapport_questions_ia(rapport_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rapport_questions_ia TO authenticated;
GRANT ALL ON public.rapport_questions_ia TO service_role;
ALTER TABLE public.rapport_questions_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "q_read" ON public.rapport_questions_ia FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));
CREATE POLICY "q_write" ON public.rapport_questions_ia FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));

CREATE TABLE IF NOT EXISTS public.rapport_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID NOT NULL REFERENCES public.rapports_techniques(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  ancien_contenu JSONB,
  nouveau_contenu JSONB,
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hist_rapport ON public.rapport_historique(rapport_id);
GRANT SELECT, INSERT ON public.rapport_historique TO authenticated;
GRANT ALL ON public.rapport_historique TO service_role;
ALTER TABLE public.rapport_historique ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hist_read" ON public.rapport_historique FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));
CREATE POLICY "hist_ins" ON public.rapport_historique FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.rapports_techniques r WHERE r.id = rapport_id));

INSERT INTO public.rapport_categories (nom, slug, icone, ordre) VALUES
  ('Béton','beton','Layers',1),
  ('Granulats','granulats','Boxes',2),
  ('Ciment','ciment','Package',3),
  ('Adjuvant','adjuvant','FlaskConical',4),
  ('Acier','acier','Bolt',5),
  ('Chantier','chantier','HardHat',6),
  ('Essais','essais','TestTube',7),
  ('Non-conformités','non-conformites','AlertTriangle',8),
  ('Réclamations','reclamations','MessageSquareWarning',9),
  ('Audit','audit','ClipboardCheck',10),
  ('Autres','autres','MoreHorizontal',11)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.rapport_modeles_bibliotheque (categorie_id, titre, slug, description, ordre) VALUES
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Résistance insuffisante','beton-resistance-insuffisante','Résistance à la compression inférieure au requis',1),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Affaissement non conforme','beton-affaissement-non-conforme','Slump hors classe de consistance',2),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Ségrégation','beton-segregation','Séparation des constituants',3),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Ressuage','beton-ressuage','Remontée d''eau excessive',4),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Bétonnage sous pluie','beton-pluie','Coulage en conditions défavorables',5),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Bétonnage par forte chaleur','beton-chaleur','Coulage sous température élevée',6),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Temps de prise anormal','beton-prise','Prise trop rapide ou trop lente',7),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Absence de cure','beton-cure','Cure du béton non réalisée',8),
  ((SELECT id FROM public.rapport_categories WHERE slug='beton'), 'Décoffrage prématuré','beton-decoffrage','Décoffrage avant délai',9),
  ((SELECT id FROM public.rapport_categories WHERE slug='granulats'), 'Sable non conforme','granulat-sable-nc','Sable ne respectant pas les spécifications',1),
  ((SELECT id FROM public.rapport_categories WHERE slug='granulats'), 'Granulométrie hors fuseau','granulat-granulo-hors-fuseau','Courbe granulométrique en dehors du fuseau',2),
  ((SELECT id FROM public.rapport_categories WHERE slug='granulats'), 'Équivalent de sable insuffisant','granulat-es-faible','ES en dessous du seuil',3),
  ((SELECT id FROM public.rapport_categories WHERE slug='granulats'), 'Excès de fines','granulat-exces-fines','Taux de fines élevé',4),
  ((SELECT id FROM public.rapport_categories WHERE slug='granulats'), 'Changement de carrière','granulat-changement-carriere','Origine de matériau modifiée',5),
  ((SELECT id FROM public.rapport_categories WHERE slug='ciment'), 'Changement de ciment','ciment-changement','Substitution du ciment validé',1),
  ((SELECT id FROM public.rapport_categories WHERE slug='adjuvant'), 'Changement d''adjuvant','adjuvant-changement','Substitution de l''adjuvant validé',1),
  ((SELECT id FROM public.rapport_categories WHERE slug='essais'), 'Carottes non conformes','essais-carottes-nc','Résultats de carottage non conformes',1),
  ((SELECT id FROM public.rapport_categories WHERE slug='essais'), 'Éprouvettes non conformes','essais-eprouvettes-nc','Éprouvettes défectueuses',2),
  ((SELECT id FROM public.rapport_categories WHERE slug='essais'), 'Essais incohérents','essais-incoherents','Résultats d''essais aberrants',3),
  ((SELECT id FROM public.rapport_categories WHERE slug='non-conformites'), 'Non-respect de formulation','nc-formulation','Formulation validée non respectée',1),
  ((SELECT id FROM public.rapport_categories WHERE slug='non-conformites'), 'Utilisation d''un matériau non validé','nc-materiau-non-valide','Matériau non validé mis en oeuvre',2)
ON CONFLICT (slug) DO NOTHING;
