DROP POLICY IF EXISTS "parametres_notifications_select" ON public.parametres_notifications;
CREATE POLICY "parametres_notifications_select" ON public.parametres_notifications FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "role_definitions read auth" ON public.role_definitions;
CREATE POLICY "role_definitions read auth" ON public.role_definitions FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "engagement_articles_select" ON public.engagement_articles;
CREATE POLICY "engagement_articles_select" ON public.engagement_articles FOR SELECT TO authenticated USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));