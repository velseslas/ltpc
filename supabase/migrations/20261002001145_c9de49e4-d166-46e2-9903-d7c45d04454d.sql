DROP POLICY IF EXISTS "client_centrales_std_select" ON public.client_centrales;
CREATE POLICY "client_centrales_std_select" ON public.client_centrales FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "parametres_systeme_std_select" ON public.parametres_systeme;
CREATE POLICY "parametres_systeme_std_select" ON public.parametres_systeme FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "client_maitres_oeuvre_std_select" ON public.client_maitres_oeuvre;
CREATE POLICY "client_maitres_oeuvre_std_select" ON public.client_maitres_oeuvre FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));