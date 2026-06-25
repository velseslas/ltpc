
-- 1) Backfill user_roles from utilisateurs.role for users missing a role row
INSERT INTO public.user_roles (user_id, role)
SELECT u.user_id, u.role::public.app_role
FROM public.utilisateurs u
LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
WHERE u.user_id IS NOT NULL
  AND ur.user_id IS NULL
  AND u.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Trigger to keep user_roles in sync when utilisateurs row is created/updated
CREATE OR REPLACE FUNCTION public.sync_user_role_from_utilisateurs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.role IS NULL THEN
    RETURN NEW;
  END IF;
  -- Remove other roles for this user and insert the current one
  DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role <> NEW.role::public.app_role;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, NEW.role::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role_from_utilisateurs ON public.utilisateurs;
CREATE TRIGGER trg_sync_user_role_from_utilisateurs
AFTER INSERT OR UPDATE OF role, user_id ON public.utilisateurs
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_from_utilisateurs();

-- 3) Consolidate entreprise table: keep only the row with a non-empty name (most recent)
DELETE FROM public.entreprise
WHERE id NOT IN (
  SELECT id FROM public.entreprise
  WHERE nom IS NOT NULL AND btrim(nom) <> ''
  ORDER BY updated_at DESC NULLS LAST, created_at DESC
  LIMIT 1
);
