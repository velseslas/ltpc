
DROP POLICY IF EXISTS "chantiers_std_select" ON public.chantiers;
CREATE POLICY "chantiers_select_app_users"
ON public.chantiers FOR SELECT TO authenticated
USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "affectations_select" ON public.affectations;
CREATE POLICY "affectations_select_app_users"
ON public.affectations FOR SELECT TO authenticated
USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "maintenance_materiel_std_select" ON public.maintenance_materiel;
CREATE POLICY "maintenance_materiel_select_app_users"
ON public.maintenance_materiel FOR SELECT TO authenticated
USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
