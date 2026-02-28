-- Create table for sample modification history
CREATE TABLE public.historique_echantillons_compression (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  echantillon_id uuid NOT NULL REFERENCES public.echantillons_compression(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'creation', 'modification', 'suppression'
  utilisateur text, -- User who made the change (could be email or name)
  details jsonb, -- What was changed (old values, new values)
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historique_echantillons_compression ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read on historique_echantillons_compression" 
ON public.historique_echantillons_compression 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on historique_echantillons_compression" 
ON public.historique_echantillons_compression 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete on historique_echantillons_compression" 
ON public.historique_echantillons_compression 
FOR DELETE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_historique_echantillons_compression_echantillon_id 
ON public.historique_echantillons_compression(echantillon_id);

CREATE INDEX idx_historique_echantillons_compression_created_at 
ON public.historique_echantillons_compression(created_at DESC);