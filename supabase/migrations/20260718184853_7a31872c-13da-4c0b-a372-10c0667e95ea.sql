
-- 1) Drop plaintext password table (critical exposure)
DROP TABLE IF EXISTS public.user_passwords_visible;

-- 2) Restrict clients SELECT to admin/manager
DROP POLICY IF EXISTS "Utilisateurs autorisés voient clients" ON public.clients;
DROP POLICY IF EXISTS "Auth read clients" ON public.clients;
DROP POLICY IF EXISTS "auth_read_clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
DROP POLICY IF EXISTS "clients_select_business" ON public.clients;
DROP POLICY IF EXISTS "clients_select_admin_manager" ON public.clients;
CREATE POLICY "clients_select_admin_manager"
  ON public.clients FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager());

-- 3) Restrict essais_modifications_history SELECT to admin/manager
DROP POLICY IF EXISTS "Authenticated can read history" ON public.essais_modifications_history;
DROP POLICY IF EXISTS "auth_read_history" ON public.essais_modifications_history;
DROP POLICY IF EXISTS "essais_history_select_admin_manager" ON public.essais_modifications_history;
CREATE POLICY "essais_history_select_admin_manager"
  ON public.essais_modifications_history FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager());

-- 4) Restrict material_status_history SELECT to admin/manager
DROP POLICY IF EXISTS "auth read status" ON public.material_status_history;
DROP POLICY IF EXISTS "auth_read_status" ON public.material_status_history;
DROP POLICY IF EXISTS "material_status_select_admin_manager" ON public.material_status_history;
CREATE POLICY "material_status_select_admin_manager"
  ON public.material_status_history FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager());

-- 5) Revoke anon EXECUTE from SECURITY DEFINER functions exposed to anon
REVOKE EXECUTE ON FUNCTION public.get_entreprise_public() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_archive_by_token(text, integer) FROM anon, PUBLIC;
-- Keep authenticated + service_role access
GRANT EXECUTE ON FUNCTION public.get_entreprise_public() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_archive_by_token(text, integer) TO authenticated, service_role;
