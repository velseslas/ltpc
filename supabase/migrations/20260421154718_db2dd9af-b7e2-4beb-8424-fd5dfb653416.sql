
-- 1. Audit table for deleted essais
CREATE TABLE IF NOT EXISTS public.essais_deleted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_data JSONB NOT NULL,
  numero INTEGER,
  essai_label TEXT,
  deleted_by UUID,
  deleted_by_name TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at TIMESTAMPTZ,
  restored_by UUID,
  restored_by_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_essais_deleted_table ON public.essais_deleted(table_name);
CREATE INDEX IF NOT EXISTS idx_essais_deleted_deleted_at ON public.essais_deleted(deleted_at DESC);

ALTER TABLE public.essais_deleted ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deleted essais"
ON public.essais_deleted FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete entries"
ON public.essais_deleted FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert deleted entries"
ON public.essais_deleted FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update deleted entries"
ON public.essais_deleted FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 2. Trigger function to log deletions
CREATE OR REPLACE FUNCTION public.log_essai_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_skip TEXT;
  v_data JSONB;
  v_numero INTEGER;
BEGIN
  BEGIN
    v_skip := current_setting('app.skip_deletion_log', true);
  EXCEPTION WHEN OTHERS THEN
    v_skip := NULL;
  END;
  IF v_skip = 'on' THEN
    RETURN OLD;
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(nom, email) INTO v_user_name
    FROM public.utilisateurs WHERE user_id = v_user_id LIMIT 1;
  END IF;

  v_data := to_jsonb(OLD);
  BEGIN
    v_numero := (v_data->>'numero')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_numero := NULL;
  END;

  INSERT INTO public.essais_deleted(
    table_name, record_id, record_data, numero, deleted_by, deleted_by_name
  ) VALUES (
    TG_TABLE_NAME, OLD.id, v_data, v_numero, v_user_id, v_user_name
  );

  RETURN OLD;
END;
$$;

-- 3. Attach trigger to all essai tables
DO $$
DECLARE
  v_tbl TEXT;
  v_tables TEXT[] := ARRAY[
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
  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_tbl) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_log_deletion_%I ON public.%I', v_tbl, v_tbl);
      EXECUTE format('CREATE TRIGGER trg_log_deletion_%I BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_essai_deletion()', v_tbl, v_tbl);
    END IF;
  END LOOP;
END $$;

-- 4. Restore function
CREATE OR REPLACE FUNCTION public.restore_deleted_essai(_deleted_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_user_id UUID;
  v_user_name TEXT;
  v_cols TEXT;
  v_vals TEXT;
  v_sql TEXT;
  v_exists BOOLEAN;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Permission refusée';
  END IF;

  SELECT * INTO v_entry FROM public.essais_deleted WHERE id = _deleted_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrée introuvable';
  END IF;
  IF v_entry.restored_at IS NOT NULL THEN
    RAISE EXCEPTION 'Déjà restauré';
  END IF;

  -- Check the record doesn't already exist
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1)', v_entry.table_name)
    INTO v_exists USING v_entry.record_id;
  IF v_exists THEN
    RAISE EXCEPTION 'Un enregistrement avec cet ID existe déjà';
  END IF;

  -- Build dynamic INSERT from JSONB, restricting to actual table columns
  SELECT
    string_agg(quote_ident(c.column_name), ','),
    string_agg(format('(($1->>%L)::%s)', c.column_name, c.data_type), ',')
  INTO v_cols, v_vals
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = v_entry.table_name
    AND v_entry.record_data ? c.column_name;

  PERFORM set_config('app.skip_deletion_log', 'on', true);
  PERFORM set_config('app.skip_history_log', 'on', true);

  v_sql := format('INSERT INTO public.%I (%s) VALUES (%s)', v_entry.table_name, v_cols, v_vals);
  EXECUTE v_sql USING v_entry.record_data;

  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(nom, email) INTO v_user_name
    FROM public.utilisateurs WHERE user_id = v_user_id LIMIT 1;
  END IF;

  UPDATE public.essais_deleted
  SET restored_at = now(), restored_by = v_user_id, restored_by_name = v_user_name
  WHERE id = _deleted_id;

  RETURN v_entry.record_id;
END;
$$;
