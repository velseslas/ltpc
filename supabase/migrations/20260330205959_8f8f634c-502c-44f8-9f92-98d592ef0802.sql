
-- Add client_id and chantier_id to all granulat sample tables

ALTER TABLE public.echantillons_equivalent_sable
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_bleu_methylene
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_matiere_organique
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_granulometrie
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_masse_volumique
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_forme_granulats
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_teneur_eau
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_los_angeles
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_micro_deval
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_ecrasement
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;

ALTER TABLE public.echantillons_friabilite
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL;
