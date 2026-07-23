
CREATE TABLE public.chantier_centrales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  centrale_id uuid NOT NULL REFERENCES public.centrales_beton(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chantier_id, centrale_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chantier_centrales TO authenticated;
GRANT ALL ON public.chantier_centrales TO service_role;

ALTER TABLE public.chantier_centrales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chantier_centrales_read_authenticated"
  ON public.chantier_centrales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chantier_centrales_write_business"
  ON public.chantier_centrales FOR INSERT
  TO authenticated
  WITH CHECK (public.can_write_business());

CREATE POLICY "chantier_centrales_update_business"
  ON public.chantier_centrales FOR UPDATE
  TO authenticated
  USING (public.can_write_business())
  WITH CHECK (public.can_write_business());

CREATE POLICY "chantier_centrales_delete_business"
  ON public.chantier_centrales FOR DELETE
  TO authenticated
  USING (public.can_write_business());

CREATE INDEX idx_chantier_centrales_chantier ON public.chantier_centrales(chantier_id);
CREATE INDEX idx_chantier_centrales_centrale ON public.chantier_centrales(centrale_id);
