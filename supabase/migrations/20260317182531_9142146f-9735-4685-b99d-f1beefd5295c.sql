
-- Scléromètre: rename columns
ALTER TABLE public.echantillons_sclerometre ADD COLUMN IF NOT EXISTS ouvrage text;
ALTER TABLE public.echantillons_sclerometre ADD COLUMN IF NOT EXISTS partie_ouvrage text;
ALTER TABLE public.echantillons_sclerometre DROP COLUMN IF EXISTS element_teste;
ALTER TABLE public.echantillons_sclerometre DROP COLUMN IF EXISTS localisation;

-- Ultrason: rename columns
ALTER TABLE public.echantillons_ultrason ADD COLUMN IF NOT EXISTS ouvrage text;
ALTER TABLE public.echantillons_ultrason ADD COLUMN IF NOT EXISTS partie_ouvrage text;
ALTER TABLE public.echantillons_ultrason DROP COLUMN IF EXISTS element_teste;
ALTER TABLE public.echantillons_ultrason DROP COLUMN IF EXISTS localisation;
