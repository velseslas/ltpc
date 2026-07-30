ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS mode_paiement text,
  ADD COLUMN IF NOT EXISTS periode text;