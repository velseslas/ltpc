// -----------------------------------------------------------------------------
// BusinessDataTool — accès LARGE EN LECTURE aux données métier / techniques.
//
// Pipeline : question → entités métier (BUSINESS_ENTITIES) → opération
// (COUNT / LIST / SEARCH) → résultat réel Supabase (RLS appliquées) → contexte
// vérifié transmis au LLM.
//
// Garde-fous :
//  - aucune table ni colonne ne provient du LLM ou de l'utilisateur : tout vient
//    du catalogue figé BUSINESS_ENTITIES ;
//  - aucune écriture, aucun SQL arbitraire, aucun `select *` ;
//  - tables de sécurité / authentification absentes du catalogue → invisibles.
// -----------------------------------------------------------------------------
import { sb } from "./sbAny";
import type { Tool, RouterDecision, ToolResult } from "./types";
import type { AICitation } from "../types";
import { runTool } from "./runTool";
import {
  resolveBusinessEntities, entityVocabulary, rowLabel, rowSnippet,
  buildIlikeOrFields, type BusinessEntity,
} from "./BusinessEntities";

const LIST_LIMIT = 12;
const SEARCH_LIMIT = 8;

type Operation = "count" | "list" | "search";

function pickOperation(d: RouterDecision): Operation {
  if (d.intents.includes("count")) return "count";
  if (d.intents.includes("list") || d.intents.includes("summarize")) return "list";
  return "search";
}

function searchKeywords(d: RouterDecision, entities: BusinessEntity[]): string[] {
  const vocab = entityVocabulary(entities);
  return d.keywords.filter((k) => k.length > 2 && !vocab.has(k)).slice(0, 4);
}

/** Tables verrouillées par RLS dont la lecture passe par une fonction scopée. */
const RPC_SOURCES: Record<string, string> = { clients: "clients_scoped" };

async function rpcRows(fn: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await sb.rpc(fn);
  if (error) throw new Error(`${fn}(): ${error.message}`);
  return (data ?? []) as Record<string, unknown>[];
}

async function countEntity(e: BusinessEntity) {
  const fn = RPC_SOURCES[e.table];
  if (fn) return (await rpcRows(fn)).length;
  const { count, error } = await sb.from(e.table).select("id", { count: "exact", head: true });
  if (error) throw new Error(`${e.table}: ${error.message}`);
  return count ?? 0;
}

async function rowsOf(e: BusinessEntity, limit: number, or: string | null, keywords: string[] = []) {
  const fn = RPC_SOURCES[e.table];
  if (fn) {
    const rows = await rpcRows(fn);
    const kws = keywords.map((k) => k.toLowerCase()).filter(Boolean);
    const matched = kws.length
      ? rows.filter((r) => e.searchFields.some((f) => kws.some((k) => String(r[f] ?? "").toLowerCase().includes(k))))
      : rows;
    return matched.slice(0, limit);
  }
  let q = sb.from(e.table).select(e.select);
  if (or) q = q.or(or);
  const { data, error } = await q
    .order(e.orderBy.column, { ascending: e.orderBy.ascending, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`${e.table}: ${error.message}`);
  return (data ?? []) as Record<string, unknown>[];
}


export const BusinessDataTool: Tool = {
  name: "BusinessDataTool",
  description:
    "Lecture des données métier et techniques de LTPC ERP (intervenants, matériaux, chantiers, formulations, essais, matériel, rapports, facturation) : COUNT, LIST, SEARCH sur les tables réelles du catalogue métier.",
  supports: (d: RouterDecision) => resolveBusinessEntities(d.original_query).length > 0,
  confidence: (d: RouterDecision) => {
    const n = resolveBusinessEntities(d.original_query).length;
    if (!n) return 0;
    if (d.intents.includes("count")) return 0.94;
    if (d.intents.includes("list")) return 0.88;
    return 0.7;
  },
  execute: (d: RouterDecision) => runTool(BusinessDataTool, async (): Promise<Omit<ToolResult, "tool" | "duration_ms">> => {
    const entities = resolveBusinessEntities(d.original_query);
    const operation = pickOperation(d);
    const kws = operation === "search" ? searchKeywords(d, entities) : [];

    const counts: Record<string, number> = {};
    const entity_map: Array<{ entite: string; key: string; table: string; operation: Operation }> = [];
    const lists: Array<{ entite: string; key: string; table: string; count_exact?: number; items: unknown[] }> = [];
    const citations: AICitation[] = [];
    const repo_debug: NonNullable<ToolResult["repo_debug"]> = [];
    let rows = 0;
    let ok = true;
    let errMsg: string | undefined;

    await Promise.all(entities.map(async (e) => {
      const t0 = performance.now();
      try {
        const total = await countEntity(e);
        counts[e.key] = total;

        let items: unknown[] = [];
        if (operation !== "count") {
          const or = kws.length ? buildIlikeOrFields(e.searchFields, kws) : null;
          const data = await rowsOf(e, operation === "list" ? LIST_LIMIT : SEARCH_LIMIT, or, kws);
          rows += data.length;
          items = data.map((r) => ({
            id: r.id,
            label: rowLabel(e, r),
            details: rowSnippet(e, r),
            url: e.url ? `${e.url}` : null,
          }));
          for (const r of data) {
            citations.push({
              source_type: e.source_type, source_id: String(r.id),
              label: rowLabel(e, r), reference: null,
              url: e.url ?? null, snippet: rowSnippet(e, r) || null,
            });
          }
        }
        lists.push({ entite: e.label, key: e.key, table: e.table, count_exact: total, items });
        const returned = items.length;
        entity_map.push({ entite: e.label, key: e.key, table: e.table, operation });
        repo_debug.push({
          repository: `BusinessDataTool (${e.key})`, table: e.table, operation,
          select: operation === "count" ? "count(*)" : e.select,
          filters: kws.length ? { ilike_keywords: kws, fields: e.searchFields } : {},
          sql_preview: operation === "count"
            ? `select count(*) from public.${e.table}`
            : `select ${e.select} from public.${e.table} order by ${e.orderBy.column} limit ${operation === "list" ? LIST_LIMIT : SEARCH_LIMIT}`,
          rows_returned: returned,
          count_exact: total,
          duration_ms: Math.round(performance.now() - t0),
        });
      } catch (err) {
        ok = false;
        errMsg = err instanceof Error ? err.message : String(err);
        repo_debug.push({
          repository: `BusinessDataTool (${e.key})`, table: e.table, operation,
          select: e.select, filters: {}, sql_preview: `-- erreur: ${errMsg}`,
          rows_returned: 0, warning: errMsg, duration_ms: Math.round(performance.now() - t0),
        });
      }
    }));

    const summary = operation === "count"
      ? `Comptages métier — ${entities.map((e) => `${e.label}: ${counts[e.key] ?? "?"}`).join(" · ")}`
      : `${operation === "list" ? "Listes" : "Recherche"} métier — ${lists.map((l) => `${l.entite}(${l.items.length}/${l.count_exact ?? "?"})`).join(" · ")}`;

    return {
      ok,
      summary,
      data: {
        operation,
        counts,
        entity_map,
        lists: operation === "count" ? [] : lists,
        keywords: kws,
        source: "Catalogue métier LTPC ERP (tables réelles, RLS appliquées)",
      },
      citations,
      confidence: ok ? 0.95 : 0.4,
      error: errMsg,
      rows,
      repo_debug,
    };
  }),
};
