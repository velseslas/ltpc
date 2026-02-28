-- Add ouvrage and destination_beton fields to all Béton Frais tables

-- Affaissement
ALTER TABLE public.echantillons_affaissement
ADD COLUMN IF NOT EXISTS ouvrage text,
ADD COLUMN IF NOT EXISTS destination_beton text;

-- Temperature
ALTER TABLE public.echantillons_temperature
ADD COLUMN IF NOT EXISTS ouvrage text,
ADD COLUMN IF NOT EXISTS destination_beton text;

-- Temps de prise
ALTER TABLE public.echantillons_temps_prise
ADD COLUMN IF NOT EXISTS ouvrage text,
ADD COLUMN IF NOT EXISTS destination_beton text;

-- Teneur en air
ALTER TABLE public.echantillons_teneur_air
ADD COLUMN IF NOT EXISTS ouvrage text,
ADD COLUMN IF NOT EXISTS destination_beton text;