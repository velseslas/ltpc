-- 1. Clients: remove broad SELECT policy exposing financial/tax fields to technicians
DROP POLICY IF EXISTS "clients_select_assigned_chantiers" ON public.clients;

CREATE OR REPLACE VIEW public.clients_scoped
WITH (security_barrier = true) AS
SELECT c.id, c.nom, c.email, c.telephone, c.adresse, c.ville, c.contact,
       c.representant, c.created_at, c.updated_at
FROM public.clients c
WHERE public.is_admin_or_manager()
   OR EXISTS (
        SELECT 1 FROM public.chantiers ch
        WHERE ch.client_id = c.id
          AND public.can_access_chantier_data(ch.id)
      );

REVOKE ALL ON public.clients_scoped FROM anon;
GRANT SELECT ON public.clients_scoped TO authenticated;
GRANT ALL ON public.clients_scoped TO service_role;

-- 2. utilisateurs.role must never be writable from the client (authoritative roles live in user_roles)
REVOKE INSERT (role), UPDATE (role) ON public.utilisateurs FROM authenticated;
REVOKE INSERT (role), UPDATE (role) ON public.utilisateurs FROM anon;

-- 3. SECURITY DEFINER helpers must not be callable anonymously
REVOKE EXECUTE ON FUNCTION public.bump_conversation() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_conversation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_access_conversation(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bump_conversation() TO service_role;