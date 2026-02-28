
-- Add poste_id and intervenant_id to utilisateurs table
ALTER TABLE public.utilisateurs 
ADD COLUMN poste_id uuid REFERENCES public.postes(id) ON DELETE SET NULL,
ADD COLUMN intervenant_id uuid REFERENCES public.intervenants(id) ON DELETE SET NULL;
