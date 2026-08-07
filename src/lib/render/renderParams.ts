/**
 * Paramètres de rendu figés côté serveur (§7.2).
 *
 * Alimentés uniquement par la route `/__render/:token` après consommation du
 * jeton par l'Edge Function `render-context`. Les écrans de type « État … »
 * lisent ces paramètres pour se générer automatiquement, sans clic utilisateur
 * et sans jamais lire de filtre depuis l'URL.
 */

export type FrozenRenderContext = {
  report_kind: string;
  resource_id: string | null;
  params: Record<string, unknown>;
};

let frozenContext: FrozenRenderContext | null = null;

export function setFrozenRenderContext(ctx: FrozenRenderContext): void {
  frozenContext = {
    report_kind: ctx.report_kind,
    resource_id: ctx.resource_id ?? null,
    params: Object.freeze({ ...(ctx.params ?? {}) }),
  };
}

export function getFrozenRenderContext(): FrozenRenderContext | null {
  return frozenContext;
}

/** Renvoie les paramètres figés si (et seulement si) ils concernent ce rapport. */
export function useRenderParams(reportKind: string): Record<string, unknown> | null {
  const ctx = frozenContext;
  if (!ctx || ctx.report_kind !== reportKind) return null;
  return ctx.params;
}

/** Lecture typée d'un filtre figé, avec repli sur la valeur par défaut de l'écran. */
export function frozenString(
  params: Record<string, unknown> | null,
  key: string,
  fallback: string,
): string {
  const v = params?.[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function frozenDate(params: Record<string, unknown> | null, key: string): Date | undefined {
  const v = params?.[key];
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
