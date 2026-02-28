-- Add client_id, chantier_id, date_debut, date_fin columns to laboratoires_mobiles
ALTER TABLE public.laboratoires_mobiles
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS date_debut DATE,
ADD COLUMN IF NOT EXISTS date_fin DATE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_laboratoires_mobiles_chantier_id ON public.laboratoires_mobiles(chantier_id);
CREATE INDEX IF NOT EXISTS idx_laboratoires_mobiles_client_id ON public.laboratoires_mobiles(client_id);