CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Supprimer les doublons chevauchants existants (garder la plus ancienne)
DELETE FROM public.affectations a
USING public.affectations b
WHERE a.ctid > b.ctid
  AND a.intervenant_id = b.intervenant_id
  AND a.chantier_id = b.chantier_id
  AND daterange(a.date_debut, COALESCE(a.date_fin, 'infinity'::date), '[]')
      && daterange(b.date_debut, COALESCE(b.date_fin, 'infinity'::date), '[]');

ALTER TABLE public.affectations
  ADD CONSTRAINT affectations_no_overlap_per_chantier
  EXCLUDE USING gist (
    intervenant_id WITH =,
    chantier_id WITH =,
    daterange(date_debut, COALESCE(date_fin, 'infinity'::date), '[]') WITH &&
  );