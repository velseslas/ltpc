
ALTER TABLE public.echantillons_proctor_normal 
  ADD COLUMN IF NOT EXISTS carriere_id UUID REFERENCES public.carrieres(id),
  ADD COLUMN IF NOT EXISTS date_essai DATE;

ALTER TABLE public.echantillons_proctor_modifie 
  ADD COLUMN IF NOT EXISTS carriere_id UUID REFERENCES public.carrieres(id),
  ADD COLUMN IF NOT EXISTS date_essai DATE;

ALTER TABLE public.echantillons_cbr 
  ADD COLUMN IF NOT EXISTS carriere_id UUID REFERENCES public.carrieres(id),
  ADD COLUMN IF NOT EXISTS date_essai DATE;
