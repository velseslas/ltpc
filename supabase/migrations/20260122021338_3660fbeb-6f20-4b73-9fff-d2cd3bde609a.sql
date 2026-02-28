-- Add new columns to clients table for RC, NIF, NIS, and article_imposition
-- Also rename ice to rc if needed (keeping ice for backward compatibility and renaming in UI only)

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS nif text,
ADD COLUMN IF NOT EXISTS nis text,
ADD COLUMN IF NOT EXISTS article_imposition text;