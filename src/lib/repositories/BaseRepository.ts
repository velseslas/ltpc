// BaseRepository — couche unique d'accès aux données Supabase pour l'UI et LTPC AI.
// Objectif : garantir que les comptes/listes affichés dans les écrans et les
// réponses des outils IA proviennent EXACTEMENT de la même requête. Interdit de
// dupliquer un `.from("table")` ailleurs pour les domaines couverts ici.
import { supabase } from "@/integrations/supabase/client";

export interface RepoOrder { column: string; ascending: boolean }

export interface RepoDebug {
  repository: string;
  table: string;
  operation: "list" | "count" | "search" | "getById";
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
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

function previewSql(op: string, table: string, select: string, filters: Record<string, unknown>, order?: RepoOrder, limit?: number): string {
  const where = Object.entries(filters)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k} = ${esc(v)}`)
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

  /** Retourne les lignes + le count exact (comme Supabase count:'exact'). */
  async list(opts: {
    select?: string;
    order?: RepoOrder;
    filters?: Record<string, unknown>;
    limit?: number;
  } = {}): Promise<RepoListResult<T>> {
    const t0 = performance.now();
    const select = opts.select ?? this.config.defaultSelect ?? "*";
    const order = opts.order ?? this.config.defaultOrder;
    const filters = opts.filters ?? {};
    let q = sb.from(this.config.table).select(select, { count: "exact" });
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined) continue;
      if (v === null) q = q.is(k, null); else q = q.eq(k, v);
    }
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
  async count(filters: Record<string, unknown> = {}): Promise<RepoCountResult> {
    const t0 = performance.now();
    let q = sb.from(this.config.table).select("id", { count: "exact", head: true });
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined) continue;
      if (v === null) q = q.is(k, null); else q = q.eq(k, v);
    }
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
}
