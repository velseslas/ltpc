ALTER TABLE public.essais_modifications_history
  ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS restored_by UUID,
  ADD COLUMN IF NOT EXISTS restored_by_name TEXT;

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
  v_user_id UUID;
  v_user_name TEXT;
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
    FROM public.utilisateurs WHERE id = v_user_id LIMIT 1;
  END IF;

  -- Disable history logging for this transaction
  PERFORM set_config('app.skip_history_log', 'on', true);

  v_sql := format('UPDATE public.%I SET %I = $1, updated_at = now() WHERE id = $2', _table_name, _field_name);
  EXECUTE v_sql USING (CASE WHEN _old_value = 'null'::jsonb THEN NULL ELSE _old_value END), _record_id;

  -- Mark history entry as restored (keep traceability)
  UPDATE public.essais_modifications_history
  SET restored_at = now(),
      restored_by = v_user_id,
      restored_by_name = v_user_name
  WHERE id = _history_id;
END;
$$;