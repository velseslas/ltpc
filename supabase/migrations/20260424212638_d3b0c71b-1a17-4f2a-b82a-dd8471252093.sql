ALTER TABLE public.formulations
  -- Étape 1 — Identification
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_id uuid REFERENCES public.chantiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS maitre_ouvrage_id uuid REFERENCES public.maitres_ouvrage(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS maitre_oeuvre_id uuid REFERENCES public.maitres_oeuvre(id) ON DELETE SET NULL,
  -- Étape 2 — Données de base
  ADD COLUMN IF NOT EXISTS resistance_28j numeric(10,2),
  ADD COLUMN IF NOT EXISTS slump_souhaite numeric(10,2),
  ADD COLUMN IF NOT EXISTS classe_exposition text,
  ADD COLUMN IF NOT EXISTS eau_calculee numeric(10,2),
  ADD COLUMN IF NOT EXISTS ciment_calcule numeric(10,2),
  ADD COLUMN IF NOT EXISTS ratio_gs numeric(10,3),
  -- Étape 4 — Essai associé
  ADD COLUMN IF NOT EXISTS essai_compression_id uuid REFERENCES public.echantillons_compression(id) ON DELETE SET NULL,
  -- Étape 5 — Coefficients
  ADD COLUMN IF NOT EXISTS coefficient_granulaire numeric(10,3),
  ADD COLUMN IF NOT EXISTS coefficient_compacite numeric(10,3),
  ADD COLUMN IF NOT EXISTS dmax_utilisateur numeric(10,2),
  -- Étape 6 — Calcul A et E
  ADD COLUMN IF NOT EXISTS vibration_ae text,
  ADD COLUMN IF NOT EXISTS forme_ae text,
  ADD COLUMN IF NOT EXISTS kp_ae numeric(10,3),
  ADD COLUMN IF NOT EXISTS mf_ideal numeric(10,3),
  -- Étape 7 — Données importées
  ADD COLUMN IF NOT EXISTS granulat_densites jsonb,
  ADD COLUMN IF NOT EXISTS granulat_module_finesse jsonb;