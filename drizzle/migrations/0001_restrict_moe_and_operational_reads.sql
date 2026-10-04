DROP POLICY IF EXISTS "Authenticated users can view maitres_oeuvre" ON public.maitres_oeuvre;
DROP POLICY IF EXISTS "maitres_oeuvre_std_select" ON public.maitres_oeuvre;
CREATE POLICY "maitres_oeuvre_admin_select"
ON public.maitres_oeuvre
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

DROP POLICY IF EXISTS "chantier_centrales_read_authenticated" ON public.chantier_centrales;
CREATE POLICY "chantier_centrales_active_employee_select"
ON public.chantier_centrales
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.utilisateurs u
    WHERE u.user_id = auth.uid()
      AND lower(u.statut) = 'actif'
  )
);

DROP POLICY IF EXISTS "materiel_std_select" ON public.materiel;
CREATE POLICY "materiel_active_employee_select"
ON public.materiel
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.utilisateurs u
    WHERE u.user_id = auth.uid()
      AND lower(u.statut) = 'actif'
  )
);