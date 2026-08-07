CREATE OR REPLACE FUNCTION public.get_database_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT jsonb_build_object(
    'version', (SELECT current_setting('server_version')),
    'database_size_bytes', pg_database_size(current_database()),
    'started_at', (SELECT pg_postmaster_start_time()),
    'now', now(),
    'connections_active', (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()),
    'connections_max', (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'),
    'cache_hit_ratio', (
      SELECT CASE WHEN (blks_hit + blks_read) > 0
        THEN round(100.0 * blks_hit / (blks_hit + blks_read), 2) ELSE 0 END
      FROM pg_stat_database WHERE datname = current_database()
    ),
    'index_usage_ratio', (
      SELECT CASE WHEN COALESCE(sum(seq_scan),0) + COALESCE(sum(idx_scan),0) > 0
        THEN round(100.0 * COALESCE(sum(idx_scan),0) / (COALESCE(sum(seq_scan),0) + COALESCE(sum(idx_scan),0)), 2)
        ELSE 0 END
      FROM pg_stat_user_tables WHERE schemaname = 'public'
    ),
    'transactions_committed', (SELECT xact_commit FROM pg_stat_database WHERE datname = current_database()),
    'transactions_rolled_back', (SELECT xact_rollback FROM pg_stat_database WHERE datname = current_database()),
    'deadlocks', (SELECT deadlocks FROM pg_stat_database WHERE datname = current_database()),
    'tables', (
      SELECT COALESCE(jsonb_agg(t ORDER BY t->>'nom'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'nom', c.relname,
          'enregistrements', COALESCE(s.n_live_tup, 0),
          'taille_bytes', pg_total_relation_size(c.oid),
          'index', (SELECT count(*) FROM pg_index i WHERE i.indrelid = c.oid),
          'rls', c.relrowsecurity,
          'policies', (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid),
          'seq_scan', COALESCE(s.seq_scan, 0),
          'idx_scan', COALESCE(s.idx_scan, 0),
          'last_autovacuum', s.last_autovacuum
        ) AS t
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
        WHERE n.nspname = 'public' AND c.relkind = 'r'
      ) x
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_database_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_database_stats() TO authenticated;