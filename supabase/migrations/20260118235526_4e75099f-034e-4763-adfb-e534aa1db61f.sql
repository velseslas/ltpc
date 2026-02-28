-- Ajouter le champ ouvrage à la table echantillons_compression
ALTER TABLE public.echantillons_compression ADD COLUMN IF NOT EXISTS ouvrage text;