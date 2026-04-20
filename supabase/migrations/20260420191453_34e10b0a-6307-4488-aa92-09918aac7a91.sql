CREATE TRIGGER trg_log_modif_temperature
  AFTER UPDATE ON public.echantillons_temperature
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_temps_prise
  AFTER UPDATE ON public.echantillons_temps_prise
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_teneur_air
  AFTER UPDATE ON public.echantillons_teneur_air
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_traction_fendage
  AFTER UPDATE ON public.echantillons_traction_fendage
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_module_elasticite
  AFTER UPDATE ON public.echantillons_module_elasticite
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_permeabilite
  AFTER UPDATE ON public.echantillons_permeabilite
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_sclerometre
  AFTER UPDATE ON public.echantillons_sclerometre
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_ultrason
  AFTER UPDATE ON public.echantillons_ultrason
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_ecrasement
  AFTER UPDATE ON public.echantillons_ecrasement
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_formulations
  AFTER UPDATE ON public.formulations
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();
