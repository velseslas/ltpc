
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS representant text;
ALTER TABLE public.chantiers ADD COLUMN IF NOT EXISTS contact text;
ALTER TABLE public.chantiers ADD COLUMN IF NOT EXISTS telephone text;
