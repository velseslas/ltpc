-- Add classe_resistance column to echantillons_compression table
ALTER TABLE public.echantillons_compression 
ADD COLUMN classe_resistance TEXT;