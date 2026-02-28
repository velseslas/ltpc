-- Add essai_convenance fields to all Béton Frais tables

-- Affaissement
ALTER TABLE public.echantillons_affaissement
ADD COLUMN IF NOT EXISTS essai_convenance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS essai_convenance_details text;

-- Temperature
ALTER TABLE public.echantillons_temperature
ADD COLUMN IF NOT EXISTS essai_convenance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS essai_convenance_details text;

-- Temps de prise
ALTER TABLE public.echantillons_temps_prise
ADD COLUMN IF NOT EXISTS essai_convenance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS essai_convenance_details text;

-- Teneur en air
ALTER TABLE public.echantillons_teneur_air
ADD COLUMN IF NOT EXISTS essai_convenance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS essai_convenance_details text;