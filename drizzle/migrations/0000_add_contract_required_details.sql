ALTER TABLE public.contrats
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS observations text,
  ADD COLUMN IF NOT EXISTS representant text,
  ADD COLUMN IF NOT EXISTS montant_ht numeric;

COMMENT ON COLUMN public.contrats.montant_ht IS 'Montant hors taxes du contrat en dinars algériens.';