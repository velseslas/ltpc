-- Add essai_convenance_details column to echantillons_compression table
ALTER TABLE public.echantillons_compression 
ADD COLUMN essai_convenance_details text;