DROP POLICY IF EXISTS eval_norm_select ON public.evaluations_normatives_carottage;
CREATE POLICY eval_norm_select ON public.evaluations_normatives_carottage
FOR SELECT TO authenticated
USING (
  public.can_write_business()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.echantillons_carottage ec
    WHERE ec.id = evaluations_normatives_carottage.echantillon_id
      AND public.can_access_chantier_data(ec.chantier_id)
  )
);