-- Fix: lookup utilisateurs by user_id (not id) for proper traceability names
CREATE OR REPLACE FUNCTION public.log_essai_modifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_key TEXT;
  v_user_id UUID;
  v_user_name TEXT;
  v_ignored TEXT[] := ARRAY['updated_at', 'created_at', 'id'];
  v_skip TEXT;
BEGIN
  BEGIN
    v_skip := current_setting('app.skip_history_log', true);
  EXCEPTION WHEN OTHERS THEN
    v_skip := NULL;
  END;
  IF v_skip = 'on' THEN
    RETURN NEW;
  END IF;

  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(nom, email) INTO v_user_name
    FROM public.utilisateurs WHERE user_id = v_user_id LIMIT 1;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);

  FOR v_key IN SELECT jsonb_object_keys(v_new)
  LOOP
    IF v_key = ANY(v_ignored) THEN CONTINUE; END IF;
    IF (v_old->v_key) IS DISTINCT FROM (v_new->v_key) THEN
      INSERT INTO public.essais_modifications_history(
        table_name, record_id, field_name, old_value, new_value, modified_by, modified_by_name
      ) VALUES (
        TG_TABLE_NAME, NEW.id, v_key, v_old->v_key, v_new->v_key, v_user_id, v_user_name
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

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
    'echantillons_ultrason','echantillons_sclerometre','formulations'
  ];
BEGIN
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