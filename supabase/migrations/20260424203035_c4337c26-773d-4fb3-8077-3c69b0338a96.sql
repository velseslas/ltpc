-- 1) Drop anon read on utilisateurs (PII + plaintext password leak)
DROP POLICY IF EXISTS "Allow anon read on utilisateurs" ON public.utilisateurs;

-- 2) Tighten utilisateurs policies: remove permissive USING(true) for authenticated mutations, restrict to admins/super_admins
DROP POLICY IF EXISTS "Allow authenticated read on utilisateurs" ON public.utilisateurs;
DROP POLICY IF EXISTS "Allow authenticated insert on utilisateurs" ON public.utilisateurs;
DROP POLICY IF EXISTS "Allow authenticated update on utilisateurs" ON public.utilisateurs;
DROP POLICY IF EXISTS "Allow authenticated delete on utilisateurs" ON public.utilisateurs;

CREATE POLICY "Users can read their own utilisateur row"
  ON public.utilisateurs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all utilisateurs"
  ON public.utilisateurs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert utilisateurs"
  ON public.utilisateurs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update utilisateurs"
  ON public.utilisateurs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete utilisateurs"
  ON public.utilisateurs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 3) Drop plaintext password column
ALTER TABLE public.utilisateurs DROP COLUMN IF EXISTS mot_de_passe;

-- 4) Tighten user_roles: remove permissive policies that allow privilege escalation
DROP POLICY IF EXISTS "Allow authenticated insert on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated update on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated delete on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated read on user_roles" ON public.user_roles;
-- Keep "Admins can manage user_roles" and "Users can view their own roles"

-- 5) Lock down storage bucket "contrats" - remove public write/delete/update; keep public read (existing app behavior relies on public URLs)
DROP POLICY IF EXISTS "Anyone can upload contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete contract documents" ON storage.objects;

CREATE POLICY "Authenticated can upload contract documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contrats');

CREATE POLICY "Authenticated can update contract documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contrats');

CREATE POLICY "Authenticated can delete contract documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contrats');

-- 6) Lock down storage bucket "certificats-etalonnage" - remove public write/delete/update
DROP POLICY IF EXISTS "Public insert certificats etalonnage" ON storage.objects;
DROP POLICY IF EXISTS "Public update certificats etalonnage" ON storage.objects;
DROP POLICY IF EXISTS "Public delete certificats etalonnage" ON storage.objects;

CREATE POLICY "Authenticated can insert certificats etalonnage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificats-etalonnage');

CREATE POLICY "Authenticated can update certificats etalonnage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'certificats-etalonnage');

CREATE POLICY "Authenticated can delete certificats etalonnage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'certificats-etalonnage');