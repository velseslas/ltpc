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
  -- Skip logging if a restore is in progress (set via SET LOCAL by client)
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
    FROM public.utilisateurs WHERE id = v_user_id LIMIT 1;
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

-- RPC to perform a restore atomically without logging history
CREATE OR REPLACE FUNCTION public.restore_essai_field(
  _table_name TEXT,
  _record_id UUID,
  _field_name TEXT,
  _old_value JSONB,
  _history_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sql TEXT;
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

  -- Disable history logging for this transaction
  PERFORM set_config('app.skip_history_log', 'on', true);

  v_sql := format('UPDATE public.%I SET %I = $1, updated_at = now() WHERE id = $2', _table_name, _field_name);
  EXECUTE v_sql USING (CASE WHEN _old_value = 'null'::jsonb THEN NULL ELSE _old_value END), _record_id;

  DELETE FROM public.essais_modifications_history WHERE id = _history_id;
END;
$$;