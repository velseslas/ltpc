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
  v_nom := NULLIF(TRIM(p_utilisateur_nom), '');

  IF v_nom IS NULL AND v_uid IS NOT NULL THEN
    SELECT COALESCE(NULLIF(TRIM(nom), ''), email)
      INTO v_nom
      FROM public.utilisateurs
      WHERE user_id = v_uid
      LIMIT 1;
  END IF;

  IF v_uid IS NULL OR v_nom IS NULL THEN
    SELECT u.user_id, COALESCE(NULLIF(TRIM(u.nom), ''), u.email)
      INTO v_uid, v_nom
      FROM public.utilisateurs u
      WHERE u.user_id IS NOT NULL
      ORDER BY CASE u.role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        ELSE 3
      END, u.created_at ASC
      LIMIT 1;
  END IF;

  INSERT INTO public.journal_audit (action, type, cible, details, utilisateur_id, utilisateur_nom)
  VALUES (p_action, p_type, p_cible, p_details, v_uid, v_nom)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;