// Mapping centralisé « domaine du router → table Supabase + colonnes ILIKE ».
// Utilisé par les outils SQL* pour éviter la duplication.
import type { ToolDomain } from "./types";

export interface DomainSpec {
  table: string;
  searchFields: string[];
  orderBy: { column: string; ascending: boolean };
  select: string;                             // colonnes à retourner pour les listes
  labelOf: (row: Record<string, unknown>) => string;
  refOf?: (row: Record<string, unknown>) => string | null;
  urlOf?: (row: Record<string, unknown>) => string | null;
  snippetOf?: (row: Record<string, unknown>) => string;
  /** source_type utilisé dans les citations (compatible avec l'existant). */
  source_type: string;
}

const s = (v: unknown, max = 160) => {
  const str = v == null ? "" : String(v);
  return str.length > max ? str.slice(0, max) + "…" : str;
};

export const DOMAIN_SPECS: Partial<Record<ToolDomain, DomainSpec>> = {
  clients: {
    table: "clients", source_type: "client",
    searchFields: ["nom", "ville", "contact", "telephone"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, nom, ville, contact, telephone, created_at",
    labelOf: (r) => s(r.nom ?? "Client", 80),
    refOf: () => null,
    urlOf: (r) => `/intervenant/clients/${r.id}`,
    snippetOf: (r) => s(`${r.ville ?? ""} · ${r.contact ?? ""} · ${r.telephone ?? ""}`),
  },
  entreprises: {
    table: "clients", source_type: "client",
    searchFields: ["nom", "ville"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, nom, ville, created_at",
    labelOf: (r) => s(r.nom ?? "Entreprise", 80),
    urlOf: (r) => `/intervenant/clients/${r.id}`,
    snippetOf: (r) => s(String(r.ville ?? "")),
  },
  chantiers: {
    table: "chantiers", source_type: "chantier",
    searchFields: ["nom", "ville", "adresse", "statut"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, nom, ville, adresse, statut, created_at",
    labelOf: (r) => s(r.nom ?? "Chantier", 80),
    urlOf: (r) => `/intervenant/chantiers/${r.id}`,
    snippetOf: (r) => s(`${r.ville ?? ""} · ${r.statut ?? ""} · ${r.adresse ?? ""}`),
  },
  compression: {
    table: "echantillons_compression", source_type: "essai_compression",
    searchFields: ["ouvrage", "classe_resistance", "numero", "statut"],
    orderBy: { column: "date_coulage", ascending: false },
    select: "id, numero, numero_chantier, ouvrage, classe_resistance, statut, date_coulage",
    labelOf: (r) => `Compression ${r.numero ?? "#" + (r.numero_chantier ?? "?")} — ${r.ouvrage ?? ""}`,
    refOf: (r) => String(r.numero ?? r.numero_chantier ?? ""),
    urlOf: () => `/essais/beton-durci/compression`,
    snippetOf: (r) => s(`Classe ${r.classe_resistance ?? "?"} · ${r.statut ?? ""} · ${r.date_coulage ?? ""}`),
  },
  essais: {
    table: "essais", source_type: "essai",
    searchFields: ["type", "statut", "reference"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, type, statut, reference, created_at",
    labelOf: (r) => s(`${r.type ?? "Essai"} ${r.reference ?? ""}`, 80),
    refOf: (r) => (r.reference as string | null) ?? null,
    snippetOf: (r) => s(String(r.statut ?? "")),
  },
  granulometrie: {
    table: "echantillons_granulometrie", source_type: "essai_granulometrie",
    searchFields: ["numero", "statut"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, numero, statut, created_at",
    labelOf: (r) => s(`Granulométrie ${r.numero ?? ""}`, 80),
    refOf: (r) => (r.numero as string | null) ?? null,
    urlOf: () => `/essais/granulat`,
    snippetOf: (r) => s(String(r.statut ?? "")),
  },
  formulations: {
    table: "formulations", source_type: "formulation",
    searchFields: ["nom", "classe_exposition"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, nom, resistance_28j, classe_exposition, slump_souhaite, created_at",
    labelOf: (r) => s(r.nom ?? "Formulation", 80),
    refOf: (r) => (r.nom as string | null) ?? null,
    urlOf: () => `/essais/formulation`,
    snippetOf: (r) => s(`R28j ${r.resistance_28j ?? "?"} MPa · ${r.classe_exposition ?? ""} · Slump ${r.slump_souhaite ?? "?"}`),
  },
  rapports: {
    table: "rapports_techniques", source_type: "rapport_technique",
    searchFields: ["titre", "description_probleme", "numero", "entreprise", "projet", "statut"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, numero, titre, description_probleme, statut, entreprise, projet, created_at",
    labelOf: (r) => s(r.titre ?? r.numero ?? "Rapport", 80),
    refOf: (r) => (r.numero as string | null) ?? null,
    urlOf: (r) => `/essais/rapports-techniques/${r.id}`,
    snippetOf: (r) => s(`${r.statut ?? ""} — ${r.description_probleme ?? r.projet ?? r.entreprise ?? ""}`),
  },
  documents: {
    table: "document_archives", source_type: "document_archive",
    searchFields: ["numero", "document_type"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, numero, document_type, version, created_at",
    labelOf: (r) => s(`${r.numero ?? "Document"} v${r.version ?? 1}`, 80),
    refOf: (r) => (r.numero as string | null) ?? null,
    snippetOf: (r) => s(`${r.document_type ?? ""}`),
  },
  materiels: {
    table: "materiel_laboratoire", source_type: "materiel",
    searchFields: ["nom", "reference", "marque", "modele", "categorie", "statut_courant"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, nom, reference, marque, modele, statut_courant, categorie, created_at",
    labelOf: (r) => s(`${r.reference ?? ""} ${r.nom ?? ""}`.trim() || "Matériel", 80),
    refOf: (r) => (r.reference as string | null) ?? null,
    urlOf: () => `/materiel/liste`,
    snippetOf: (r) => s(`${r.marque ?? ""} ${r.modele ?? ""} · ${r.categorie ?? ""} · ${r.statut_courant ?? ""}`),
  },
  etalonnages: {
    table: "etalonnage_materiel", source_type: "etalonnage",
    searchFields: ["organisme", "numero_certificat", "statut"],
    orderBy: { column: "date_prochaine", ascending: true },
    select: "id, materiel_id, organisme, numero_certificat, date_etalonnage, date_prochaine, statut",
    labelOf: (r) => s(`Étalonnage ${r.numero_certificat ?? ""}`, 80),
    refOf: (r) => (r.numero_certificat as string | null) ?? null,
    urlOf: () => `/materiel/etalonnage`,
    snippetOf: (r) => s(`${r.organisme ?? ""} · Prochain : ${r.date_prochaine ?? "?"}`),
  },
  non_conformites: {
    // Approximé sur rapports_techniques filtrés (pas de table dédiée).
    table: "rapports_techniques", source_type: "rapport_technique",
    searchFields: ["titre", "description_probleme", "statut"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, numero, titre, description_probleme, statut, created_at",
    labelOf: (r) => s(r.titre ?? "Non-conformité", 80),
    refOf: (r) => (r.numero as string | null) ?? null,
    urlOf: (r) => `/essais/rapports-techniques/${r.id}`,
    snippetOf: (r) => s(String(r.description_probleme ?? "")),
  },
  audits: {
    table: "journal_audit", source_type: "audit",
    searchFields: ["action", "type", "cible", "utilisateur_nom"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, action, type, cible, utilisateur_nom, details, created_at",
    labelOf: (r) => s(String(r.action ?? "Action"), 100),
    snippetOf: (r) => s(`${r.type ?? ""} · ${r.utilisateur_nom ?? ""} · ${r.details ?? ""}`),
  },
  utilisateurs: {
    table: "utilisateurs", source_type: "utilisateur",
    searchFields: ["nom", "email", "role"],
    orderBy: { column: "created_at", ascending: false },
    select: "id, nom, email, role, created_at",
    labelOf: (r) => s(r.nom ?? r.email ?? "Utilisateur", 80),
    snippetOf: (r) => s(`${r.role ?? ""} · ${r.email ?? ""}`),
  },
};

export function domainsWithSpec(domains: ToolDomain[]): ToolDomain[] {
  return domains.filter((d) => DOMAIN_SPECS[d]);
}

/** Construit une clause `.or()` supabase à partir de mots-clés (avec échappement). */
export function buildIlikeOr(fields: string[], keywords: string[]): string | null {
  if (!keywords.length) return null;
  const clauses: string[] = [];
  for (const f of fields) for (const k of keywords) {
    const safe = k.replace(/[%,()"'\\]/g, "");
    if (safe) clauses.push(`${f}.ilike.%${safe}%`);
  }
  return clauses.length ? clauses.join(",") : null;
}
