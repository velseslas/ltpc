
-- Add carriere_id and date_essai to identification tables
ALTER TABLE public.echantillons_teneur_eau_sol
  ADD COLUMN IF NOT EXISTS carriere_id uuid REFERENCES public.carrieres(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_essai date;

ALTER TABLE public.echantillons_granulometrie_sol
  ADD COLUMN IF NOT EXISTS carriere_id uuid REFERENCES public.carrieres(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_essai date;

ALTER TABLE public.echantillons_limites_atterberg
  ADD COLUMN IF NOT EXISTS carriere_id uuid REFERENCES public.carrieres(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_essai date;

ALTER TABLE public.echantillons_classification_sol
  ADD COLUMN IF NOT EXISTS carriere_id uuid REFERENCES public.carrieres(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_essai date;

-- Add only date_essai to densitometre (no carriere)
ALTER TABLE public.echantillons_densitometre
  ADD COLUMN IF NOT EXISTS date_essai date;
