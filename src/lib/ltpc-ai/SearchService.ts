// SearchService — recherche globale respectant les RLS (client Supabase utilisateur).
// Domaines couverts : rapports techniques, essais compression, formulations, matériel,
// chantiers, clients, intervenants, documents archivés.
// Interface stable — remplaçable par un moteur sémantique (pgvector) sans casser l'UI.
import { supabase } from "@/integrations/supabase/client";
import type { AISearchHit } from "./types";

export type SearchDomain =
  | "rapport_technique" | "essai_compression" | "formulation"
  | "materiel" | "chantier" | "client" | "intervenant"
  | "document_archive";

const clip = (s: string | null | undefined, n = 160) =>
  !s ? "" : s.length > n ? s.slice(0, n) + "…" : s;

async function searchRapports(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("rapports_techniques")
    .select("id, numero, titre, description_probleme, statut, entreprise, projet")
    .or(`titre.ilike.%${q}%,description_probleme.ilike.%${q}%,numero.ilike.%${q}%,entreprise.ilike.%${q}%,projet.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "rapport_technique",
    source_id: r.id,
    label: r.titre ?? r.numero ?? "Rapport",
    reference: r.numero,
    snippet: clip(`${r.statut ?? ""} — ${r.description_probleme ?? r.projet ?? ""}`),
    url: `/essais/rapports-techniques/${r.id}`,
  }));
}

async function searchEssais(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("echantillons_compression")
    .select("id, numero, numero_chantier, ouvrage, classe_resistance, statut, date_coulage")
    .or(`ouvrage.ilike.%${q}%,classe_resistance.ilike.%${q}%,numero.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "essai_compression",
    source_id: r.id,
    label: `Compression ${r.numero ?? "#" + (r.numero_chantier ?? "?")} — ${r.ouvrage ?? ""}`,
    reference: String(r.numero ?? r.numero_chantier ?? ""),
    snippet: clip(`Classe ${r.classe_resistance ?? "?"} · ${r.statut ?? ""} · ${r.date_coulage ?? ""}`),
    url: `/essais/beton-durci/compression`,
  }));
}

async function searchFormulations(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("formulations")
    .select("id, nom, resistance_28j, classe_exposition, slump_souhaite")
    .ilike("nom", `%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "formulation",
    source_id: r.id,
    label: r.nom ?? "Formulation",
    reference: r.nom,
    snippet: clip(`R28j ${r.resistance_28j ?? "?"} MPa · ${r.classe_exposition ?? ""} · Slump ${r.slump_souhaite ?? "?"}`),
    url: `/essais/formulation`,
  }));
}

async function searchChantiers(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("chantiers")
    .select("id, nom, adresse, ville, statut")
    .or(`nom.ilike.%${q}%,ville.ilike.%${q}%,adresse.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "chantier",
    source_id: r.id,
    label: r.nom ?? "Chantier",
    reference: null,
    snippet: clip(`${r.ville ?? ""} · ${r.statut ?? ""} · ${r.adresse ?? ""}`),
    url: `/intervenant/chantiers/${r.id}`,
  }));
}

async function searchClients(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("clients")
    .select("id, nom, ville, telephone, contact")
    .or(`nom.ilike.%${q}%,ville.ilike.%${q}%,contact.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "client",
    source_id: r.id,
    label: r.nom ?? "Client",
    reference: null,
    snippet: clip(`${r.ville ?? ""} · ${r.contact ?? ""} · ${r.telephone ?? ""}`),
    url: `/intervenant/clients/${r.id}`,
  }));
}

async function searchIntervenants(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("intervenants")
    .select("id, nom, prenom, role, specialite, email")
    .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,role.ilike.%${q}%,specialite.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "intervenant",
    source_id: r.id,
    label: `${r.prenom ?? ""} ${r.nom ?? ""}`.trim() || "Intervenant",
    reference: r.role ?? r.specialite,
    snippet: clip(`${r.role ?? ""} · ${r.email ?? ""}`),
    url: `/rh`,
  }));
}

async function searchMateriel(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("materiel_laboratoire")
    .select("id, nom, reference, marque, modele, statut_courant, categorie")
    .or(`nom.ilike.%${q}%,reference.ilike.%${q}%,marque.ilike.%${q}%,modele.ilike.%${q}%,categorie.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "materiel",
    source_id: r.id,
    label: `${r.reference ?? ""} ${r.nom ?? ""}`.trim(),
    reference: r.reference,
    snippet: clip(`${r.marque ?? ""} ${r.modele ?? ""} · ${r.categorie ?? ""} · ${r.statut_courant ?? ""}`),
    url: `/materiel/liste`,
  }));
}

async function searchDocuments(q: string, limit: number): Promise<AISearchHit[]> {
  const { data } = await supabase
    .from("document_archives")
    .select("id, numero, document_type, version, created_at")
    .ilike("numero", `%${q}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    source_type: "document_archive",
    source_id: r.id,
    label: `${r.numero ?? "Document"} v${r.version ?? 1}`,
    reference: r.numero,
    snippet: clip(`${r.document_type ?? ""} · ${new Date(r.created_at as string).toLocaleDateString("fr-FR")}`),
  }));
}

const DOMAIN_MAP: Record<SearchDomain, (q: string, l: number) => Promise<AISearchHit[]>> = {
  rapport_technique: searchRapports,
  essai_compression: searchEssais,
  formulation: searchFormulations,
  chantier: searchChantiers,
  client: searchClients,
  intervenant: searchIntervenants,
  materiel: searchMateriel,
  document_archive: searchDocuments,
};

export const SearchService = {
  domains: Object.keys(DOMAIN_MAP) as SearchDomain[],
  async searchAll(query: string, opts: { domains?: SearchDomain[]; limitPerDomain?: number } = {}): Promise<AISearchHit[]> {
    const q = query.trim();
    if (!q) return [];
    const limit = opts.limitPerDomain ?? 5;
    const domains = opts.domains ?? (Object.keys(DOMAIN_MAP) as SearchDomain[]);
    const results = await Promise.allSettled(domains.map((d) => DOMAIN_MAP[d](q, limit)));
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  },
  async searchDomain(domain: SearchDomain, query: string, limit = 10): Promise<AISearchHit[]> {
    return DOMAIN_MAP[domain](query, limit);
  },
};
