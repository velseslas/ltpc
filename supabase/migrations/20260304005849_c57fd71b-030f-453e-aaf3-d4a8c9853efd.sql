
ALTER TABLE public.echantillons_compression
ADD COLUMN mention_info_client boolean NOT NULL DEFAULT false,
ADD COLUMN mention_eprouvette_client boolean NOT NULL DEFAULT false;
