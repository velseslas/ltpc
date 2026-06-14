
DO $$
DECLARE
  r RECORD;
  v_cmd TEXT;
  v_using TEXT;
  v_check TEXT;
  v_for TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);

    v_cmd := r.cmd;
    IF v_cmd = 'ALL' THEN v_for := 'ALL';
    ELSIF v_cmd = 'SELECT' THEN v_for := 'SELECT';
    ELSIF v_cmd = 'INSERT' THEN v_for := 'INSERT';
    ELSIF v_cmd = 'UPDATE' THEN v_for := 'UPDATE';
    ELSIF v_cmd = 'DELETE' THEN v_for := 'DELETE';
    END IF;

    v_using := '';
    v_check := '';
    IF r.qual IS NOT NULL THEN
      v_using := ' USING (' || r.qual || ')';
    ELSIF v_cmd IN ('ALL','SELECT','UPDATE','DELETE') THEN
      v_using := ' USING (auth.role() = ''authenticated'')';
    END IF;
    IF r.with_check IS NOT NULL THEN
      v_check := ' WITH CHECK (' || r.with_check || ')';
    ELSIF v_cmd IN ('ALL','INSERT','UPDATE') THEN
      v_check := ' WITH CHECK (auth.role() = ''authenticated'')';
    END IF;

    -- Override permissive "true" quals/checks to require authenticated
    IF r.qual = 'true' AND v_cmd IN ('ALL','SELECT','UPDATE','DELETE') THEN
      v_using := ' USING (auth.role() = ''authenticated'')';
    END IF;
    IF r.with_check = 'true' AND v_cmd IN ('ALL','INSERT','UPDATE') THEN
      v_check := ' WITH CHECK (auth.role() = ''authenticated'')';
    END IF;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR %s TO authenticated%s%s',
      r.policyname, r.tablename, v_for, v_using, v_check
    );
  END LOOP;
END $$;

-- Remove anon SELECT on intervenants (sensitive: CIN, salaire)
DROP POLICY IF EXISTS "Allow anon read on intervenants" ON public.intervenants;
