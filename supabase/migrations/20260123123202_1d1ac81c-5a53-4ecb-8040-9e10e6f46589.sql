-- Table pour les taux TVA
CREATE TABLE public.taux_tva (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  taux NUMERIC NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres de facturation
CREATE TABLE public.parametres_facturation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prefixe_facture TEXT NOT NULL DEFAULT 'FAC',
  prochain_numero_facture INTEGER NOT NULL DEFAULT 1,
  prefixe_devis TEXT NOT NULL DEFAULT 'DEV',
  prochain_numero_devis INTEGER NOT NULL DEFAULT 1,
  delai_paiement INTEGER NOT NULL DEFAULT 30,
  penalite_retard NUMERIC NOT NULL DEFAULT 1.5,
  mention_legale TEXT,
  conditions_paiement TEXT,
  banque_nom TEXT,
  banque_iban TEXT,
  banque_bic TEXT,
  banque_rib TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres de sécurité
CREATE TABLE public.parametres_securite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  longueur_mot_passe INTEGER NOT NULL DEFAULT 8,
  exiger_majuscule BOOLEAN NOT NULL DEFAULT true,
  exiger_chiffre BOOLEAN NOT NULL DEFAULT true,
  exiger_special BOOLEAN NOT NULL DEFAULT false,
  duree_session INTEGER NOT NULL DEFAULT 480,
  tentatives_max INTEGER NOT NULL DEFAULT 5,
  duree_blocage INTEGER NOT NULL DEFAULT 30,
  activer_2fa BOOLEAN NOT NULL DEFAULT false,
  journal_connexions BOOLEAN NOT NULL DEFAULT true,
  journal_modifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres de notifications
CREATE TABLE public.parametres_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_nouveaux_essais BOOLEAN NOT NULL DEFAULT true,
  email_resultats BOOLEAN NOT NULL DEFAULT true,
  email_alertes BOOLEAN NOT NULL DEFAULT true,
  email_rapports BOOLEAN NOT NULL DEFAULT false,
  push_nouveaux_essais BOOLEAN NOT NULL DEFAULT false,
  push_resultats BOOLEAN NOT NULL DEFAULT true,
  push_alertes BOOLEAN NOT NULL DEFAULT true,
  push_rappels BOOLEAN NOT NULL DEFAULT false,
  sms_alertes_critiques BOOLEAN NOT NULL DEFAULT false,
  sms_rappels_urgents BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres de signature
CREATE TABLE public.parametres_signature (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_auto BOOLEAN NOT NULL DEFAULT false,
  cachet_auto BOOLEAN NOT NULL DEFAULT false,
  position_signature TEXT NOT NULL DEFAULT 'bas-droite',
  position_cachet TEXT NOT NULL DEFAULT 'bas-gauche',
  inclure_date BOOLEAN NOT NULL DEFAULT true,
  inclure_nom BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres QR Code
CREATE TABLE public.parametres_qrcode (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activer_qrcode BOOLEAN NOT NULL DEFAULT true,
  taille_qrcode TEXT NOT NULL DEFAULT 'medium',
  position_qrcode TEXT NOT NULL DEFAULT 'bas-droite',
  inclure_logo BOOLEAN NOT NULL DEFAULT false,
  couleur_qrcode TEXT NOT NULL DEFAULT '#000000',
  url_base TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres système
CREATE TABLE public.parametres_systeme (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  langue TEXT NOT NULL DEFAULT 'fr',
  fuseau_horaire TEXT NOT NULL DEFAULT 'Africa/Algiers',
  format_date TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  format_nombre TEXT NOT NULL DEFAULT 'fr-FR',
  theme TEXT NOT NULL DEFAULT 'dark',
  couleur_accent TEXT NOT NULL DEFAULT 'blue',
  logo_header BOOLEAN NOT NULL DEFAULT true,
  nom_application TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le journal d'audit
CREATE TABLE public.journal_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  utilisateur_id UUID,
  utilisateur_nom TEXT,
  action TEXT NOT NULL,
  type TEXT NOT NULL,
  cible TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.taux_tva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_facturation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_securite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_qrcode ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_systeme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for taux_tva
CREATE POLICY "Allow authenticated read on taux_tva" ON public.taux_tva FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on taux_tva" ON public.taux_tva FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on taux_tva" ON public.taux_tva FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete on taux_tva" ON public.taux_tva FOR DELETE USING (true);

-- RLS Policies for parametres_facturation
CREATE POLICY "Allow authenticated read on parametres_facturation" ON public.parametres_facturation FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on parametres_facturation" ON public.parametres_facturation FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on parametres_facturation" ON public.parametres_facturation FOR UPDATE USING (true);

-- RLS Policies for parametres_securite
CREATE POLICY "Allow authenticated read on parametres_securite" ON public.parametres_securite FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on parametres_securite" ON public.parametres_securite FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on parametres_securite" ON public.parametres_securite FOR UPDATE USING (true);

-- RLS Policies for parametres_notifications
CREATE POLICY "Allow authenticated read on parametres_notifications" ON public.parametres_notifications FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on parametres_notifications" ON public.parametres_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on parametres_notifications" ON public.parametres_notifications FOR UPDATE USING (true);

-- RLS Policies for parametres_signature
CREATE POLICY "Allow authenticated read on parametres_signature" ON public.parametres_signature FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on parametres_signature" ON public.parametres_signature FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on parametres_signature" ON public.parametres_signature FOR UPDATE USING (true);

-- RLS Policies for parametres_qrcode
CREATE POLICY "Allow authenticated read on parametres_qrcode" ON public.parametres_qrcode FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on parametres_qrcode" ON public.parametres_qrcode FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on parametres_qrcode" ON public.parametres_qrcode FOR UPDATE USING (true);

-- RLS Policies for parametres_systeme
CREATE POLICY "Allow authenticated read on parametres_systeme" ON public.parametres_systeme FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on parametres_systeme" ON public.parametres_systeme FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on parametres_systeme" ON public.parametres_systeme FOR UPDATE USING (true);

-- RLS Policies for journal_audit
CREATE POLICY "Allow authenticated read on journal_audit" ON public.journal_audit FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on journal_audit" ON public.journal_audit FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_taux_tva_updated_at BEFORE UPDATE ON public.taux_tva FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parametres_facturation_updated_at BEFORE UPDATE ON public.parametres_facturation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parametres_securite_updated_at BEFORE UPDATE ON public.parametres_securite FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parametres_notifications_updated_at BEFORE UPDATE ON public.parametres_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parametres_signature_updated_at BEFORE UPDATE ON public.parametres_signature FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parametres_qrcode_updated_at BEFORE UPDATE ON public.parametres_qrcode FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parametres_systeme_updated_at BEFORE UPDATE ON public.parametres_systeme FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();