ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS adresse_localisation TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.chantiers
  ADD CONSTRAINT chantiers_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  ADD CONSTRAINT chantiers_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));