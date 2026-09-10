// SearchService — recherche intelligente respectant les RLS.
// Détecte l'intention (liste/compte/recherche), extrait les mots-clés utiles,
// interroge chaque domaine avec ILIKE + fallback "derniers N" quand aucun mot-clé
// n'est pertinent, et retourne un bloc debug complet.
import { supabase } from "@/integrations/supabase/client";
import type { AISearchHit, AISearchDebug } from "./types";

export type SearchDomain =
  | "rapport_technique" | "essai_compression" | "formulation"
  | "materiel" | "chantier" | "client" | "intervenant"
  | "document_archive";

const clip = (s: string | null | undefined, n = 180) =>
  !s ? "" : s.length > n ? s.slice(0, n) + "…" : s;

// --- Détection d'intention & extraction de mots-clés ------------------------

const STOPWORDS = new Set([
  "le","la","les","un","une","des","de","du","d","et","ou","à","a","au","aux",
  "en","dans","sur","pour","par","avec","sans","est","sont","ce","cette","ces",
  "quel","quels","quelle","quelles","qui","que","quoi","où","ou","combien",
  "y","a","t","il","elle","ils","elles","je","tu","nous","vous","mon","ma","mes",
  "notre","nos","votre","vos","son","sa","ses","leur","leurs","tous","toutes",
  "tout","toute","liste","donne","montre","affiche","cherche","trouve","voir",
  "voir","peux","dois","faut","faire","avoir","être","etre","plus","moins",
  "?","!",".",","," ","'","-",":",";","(",")",
]);

const DOMAIN_KEYWORDS: Record<SearchDomain, string[]> = {
  client:            ["client","clients","société","societe","entreprise","entreprises","donneur","maître","maitre","ouvrage"],
  chantier:          ["chantier","chantiers","projet","projets","site","sites","travaux"],
  rapport_technique: ["rapport","rapports","technique","expertise","expertises","non-conformité","non-conformite","nc","anomalie","anomalies"],
  essai_compression: ["essai","essais","compression","béton","beton","résistance","resistance","éprouvette","eprouvette","cube","cylindre"],
  formulation:       ["formulation","formulations","dreux","gorisse","mélange","melange","recette","bps","bpc"],
  materiel:          ["matériel","materiel","matériels","materiels","équipement","equipement","instrument","machine","balance","presse","étalonnage","etalonnage"],
  intervenant:       ["technicien","techniciens","ingénieur","ingenieur","personnel","équipe","equipe","intervenant","intervenants","opérateur","operateur"],
  document_archive:  ["document","documents","archive","archives","officiel","pdf","contrat","contrats","attestation"],
};

const INTENT_PATTERNS: Array<{ intent: string; re: RegExp }> = [
  { intent: "count",  re: /\b(combien|nombre de|nb\s|total(?:\s|$)|comptez?|compte)\b/i },
  { intent: "list",   re: /\b(liste|donne(?:z|r)?|montre|affiche|quels?|quelles?|tous les|toutes les|derniers?|dernières?|recentes?|récents?)\b/i },
  { intent: "search", re: /\b(cherche|trouve|où|ou est|concernant|à propos|sur le|sur la)\b/i },
];

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .split(/[^a-z0-9]+/i)
    .filter((w) => w && w.length > 1 && !STOPWORDS.has(w));
}

function detectIntents(q: string): string[] {
  const out = new Set<string>();
  for (const { intent, re } of INTENT_PATTERNS) if (re.test(q)) out.add(intent);
  return [...out];
}

function detectDomains(q: string, tokens: string[]): SearchDomain[] {
  const norm = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matched = new Set<SearchDomain>();
  for (const [dom, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const kw of kws) {
      const k = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (norm.includes(k) || tokens.includes(k)) { matched.add(dom as SearchDomain); break; }
    }
  }
  return [...matched];
}

/** Mots-clés réellement utilisables pour ILIKE (hors mots de domaine et stopwords). */
function extractSearchKeywords(tokens: string[], domains: SearchDomain[]): string[] {
  const domainWords = new Set(
    domains.flatMap((d) => DOMAIN_KEYWORDS[d])
      .map((w) => w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
  return tokens.filter((t) => !domainWords.has(t));
}

// --- Requêtes par domaine ---------------------------------------------------

type DomainFetcher = (kw: string[], limit: number) => Promise<{ hits: AISearchHit[]; total: number }>;

function orIlike(fields: string[], keywords: string[]): string | null {
  if (!keywords.length) return null;
  const clauses: string[] = [];
  for (const f of fields) for (const k of keywords) {
    // supabase.or ne supporte pas les caractères spéciaux non échappés
    const safe = k.replace(/[%,()"'\\]/g, "");
    if (safe) clauses.push(`${f}.ilike.%${safe}%`);
  }
  return clauses.length ? clauses.join(",") : null;
}

const fetchRapports: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("rapports_techniques").select("id", { count: "exact", head: true });
  const q = supabase.from("rapports_techniques")
    .select("id, numero, titre, description_probleme, statut, entreprise, projet, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  const or = orIlike(["titre","description_probleme","numero","entreprise","projet","statut"], kw);
  const { data } = or ? await q.or(or) : await q;
  return {
    total: cnt.count ?? 0,
    hits: (data ?? []).map((r) => ({
      source_type: "rapport_technique", source_id: r.id,
      label: r.titre ?? r.numero ?? "Rapport", reference: r.numero,
      snippet: clip(`${r.statut ?? ""} — ${r.description_probleme ?? r.projet ?? r.entreprise ?? ""}`),
      url: `/essais/rapports-techniques/${r.id}`,
    })),
  };
};

const fetchEssais: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("echantillons_compression").select("id", { count: "exact", head: true });
  const q = supabase.from("echantillons_compression")
    .select("id, numero, numero_chantier, ouvrage, classe_resistance, statut, date_coulage")
    .order("date_coulage", { ascending: false, nullsFirst: false }).limit(limit);
  const or = orIlike(["ouvrage","classe_resistance","numero","statut"], kw);
  const { data } = or ? await q.or(or) : await q;
  return {
    total: cnt.count ?? 0,
    hits: (data ?? []).map((r) => ({
      source_type: "essai_compression", source_id: r.id,
      label: `Compression ${r.numero ?? "#" + (r.numero_chantier ?? "?")} — ${r.ouvrage ?? ""}`,
      reference: String(r.numero ?? r.numero_chantier ?? ""),
      snippet: clip(`Classe ${r.classe_resistance ?? "?"} · ${r.statut ?? ""} · ${r.date_coulage ?? ""}`),
      url: `/essais/beton-durci/compression`,
    })),
  };
};

const fetchFormulations: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("formulations").select("id", { count: "exact", head: true });
  const q = supabase.from("formulations")
    .select("id, nom, resistance_28j, classe_exposition, slump_souhaite, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  const or = orIlike(["nom","classe_exposition"], kw);
  const { data } = or ? await q.or(or) : await q;
  return {
    total: cnt.count ?? 0,
    hits: (data ?? []).map((r) => ({
      source_type: "formulation", source_id: r.id,
      label: r.nom ?? "Formulation", reference: r.nom,
      snippet: clip(`R28j ${r.resistance_28j ?? "?"} MPa · ${r.classe_exposition ?? ""} · Slump ${r.slump_souhaite ?? "?"}`),
      url: `/essais/formulation`,
    })),
  };
};

const fetchChantiers: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("chantiers").select("id", { count: "exact", head: true });
  const q = supabase.from("chantiers")
    .select("id, nom, adresse, ville, statut, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  const or = orIlike(["nom","ville","adresse","statut"], kw);
  const { data } = or ? await q.or(or) : await q;
  return {
    total: cnt.count ?? 0,
    hits: (data ?? []).map((r) => ({
      source_type: "chantier", source_id: r.id,
      label: r.nom ?? "Chantier", reference: null,
      snippet: clip(`${r.ville ?? ""} · ${r.statut ?? ""} · ${r.adresse ?? ""}`),
      url: `/intervenant/chantiers/${r.id}`,
    })),
  };
};

const fetchClients: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("clients").select("id", { count: "exact", head: true });
  const q = supabase.from("clients")
    .select("id, nom, ville, telephone, contact, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  const or = orIlike(["nom","ville","contact","telephone"], kw);
  let { data } = or ? await q.or(or) : await q;
  let total = cnt.count ?? 0;
  if (!data || data.length === 0) {
    // Rôles non privilégiés : lecture via la fonction sécurisée (identité seulement,
    // jamais les données fiscales/bancaires ICE/NIF/NIS/RIB).
    const { data: scoped } = await supabase.rpc("clients_scoped");
    const needle = (Array.isArray(kw) ? kw.join(" ") : String(kw ?? "")).toLowerCase();
    const filtered = (scoped ?? []).filter((c: any) =>
      !needle || [c.nom, c.ville, c.contact, c.telephone].some((v: any) => (v ?? "").toLowerCase().includes(needle))
    );
    total = total || filtered.length;
    data = filtered.slice(0, limit) as any;
  }
  return {
    total,
    hits: (data ?? []).map((r) => ({
      source_type: "client", source_id: r.id,
      label: r.nom ?? "Client", reference: null,
      snippet: clip(`${r.ville ?? ""} · ${r.contact ?? ""} · ${r.telephone ?? ""}`),
      url: `/intervenant/clients/${r.id}`,
    })),
  };
};

const fetchIntervenants: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("intervenants").select("id", { count: "exact", head: true });
  const q = supabase.from("intervenants")
    .select("id, nom, prenom, role, specialite, email, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  const or = orIlike(["nom","prenom","role","specialite","email"], kw);
  const { data } = or ? await q.or(or) : await q;
  return {
    total: cnt.count ?? 0,
    hits: (data ?? []).map((r) => ({
      source_type: "intervenant", source_id: r.id,
      label: `${r.prenom ?? ""} ${r.nom ?? ""}`.trim() || "Intervenant",
      reference: r.role ?? r.specialite,
      snippet: clip(`${r.role ?? ""} · ${r.email ?? ""}`),
      url: `/rh`,
    })),
  };
};

const fetchMateriel: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("materiel_laboratoire").select("id", { count: "exact", head: true });
  const q = supabase.from("materiel_laboratoire")
    .select("id, nom, reference, marque, modele, statut_courant, categorie, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  const or = orIlike(["nom","reference","marque","modele","categorie","statut_courant"], kw);
  const { data } = or ? await q.or(or) : await q;
  return {
    total: cnt.count ?? 0,
    hits: (data ?? []).map((r) => ({
      source_type: "materiel", source_id: r.id,
      label: `${r.reference ?? ""} ${r.nom ?? ""}`.trim(),
      reference: r.reference,
      snippet: clip(`${r.marque ?? ""} ${r.modele ?? ""} · ${r.categorie ?? ""} · ${r.statut_courant ?? ""}`),
      url: `/materiel/liste`,
    })),
  };
};

const fetchDocuments: DomainFetcher = async (kw, limit) => {
  const cnt = await supabase.from("document_archives").select("id", { count: "exact", head: true });
  const q = supabase.from("document_archives")
    .select("id, numero, document_type, version, created_at")
    .order("created_at", { ascending: false }).limit(limit);
  const or = orIlike(["numero","document_type"], kw);
  const { data } = or ? await q.or(or) : await q;
  return {
    total: cnt.count ?? 0,
    hits: (data ?? []).map((r) => ({
      source_type: "document_archive", source_id: r.id,
      label: `${r.numero ?? "Document"} v${r.version ?? 1}`,
      reference: r.numero,
      snippet: clip(`${r.document_type ?? ""} · ${new Date(r.created_at as string).toLocaleDateString("fr-FR")}`),
    })),
  };
};

const DOMAIN_MAP: Record<SearchDomain, DomainFetcher> = {
  rapport_technique: fetchRapports,
  essai_compression: fetchEssais,
  formulation: fetchFormulations,
  chantier: fetchChantiers,
  client: fetchClients,
  intervenant: fetchIntervenants,
  materiel: fetchMateriel,
  document_archive: fetchDocuments,
};

// --- API publique -----------------------------------------------------------

export const SearchService = {
  domains: Object.keys(DOMAIN_MAP) as SearchDomain[],

  detect(query: string) {
    const tokens = tokenize(query);
    const intents = detectIntents(query);
    const domains = detectDomains(query, tokens);
    const keywords = extractSearchKeywords(tokens, domains);
    return { tokens, intents, domains, keywords };
  },

  async searchAll(
    query: string,
    opts: { domains?: SearchDomain[]; limitPerDomain?: number } = {},
  ): Promise<{ hits: AISearchHit[]; debug: AISearchDebug }> {
    const q = query.trim();
    const debug: AISearchDebug = {
      original_query: q, keywords: [], intents: [],
      domains_searched: [], hits_per_domain: {}, totals_per_domain: {}, errors: [],
    };
    if (!q) return { hits: [], debug };

    const det = SearchService.detect(q);
    debug.intents = det.intents;
    debug.keywords = det.keywords;

    // Domaines: explicites → détectés → tous par défaut (mode "fallback global")
    const targetDomains =
      opts.domains?.length ? opts.domains
      : det.domains.length ? det.domains
      : (Object.keys(DOMAIN_MAP) as SearchDomain[]);

    debug.domains_searched = targetDomains;

    // Si intent list/count sans mots-clés → montrer les derniers enregistrements
    const isBrowse = det.intents.some((i) => i === "list" || i === "count");
    const effectiveKeywords = isBrowse && det.keywords.length === 0 ? [] : det.keywords;
    // Limite plus large pour list/count
    const limit = opts.limitPerDomain ?? (isBrowse ? 8 : 5);

    const results = await Promise.allSettled(
      targetDomains.map((d) => DOMAIN_MAP[d](effectiveKeywords, limit)),
    );

    const allHits: AISearchHit[] = [];
    results.forEach((r, i) => {
      const d = targetDomains[i];
      if (r.status === "fulfilled") {
        debug.hits_per_domain[d] = r.value.hits.length;
        debug.totals_per_domain[d] = r.value.total;
        allHits.push(...r.value.hits);
      } else {
        debug.errors.push({ domain: d, message: r.reason?.message ?? String(r.reason) });
        debug.hits_per_domain[d] = 0;
      }
    });

    return { hits: allHits, debug };
  },

  async searchDomain(domain: SearchDomain, query: string, limit = 10): Promise<AISearchHit[]> {
    const det = SearchService.detect(query);
    const { hits } = await DOMAIN_MAP[domain](det.keywords, limit);
    return hits;
  },
};
