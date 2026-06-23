
DO $$
DECLARE r RECORD;
  v_qual TEXT;
  v_check TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
    FROM pg_policies
    WHERE schemaname='public' AND cmd <> 'SELECT'
      AND (qual = 'true' OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    v_qual := CASE WHEN r.qual = 'true' THEN '(auth.uid() IS NOT NULL)' ELSE r.qual END;
    v_check := CASE WHEN r.with_check = 'true' THEN '(auth.uid() IS NOT NULL)' ELSE r.with_check END;
    IF r.cmd = 'INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK %s',
        r.policyname, r.schemaname, r.tablename, v_check);
    ELSIF r.cmd = 'UPDATE' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING %s WITH CHECK %s',
        r.policyname, r.schemaname, r.tablename, v_qual, COALESCE(v_check, v_qual));
    ELSIF r.cmd = 'DELETE' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR DELETE TO authenticated USING %s',
        r.policyname, r.schemaname, r.tablename, v_qual);
    ELSIF r.cmd = 'ALL' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR ALL TO authenticated USING %s WITH CHECK %s',
        r.policyname, r.schemaname, r.tablename, v_qual, COALESCE(v_check, v_qual));
    END IF;
  END LOOP;
END $$;
