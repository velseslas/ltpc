ALTER TABLE public.echantillons_compression
ADD COLUMN IF NOT EXISTS essai_convenance boolean NOT NULL DEFAULT true;