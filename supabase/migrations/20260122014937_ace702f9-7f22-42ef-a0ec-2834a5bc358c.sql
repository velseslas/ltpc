-- Add authorization date column to entreprise table
ALTER TABLE public.entreprise 
ADD COLUMN IF NOT EXISTS date_autorisation date;