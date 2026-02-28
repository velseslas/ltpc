
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'technicien', 'operateur', 'lecteur');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'lecteur',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create permissions table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (role, permission_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'technicien' THEN 4
      WHEN 'operateur' THEN 5
      WHEN 'lecteur' THEN 6
    END
  LIMIT 1
$$;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id
      AND p.code = _permission_code
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for permissions (read-only for authenticated)
CREATE POLICY "Authenticated can read permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for role_permissions
CREATE POLICY "Authenticated can read role_permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage role_permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions
INSERT INTO public.permissions (code, nom, description, module) VALUES
-- Module Clients
('clients.view', 'Voir les clients', 'Permet de consulter la liste des clients', 'Clients'),
('clients.create', 'Créer des clients', 'Permet d''ajouter de nouveaux clients', 'Clients'),
('clients.edit', 'Modifier les clients', 'Permet de modifier les informations des clients', 'Clients'),
('clients.delete', 'Supprimer les clients', 'Permet de supprimer des clients', 'Clients'),
-- Module Chantiers
('chantiers.view', 'Voir les chantiers', 'Permet de consulter la liste des chantiers', 'Chantiers'),
('chantiers.create', 'Créer des chantiers', 'Permet d''ajouter de nouveaux chantiers', 'Chantiers'),
('chantiers.edit', 'Modifier les chantiers', 'Permet de modifier les informations des chantiers', 'Chantiers'),
('chantiers.delete', 'Supprimer les chantiers', 'Permet de supprimer des chantiers', 'Chantiers'),
-- Module Essais
('essais.view', 'Voir les essais', 'Permet de consulter la liste des essais', 'Essais'),
('essais.create', 'Créer des essais', 'Permet d''ajouter de nouveaux essais', 'Essais'),
('essais.edit', 'Modifier les essais', 'Permet de modifier les informations des essais', 'Essais'),
('essais.delete', 'Supprimer les essais', 'Permet de supprimer des essais', 'Essais'),
('essais.validate', 'Valider les essais', 'Permet de valider les résultats des essais', 'Essais'),
-- Module Rapports
('rapports.view', 'Voir les rapports', 'Permet de consulter les rapports', 'Rapports'),
('rapports.generate', 'Générer des rapports', 'Permet de générer de nouveaux rapports', 'Rapports'),
('rapports.export', 'Exporter les rapports', 'Permet d''exporter les rapports en PDF', 'Rapports'),
-- Module Producteurs
('producteurs.view', 'Voir les producteurs', 'Permet de consulter la liste des producteurs', 'Producteurs'),
('producteurs.create', 'Créer des producteurs', 'Permet d''ajouter de nouveaux producteurs', 'Producteurs'),
('producteurs.edit', 'Modifier les producteurs', 'Permet de modifier les informations des producteurs', 'Producteurs'),
('producteurs.delete', 'Supprimer les producteurs', 'Permet de supprimer des producteurs', 'Producteurs'),
-- Module RH
('rh.view', 'Voir le personnel', 'Permet de consulter la liste du personnel', 'RH'),
('rh.create', 'Créer du personnel', 'Permet d''ajouter de nouveaux employés', 'RH'),
('rh.edit', 'Modifier le personnel', 'Permet de modifier les informations du personnel', 'RH'),
('rh.delete', 'Supprimer du personnel', 'Permet de supprimer des employés', 'RH'),
('rh.salaires', 'Voir les salaires', 'Permet de consulter les informations salariales', 'RH'),
-- Module Paramètres
('parametres.view', 'Voir les paramètres', 'Permet de consulter les paramètres', 'Paramètres'),
('parametres.edit', 'Modifier les paramètres', 'Permet de modifier les paramètres système', 'Paramètres'),
('parametres.users', 'Gérer les utilisateurs', 'Permet de gérer les utilisateurs du système', 'Paramètres'),
('parametres.roles', 'Gérer les rôles', 'Permet de gérer les rôles et permissions', 'Paramètres'),
-- Module Facturation
('facturation.view', 'Voir les factures', 'Permet de consulter les factures', 'Facturation'),
('facturation.create', 'Créer des factures', 'Permet de créer de nouvelles factures', 'Facturation'),
('facturation.edit', 'Modifier les factures', 'Permet de modifier les factures', 'Facturation'),
('facturation.delete', 'Supprimer les factures', 'Permet de supprimer des factures', 'Facturation');

-- Assign default permissions to roles
-- Super Admin - All permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin', id FROM public.permissions;

-- Admin - All except role management
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions WHERE code != 'parametres.roles';

-- Manager - View and edit most modules
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager', id FROM public.permissions 
WHERE code LIKE '%.view' OR code LIKE '%.create' OR code LIKE '%.edit' OR code IN ('essais.validate', 'rapports.generate', 'rapports.export');

-- Technicien - Essais related + view others
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'technicien', id FROM public.permissions 
WHERE code LIKE 'essais.%' OR code LIKE 'rapports.%' OR code IN ('clients.view', 'chantiers.view', 'producteurs.view');

-- Operateur - Create and view essais
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'operateur', id FROM public.permissions 
WHERE code IN ('essais.view', 'essais.create', 'clients.view', 'chantiers.view', 'rapports.view');

-- Lecteur - View only
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'lecteur', id FROM public.permissions WHERE code LIKE '%.view';

-- Log audit action
SELECT public.log_audit_action(
    'Création',
    'système',
    'Tables user_roles, permissions et role_permissions créées avec permissions par défaut',
    'système'
);
