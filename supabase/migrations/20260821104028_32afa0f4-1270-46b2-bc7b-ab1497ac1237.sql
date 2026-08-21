CREATE POLICY "intervenants_select_chantier_scope"
ON public.intervenants
FOR SELECT
TO authenticated
USING (
  id = public.current_intervenant_id()
  OR EXISTS (
    SELECT 1 FROM public.affectations a
    WHERE a.intervenant_id = public.intervenants.id
      AND public.can_access_chantier_data(a.chantier_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.laboratoires_mobiles lm
    WHERE lm.responsable_id = public.intervenants.id
      AND public.can_access_chantier_data(lm.chantier_id)
  )
);