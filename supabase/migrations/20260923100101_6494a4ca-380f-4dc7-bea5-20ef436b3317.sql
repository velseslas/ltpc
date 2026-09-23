
CREATE OR REPLACE FUNCTION public.is_active_app_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.utilisateurs u
    WHERE u.user_id = auth.uid()
      AND (u.statut IS NULL OR lower(u.statut) IN ('actif', 'active'))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_app_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_app_user() TO authenticated, service_role;

DROP POLICY IF EXISTS "Allow authenticated read on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated can read role_permissions" ON public.role_permissions;
CREATE POLICY "role_permissions_select_app_users"
ON public.role_permissions FOR SELECT TO authenticated
USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Authenticated can read prix_essais" ON public.prix_essais;
CREATE POLICY "prix_essais_select_app_users"
ON public.prix_essais FOR SELECT TO authenticated
USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Authenticated users can view maitres_ouvrage" ON public.maitres_ouvrage;
DROP POLICY IF EXISTS "maitres_ouvrage_std_select" ON public.maitres_ouvrage;
CREATE POLICY "maitres_ouvrage_select_app_users"
ON public.maitres_ouvrage FOR SELECT TO authenticated
USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
