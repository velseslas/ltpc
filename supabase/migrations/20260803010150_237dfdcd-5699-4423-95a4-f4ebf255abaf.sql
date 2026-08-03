
CREATE OR REPLACE FUNCTION public.is_privileged_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'manager')
      OR public.has_role(auth.uid(),'ingenieur');
$$;

CREATE OR REPLACE FUNCTION public.current_intervenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT u.intervenant_id FROM public.utilisateurs u WHERE u.user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_access_chantier_data(_chantier_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.is_privileged_staff()
     OR (
       auth.uid() IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid())
       AND (
         _chantier_id IS NULL
         OR EXISTS (
           SELECT 1 FROM public.affectations a
           WHERE a.chantier_id = _chantier_id
             AND a.intervenant_id = public.current_intervenant_id()
         )
         OR EXISTS (
           SELECT 1 FROM public.laboratoires_mobiles lm
           WHERE lm.chantier_id = _chantier_id
             AND lm.responsable_id = public.current_intervenant_id()
         )
       )
     );
$$;

REVOKE EXECUTE ON FUNCTION public.is_privileged_staff() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.current_intervenant_id() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_chantier_data(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_privileged_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_intervenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_chantier_data(uuid) TO authenticated;

DO $do$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname LIKE 'echantillons\_%'
      AND EXISTS (SELECT 1 FROM information_schema.columns col
                  WHERE col.table_schema='public' AND col.table_name=c.relname AND col.column_name='chantier_id')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_staff_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_access_chantier_data(chantier_id))', t||'_staff_select', t);
  END LOOP;
END
$do$;

DROP POLICY IF EXISTS essais_staff_select ON public.essais;
CREATE POLICY essais_staff_select ON public.essais FOR SELECT TO authenticated
USING (
  public.is_privileged_staff()
  OR (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid())
    AND (
      intervenant_id = public.current_intervenant_id()
      OR client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.affectations a
        WHERE a.client_id = essais.client_id
          AND a.intervenant_id = public.current_intervenant_id()
      )
    )
  )
);
