-- Add numero_chantier column for per-chantier sample numbering
ALTER TABLE public.echantillons_compression 
ADD COLUMN IF NOT EXISTS numero_chantier integer DEFAULT 0;

-- Create a function to generate per-chantier numbering
CREATE OR REPLACE FUNCTION public.generate_chantier_sample_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate next number for this specific chantier
  IF NEW.chantier_id IS NOT NULL AND (NEW.numero_chantier IS NULL OR NEW.numero_chantier = 0) THEN
    SELECT COALESCE(MAX(numero_chantier), 0) + 1
    INTO NEW.numero_chantier
    FROM public.echantillons_compression
    WHERE chantier_id = NEW.chantier_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating chantier-specific numbers
DROP TRIGGER IF EXISTS trigger_generate_chantier_sample_number ON public.echantillons_compression;
CREATE TRIGGER trigger_generate_chantier_sample_number
BEFORE INSERT ON public.echantillons_compression
FOR EACH ROW
EXECUTE FUNCTION public.generate_chantier_sample_number();

-- Update existing samples to have chantier-specific numbers
WITH numbered AS (
  SELECT id, chantier_id, ROW_NUMBER() OVER (PARTITION BY chantier_id ORDER BY created_at) as rn
  FROM public.echantillons_compression
  WHERE chantier_id IS NOT NULL
)
UPDATE public.echantillons_compression ec
SET numero_chantier = n.rn
FROM numbered n
WHERE ec.id = n.id AND ec.chantier_id IS NOT NULL;