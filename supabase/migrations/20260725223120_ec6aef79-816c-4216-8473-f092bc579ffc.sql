-- =========================================================================
-- PHASE 2 / P0 — Intégrité du document officiel (rapports techniques)
-- =========================================================================

-- ---------- 1. Verrou de numérotation ----------
CREATE OR REPLACE FUNCTION public.next_rapport_numero()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_year TEXT := to_char(now(),'YYYY');
  v_n INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('rapport_numero_'||v_year));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(numero,'^RAPP-'||v_year||'-',''),'')::int),0)+1
    INTO v_n FROM public.rapports_techniques
    WHERE numero LIKE 'RAPP-'||v_year||'-%';
  RETURN 'RAPP-'||v_year||'-'||lpad(v_n::text,4,'0');
END $function$;

-- ---------- 2. Immutabilité ----------
DROP POLICY IF EXISTS rap_update ON public.rapports_techniques;
CREATE POLICY rap_update ON public.rapports_techniques
FOR UPDATE TO authenticated
USING (
  statut <> ALL (ARRAY['valide','archive']::rapport_statut[])
  AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'ingenieur')
    OR ((technicien_id = auth.uid() OR created_by = auth.uid())
        AND statut = ANY (ARRAY['brouillon','a_completer','en_cours']::rapport_statut[]))
  )
)
WITH CHECK (
  statut <> ALL (ARRAY['valide','archive']::rapport_statut[])
);

CREATE OR REPLACE FUNCTION public.guard_rapport_statut_officiel()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE v_flag TEXT;
BEGIN
  BEGIN v_flag := current_setting('app.rapport_workflow', true);
  EXCEPTION WHEN OTHERS THEN v_flag := NULL; END;
  IF v_flag = 'on' THEN RETURN NEW; END IF;

  IF OLD.statut IN ('valide','archive') THEN
    RAISE EXCEPTION 'Rapport % : document officiel verrouillé (statut %). Toute modification est interdite.', OLD.id, OLD.statut;
  END IF;
  IF NEW.statut IN ('valide','archive') AND NEW.statut <> OLD.statut THEN
    RAISE EXCEPTION 'Transition vers le statut % interdite hors du workflow de validation serveur.', NEW.statut;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_guard_rapport_statut ON public.rapports_techniques;
CREATE TRIGGER trg_guard_rapport_statut
BEFORE UPDATE ON public.rapports_techniques
FOR EACH ROW EXECUTE FUNCTION public.guard_rapport_statut_officiel();

-- ---------- 3. Workflow serveur unique ----------
CREATE OR REPLACE FUNCTION public.rapport_workflow_transition(
  _rapport_id uuid,
  _action text,
  _commentaire text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_uid uuid := auth.uid();
  v_new public.rapport_statut;
  v_validator boolean;
  v_author boolean;
  v_nom text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  SELECT * INTO r FROM public.rapports_techniques WHERE id = _rapport_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rapport introuvable'; END IF;
  IF NOT public.can_access_rapport(_rapport_id) THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  v_validator := public.has_role(v_uid,'super_admin') OR public.has_role(v_uid,'admin')
              OR public.has_role(v_uid,'manager') OR public.has_role(v_uid,'ingenieur');
  v_author := (r.created_by = v_uid) OR (r.technicien_id = v_uid);

  IF _action = 'soumettre' THEN
    IF r.statut NOT IN ('brouillon','en_cours','a_completer','refuse') THEN
      RAISE EXCEPTION 'Transition « soumettre » impossible depuis le statut %', r.statut;
    END IF;
    IF NOT (v_validator OR v_author) THEN RAISE EXCEPTION 'Permission refusée'; END IF;
    v_new := 'en_attente_validation';

  ELSIF _action = 'approuver' THEN
    IF r.statut <> 'en_attente_validation' THEN
      RAISE EXCEPTION 'Seul un rapport en attente de validation peut être approuvé (statut actuel : %)', r.statut;
    END IF;
    IF NOT v_validator THEN
      RAISE EXCEPTION 'Permission refusée : seul un ingénieur, manager ou administrateur peut valider un rapport.';
    END IF;
    IF v_author AND NOT public.has_role(v_uid,'super_admin') THEN
      RAISE EXCEPTION 'Séparation rédacteur/validateur : vous ne pouvez pas valider un rapport que vous avez rédigé.';
    END IF;
    v_new := 'valide';

  ELSIF _action = 'demander_correction' THEN
    IF r.statut <> 'en_attente_validation' THEN RAISE EXCEPTION 'Transition impossible depuis le statut %', r.statut; END IF;
    IF NOT v_validator THEN RAISE EXCEPTION 'Permission refusée'; END IF;
    v_new := 'a_completer';

  ELSIF _action = 'refuser' THEN
    IF r.statut <> 'en_attente_validation' THEN RAISE EXCEPTION 'Transition impossible depuis le statut %', r.statut; END IF;
    IF NOT v_validator THEN RAISE EXCEPTION 'Permission refusée'; END IF;
    IF _commentaire IS NULL OR btrim(_commentaire) = '' THEN RAISE EXCEPTION 'Un motif de refus est obligatoire.'; END IF;
    v_new := 'refuse';

  ELSIF _action = 'publier' THEN
    IF r.statut <> 'valide' THEN RAISE EXCEPTION 'Seul un rapport validé peut être publié.'; END IF;
    IF NOT v_validator THEN RAISE EXCEPTION 'Permission refusée'; END IF;
    v_new := 'archive';

  ELSIF _action = 'archiver' THEN
    IF r.statut NOT IN ('valide','refuse') THEN RAISE EXCEPTION 'Seul un rapport validé ou refusé peut être archivé.'; END IF;
    IF NOT v_validator THEN RAISE EXCEPTION 'Permission refusée'; END IF;
    v_new := 'archive';

  ELSE
    RAISE EXCEPTION 'Action de workflow inconnue : %', _action;
  END IF;

  SELECT COALESCE(NULLIF(btrim(nom),''), email) INTO v_nom
    FROM public.utilisateurs WHERE user_id = v_uid LIMIT 1;

  PERFORM set_config('app.rapport_workflow','on',true);

  UPDATE public.rapports_techniques SET
    statut = v_new,
    soumis_at = CASE WHEN _action = 'soumettre' THEN now() ELSE soumis_at END,
    valide_at = CASE WHEN _action = 'approuver' THEN now() ELSE valide_at END,
    ingenieur_id = CASE WHEN _action = 'approuver' THEN v_uid ELSE ingenieur_id END,
    signature_ingenieur_id = CASE WHEN _action = 'approuver' THEN v_uid ELSE signature_ingenieur_id END,
    refuse_at = CASE WHEN _action = 'refuser' THEN now() ELSE refuse_at END,
    motif_refus = CASE WHEN _action = 'refuser' THEN _commentaire ELSE motif_refus END,
    publie_at = CASE WHEN _action = 'publier' THEN now() ELSE publie_at END
  WHERE id = _rapport_id;

  INSERT INTO public.rapport_workflow_events(rapport_id, ancien_statut, nouveau_statut, action, commentaire, created_by)
  VALUES (_rapport_id, r.statut::text, v_new::text, _action, _commentaire, v_uid);

  RETURN jsonb_build_object('statut', v_new, 'validateur', v_nom, 'action', _action);
END $function$;

GRANT EXECUTE ON FUNCTION public.rapport_workflow_transition(uuid, text, text) TO authenticated;

-- ---------- 4. Identité du validateur réel ----------
CREATE OR REPLACE FUNCTION public.get_rapport_validateur(_rapport_id uuid)
RETURNS TABLE(nom text, fonction text, valide_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(NULLIF(btrim(u.nom),''), u.email) AS nom,
         COALESCE(NULLIF(btrim(p.nom),''), 'Ingénieur validateur') AS fonction,
         r.valide_at
  FROM public.rapports_techniques r
  LEFT JOIN public.utilisateurs u ON u.user_id = r.ingenieur_id
  LEFT JOIN public.postes p ON p.id = u.poste_id
  WHERE r.id = _rapport_id
    AND r.statut IN ('valide','archive')
    AND public.can_access_rapport(_rapport_id)
  LIMIT 1
$function$;

GRANT EXECUTE ON FUNCTION public.get_rapport_validateur(uuid) TO authenticated;

-- ---------- 5. QR lié à l'archive officielle ----------
CREATE OR REPLACE FUNCTION public.get_rapport_verification(_rapport_id uuid)
RETURNS TABLE(qr_token text, version integer, numero text, sha256 text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT a.qr_token, a.version, a.numero, a.sha256, a.created_at
  FROM public.document_archives a
  WHERE a.document_type = 'rapport_technique'
    AND a.document_id = _rapport_id
    AND a.status = 'active'
    AND public.can_access_rapport(_rapport_id)
  ORDER BY a.version DESC
  LIMIT 1
$function$;

GRANT EXECUTE ON FUNCTION public.get_rapport_verification(uuid) TO authenticated;

DROP POLICY IF EXISTS archives_read_auth ON public.document_archives;
CREATE POLICY archives_read_auth ON public.document_archives
FOR SELECT TO authenticated
USING (
  public.is_admin_or_manager()
  OR generated_by = auth.uid()
  OR (document_type = 'rapport_technique' AND public.can_access_rapport(document_id))
);

-- ---------- 6. RLS moindre privilège ----------
DROP POLICY IF EXISTS wf_select_auth ON public.rapport_workflow_events;
CREATE POLICY wf_select_auth ON public.rapport_workflow_events
FOR SELECT TO authenticated
USING (public.can_access_rapport(rapport_id));

DROP POLICY IF EXISTS "authenticated can read alerts" ON public.ai_alerts;
CREATE POLICY "staff can read alerts" ON public.ai_alerts
FOR SELECT TO authenticated
USING (public.is_admin_or_manager() OR public.has_role(auth.uid(),'ingenieur'));

DROP POLICY IF EXISTS "authenticated can read summaries" ON public.ai_daily_summaries;
CREATE POLICY "staff can read summaries" ON public.ai_daily_summaries
FOR SELECT TO authenticated
USING (public.is_admin_or_manager() OR public.has_role(auth.uid(),'ingenieur'));

DROP POLICY IF EXISTS "read chunks authenticated" ON public.ai_knowledge_chunks;
CREATE POLICY "staff can read knowledge chunks" ON public.ai_knowledge_chunks
FOR SELECT TO authenticated
USING (public.can_write_business() OR public.has_role(auth.uid(),'ingenieur'));

-- ---------- 7. IA proactive : cron quotidien réel ----------
SELECT cron.unschedule('ltpc-ai-monitor-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ltpc-ai-monitor-daily');

SELECT cron.schedule(
  'ltpc-ai-monitor-daily',
  '15 5 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://retsfiqxzkwooxqyxczx.supabase.co/functions/v1/ltpc-ai-monitor',
    headers := '{"Content-Type": "application/json", "x-ltpc-cron": "ltpc-cron-monitor-2026"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $cron$
);