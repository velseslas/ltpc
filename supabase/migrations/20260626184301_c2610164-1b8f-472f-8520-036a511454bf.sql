
CREATE TABLE IF NOT EXISTS public.role_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  color text,
  alias_of public.app_role,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_definitions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.role_definitions TO authenticated;
GRANT ALL ON public.role_definitions TO service_role;

ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_definitions read auth"
  ON public.role_definitions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "role_definitions admin insert"
  ON public.role_definitions FOR INSERT
  TO authenticated WITH CHECK (public.is_admin_only());

CREATE POLICY "role_definitions admin update"
  ON public.role_definitions FOR UPDATE
  TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

CREATE POLICY "role_definitions admin delete"
  ON public.role_definitions FOR DELETE
  TO authenticated USING (public.is_admin_only() AND is_system = false);

CREATE TRIGGER trg_role_definitions_updated_at
  BEFORE UPDATE ON public.role_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.role_definitions (key, label, description, color, alias_of, is_system) VALUES
  ('super_admin','Super Administrateur','Accès complet à toutes les fonctionnalités, y compris la gestion des rôles','bg-red-500/20 text-red-400 border-red-500/30',NULL,true),
  ('admin','Administrateur','Accès à toutes les fonctionnalités sauf la gestion des rôles','bg-orange-500/20 text-orange-400 border-orange-500/30',NULL,true),
  ('manager','Manager','Peut gérer les essais, clients, chantiers et valider les rapports','bg-blue-500/20 text-blue-400 border-blue-500/30',NULL,true),
  ('technicien','Technicien','Peut créer et modifier les essais, générer des rapports','bg-green-500/20 text-green-400 border-green-500/30',NULL,true),
  ('operateur','Opérateur','Peut créer des essais et consulter les données','bg-purple-500/20 text-purple-400 border-purple-500/30',NULL,true),
  ('lecteur','Lecteur','Accès en lecture seule à toutes les données','bg-gray-500/20 text-gray-400 border-gray-500/30',NULL,true)
ON CONFLICT (key) DO NOTHING;
