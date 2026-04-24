
-- 1. parametres_securite: restrict to admins only
DROP POLICY IF EXISTS "Allow public read access to parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Allow public insert to parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Allow public update to parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Anyone can view parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Anyone can insert parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Anyone can update parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Public can read parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Public can insert parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Public can update parametres_securite" ON public.parametres_securite;

CREATE POLICY "Admins can view parametres_securite"
ON public.parametres_securite FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert parametres_securite"
ON public.parametres_securite FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update parametres_securite"
ON public.parametres_securite FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 2. essais_deleted: restrict INSERT to authenticated users (triggers run as SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "System can insert deleted entries" ON public.essais_deleted;

CREATE POLICY "Authenticated can insert deleted entries"
ON public.essais_deleted FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. role_permissions: remove overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated delete on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated insert on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated update on role_permissions" ON public.role_permissions;
