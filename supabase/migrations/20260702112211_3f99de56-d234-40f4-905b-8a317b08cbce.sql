
CREATE TABLE IF NOT EXISTS public.rapport_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id uuid NOT NULL REFERENCES public.rapports_techniques(id) ON DELETE CASCADE,
  version integer NOT NULL,
  titre text,
  contenu jsonb,
  editor_html text,
  commentaire text,
  event_type text NOT NULL DEFAULT 'edition',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rapport_id, version)
);
GRANT SELECT, INSERT ON public.rapport_versions TO authenticated;
GRANT ALL ON public.rapport_versions TO service_role;
ALTER TABLE public.rapport_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versions_select_auth" ON public.rapport_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "versions_insert_auth" ON public.rapport_versions FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
CREATE INDEX IF NOT EXISTS idx_rapport_versions_r ON public.rapport_versions(rapport_id, version DESC);

CREATE TABLE IF NOT EXISTS public.rapport_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  entreprise_id uuid,
  logo_url text,
  header_html text,
  footer_html text,
  couleur_primaire text DEFAULT '#0f3460',
  couleur_secondaire text DEFAULT '#e94560',
  marge_haut integer DEFAULT 20,
  marge_bas integer DEFAULT 20,
  marge_gauche integer DEFAULT 15,
  marge_droite integer DEFAULT 15,
  numerotation_format text DEFAULT 'Page {n} / {total}',
  actif boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rapport_templates TO authenticated;
GRANT ALL ON public.rapport_templates TO service_role;
ALTER TABLE public.rapport_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select_auth" ON public.rapport_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_admin_all" ON public.rapport_templates FOR ALL TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

INSERT INTO public.rapport_templates(nom, description, is_default)
SELECT 'Modèle standard', 'Template par défaut du laboratoire', true
WHERE NOT EXISTS (SELECT 1 FROM public.rapport_templates WHERE is_default = true);

CREATE TABLE IF NOT EXISTS public.rapport_workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id uuid NOT NULL REFERENCES public.rapports_techniques(id) ON DELETE CASCADE,
  ancien_statut text,
  nouveau_statut text NOT NULL,
  action text NOT NULL,
  commentaire text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rapport_workflow_events TO authenticated;
GRANT ALL ON public.rapport_workflow_events TO service_role;
ALTER TABLE public.rapport_workflow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_select_auth" ON public.rapport_workflow_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "wf_insert_auth" ON public.rapport_workflow_events FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
CREATE INDEX IF NOT EXISTS idx_wf_events_r ON public.rapport_workflow_events(rapport_id, created_at DESC);

ALTER TABLE public.rapports_techniques
  ADD COLUMN IF NOT EXISTS version_courante integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.rapport_templates(id),
  ADD COLUMN IF NOT EXISTS signature_ingenieur_id uuid,
  ADD COLUMN IF NOT EXISTS publie_at timestamptz,
  ADD COLUMN IF NOT EXISTS editor_html text;
