-- =====================================================================
-- PHASE CORRECTIVE — RLS standardisée + Index FK manquants
-- Safe production-first migration, no architecture rewrite
-- =====================================================================

-- ---------------------------------------------------------------------
-- PRIORITÉ 1 : Standardiser les policies legacy
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r record;
  t text;
  business_tables text[] := ARRAY[
    'adjuvants','carrieres','centrales_beton','chantiers','cimenteries',
    'client_centrales','client_maitres_oeuvre','client_maitres_ouvrage',
    'clients','contrats','documents_administratifs',
    'echantillons_affaissement','echantillons_bleu_methylene','echantillons_carottage',
    'echantillons_cbr','echantillons_cisaillement','echantillons_classification_sol',
    'echantillons_compression','echantillons_compression_simple','echantillons_densite_place',
    'echantillons_densitometre','echantillons_ecrasement','echantillons_equivalent_sable',
    'echantillons_forme_granulats','echantillons_friabilite','echantillons_granulometrie',
    'echantillons_granulometrie_sol','echantillons_limites_atterberg','echantillons_los_angeles',
    'echantillons_masse_volumique','echantillons_matiere_organique','echantillons_micro_deval',
    'echantillons_module_elasticite','echantillons_oedometrique','echantillons_penetrometre',
    'echantillons_permeabilite','echantillons_plaque','echantillons_pressiometre',
    'echantillons_proctor_modifie','echantillons_proctor_normal','echantillons_sclerometre',
    'echantillons_sondage','echantillons_temperature','echantillons_temps_prise',
    'echantillons_teneur_air','echantillons_teneur_eau','echantillons_teneur_eau_sol',
    'echantillons_traction_fendage','echantillons_triaxial','echantillons_ultrason',
    'essais','formulations','laboratoires_mobiles','maintenance_materiel',
    'maitres_oeuvre','maitres_ouvrage','materiel','materiel_laboratoire',
    'postes','prestataires','produits','sources_eau'
  ];
  admin_tables text[] := ARRAY[
    'entreprise','parametres_facturation','parametres_qrcode','parametres_signature',
    'parametres_systeme','taux_tva','essais_deleted'
  ];
BEGIN
  -- 1) Supprimer toutes les policies legacy détectées
  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename = ANY(business_tables || admin_tables)
      AND (
        COALESCE(qual,'')        ILIKE '%auth.uid() IS NOT NULL%'
        OR COALESCE(qual,'')      ILIKE '%auth.role()%'
        OR COALESCE(with_check,'') ILIKE '%auth.uid() IS NOT NULL%'
        OR COALESCE(with_check,'') ILIKE '%auth.role()%'
        OR (cmd IN ('INSERT','UPDATE','DELETE') AND COALESCE(qual,'')='true')
        OR (cmd IN ('INSERT','UPDATE','DELETE') AND COALESCE(with_check,'')='true')
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  -- 2) Recréer des policies standardisées pour les tables métier
  FOREACH t IN ARRAY business_tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_select') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
                     t||'_std_select', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_insert') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_write_business())',
                     t||'_std_insert', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_update') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business())',
                     t||'_std_update', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_delete') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_admin_or_manager())',
                     t||'_std_delete', t);
    END IF;
  END LOOP;

  -- 3) Recréer des policies admin-only pour les tables sensibles
  FOREACH t IN ARRAY admin_tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_select') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
                     t||'_std_select', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_insert') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin_only())',
                     t||'_std_insert', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_update') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only())',
                     t||'_std_update', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_std_delete') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_admin_only())',
                     t||'_std_delete', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- PRIORITÉ 2 : Index manquants sur Foreign Keys (idempotent)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r record;
  idx_name text;
  col_csv text;
BEGIN
  FOR r IN
    WITH fk_cols AS (
      SELECT c.conrelid::regclass::text AS tbl,
             (SELECT array_agg(a.attname ORDER BY u.ord)
              FROM unnest(c.conkey) WITH ORDINALITY u(attnum, ord)
              JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=u.attnum) AS cols
      FROM pg_constraint c
      WHERE c.contype='f' AND c.connamespace='public'::regnamespace
    ),
    idx AS (
      SELECT t.relname AS tbl,
             (SELECT array_agg(a.attname ORDER BY k.ord)
              FROM unnest(i.indkey) WITH ORDINALITY k(attnum,ord)
              JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=k.attnum) AS cols
      FROM pg_index i
      JOIN pg_class t ON t.oid=i.indrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace AND n.nspname='public'
    )
    SELECT fk_cols.tbl, fk_cols.cols
    FROM fk_cols
    WHERE NOT EXISTS (
      SELECT 1 FROM idx
      WHERE idx.tbl = fk_cols.tbl
        AND idx.cols[1:array_length(fk_cols.cols,1)] = fk_cols.cols
    )
  LOOP
    idx_name := 'idx_' || r.tbl || '_' || array_to_string(r.cols, '_');
    IF length(idx_name) > 63 THEN
      idx_name := substring(idx_name from 1 for 63);
    END IF;
    SELECT string_agg(quote_ident(c), ',') INTO col_csv FROM unnest(r.cols) AS c;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%s)', idx_name, r.tbl, col_csv);
  END LOOP;
END $$;
