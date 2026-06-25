type EchantillonLike = {
  chantier_id?: string | null;
  date_essai?: string | null;
  date_coulage?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  statut?: string | null;
  resultats?: unknown;
};

const parseValidDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toPositiveNumber = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const hasMeasuredResult = (resultats: unknown): boolean => {
  if (!resultats) return false;

  if (Array.isArray(resultats)) {
    return resultats.some((item) => hasMeasuredResult(item));
  }

  if (typeof resultats !== "object") {
    return toPositiveNumber(resultats) > 0;
  }

  const data = resultats as Record<string, unknown>;
  if (
    toPositiveNumber(data.resistance) > 0 ||
    toPositiveNumber(data.charge) > 0 ||
    toPositiveNumber(data.contrainte) > 0 ||
    toPositiveNumber(data.valeur) > 0
  ) {
    return true;
  }

  return Object.values(data).some((value) => {
    if (!value || typeof value !== "object") return false;
    return hasMeasuredResult(value);
  });
};

const getExplicitConformity = (resultats: unknown): boolean | null => {
  if (!resultats || typeof resultats !== "object") return null;

  if (Array.isArray(resultats)) {
    for (const item of resultats) {
      const conformity = getExplicitConformity(item);
      if (conformity !== null) return conformity;
    }
    return null;
  }

  const data = resultats as Record<string, unknown>;
  for (const key of ["conforme", "conformite", "is_conforme"]) {
    if (typeof data[key] === "boolean") return data[key] as boolean;
  }

  for (const value of Object.values(data)) {
    const conformity = getExplicitConformity(value);
    if (conformity !== null) return conformity;
  }

  return null;
};

const getActivityDate = (echantillon: EchantillonLike) => {
  const hasResult = hasMeasuredResult(echantillon.resultats);

  return (
    parseValidDate(echantillon.date_essai) ||
    (hasResult ? parseValidDate(echantillon.updated_at) : null) ||
    parseValidDate(echantillon.date_coulage) ||
    parseValidDate(echantillon.created_at)
  );
};

const getConformity = (echantillon: EchantillonLike): boolean | null => {
  if (echantillon.statut === "non-conforme") return false;

  const explicit = getExplicitConformity(echantillon.resultats);
  if (explicit !== null) return explicit;

  if (echantillon.statut === "termine") return true;
  if (hasMeasuredResult(echantillon.resultats)) return true;

  return null;
};

export function calculateLaboratoireEssaiStats(
  echantillons: EchantillonLike[] | undefined,
  chantierIds?: Set<string>,
) {
  if (!echantillons?.length) return { essaisCount: 0, tauxReussite: 0 };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const scoped = chantierIds
    ? echantillons.filter((e) => e.chantier_id && chantierIds.has(e.chantier_id))
    : echantillons;

  const essaisCount = scoped.filter((e) => {
    const date = getActivityDate(e);
    return date && date >= monthStart && date < monthEnd;
  }).length;

  const evaluated = scoped
    .map(getConformity)
    .filter((value): value is boolean => value !== null);
  const conformes = evaluated.filter(Boolean).length;

  return {
    essaisCount,
    tauxReussite: evaluated.length > 0 ? Math.round((conformes / evaluated.length) * 100) : 0,
  };
}