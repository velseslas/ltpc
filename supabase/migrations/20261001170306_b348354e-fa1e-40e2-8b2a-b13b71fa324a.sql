DROP POLICY IF EXISTS "formulations_std_select" ON public.formulations;
CREATE POLICY "formulations_std_select" ON public.formulations FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "parametres_signature_std_select" ON public.parametres_signature;
CREATE POLICY "parametres_signature_std_select" ON public.parametres_signature FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "client_maitres_ouvrage_std_select" ON public.client_maitres_ouvrage;
CREATE POLICY "client_maitres_ouvrage_std_select" ON public.client_maitres_ouvrage FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));