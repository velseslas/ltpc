ALTER TABLE public.evaluations_normatives_carottage
  ADD COLUMN IF NOT EXISTS dmax numeric,
  ADD COLUMN IF NOT EXISTS dmax_source text,
  ADD COLUMN IF NOT EXISTS validee_at timestamptz,
  ADD COLUMN IF NOT EXISTS validee_par uuid,
  ADD COLUMN IF NOT EXISTS validee_par_nom text;

DROP TRIGGER IF EXISTS set_updated_at_eval_norm ON public.evaluations_normatives_carottage;
CREATE TRIGGER set_updated_at_eval_norm
BEFORE UPDATE ON public.evaluations_normatives_carottage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();