DROP POLICY IF EXISTS eval_norm_delete ON public.evaluations_normatives_carottage;
CREATE POLICY eval_norm_delete ON public.evaluations_normatives_carottage
FOR DELETE TO authenticated
USING (is_admin_only() AND figee = false);