-- Add essai_convenance column to echantillons_compression table
ALTER TABLE public.echantillons_compression 
ADD COLUMN essai_convenance boolean NOT NULL DEFAULT false;