-- Add cachet_url column to entreprise table
ALTER TABLE public.entreprise ADD COLUMN IF NOT EXISTS cachet_url text;