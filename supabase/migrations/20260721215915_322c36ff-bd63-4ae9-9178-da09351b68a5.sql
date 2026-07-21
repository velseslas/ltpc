-- 1) Intervenants: restrict full row SELECT to admin/manager and expose a safe directory view
DROP POLICY IF EXISTS "Authenticated can read intervenants" ON public.intervenants;

CREATE POLICY "intervenants_select_admin_manager"
ON public.intervenants
FOR SELECT
TO authenticated
USING (public.is_admin_or_manager());

CREATE OR REPLACE VIEW public.intervenants_directory
WITH (security_invoker = off) AS
SELECT
  i.id,
  i.nom,
  i.prenom,
  i.email,
  i.telephone,
  i.role,
  i.departement,
  i.statut,
  i.date_embauche,
  i.poste_id,
  i.specialite,
  i.signature_url,
  i.created_at,
  i.updated_at,
  p.nom AS poste_nom
FROM public.intervenants i
LEFT JOIN public.postes p ON p.id = i.poste_id;

REVOKE ALL ON public.intervenants_directory FROM PUBLIC;
REVOKE ALL ON public.intervenants_directory FROM anon;
GRANT SELECT ON public.intervenants_directory TO authenticated;

-- 2) material_status_history: writes must go through the SECURITY DEFINER trigger only
DROP POLICY IF EXISTS "admins insert status history" ON public.material_status_history;

-- 3) clients: consolidate SELECT policies — keep only the restricted one (admin/manager)
--    (No other permissive SELECT exists today; this is a defensive re-affirmation.)
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "clients_select_all_authenticated" ON public.clients;
COMMENT ON POLICY "clients_select_admin_manager" ON public.clients IS
  'Sole SELECT policy: restricts reads (incl. banking/contact fields) to admin/manager roles.';