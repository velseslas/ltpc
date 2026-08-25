-- 1. Column-level privileges: HR fields become unreadable/unwritable through the Data API.
REVOKE SELECT, INSERT, UPDATE ON public.intervenants FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.intervenants FROM anon;

GRANT SELECT (id, nom, prenom, email, telephone, role, departement, statut,
              date_embauche, poste_id, specialite, signature_url, created_at, updated_at)
  ON public.intervenants TO authenticated;

GRANT INSERT (id, nom, prenom, email, telephone, role, departement, statut,
              date_embauche, poste_id, specialite, signature_url, created_at, updated_at)
  ON public.intervenants TO authenticated;

GRANT UPDATE (nom, prenom, email, telephone, role, departement, statut,
              date_embauche, poste_id, specialite, signature_url, updated_at)
  ON public.intervenants TO authenticated;

GRANT ALL ON public.intervenants TO service_role;

-- 2. Admin/manager-only read of the sensitive HR fields.
CREATE OR REPLACE FUNCTION public.intervenant_hr(_id uuid)
RETURNS TABLE (
  id uuid,
  date_naissance date,
  cin text,
  cnas text,
  adresse text,
  salaire integer,
  notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.date_naissance, i.cin, i.cnas, i.adresse, i.salaire, i.notes
  FROM public.intervenants i
  WHERE i.id = _id
    AND public.is_admin_or_manager();
$$;

REVOKE EXECUTE ON FUNCTION public.intervenant_hr(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intervenant_hr(uuid) TO authenticated;

-- 3. Admin/manager-only write of the sensitive HR fields.
CREATE OR REPLACE FUNCTION public.intervenant_hr_save(
  _id uuid,
  _date_naissance date DEFAULT NULL,
  _cin text DEFAULT NULL,
  _cnas text DEFAULT NULL,
  _adresse text DEFAULT NULL,
  _salaire integer DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_manager() THEN
    RAISE EXCEPTION 'Accès refusé : réservé aux administrateurs et responsables';
  END IF;

  UPDATE public.intervenants
     SET date_naissance = _date_naissance,
         cin            = _cin,
         cnas           = _cnas,
         adresse        = _adresse,
         salaire        = _salaire,
         notes          = _notes,
         updated_at     = now()
   WHERE id = _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.intervenant_hr_save(uuid, date, text, text, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intervenant_hr_save(uuid, date, text, text, text, integer, text) TO authenticated;