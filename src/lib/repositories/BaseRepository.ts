// BaseRepository — couche unique d'accès aux données Supabase pour l'UI et LTPC AI.
// Objectif : garantir que les comptes/listes affichés dans les écrans et les
// réponses des outils IA proviennent EXACTEMENT de la même requête. Interdit de
// dupliquer un `.from("table")` ailleurs pour les domaines couverts ici.
//
// Phase 2 : le Repository supporte aussi les filtres avancés (in/gte/lte/or/ilike)
// et les mutations (insert/update/delete/upsert) — ce qui permet aux hooks
// existants d'être migrés sans perdre de fonctionnalité.
import { supabase } from "@/integrations/supabase/client";

export interface RepoOrder { column: string; ascending: boolean }

/** Filtre avancé — extensions au-delà de l'égalité simple. */
export type RepoAdvancedFilter =
  | { op: "eq"; value: unknown }
  | { op: "neq"; value: unknown }
  | { op: "in"; value: readonly (string | number)[] }
  | { op: "gt" | "gte" | "lt" | "lte"; value: number | string }
  | { op: "like" | "ilike"; value: string }
  | { op: "is"; value: null | boolean }
  | { op: "or"; value: string /* ex: "nom.ilike.%foo%,ville.ilike.%foo%" */ };

/** Un filtre peut être une valeur brute (eq) ou un objet {op,value}. */
export type RepoFilter = unknown | RepoAdvancedFilter;

export interface RepoDebug {
  repository: string;
  table: string;
  operation: "list" | "count" | "search" | "getById" | "insert" | "update" | "delete" | "upsert";
  select: string;
  order?: RepoOrder;
  filters: Record<string, unknown>;
  /** Pseudo-SQL lisible pour humains (jamais exécuté — reflet des paramètres). */
  sql_preview: string;
  rows_returned: number;
  count_exact?: number;
  warning?: string;
  duration_ms: number;
}

export interface RepoListResult<T> { data: T[]; count: number; debug: RepoDebug }
export interface RepoCountResult { count: number; debug: RepoDebug }
export interface RepoSingleResult<T> { data: T | null; debug: RepoDebug }
export interface RepoMutationResult<T> { data: T[]; error: string | null; debug: RepoDebug }

export interface RepositoryConfig {
  /** Identifiant logique (ex: "clients", "chantiers"). */
  name: string;
  /** Nom de table Supabase. */
  table: string;
  /** SELECT par défaut utilisé par list()/getById() — peut inclure des joints imbriqués. */
  defaultSelect?: string;
  /** ORDER BY par défaut. */
  defaultOrder?: RepoOrder;
  /** Champs textuels utilisés par search(). */
  searchFields?: string[];
  /**
   * Fonction SQL (SECURITY DEFINER) à utiliser à la place de la table pour la
   * LECTURE lorsque la table elle-même est verrouillée par RLS pour certains
   * rôles (ex. `clients` → `clients_scoped()` : identité seulement, périmètre
   * limité aux chantiers affectés). Utilisée uniquement sans filtre avancé.
   */
  rpcSource?: string;

}

function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

function isAdvancedFilter(v: unknown): v is RepoAdvancedFilter {
  return typeof v === "object" && v !== null && "op" in v && "value" in v;
}

function applyFilters<Q extends { eq: Function; neq: Function; in: Function; gt: Function; gte: Function; lt: Function; lte: Function; like: Function; ilike: Function; is: Function; or: Function }>(
  q: Q,
  filters: Record<string, RepoFilter>,
): Q {
  let out = q;
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined) continue;
    if (isAdvancedFilter(v)) {
      switch (v.op) {
        case "eq": out = (out as any).eq(k, v.value); break;
        case "neq": out = (out as any).neq(k, v.value); break;
        case "in": out = (out as any).in(k, v.value); break;
        case "gt": out = (out as any).gt(k, v.value); break;
        case "gte": out = (out as any).gte(k, v.value); break;
        case "lt": out = (out as any).lt(k, v.value); break;
        case "lte": out = (out as any).lte(k, v.value); break;
        case "like": out = (out as any).like(k, v.value); break;
        case "ilike": out = (out as any).ilike(k, v.value); break;
        case "is": out = (out as any).is(k, v.value); break;
        case "or": out = (out as any).or(v.value); break;
      }
    } else if (v === null) {
      out = (out as any).is(k, null);
    } else {
      out = (out as any).eq(k, v);
    }
  }
  return out;
}

function previewSql(op: string, table: string, select: string, filters: Record<string, unknown>, order?: RepoOrder, limit?: number): string {
  const where = Object.entries(filters)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (isAdvancedFilter(v)) return `${k} ${v.op} ${Array.isArray((v as any).value) ? `(${((v as any).value as unknown[]).map(esc).join(",")})` : esc((v as any).value)}`;
      return `${k} = ${esc(v)}`;
    })
    .join(" AND ");
  const cols = op === "count" ? "count(*)" : select;
  let sql = `SELECT ${cols} FROM public.${table}`;
  if (where) sql += ` WHERE ${where}`;
  if (order && op !== "count") sql += ` ORDER BY ${order.column} ${order.ascending ? "ASC" : "DESC"}`;
  if (limit) sql += ` LIMIT ${limit}`;
  return sql;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;

export class Repository<T = Record<string, unknown>> {
  constructor(public readonly config: RepositoryConfig) {}

  /** Lecture via fonction SQL scopée (contourne une RLS table verrouillée). */
  private async rpcRows(): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
    const { data, error } = await sb.rpc(this.config.rpcSource!);
    return { rows: (data ?? []) as Record<string, unknown>[], error: error?.message ?? null };
  }

  /** Vrai si la lecture peut passer par la fonction scopée (aucun filtre avancé). */
  private canUseRpc(filters: Record<string, RepoFilter>): boolean {
    return !!this.config.rpcSource && Object.values(filters).every((v) => v === undefined);
  }

  /** Retourne les lignes + le count exact (comme Supabase count:'exact'). */
  async list(opts: {
    select?: string;
    order?: RepoOrder;
    filters?: Record<string, RepoFilter>;
    limit?: number;
  } = {}): Promise<RepoListResult<T>> {
    const t0 = performance.now();
    const select = opts.select ?? this.config.defaultSelect ?? "*";
    const order = opts.order ?? this.config.defaultOrder;
    const filters = opts.filters ?? {};

    if (this.canUseRpc(filters)) {
      const { rows, error } = await this.rpcRows();
      const limited = opts.limit ? rows.slice(0, opts.limit) : rows;
      return {
        data: limited as T[],
        count: rows.length,
        debug: {
          repository: this.config.name, table: this.config.table, operation: "list",
          select, order, filters,
          sql_preview: `SELECT * FROM public.${this.config.rpcSource}()`,
          rows_returned: limited.length, count_exact: rows.length,
          warning: error ? `Erreur: ${error}` : undefined,
          duration_ms: Math.round(performance.now() - t0),
        },
      };
    }

    let q = sb.from(this.config.table).select(select, { count: "exact" });
    q = applyFilters(q, filters);
    if (order) q = q.order(order.column, { ascending: order.ascending });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error, count } = await q;
    const rows_returned = Array.isArray(data) ? data.length : 0;
    const count_exact = count ?? rows_returned;
    const debug: RepoDebug = {
      repository: this.config.name, table: this.config.table, operation: "list",
      select, order, filters,
      sql_preview: previewSql("list", this.config.table, select, filters, order, opts.limit),
      rows_returned, count_exact,
      warning: opts.limit && count_exact > opts.limit
        ? `⚠ ${count_exact} lignes existent en base mais seules ${rows_returned} ont été chargées (limit=${opts.limit}).`
        : undefined,
      duration_ms: Math.round(performance.now() - t0),
    };
    if (error) return { data: [], count: 0, debug: { ...debug, warning: `Erreur: ${error.message}` } };
    return { data: (data ?? []) as T[], count: count_exact, debug };
  }

  /** Comptage exact — utilise le MÊME chemin que list() pour garantir la cohérence. */
  async count(filters: Record<string, RepoFilter> = {}): Promise<RepoCountResult> {
    const t0 = performance.now();

    if (this.canUseRpc(filters)) {
      const { rows, error } = await this.rpcRows();
      return {
        count: rows.length,
        debug: {
          repository: this.config.name, table: this.config.table, operation: "count",
          select: "count(*)", filters,
          sql_preview: `SELECT count(*) FROM public.${this.config.rpcSource}()`,
          rows_returned: rows.length, count_exact: rows.length,
          warning: error ? `Erreur: ${error}` : undefined,
          duration_ms: Math.round(performance.now() - t0),
        },
      };
    }

    let q = sb.from(this.config.table).select("id", { count: "exact", head: true });
    q = applyFilters(q, filters);
    const { error, count } = await q;
    const debug: RepoDebug = {
      repository: this.config.name, table: this.config.table, operation: "count",
      select: "count(*)", filters,
      sql_preview: previewSql("count", this.config.table, "count(*)", filters),
      rows_returned: count ?? 0, count_exact: count ?? 0,
      warning: error ? `Erreur: ${error.message}` : undefined,
      duration_ms: Math.round(performance.now() - t0),
    };
    return { count: count ?? 0, debug };
  }


  async search(keywords: string[], limit = 20): Promise<RepoListResult<T>> {
    const t0 = performance.now();
    const fields = this.config.searchFields ?? [];
    const select = this.config.defaultSelect ?? "*";
    const order = this.config.defaultOrder;

    if (this.config.rpcSource) {
      const { rows, error } = await this.rpcRows();
      const kws = keywords.map((k) => k.toLowerCase()).filter(Boolean);
      const matched = kws.length
        ? rows.filter((r) => fields.some((f) => kws.some((k) => String(r[f] ?? "").toLowerCase().includes(k))))
        : rows;
      const data = matched.slice(0, limit);
      return {
        data: data as T[],
        count: matched.length,
        debug: {
          repository: this.config.name, table: this.config.table, operation: "search",
          select, order, filters: { keywords, fields },
          sql_preview: `SELECT * FROM public.${this.config.rpcSource}() -- filtrage mots-clés côté client`,
          rows_returned: data.length, count_exact: matched.length,
          warning: error ? `Erreur: ${error}` : undefined,
          duration_ms: Math.round(performance.now() - t0),
        },
      };
    }

    let q = sb.from(this.config.table).select(select, { count: "exact" });

    if (fields.length && keywords.length) {
      const parts: string[] = [];
      for (const f of fields) for (const k of keywords) {
        const safe = k.replace(/[%,()"'\\]/g, "");
        if (safe) parts.push(`${f}.ilike.%${safe}%`);
      }
      if (parts.length) q = q.or(parts.join(","));
    }
    if (order) q = q.order(order.column, { ascending: order.ascending });
    q = q.limit(limit);
    const { data, error, count } = await q;
    const rows_returned = Array.isArray(data) ? data.length : 0;
    const debug: RepoDebug = {
      repository: this.config.name, table: this.config.table, operation: "search",
      select, order, filters: { keywords, fields },
      sql_preview: `SELECT ${select} FROM public.${this.config.table} WHERE (${fields.map(f => `${f} ILIKE '%…%'`).join(" OR ")}) LIMIT ${limit}`,
      rows_returned, count_exact: count ?? rows_returned,
      warning: error ? `Erreur: ${error.message}` : undefined,
      duration_ms: Math.round(performance.now() - t0),
    };
    return { data: (data ?? []) as T[], count: count ?? rows_returned, debug };
  }

  async getById(id: string, select?: string): Promise<RepoSingleResult<T>> {
    const t0 = performance.now();
    const sel = select ?? this.config.defaultSelect ?? "*";
    const { data, error } = await sb.from(this.config.table).select(sel).eq("id", id).maybeSingle();
    const debug: RepoDebug = {
      repository: this.config.name, table: this.config.table, operation: "getById",
      select: sel, filters: { id },
      sql_preview: previewSql("getById", this.config.table, sel, { id }, undefined, 1),
      rows_returned: data ? 1 : 0,
      warning: error ? `Erreur: ${error.message}` : undefined,
      duration_ms: Math.round(performance.now() - t0),
    };
    return { data: (data ?? null) as T | null, debug };
  }

  // ---------- Mutations ----------

  /** INSERT — retourne les lignes créées (avec SELECT * par défaut). */
  async insert(values: Partial<T> | Partial<T>[], opts: { select?: string } = {}): Promise<RepoMutationResult<T>> {
    const t0 = performance.now();
    const sel = opts.select ?? "*";
    const { data, error } = await sb.from(this.config.table).insert(values).select(sel);
    const rows = Array.isArray(data) ? data.length : 0;
    return {
      data: (data ?? []) as T[],
      error: error?.message ?? null,
      debug: {
        repository: this.config.name, table: this.config.table, operation: "insert",
        select: sel, filters: {},
        sql_preview: `INSERT INTO public.${this.config.table} (…) VALUES (…) RETURNING ${sel}`,
        rows_returned: rows,
        warning: error ? `Erreur: ${error.message}` : undefined,
        duration_ms: Math.round(performance.now() - t0),
      },
    };
  }

  /** UPDATE avec filtres — supporte `{col: value}` et filtres avancés. */
  async update(values: Partial<T>, filters: Record<string, RepoFilter>, opts: { select?: string } = {}): Promise<RepoMutationResult<T>> {
    const t0 = performance.now();
    const sel = opts.select ?? "*";
    let q = sb.from(this.config.table).update(values);
    q = applyFilters(q, filters);
    const { data, error } = await q.select(sel);
    const rows = Array.isArray(data) ? data.length : 0;
    return {
      data: (data ?? []) as T[],
      error: error?.message ?? null,
      debug: {
        repository: this.config.name, table: this.config.table, operation: "update",
        select: sel, filters,
        sql_preview: `UPDATE public.${this.config.table} SET … WHERE ${Object.keys(filters).map(k => `${k}=?`).join(" AND ") || "true"} RETURNING ${sel}`,
        rows_returned: rows,
        warning: error ? `Erreur: ${error.message}` : undefined,
        duration_ms: Math.round(performance.now() - t0),
      },
    };
  }

  /** UPSERT — insertion ou mise à jour selon clé (par défaut: primary key). */
  async upsert(values: Partial<T> | Partial<T>[], opts: { onConflict?: string; select?: string } = {}): Promise<RepoMutationResult<T>> {
    const t0 = performance.now();
    const sel = opts.select ?? "*";
    let q = sb.from(this.config.table).upsert(values, opts.onConflict ? { onConflict: opts.onConflict } : undefined);
    const { data, error } = await q.select(sel);
    const rows = Array.isArray(data) ? data.length : 0;
    return {
      data: (data ?? []) as T[],
      error: error?.message ?? null,
      debug: {
        repository: this.config.name, table: this.config.table, operation: "upsert",
        select: sel, filters: opts.onConflict ? { onConflict: opts.onConflict } : {},
        sql_preview: `INSERT INTO public.${this.config.table} … ON CONFLICT (${opts.onConflict ?? "id"}) DO UPDATE RETURNING ${sel}`,
        rows_returned: rows,
        warning: error ? `Erreur: ${error.message}` : undefined,
        duration_ms: Math.round(performance.now() - t0),
      },
    };
  }

  /** DELETE avec filtres. Refuse une suppression sans filtre pour éviter les accidents. */
  async delete(filters: Record<string, RepoFilter>): Promise<RepoMutationResult<T>> {
    const t0 = performance.now();
    if (!filters || Object.keys(filters).length === 0) {
      return {
        data: [],
        error: "Refus: DELETE sans filtre interdit",
        debug: {
          repository: this.config.name, table: this.config.table, operation: "delete",
          select: "-", filters: {},
          sql_preview: `-- refused: DELETE without WHERE`,
          rows_returned: 0,
          warning: "DELETE sans filtre bloqué par le Repository (sécurité).",
          duration_ms: 0,
        },
      };
    }
    let q = sb.from(this.config.table).delete();
    q = applyFilters(q, filters);
    const { data, error } = await q.select("*");
    const rows = Array.isArray(data) ? data.length : 0;
    return {
      data: (data ?? []) as T[],
      error: error?.message ?? null,
      debug: {
        repository: this.config.name, table: this.config.table, operation: "delete",
        select: "*", filters,
        sql_preview: `DELETE FROM public.${this.config.table} WHERE ${Object.keys(filters).map(k => `${k}=?`).join(" AND ")} RETURNING *`,
        rows_returned: rows,
        warning: error ? `Erreur: ${error.message}` : undefined,
        duration_ms: Math.round(performance.now() - t0),
      },
    };
  }
}
