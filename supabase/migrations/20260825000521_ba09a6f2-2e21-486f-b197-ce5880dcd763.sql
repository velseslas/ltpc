DROP VIEW IF EXISTS public.clients_scoped;

CREATE OR REPLACE FUNCTION public.clients_scoped()
RETURNS TABLE (
  id uuid,
  nom text,
  email text,
  telephone text,
  adresse text,
  ville text,
  contact text,
  representant text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nom, c.email, c.telephone, c.adresse, c.ville, c.contact,
         c.representant, c.created_at, c.updated_at
  FROM public.clients c
  WHERE auth.uid() IS NOT NULL
    AND (
      public.is_admin_or_manager()
      OR EXISTS (
        SELECT 1 FROM public.chantiers ch
        WHERE ch.client_id = c.id
          AND public.can_access_chantier_data(ch.id)
      )
    )
  ORDER BY c.nom;
$$;

REVOKE EXECUTE ON FUNCTION public.clients_scoped() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clients_scoped() TO authenticated, service_role;