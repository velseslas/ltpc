
-- Fix RLS policies for role_permissions table
DROP POLICY IF EXISTS "Allow authenticated read on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated insert on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated delete on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated update on role_permissions" ON public.role_permissions;

CREATE POLICY "Allow authenticated read on role_permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on role_permissions"
  ON public.role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on role_permissions"
  ON public.role_permissions FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update on role_permissions"
  ON public.role_permissions FOR UPDATE
  TO authenticated
  USING (true);

-- Fix RLS policies for user_roles table
DROP POLICY IF EXISTS "Allow authenticated read on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated insert on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated delete on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated update on user_roles" ON public.user_roles;

CREATE POLICY "Allow authenticated read on user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update on user_roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (true);
