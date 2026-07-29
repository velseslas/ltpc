
-- 1) helper: staff = utilisateur authentifié avec un rôle attribué
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid())
$$;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;

-- 2) branding public (remplace l'exposition anon de get_entreprise_public)
CREATE TABLE IF NOT EXISTS public.entreprise_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL DEFAULT '',
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.entreprise_branding TO anon, authenticated;
GRANT ALL ON public.entreprise_branding TO service_role;
ALTER TABLE public.entreprise_branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branding readable by everyone" ON public.entreprise_branding;
CREATE POLICY "branding readable by everyone" ON public.entreprise_branding FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.sync_entreprise_branding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.entreprise_branding WHERE id <> NEW.id;
  INSERT INTO public.entreprise_branding (id, nom, logo_url, updated_at)
  VALUES (NEW.id, COALESCE(NEW.nom,''), NEW.logo_url, now())
  ON CONFLICT (id) DO UPDATE
    SET nom = EXCLUDED.nom, logo_url = EXCLUDED.logo_url, updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_entreprise_branding ON public.entreprise;
CREATE TRIGGER trg_sync_entreprise_branding
AFTER INSERT OR UPDATE ON public.entreprise
FOR EACH ROW EXECUTE FUNCTION public.sync_entreprise_branding();

INSERT INTO public.entreprise_branding (id, nom, logo_url)
SELECT e.id, COALESCE(e.nom,''), e.logo_url
FROM public.entreprise e ORDER BY e.created_at ASC LIMIT 1
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom, logo_url = EXCLUDED.logo_url;

REVOKE EXECUTE ON FUNCTION public.get_entreprise_public() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_entreprise_public() TO authenticated, service_role;

-- 3) essais / echantillons : lecture réservée au personnel
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND cmd='SELECT' AND permissive='PERMISSIVE' AND qual='true'
      AND (tablename='essais' OR tablename LIKE 'echantillons%')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  FOR r IN
    SELECT c.relname AS tablename FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
      AND (c.relname='essais' OR c.relname LIKE 'echantillons%')
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff())',
      r.tablename || '_staff_select', r.tablename);
  END LOOP;
END $$;

-- 4) mouvements matériel
DROP POLICY IF EXISTS "auth read movements" ON public.materiel_movements;
CREATE POLICY "staff read movements" ON public.materiel_movements
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "auth read items" ON public.movement_items;
CREATE POLICY "staff read items" ON public.movement_items
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "auth read resp" ON public.material_responsibility_history;
CREATE POLICY "staff read resp" ON public.material_responsibility_history
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "auth read sig" ON public.movement_signatures;
CREATE POLICY "staff read sig" ON public.movement_signatures
  FOR SELECT TO authenticated USING (public.can_write_business());

-- 5) intervenants : une seule règle de lecture (admin/manager)
DROP POLICY IF EXISTS "intervenants_select_restrict_admin_manager" ON public.intervenants;
DROP POLICY IF EXISTS "intervenants_select_admin_manager" ON public.intervenants;
CREATE POLICY "intervenants_select_admin_manager" ON public.intervenants
  FOR SELECT TO authenticated USING (public.is_admin_or_manager());
