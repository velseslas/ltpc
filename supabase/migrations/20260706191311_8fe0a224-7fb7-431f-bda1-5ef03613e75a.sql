
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action text,
  p_type text,
  p_cible text DEFAULT NULL::text,
  p_details text DEFAULT NULL::text,
  p_utilisateur_id uuid DEFAULT NULL::uuid,
  p_utilisateur_nom text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
  v_uid UUID;
  v_nom TEXT;
BEGIN
  v_uid := COALESCE(p_utilisateur_id, auth.uid());
  v_nom := p_utilisateur_nom;

  IF v_nom IS NULL AND v_uid IS NOT NULL THEN
    SELECT COALESCE(NULLIF(TRIM(nom), ''), email)
      INTO v_nom
      FROM public.utilisateurs
      WHERE user_id = v_uid
      LIMIT 1;
  END IF;

  INSERT INTO public.journal_audit (action, type, cible, details, utilisateur_id, utilisateur_nom)
  VALUES (p_action, p_type, p_cible, p_details, v_uid, v_nom)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- Backfill existing rows where utilisateur_nom is NULL but utilisateur_id is set
UPDATE public.journal_audit ja
SET utilisateur_nom = COALESCE(NULLIF(TRIM(u.nom), ''), u.email)
FROM public.utilisateurs u
WHERE ja.utilisateur_nom IS NULL
  AND ja.utilisateur_id IS NOT NULL
  AND u.user_id = ja.utilisateur_id;
