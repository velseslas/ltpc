ALTER TABLE public.laboratoires_mobiles
  ADD COLUMN IF NOT EXISTS date_affectation DATE,
  ADD COLUMN IF NOT EXISTS date_fin_affectation DATE,
  ADD COLUMN IF NOT EXISTS notes_affectation TEXT;