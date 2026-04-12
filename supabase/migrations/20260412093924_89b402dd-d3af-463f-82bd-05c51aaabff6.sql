
ALTER TABLE public.paiements_espece 
ADD COLUMN chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
ADD COLUMN recu_url TEXT;
