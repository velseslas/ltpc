
-- Phase 7.5 — C1 : ajout des 31 index manquants sur clés étrangères
-- Convention : idx_<table>_<colonne>. Plain CREATE INDEX (interdit CONCURRENTLY dans une migration).

CREATE INDEX IF NOT EXISTS idx_materiel_laboratoire_chantier_courant_id ON public.materiel_laboratoire(chantier_courant_id);
CREATE INDEX IF NOT EXISTS idx_materiel_laboratoire_responsable_courant_id ON public.materiel_laboratoire(responsable_courant_id);

CREATE INDEX IF NOT EXISTS idx_materiel_movements_chantier_id ON public.materiel_movements(chantier_id);
CREATE INDEX IF NOT EXISTS idx_materiel_movements_created_by ON public.materiel_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_materiel_movements_parent_movement_id ON public.materiel_movements(parent_movement_id);
CREATE INDEX IF NOT EXISTS idx_materiel_movements_responsable_id ON public.materiel_movements(responsable_id);
CREATE INDEX IF NOT EXISTS idx_materiel_movements_technicien_entrant_id ON public.materiel_movements(technicien_entrant_id);
CREATE INDEX IF NOT EXISTS idx_materiel_movements_technicien_sortant_id ON public.materiel_movements(technicien_sortant_id);

CREATE INDEX IF NOT EXISTS idx_movement_items_materiel_id ON public.movement_items(materiel_id);
CREATE INDEX IF NOT EXISTS idx_movement_items_movement_id ON public.movement_items(movement_id);

CREATE INDEX IF NOT EXISTS idx_movement_signatures_movement_id ON public.movement_signatures(movement_id);
CREATE INDEX IF NOT EXISTS idx_movement_signatures_user_id ON public.movement_signatures(user_id);

CREATE INDEX IF NOT EXISTS idx_material_responsibility_history_chantier_id ON public.material_responsibility_history(chantier_id);
CREATE INDEX IF NOT EXISTS idx_material_responsibility_history_materiel_id ON public.material_responsibility_history(materiel_id);
CREATE INDEX IF NOT EXISTS idx_material_responsibility_history_movement_id_debut ON public.material_responsibility_history(movement_id_debut);
CREATE INDEX IF NOT EXISTS idx_material_responsibility_history_movement_id_fin ON public.material_responsibility_history(movement_id_fin);
CREATE INDEX IF NOT EXISTS idx_material_responsibility_history_technicien_id ON public.material_responsibility_history(technicien_id);

CREATE INDEX IF NOT EXISTS idx_material_status_history_changed_by ON public.material_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_material_status_history_materiel_id ON public.material_status_history(materiel_id);
CREATE INDEX IF NOT EXISTS idx_material_status_history_movement_id ON public.material_status_history(movement_id);

CREATE INDEX IF NOT EXISTS idx_rapport_modeles_bibliotheque_categorie_id ON public.rapport_modeles_bibliotheque(categorie_id);

CREATE INDEX IF NOT EXISTS idx_rapports_techniques_categorie_id ON public.rapports_techniques(categorie_id);
CREATE INDEX IF NOT EXISTS idx_rapports_techniques_created_by ON public.rapports_techniques(created_by);
CREATE INDEX IF NOT EXISTS idx_rapports_techniques_ingenieur_id ON public.rapports_techniques(ingenieur_id);
CREATE INDEX IF NOT EXISTS idx_rapports_techniques_modele_id ON public.rapports_techniques(modele_id);
CREATE INDEX IF NOT EXISTS idx_rapports_techniques_template_id ON public.rapports_techniques(template_id);

CREATE INDEX IF NOT EXISTS idx_rapport_pieces_jointes_uploaded_by ON public.rapport_pieces_jointes(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_rapport_historique_user_id ON public.rapport_historique(user_id);

CREATE INDEX IF NOT EXISTS idx_document_archives_generated_by ON public.document_archives(generated_by);
CREATE INDEX IF NOT EXISTS idx_rapport_ai_reviews_created_by ON public.rapport_ai_reviews(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_context_snapshots_message_id ON public.ai_context_snapshots(message_id);
