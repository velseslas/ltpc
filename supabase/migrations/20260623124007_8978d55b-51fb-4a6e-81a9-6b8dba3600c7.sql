
-- Add admin/super_admin guard to restore_essai_field
CREATE OR REPLACE FUNCTION public.restore_essai_field(_table_name text, _record_id uuid, _field_name text, _old_value jsonb, _history_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sql TEXT;
  v_user_id UUID;
  v_user_name TEXT;
  v_col_type TEXT;
  v_text_value TEXT;
  v_allowed_tables TEXT[] := ARRAY[
    'echantillons_compression','echantillons_affaissement','echantillons_temperature',
    'echantillons_temps_prise','echantillons_teneur_air','echantillons_carottage',
    'echantillons_traction_fendage','echantillons_permeabilite','echantillons_module_elasticite',
    'echantillons_ultrason','echantillons_sclerometre','echantillons_ecrasement','formulations',
    'echantillons_bleu_methylene','echantillons_equivalent_sable','echantillons_forme_granulats',
    'echantillons_friabilite','echantillons_granulometrie','echantillons_los_angeles',
    'echantillons_masse_volumique','echantillons_matiere_organique','echantillons_micro_deval',
    'echantillons_teneur_eau',
    'echantillons_cbr','echantillons_cisaillement','echantillons_classification_sol',
    'echantillons_compression_simple','echantillons_densite_place','echantillons_densitometre',
    'echantillons_granulometrie_sol','echantillons_limites_atterberg','echantillons_oedometrique',
    'echantillons_penetrometre','echantillons_plaque','echantillons_pressiometre',
    'echantillons_proctor_modifie','echantillons_proctor_normal','echantillons_sondage',
    'echantillons_teneur_eau_sol','echantillons_triaxial'
  ];
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Permission refusée';
  END IF;

  IF NOT (_table_name = ANY(v_allowed_tables)) THEN
    RAISE EXCEPTION 'Table non autorisée: %', _table_name;
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(nom, email) INTO v_user_name
    FROM public.utilisateurs WHERE user_id = v_user_id LIMIT 1;
  END IF;

  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = _table_name AND column_name = _field_name;

  IF v_col_type IS NULL THEN
    RAISE EXCEPTION 'Colonne % introuvable dans %', _field_name, _table_name;
  END IF;

  PERFORM set_config('app.skip_history_log', 'on', true);

  IF _old_value IS NULL OR _old_value = 'null'::jsonb THEN
    v_sql := format('UPDATE public.%I SET %I = NULL, updated_at = now() WHERE id = $1', _table_name, _field_name);
    EXECUTE v_sql USING _record_id;
  ELSE
    IF jsonb_typeof(_old_value) = 'string' THEN
      v_text_value := _old_value #>> '{}';
    ELSE
      v_text_value := _old_value::text;
    END IF;

    IF v_col_type IN ('jsonb', 'json') THEN
      v_sql := format('UPDATE public.%I SET %I = $1, updated_at = now() WHERE id = $2', _table_name, _field_name);
      EXECUTE v_sql USING _old_value, _record_id;
    ELSE
      v_sql := format('UPDATE public.%I SET %I = $1::text::%s, updated_at = now() WHERE id = $2', _table_name, _field_name, v_col_type);
      EXECUTE v_sql USING v_text_value, _record_id;
    END IF;
  END IF;

  UPDATE public.essais_modifications_history
  SET restored_at = now(),
      restored_by = v_user_id,
      restored_by_name = v_user_name
  WHERE id = _history_id;
END;
$function$;

-- Revoke EXECUTE from PUBLIC (and anon/authenticated for trigger-only functions)
REVOKE EXECUTE ON FUNCTION public.audit_parametres_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_taux_tva_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_utilisateurs_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_essai_modifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_essai_deletion() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_audit_action(text, text, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_essai_field(text, uuid, text, jsonb, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_deleted_essai(uuid) FROM PUBLIC, anon;
