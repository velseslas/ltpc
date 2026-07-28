ALTER TABLE public.echantillons_compression
ADD COLUMN IF NOT EXISTS mention_eprouvettes_labo boolean NOT NULL DEFAULT true;