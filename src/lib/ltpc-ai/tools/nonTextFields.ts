// Colonnes NON textuelles (enum, entier, date, uuid, jsonb…) des tables interrogées
// par LTPC AI. Un ILIKE sur ces colonnes est rejeté par Postgres :
//   « operator does not exist: <type> ~~* unknown » (code 42883)
// et fait échouer tout l'outil. On les retire donc systématiquement des filtres
// de recherche par mots-clés.
// Source de vérité : information_schema.columns (data_type ∉ text/varchar/char).
const NON_TEXT_COLUMNS: Record<string, readonly string[]> = {
  affectation_materiel: ["chantier_id", "created_at", "date_debut", "date_fin", "id", "intervenant_id", "materiel_id", "quantite", "updated_at"],
  affectations: ["chantier_id", "client_id", "created_at", "date_debut", "date_fin", "id", "intervenant_id", "updated_at"],
  chantiers: ["client_id", "created_at", "date_debut", "date_fin", "id", "latitude", "longitude", "updated_at"],
  clients: ["created_at", "id", "updated_at"],
  contrats: ["chantier_id", "client_id", "created_at", "date_expiration", "date_signature", "id", "updated_at"],
  document_archives: ["contenu_snapshot", "created_at", "document_id", "generated_by", "id", "pdf_size", "template_id", "variables", "version"],
  echantillons_affaissement: ["centrale_id", "chantier_id", "client_id", "created_at", "date_prelevement", "essai_convenance", "formulation_id", "heure_prelevement", "id", "numero", "operateur_id", "resultats", "temperature_air", "temperature_ambiante", "temperature_beton", "updated_at"],
  echantillons_compression: ["centrale_id", "chantier_id", "client_id", "created_at", "date_coulage", "date_essai", "essai_convenance", "formulation_id", "id", "is_laboratoire_chantier", "jours_essai", "mention_eprouvette_client", "mention_eprouvettes_labo", "mention_info_client", "nombre_eprouvettes", "numero", "numero_chantier", "operateur_id", "resultats", "temperature_air", "temperature_beton", "updated_at"],
  echantillons_granulometrie: ["carriere_id", "chantier_id", "client_id", "created_at", "date_essai", "date_reception", "id", "numero", "operateur_id", "resultats", "updated_at"],
  echantillons_temperature: ["centrale_id", "chantier_id", "client_id", "created_at", "date_prelevement", "essai_convenance", "formulation_id", "heure_prelevement", "id", "numero", "operateur_id", "resultats", "temperature_ambiante", "updated_at"],
  echantillons_temps_prise: ["centrale_id", "chantier_id", "client_id", "created_at", "date_prelevement", "essai_convenance", "formulation_id", "heure_prelevement", "id", "numero", "operateur_id", "resultats", "temperature_air", "temperature_beton", "updated_at"],
  echantillons_teneur_air: ["centrale_id", "chantier_id", "client_id", "created_at", "date_prelevement", "essai_convenance", "formulation_id", "heure_prelevement", "id", "numero", "operateur_id", "resultats", "temperature_air", "temperature_beton", "updated_at"],
  essais: ["client_id", "created_at", "date_fin", "date_realisation", "date_reception", "id", "intervenant_id", "materiel_id", "resultats", "statut", "updated_at"],
  etalonnage_materiel: ["created_at", "date_etalonnage", "date_prochain_etalonnage", "id", "materiel_id", "updated_at"],
  formulations: ["adjuvant_calcule", "adjuvant_producteur_id", "adjuvant_produit_id", "adjuvant_quantite", "centrale_id", "chantier_id", "ciment_calcule", "ciment_producteur_id", "ciment_produit_id", "ciment_quantite", "client_id", "coefficient_compacite", "coefficient_granulaire", "created_at", "dmax_utilisateur", "eau_calculee", "eau_producteur_id", "eau_produit_id", "eau_quantite", "essai_compression_id", "granulat_densites", "granulat_module_finesse", "id", "kp_ae", "maitre_oeuvre_id", "maitre_ouvrage_id", "mf_ideal", "ratio_gs", "resistance_28j", "slump_souhaite", "updated_at"],
  intervenants: ["created_at", "date_embauche", "date_naissance", "id", "poste_id", "salaire", "updated_at"],
  journal_audit: ["created_at", "id", "utilisateur_id"],
  laboratoires_mobiles: ["chantier_id", "client_id", "created_at", "date_affectation", "date_debut", "date_fin", "date_fin_affectation", "id", "responsable_id", "updated_at"],
  maintenance_materiel: ["cout", "created_at", "date_maintenance", "date_prochaine_maintenance", "id", "materiel_id", "updated_at"],
  materiel: ["created_at", "date_acquisition", "date_dernier_etalonnage", "date_prochain_etalonnage", "id", "updated_at"],
  materiel_laboratoire: ["chantier_courant_id", "created_at", "date_acquisition", "id", "quantite", "responsable_courant_id", "statut_courant", "updated_at"],
  materiel_movements: ["chantier_id", "created_at", "created_by", "date_mouvement", "heure_mouvement", "id", "parent_movement_id", "responsable_id", "statut", "technicien_entrant_id", "technicien_sortant_id", "type", "updated_at"],
  offres_prix: ["chantier_id", "client_id", "created_at", "date_document", "id", "montant_ht", "montant_ttc", "updated_at"],
  postes: ["competences", "created_at", "id", "nombre_employes", "salaire_moyen", "updated_at"],
  prix_essais: ["created_at", "id", "prix_unitaire", "updated_at"],
  produits: ["created_at", "densite", "id", "producteur_id", "updated_at"],
  rapports_techniques: ["analyse_ia", "categorie_id", "chantier_id", "client_id", "contenu_rapport", "contexte_auto", "created_at", "created_by", "date_probleme", "gravite", "id", "ingenieur_id", "last_autosave_at", "metadonnees", "modele_id", "publie_at", "refuse_at", "signature_ingenieur_id", "soumis_at", "statut", "technicien_id", "template_id", "updated_at", "valide_at", "version", "version_courante"],
  utilisateurs: ["created_at", "derniere_connexion", "id", "intervenant_id", "poste_id", "updated_at", "user_id"],
};

/** Ne conserve que les champs sur lesquels un ILIKE est valide pour cette table. */
export function textSearchFields(table: string | undefined, fields: readonly string[]): string[] {
  const excluded = table ? NON_TEXT_COLUMNS[table] : undefined;
  if (!excluded?.length) return [...fields];
  return fields.filter((f) => !excluded.includes(f));
}
