-- Insert all permissions based on sidebar menu items
INSERT INTO permissions (id, code, nom, description, module) VALUES
  (gen_random_uuid(), 'dashboard.voir', 'Voir tableau de bord', 'Accès au tableau de bord', 'dashboard'),
  (gen_random_uuid(), 'intervenants.voir', 'Voir intervenants', 'Accès aux intervenants', 'intervenants'),
  (gen_random_uuid(), 'intervenants.gerer', 'Gérer intervenants', 'Créer/modifier/supprimer intervenants', 'intervenants'),
  (gen_random_uuid(), 'rh.voir', 'Voir RH', 'Accès au module RH', 'rh'),
  (gen_random_uuid(), 'rh.gerer', 'Gérer RH', 'Gérer les ressources humaines', 'rh'),
  (gen_random_uuid(), 'essais.voir', 'Voir essais', 'Accès aux essais', 'essais'),
  (gen_random_uuid(), 'essais.gerer', 'Gérer essais', 'Créer/modifier/supprimer essais', 'essais'),
  (gen_random_uuid(), 'labos_mobiles.voir', 'Voir laboratoires mobiles', 'Accès aux laboratoires chantier', 'labos_mobiles'),
  (gen_random_uuid(), 'labos_mobiles.gerer', 'Gérer laboratoires mobiles', 'Gérer les laboratoires chantier', 'labos_mobiles'),
  (gen_random_uuid(), 'materiel.voir', 'Voir matériel', 'Accès au matériel laboratoire', 'materiel'),
  (gen_random_uuid(), 'materiel.gerer', 'Gérer matériel', 'Gérer le matériel laboratoire', 'materiel'),
  (gen_random_uuid(), 'facturation.voir', 'Voir facturation', 'Accès à la facturation', 'facturation'),
  (gen_random_uuid(), 'facturation.gerer', 'Gérer facturation', 'Gérer la facturation', 'facturation'),
  (gen_random_uuid(), 'documents.voir', 'Voir documents', 'Accès aux documents', 'documents'),
  (gen_random_uuid(), 'documents.gerer', 'Gérer documents', 'Gérer les documents', 'documents'),
  (gen_random_uuid(), 'parametres.voir', 'Voir paramètres', 'Accès aux paramètres', 'parametres'),
  (gen_random_uuid(), 'parametres.gerer', 'Gérer paramètres', 'Modifier les paramètres', 'parametres'),
  (gen_random_uuid(), 'clients.voir', 'Voir clients', 'Accès aux clients', 'clients'),
  (gen_random_uuid(), 'clients.gerer', 'Gérer clients', 'Créer/modifier/supprimer clients', 'clients'),
  (gen_random_uuid(), 'chantiers.voir', 'Voir chantiers', 'Accès aux chantiers', 'chantiers'),
  (gen_random_uuid(), 'chantiers.gerer', 'Gérer chantiers', 'Créer/modifier/supprimer chantiers', 'chantiers'),
  (gen_random_uuid(), 'utilisateurs.voir', 'Voir utilisateurs', 'Accès aux utilisateurs', 'utilisateurs'),
  (gen_random_uuid(), 'utilisateurs.gerer', 'Gérer utilisateurs', 'Créer/modifier/supprimer utilisateurs', 'utilisateurs')
ON CONFLICT DO NOTHING;

-- Give admin ALL permissions
INSERT INTO role_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'admin'::app_role, p.id
FROM permissions p
ON CONFLICT DO NOTHING;

-- Give manager most permissions (not parametres.gerer, utilisateurs.gerer)
INSERT INTO role_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'manager'::app_role, p.id
FROM permissions p
WHERE p.code NOT IN ('parametres.gerer', 'utilisateurs.gerer')
ON CONFLICT DO NOTHING;

-- Give technicien limited permissions
INSERT INTO role_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'technicien'::app_role, p.id
FROM permissions p
WHERE p.code IN ('dashboard.voir', 'essais.voir', 'essais.gerer', 'labos_mobiles.voir')
ON CONFLICT DO NOTHING;

-- Give operateur view-only on essais
INSERT INTO role_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'operateur'::app_role, p.id
FROM permissions p
WHERE p.code IN ('dashboard.voir', 'essais.voir', 'labos_mobiles.voir')
ON CONFLICT DO NOTHING;

-- Give lecteur dashboard only
INSERT INTO role_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'lecteur'::app_role, p.id
FROM permissions p
WHERE p.code = 'dashboard.voir'
ON CONFLICT DO NOTHING;