-- 1. Revoke anon EXECUTE on SECURITY DEFINER functions that require an authenticated user
REVOKE EXECUTE ON FUNCTION public.get_rapport_verification(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_rapport_validateur(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rapport_workflow_transition(uuid, text, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rapport_verification(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_rapport_validateur(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rapport_workflow_transition(uuid, text, text) TO authenticated, service_role;

-- 2. intervenants: hard guarantee that salary/CIN can never be read by a future permissive policy
DROP POLICY IF EXISTS intervenants_select_restrict_admin_manager ON public.intervenants;
CREATE POLICY intervenants_select_restrict_admin_manager
  ON public.intervenants AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_admin_or_manager());

-- 3. paiements_*: restrictive guard so finance data stays limited to finance roles
DROP POLICY IF EXISTS paiements_espece_select_restrict ON public.paiements_espece;
CREATE POLICY paiements_espece_select_restrict
  ON public.paiements_espece AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_admin_or_manager());
DROP POLICY IF EXISTS paiements_cheque_select_restrict ON public.paiements_cheque;
CREATE POLICY paiements_cheque_select_restrict
  ON public.paiements_cheque AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_admin_or_manager());
DROP POLICY IF EXISTS paiements_virement_select_restrict ON public.paiements_virement;
CREATE POLICY paiements_virement_select_restrict
  ON public.paiements_virement AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_admin_or_manager());

-- 4. Financial documents: replace USING(true) SELECT with role-scoped access
DROP POLICY IF EXISTS "Read factures" ON public.factures;
CREATE POLICY factures_select_business ON public.factures
  FOR SELECT TO authenticated USING (public.can_write_business());

DROP POLICY IF EXISTS "Read devis" ON public.devis;
CREATE POLICY devis_select_business ON public.devis
  FOR SELECT TO authenticated USING (public.can_write_business());

DROP POLICY IF EXISTS "Read bons_commande" ON public.bons_commande;
CREATE POLICY bons_commande_select_business ON public.bons_commande
  FOR SELECT TO authenticated USING (public.can_write_business());

DROP POLICY IF EXISTS contrats_std_select ON public.contrats;
CREATE POLICY contrats_select_business ON public.contrats
  FOR SELECT TO authenticated USING (public.can_write_business());