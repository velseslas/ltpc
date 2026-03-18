ALTER TABLE public.echantillons_compression ADD COLUMN IF NOT EXISTS date_essai date;
ALTER TABLE public.echantillons_compression ADD COLUMN IF NOT EXISTS etuvage text DEFAULT 'non';