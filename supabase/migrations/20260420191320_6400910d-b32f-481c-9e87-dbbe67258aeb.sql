-- Table d'historique des modifications pour tous les essais béton
CREATE TABLE public.essais_modifications_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  modified_by UUID,
  modified_by_name TEXT,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_essais_history_record ON public.essais_modifications_history(table_name, record_id, modified_at DESC);

ALTER TABLE public.essais_modifications_history ENABLE ROW LEVEL SECURITY;

-- Tout le monde authentifié peut lire l'historique
CREATE POLICY "Authenticated can read history"
ON public.essais_modifications_history FOR SELECT
TO authenticated
USING (true);

-- Insertion via trigger (tous authentifiés)
CREATE POLICY "Authenticated can insert history"
ON public.essais_modifications_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Seuls admin / super_admin peuvent supprimer (utilisé lors de restauration pour purger)
CREATE POLICY "Admins can delete history"
ON public.essais_modifications_history FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Fonction trigger générique : log chaque champ modifié
CREATE OR REPLACE FUNCTION public.log_essai_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_key TEXT;
  v_user_id UUID;
  v_user_name TEXT;
  v_ignored TEXT[] := ARRAY['updated_at', 'created_at', 'id'];
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(nom, email) INTO v_user_name
    FROM public.utilisateurs WHERE id = v_user_id LIMIT 1;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);

  FOR v_key IN SELECT jsonb_object_keys(v_new)
  LOOP
    IF v_key = ANY(v_ignored) THEN CONTINUE; END IF;
    IF (v_old->v_key) IS DISTINCT FROM (v_new->v_key) THEN
      INSERT INTO public.essais_modifications_history(
        table_name, record_id, field_name, old_value, new_value, modified_by, modified_by_name
      ) VALUES (
        TG_TABLE_NAME, NEW.id, v_key, v_old->v_key, v_new->v_key, v_user_id, v_user_name
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attacher trigger aux tables d'essais béton
CREATE TRIGGER trg_log_modif_compression
  AFTER UPDATE ON public.echantillons_compression
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_affaissement
  AFTER UPDATE ON public.echantillons_affaissement
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();

CREATE TRIGGER trg_log_modif_carottage
  AFTER UPDATE ON public.echantillons_carottage
  FOR EACH ROW EXECUTE FUNCTION public.log_essai_modifications();
