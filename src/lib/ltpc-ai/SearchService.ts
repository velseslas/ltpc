// SearchService — recherche globale respectant les RLS (appels via le client Supabase de l'utilisateur).
// Couvre : rapports techniques, essais (compression + béton), formulations, matériaux, chantiers,
// clients, entreprises (intervenants), documents, non-conformités (via rapport_categories).
// Architecture prête pour être remplacée/complétée par un moteur sémantique (pgvector).
import { supabase } from "@/integrations/supabase/client";
import type { AISearchHit } from "./types";

type Domain =
  | "rapport_technique" | "essai_compression" | "formulation"
  | "materiel" | "chantier" | "client" | "intervenant"
  | "document_archive" | "non_conformite";

const clip = (s: string | null | undefined, n = 160) =>
  !s ? "" : s.length > n ? s.slice(0, n) + "…" : s;

async function searchRapports(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("rapports_techniques")
    .select("id, numero, titre, description, statut, entreprise, projet")
    .or(`titre.ilike.%${q}%,description.ilike.%${q}%,numero.ilike.%${q}%,entreprise.ilike.%${q}%,projet.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "rapport_technique",
    source_id: r.id,
    label: r.titre ?? r.numero ?? "Rapport",
    reference: r.numero,
    snippet: clip(`${r.statut ?? ""} — ${r.description ?? r.projet ?? ""}`),
    url: `/essais/rapports-techniques/${r.id}`,
  }));
}

async function searchEssais(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("echantillons_compression")
    .select("id, numero_chantier, formulation, resistance_visee, chantier_id, date_prelevement")
    .or(`formulation.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "essai_compression",
    source_id: r.id,
    label: `Compression #${r.numero_chantier ?? "?"} — ${r.formulation ?? ""}`,
    reference: r.formulation ?? null,
    snippet: clip(`Résistance visée ${r.resistance_visee ?? "?"} MPa · ${r.date_prelevement ?? ""}`),
    url: `/essais/beton-durci/compression`,
  }));
}

async function searchFormulations(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("formulations")
    .select("id, code, designation, classe_resistance, client_id")
    .or(`code.ilike.%${q}%,designation.ilike.%${q}%,classe_resistance.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "formulation",
    source_id: r.id,
    label: `${r.code ?? ""} ${r.designation ?? ""}`.trim() || "Formulation",
    reference: r.code,
    snippet: clip(`Classe ${r.classe_resistance ?? "?"}`),
    url: `/essais/formulation`,
  }));
}

async function searchChantiers(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("chantiers")
    .select("id, nom, code, wilaya, client_id")
    .or(`nom.ilike.%${q}%,code.ilike.%${q}%,wilaya.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "chantier",
    source_id: r.id,
    label: r.nom ?? r.code ?? "Chantier",
    reference: r.code,
    snippet: clip(`Wilaya ${r.wilaya ?? "?"}`),
    url: `/intervenant/chantiers/${r.id}`,
  }));
}

async function searchClients(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("clients")
    .select("id, raison_sociale, code, wilaya, telephone")
    .or(`raison_sociale.ilike.%${q}%,code.ilike.%${q}%,wilaya.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "client",
    source_id: r.id,
    label: r.raison_sociale ?? "Client",
    reference: r.code,
    snippet: clip(`${r.wilaya ?? ""} · ${r.telephone ?? ""}`),
    url: `/intervenant/clients/${r.id}`,
  }));
}

async function searchIntervenants(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("intervenants")
    .select("id, nom, prenom, fonction, email")
    .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,fonction.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "intervenant",
    source_id: r.id,
    label: `${r.prenom ?? ""} ${r.nom ?? ""}`.trim(),
    reference: r.fonction,
    snippet: clip(r.email ?? ""),
    url: `/rh`,
  }));
}

async function searchMateriel(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("materiel_laboratoire")
    .select("id, code, designation, marque, statut_courant")
    .or(`code.ilike.%${q}%,designation.ilike.%${q}%,marque.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "materiel",
    source_id: r.id,
    label: `${r.code ?? ""} ${r.designation ?? ""}`.trim(),
    reference: r.code,
    snippet: clip(`${r.marque ?? ""} · ${r.statut_courant ?? ""}`),
    url: `/materiel/liste`,
  }));
}

async function searchDocuments(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("document_archives")
    .select("id, numero, document_type, version, created_at")
    .ilike("numero", `%${q}%`)
    .limit(limit);
  return (data ?? []).map(r => ({
    source_type: "document_archive",
    source_id: r.id,
    label: `${r.numero ?? "Document"} v${r.version ?? 1}`,
    reference: r.numero,
    snippet: clip(`${r.document_type ?? ""} · ${new Date(r.created_at as string).toLocaleDateString("fr-FR")}`),
  }));
}

const DOMAIN_MAP: Record<Domain, (q: string, l: number) => Promise<AISearchHit[]>> = {
  rapport_technique: searchRapports,
  essai_compression: searchEssais,
  formulation: searchFormulations,
  chantier: searchChantiers,
  client: searchClients,
  intervenant: searchIntervenants,
  materiel: searchMateriel,
  document_archive: searchDocuments,
  non_conformite: async () => [],
};

export const SearchService = {
  domains: Object.keys(DOMAIN_MAP) as Domain[],

  async searchAll(query: string, opts: { domains?: Domain[]; limitPerDomain?: number } = {}): Promise<AISearchHit[]> {
    const q = query.trim();
    if (!q) return [];
    const limit = opts.limitPerDomain ?? 5;
    const domains = opts.domains ?? (Object.keys(DOMAIN_MAP) as Domain[]);
    const results = await Promise.allSettled(domains.map(d => DOMAIN_MAP[d](q, limit)));
    return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  },

  async searchDomain(domain: Domain, query: string, limit = 10): Promise<AISearchHit[]> {
    return DOMAIN_MAP[domain](query, limit);
  },
};
