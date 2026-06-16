/**
 * Utility for "Dupliquer" flows: merges measurement/result fields from a
 * source row into the create payload of an échantillon form, so that the
 * new échantillon is created with the same saisie de données as the
 * original (not just identification fields).
 *
 * System-managed columns are always stripped so they are regenerated.
 */
const SYSTEM_FIELDS = new Set<string>([
  "id",
  "created_at",
  "updated_at",
  "numero",
  "numero_chantier",
  "code",
  "code_essai",
  "code_echantillon",
]);

export function mergeDuplicateData<T extends Record<string, any>>(
  basePayload: T,
  source: Record<string, any> | null | undefined,
  extraExcluded: string[] = [],
): T {
  if (!source) return basePayload;
  const excluded = new Set<string>([...SYSTEM_FIELDS, ...extraExcluded]);
  const merged: Record<string, any> = { ...source };
  for (const key of excluded) delete merged[key];
  // basePayload (form values) wins over source
  return { ...merged, ...basePayload } as T;
}
