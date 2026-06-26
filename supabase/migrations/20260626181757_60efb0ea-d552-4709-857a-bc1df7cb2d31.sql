
-- Logos bucket: restrict write to admin/manager, drop public listing
DROP POLICY IF EXISTS "logos_select" ON storage.objects;
DROP POLICY IF EXISTS "logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "logos_update" ON storage.objects;
DROP POLICY IF EXISTS "logos_delete" ON storage.objects;

CREATE POLICY "logos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND public.is_admin_or_manager());

CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND public.is_admin_or_manager())
  WITH CHECK (bucket_id = 'logos' AND public.is_admin_or_manager());

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND public.is_admin_or_manager());

-- Clients: restrict SELECT to roles that need it (exclude operateur/lecteur)
DROP POLICY IF EXISTS "clients_std_select" ON public.clients;
CREATE POLICY "clients_std_select" ON public.clients
  FOR SELECT TO authenticated
  USING (public.can_write_business());

-- parametres_facturation: restrict SELECT to admin
DROP POLICY IF EXISTS "parametres_facturation_std_select" ON public.parametres_facturation;
CREATE POLICY "parametres_facturation_std_select" ON public.parametres_facturation
  FOR SELECT TO authenticated
  USING (public.is_admin_only());

-- essais_deleted: drop broad std_select; admin-only policy remains
DROP POLICY IF EXISTS "essais_deleted_std_select" ON public.essais_deleted;

-- entreprise: restrict SELECT to admin; add SECURITY DEFINER RPC for public fields
DROP POLICY IF EXISTS "entreprise_std_select" ON public.entreprise;
CREATE POLICY "entreprise_std_select" ON public.entreprise
  FOR SELECT TO authenticated
  USING (public.is_admin_only());

CREATE OR REPLACE FUNCTION public.get_entreprise_public()
RETURNS TABLE (
  id uuid,
  nom text,
  numero_autorisation text,
  date_autorisation date,
  siege_social text,
  annexe text,
  telephone text,
  email text,
  site_web text,
  logo_url text,
  cachet_url text,
  representant text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.nom, e.numero_autorisation, e.date_autorisation, e.siege_social,
         e.annexe, e.telephone, e.email, e.site_web, e.logo_url, e.cachet_url,
         e.representant, e.created_at, e.updated_at
  FROM public.entreprise e
  ORDER BY e.created_at ASC
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_entreprise_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_entreprise_public() TO authenticated;
