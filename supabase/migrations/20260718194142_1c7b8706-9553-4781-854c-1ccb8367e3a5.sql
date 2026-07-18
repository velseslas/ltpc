
-- Helper: can current user read the given rapport?
CREATE OR REPLACE FUNCTION public.can_access_rapport(_rapport_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rapports_techniques r
    WHERE r.id = _rapport_id
      AND (
        public.has_role(auth.uid(),'admin')
        OR public.has_role(auth.uid(),'super_admin')
        OR public.has_role(auth.uid(),'manager')
        OR public.has_role(auth.uid(),'ingenieur')
        OR r.technicien_id = auth.uid()
        OR r.created_by = auth.uid()
      )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_rapport(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_rapport(uuid) TO authenticated, service_role;

-- Clients: drop the overly-broad SELECT policy that leaks PII to techniciens.
DROP POLICY IF EXISTS clients_std_select ON public.clients;

-- rapport_historique
DROP POLICY IF EXISTS hist_read ON public.rapport_historique;
DROP POLICY IF EXISTS hist_ins ON public.rapport_historique;
CREATE POLICY hist_read ON public.rapport_historique FOR SELECT TO authenticated
USING (public.can_access_rapport(rapport_id));
CREATE POLICY hist_ins ON public.rapport_historique FOR INSERT TO authenticated
WITH CHECK (public.can_access_rapport(rapport_id));

-- rapport_pieces_jointes
DROP POLICY IF EXISTS pj_read ON public.rapport_pieces_jointes;
DROP POLICY IF EXISTS pj_ins ON public.rapport_pieces_jointes;
DROP POLICY IF EXISTS pj_upd ON public.rapport_pieces_jointes;
DROP POLICY IF EXISTS pj_del ON public.rapport_pieces_jointes;
CREATE POLICY pj_read ON public.rapport_pieces_jointes FOR SELECT TO authenticated
USING (public.can_access_rapport(rapport_id));
CREATE POLICY pj_ins ON public.rapport_pieces_jointes FOR INSERT TO authenticated
WITH CHECK (public.can_access_rapport(rapport_id));
CREATE POLICY pj_upd ON public.rapport_pieces_jointes FOR UPDATE TO authenticated
USING (public.can_access_rapport(rapport_id))
WITH CHECK (public.can_access_rapport(rapport_id));
CREATE POLICY pj_del ON public.rapport_pieces_jointes FOR DELETE TO authenticated
USING (public.can_access_rapport(rapport_id));

-- rapport_questions_ia
DROP POLICY IF EXISTS q_read ON public.rapport_questions_ia;
DROP POLICY IF EXISTS q_write ON public.rapport_questions_ia;
CREATE POLICY q_read ON public.rapport_questions_ia FOR SELECT TO authenticated
USING (public.can_access_rapport(rapport_id));
CREATE POLICY q_write ON public.rapport_questions_ia FOR ALL TO authenticated
USING (public.can_access_rapport(rapport_id))
WITH CHECK (public.can_access_rapport(rapport_id));

-- rapport_versions
DROP POLICY IF EXISTS versions_select_auth ON public.rapport_versions;
CREATE POLICY versions_select_auth ON public.rapport_versions FOR SELECT TO authenticated
USING (public.can_access_rapport(rapport_id));

-- rapport_ai_reviews
DROP POLICY IF EXISTS ai_reviews_read_auth ON public.rapport_ai_reviews;
CREATE POLICY ai_reviews_read_auth ON public.rapport_ai_reviews FOR SELECT TO authenticated
USING (public.can_access_rapport(rapport_id));

-- document_archives: restrict SELECT to admins/managers or the archive's generator.
DROP POLICY IF EXISTS archives_read_auth ON public.document_archives;
CREATE POLICY archives_read_auth ON public.document_archives FOR SELECT TO authenticated
USING (
  public.is_admin_or_manager()
  OR generated_by = auth.uid()
);
