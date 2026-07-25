
CREATE TABLE public.evaluations_normatives_carottage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  echantillon_id uuid NOT NULL REFERENCES public.echantillons_carottage(id) ON DELETE CASCADE,
  reference text,
  objectif text NOT NULL,
  objectif_label text,
  norme_code text NOT NULL,
  norme_nom text,
  norme_version text,
  norme_date text,
  procedure_code text,
  procedure_label text,
  classe_beton text,
  fck_cyl numeric,
  fck_cube numeric,
  carottes jsonb NOT NULL DEFAULT '[]'::jsonb,
  statistiques jsonb NOT NULL DEFAULT '{}'::jsonb,
  criteres jsonb NOT NULL DEFAULT '[]'::jsonb,
  verdict text,
  conclusion text,
  figee boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_by_nom text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations_normatives_carottage TO authenticated;
GRANT ALL ON public.evaluations_normatives_carottage TO service_role;

ALTER TABLE public.evaluations_normatives_carottage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval_norm_select" ON public.evaluations_normatives_carottage
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "eval_norm_insert" ON public.evaluations_normatives_carottage
  FOR INSERT TO authenticated WITH CHECK (public.can_write_business());

CREATE POLICY "eval_norm_update" ON public.evaluations_normatives_carottage
  FOR UPDATE TO authenticated USING (public.can_write_business() AND figee = false)
  WITH CHECK (public.can_write_business());

CREATE POLICY "eval_norm_delete" ON public.evaluations_normatives_carottage
  FOR DELETE TO authenticated USING (public.is_admin_only());

CREATE INDEX idx_eval_norm_echantillon ON public.evaluations_normatives_carottage(echantillon_id);

CREATE TRIGGER trg_eval_norm_updated_at
  BEFORE UPDATE ON public.evaluations_normatives_carottage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
