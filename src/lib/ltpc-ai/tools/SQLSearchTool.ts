// SQLSearchTool — recherche ILIKE par mots-clés dans les domaines détectés.
import { supabase } from "@/integrations/supabase/client";
import type { Tool, RouterDecision } from "./types";
import type { AICitation } from "../types";
import { DOMAIN_SPECS, domainsWithSpec, buildIlikeOr } from "./DomainSpecs";
import { runTool } from "./runTool";

const LIMIT = 6;

export const SQLSearchTool: Tool = {
  name: "SQLSearchTool",
  description: "Recherche par mots-clés (ILIKE) dans les colonnes textuelles des domaines détectés.",
  supports: (d) => d.keywords.length > 0 && domainsWithSpec(d.domains).length > 0,
  confidence: (d) => (d.intents.includes("search") ? 0.8 : d.keywords.length ? 0.55 : 0),
  execute: (d) => runTool(SQLSearchTool, async () => {
    const targets = domainsWithSpec(d.domains);
    const items: Array<{ domain: string; count: number; sample: unknown[] }> = [];
    const citations: AICitation[] = [];
    let rows = 0;
    await Promise.all(targets.map(async (dom) => {
      const spec = DOMAIN_SPECS[dom]!;
      const or = buildIlikeOr(spec.searchFields, d.keywords);
      let q = supabase.from(spec.table).select(spec.select)
        .order(spec.orderBy.column, { ascending: spec.orderBy.ascending, nullsFirst: false })
        .limit(LIMIT);
      if (or) q = q.or(or);
      const { data, error } = await q;
      if (error) throw error;
      const list = (data ?? []) as Record<string, unknown>[];
      rows += list.length;
      items.push({
        domain: dom, count: list.length,
        sample: list.map((r) => ({
          id: r.id, label: spec.labelOf(r), reference: spec.refOf?.(r) ?? null,
          snippet: spec.snippetOf?.(r) ?? "",
        })),
      });
      for (const r of list) {
        citations.push({
          source_type: spec.source_type, source_id: String(r.id),
          label: spec.labelOf(r), reference: spec.refOf?.(r) ?? null,
          url: spec.urlOf?.(r) ?? null, snippet: spec.snippetOf?.(r) ?? null,
        });
      }
    }));
    return {
      ok: true,
      summary: `Recherche « ${d.keywords.join(" ")} » → ${rows} résultats`,
      data: { matches: items, keywords: d.keywords },
      citations,
      confidence: rows > 0 ? 0.85 : 0.4,
      // @ts-expect-error trace meta
      rows,
    };
  }),
};
