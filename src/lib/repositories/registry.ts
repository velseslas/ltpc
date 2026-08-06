// Registry central des Repositories du domaine métier.
// UN SEUL endroit qui déclare quelle table est lue pour quel concept.
// - Les hooks React (useClients, useChantiers, …) lisent ici.
// - Les outils LTPC AI (SQLCountTool, SQLListTool, …) lisent ici.
// Résultat : impossible que l'IA compte X et que l'écran affiche Y.
import { Repository, type RepositoryConfig } from "./BaseRepository";
import { supabase } from "@/integrations/supabase/client";

// Déclaration figée — équivalent DOMAIN_SPECS mais partagé UI ↔ IA.
export const REPOSITORY_CONFIGS = {
  clients: {
    name: "clients", table: "clients",
    defaultSelect: "*",
    defaultOrder: { column: "nom", ascending: true },
    searchFields: ["nom", "ville", "contact", "telephone"],
  },
  chantiers: {
    name: "chantiers", table: "chantiers",
    defaultSelect: "*",
    defaultOrder: { column: "nom", ascending: true },
    searchFields: ["nom", "ville", "adresse", "statut"],
  },
  laboratoires_mobiles: {
    name: "laboratoires_mobiles", table: "laboratoires_mobiles",
    defaultSelect: "*, intervenants(*), clients(id, nom), chantiers(id, nom, ville)",
    defaultOrder: { column: "nom", ascending: true },
    searchFields: ["nom", "reference"],
  },
  intervenants: {
    name: "intervenants", table: "intervenants",
    defaultSelect: "*",
    defaultOrder: { column: "nom", ascending: true },
    searchFields: ["nom", "prenom", "email", "fonction"],
  },
  compression: {
    name: "compression", table: "echantillons_compression",
    defaultSelect: "id, numero, numero_chantier, ouvrage, classe_resistance, statut, date_coulage, created_at",
    defaultOrder: { column: "date_coulage", ascending: false },
    searchFields: ["ouvrage", "classe_resistance", "numero", "statut"],
  },
  essais: {
    name: "essais", table: "essais",
    defaultSelect: "*",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["type", "statut", "reference"],
  },
  granulometrie: {
    name: "granulometrie", table: "echantillons_granulometrie",
    defaultSelect: "*",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["numero", "statut"],
  },
  formulations: {
    name: "formulations", table: "formulations",
    defaultSelect: "*",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["nom", "classe_exposition"],
  },
  rapports: {
    name: "rapports", table: "rapports_techniques",
    defaultSelect: "id, numero, titre, description_probleme, statut, entreprise, projet, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["titre", "description_probleme", "numero", "entreprise", "projet", "statut"],
  },
  documents: {
    name: "documents", table: "document_archives",
    defaultSelect: "id, numero, document_type, version, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["numero", "document_type"],
  },
  materiels: {
    name: "materiels", table: "materiel_laboratoire",
    defaultSelect: "id, nom, reference, marque, modele, statut_courant, categorie, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["nom", "reference", "marque", "modele", "categorie", "statut_courant"],
  },
  etalonnages: {
    name: "etalonnages", table: "etalonnage_materiel",
    defaultSelect: "id, materiel_id, organisme, numero_certificat, date_etalonnage, date_prochaine, statut",
    defaultOrder: { column: "date_prochaine", ascending: true },
    searchFields: ["organisme", "numero_certificat", "statut"],
  },
  utilisateurs: {
    name: "utilisateurs", table: "utilisateurs",
    defaultSelect: "id, nom, email, role, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["nom", "email", "role"],
  },
  audits: {
    name: "audits", table: "journal_audit",
    defaultSelect: "id, action, type, cible, utilisateur_nom, details, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    searchFields: ["action", "type", "cible", "utilisateur_nom"],
  },
} satisfies Record<string, RepositoryConfig>;

export type RepositoryName = keyof typeof REPOSITORY_CONFIGS;

const CACHE = new Map<string, Repository>();

export function getRepository(name: RepositoryName): Repository {
  const cached = CACHE.get(name);
  if (cached) return cached;
  const repo = new Repository(REPOSITORY_CONFIGS[name]);
  CACHE.set(name, repo);
  return repo;
}

/** Table Supabase associée à un domaine (utilisé pour tracer un warning si l'IA
 *  compte un domaine et que l'UI affiche un chiffre différent). */
export function tableFor(name: RepositoryName): string {
  return REPOSITORY_CONFIGS[name].table;
}

/**
 * Phase 3 — Repository ad-hoc pour une table non déclarée dans REPOSITORY_CONFIGS.
 * Permet aux hooks CRUD simples (adjuvants, carrieres, …) de passer par BaseRepository
 * sans polluer le registry métier partagé avec LTPC AI.
 * Les hooks fournissent leur `defaultSelect` / `defaultOrder` via les options d'appel.
 */
export function getRepositoryForTable<T = Record<string, unknown>>(
  table: string,
  opts: { defaultSelect?: string; defaultOrder?: { column: string; ascending: boolean }; searchFields?: string[] } = {},
): Repository<T> {
  // La clé inclut le select/order : deux hooks peuvent lire la même table
  // avec des jointures différentes sans se voler mutuellement leur config.
  const orderKey = opts.defaultOrder ? `${opts.defaultOrder.column}:${opts.defaultOrder.ascending}` : "-";
  const key = `__adhoc__:${table}|${opts.defaultSelect ?? "*"}|${orderKey}`;
  const cached = CACHE.get(key) as Repository<T> | undefined;
  if (cached) return cached;
  const repo = new Repository<T>({
    name: table,
    table,
    defaultSelect: opts.defaultSelect ?? "*",
    defaultOrder: opts.defaultOrder,
    searchFields: opts.searchFields,
  });
  CACHE.set(key, repo as unknown as Repository);
  return repo;
}

// ---------- Phase 3-bis : appels RPC & Edge Functions centralisés ----------
// Les hooks ne doivent plus appeler directement `supabase.rpc(...)` ni
// `supabase.functions.invoke(...)`. Ces helpers unifient l'accès et
// permettront à la future PWA d'ajouter cache/retry/queue si besoin.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;

export interface RpcDebug {
  repository: "RpcRepository";
  operation: "rpc";
  function: string;
  duration_ms: number;
  warning?: string;
}

export async function callRpc<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<{ data: T | null; error: string | null; debug: RpcDebug }> {
  const t0 = performance.now();
  const { data, error } = await sb.rpc(name, args);
  return {
    data: (data as T) ?? null,
    error: error?.message ?? null,
    debug: {
      repository: "RpcRepository",
      operation: "rpc",
      function: name,
      duration_ms: Math.round(performance.now() - t0),
      warning: error?.message,
    },
  };
}

export async function callEdgeFunction<T = unknown>(name: string, body?: unknown): Promise<{ data: T | null; error: string | null; debug: RpcDebug }> {
  const t0 = performance.now();
  const { data, error } = await sb.functions.invoke(name, body !== undefined ? { body } : undefined);
  return {
    data: (data as T) ?? null,
    error: error?.message ?? null,
    debug: {
      repository: "RpcRepository",
      operation: "rpc",
      function: `edge:${name}`,
      duration_ms: Math.round(performance.now() - t0),
      warning: error?.message,
    },
  };
}

// ---------- Phase 3-bis : PWA extension points sur Repository ----------
// Le vrai branchement (cache local, offline, queue, retry) sera implémenté
// dans une phase dédiée. Ici on ne pose que les crochets, désactivés.
export interface RepositoryHooks {
  onDebug?: (debug: unknown) => void;
  offlineFallback?: (payload: unknown) => Promise<unknown | null>;
  enqueueMutation?: (payload: unknown) => Promise<void>;
  retryPolicy?: { retries: number; backoffMs: number };
}
export const REPOSITORY_HOOKS: RepositoryHooks = {
  // no-op — sera branché en Phase PWA.
};

