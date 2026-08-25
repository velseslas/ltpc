// Colonnes NON textuelles (enums Postgres) : impossible d'y appliquer un ILIKE.
// PostgREST renvoie « operator does not exist: <enum> ~~* unknown » si on essaie.
// Source de vérité : information_schema.columns (data_type = USER-DEFINED).
const ENUM_COLUMNS: Record<string, readonly string[]> = {
  essais: ["statut"],
  rapports_techniques: ["statut", "gravite"],
  materiel_movements: ["statut", "type"],
  materiel_laboratoire: ["statut_courant"],
  material_status_history: ["ancien_statut", "nouveau_statut"],
  movement_items: ["etat"],
  notifications: ["category", "priority"],
  notification_preferences: ["frequency"],
  conversations: ["type"],
  user_roles: ["role"],
  role_permissions: ["role"],
  role_definitions: ["alias_of"],
};

/** Retire des champs de recherche ceux qui sont des enums pour la table donnée. */
export function textSearchFields(table: string | undefined, fields: readonly string[]): string[] {
  const excluded = table ? ENUM_COLUMNS[table] : undefined;
  if (!excluded?.length) return [...fields];
  return fields.filter((f) => !excluded.includes(f));
}
