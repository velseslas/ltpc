-- Insert default TVA rates
INSERT INTO public.taux_tva (nom, taux, description, actif) VALUES
  ('TVA Standard', 19, 'Taux de TVA standard applicable à la majorité des produits et services', true),
  ('TVA Réduit', 9, 'Taux de TVA réduit pour certains produits et services', true),
  ('Exonéré', 0, 'Exonération de TVA', true)
ON CONFLICT DO NOTHING;

-- Create utilisateurs table for user management
CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Technicien',
  statut TEXT NOT NULL DEFAULT 'actif',
  derniere_connexion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on utilisateurs
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;

-- RLS policies for utilisateurs
CREATE POLICY "Allow authenticated read on utilisateurs"
  ON public.utilisateurs FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on utilisateurs"
  ON public.utilisateurs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on utilisateurs"
  ON public.utilisateurs FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete on utilisateurs"
  ON public.utilisateurs FOR DELETE
  USING (true);

-- Trigger for updated_at on utilisateurs
CREATE TRIGGER update_utilisateurs_updated_at
  BEFORE UPDATE ON public.utilisateurs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log audit entries
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action TEXT,
  p_type TEXT,
  p_cible TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_utilisateur_id UUID DEFAULT NULL,
  p_utilisateur_nom TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.journal_audit (action, type, cible, details, utilisateur_id, utilisateur_nom)
  VALUES (p_action, p_type, p_cible, p_details, p_utilisateur_id, p_utilisateur_nom)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Create trigger function for automatic audit logging on utilisateurs
CREATE OR REPLACE FUNCTION public.audit_utilisateurs_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_action(
      'Création utilisateur: ' || NEW.nom,
      'creation',
      'utilisateurs',
      'Email: ' || NEW.email || ', Rôle: ' || NEW.role
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_action(
      'Modification utilisateur: ' || NEW.nom,
      'modification',
      'utilisateurs',
      'Changements appliqués'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_action(
      'Suppression utilisateur: ' || OLD.nom,
      'suppression',
      'utilisateurs',
      'Email: ' || OLD.email
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for automatic audit on utilisateurs
CREATE TRIGGER audit_utilisateurs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.utilisateurs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_utilisateurs_changes();

-- Create trigger function for audit on parametres changes
CREATE OR REPLACE FUNCTION public.audit_parametres_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_action(
      'Modification des paramètres: ' || TG_TABLE_NAME,
      'modification',
      TG_TABLE_NAME,
      'Configuration mise à jour'
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers on all parametres tables
CREATE TRIGGER audit_parametres_facturation_trigger
  AFTER UPDATE ON public.parametres_facturation
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_parametres_changes();

CREATE TRIGGER audit_parametres_securite_trigger
  AFTER UPDATE ON public.parametres_securite
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_parametres_changes();

CREATE TRIGGER audit_parametres_notifications_trigger
  AFTER UPDATE ON public.parametres_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_parametres_changes();

CREATE TRIGGER audit_parametres_signature_trigger
  AFTER UPDATE ON public.parametres_signature
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_parametres_changes();

CREATE TRIGGER audit_parametres_qrcode_trigger
  AFTER UPDATE ON public.parametres_qrcode
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_parametres_changes();

CREATE TRIGGER audit_parametres_systeme_trigger
  AFTER UPDATE ON public.parametres_systeme
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_parametres_changes();

-- Audit trigger for taux_tva
CREATE OR REPLACE FUNCTION public.audit_taux_tva_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_action(
      'Création taux TVA: ' || NEW.nom || ' (' || NEW.taux || '%)',
      'creation',
      'taux_tva',
      'Taux: ' || NEW.taux || '%'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_action(
      'Modification taux TVA: ' || NEW.nom,
      'modification',
      'taux_tva',
      'Nouveau taux: ' || NEW.taux || '%'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_action(
      'Suppression taux TVA: ' || OLD.nom,
      'suppression',
      'taux_tva',
      'Taux: ' || OLD.taux || '%'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_taux_tva_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.taux_tva
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_taux_tva_changes();