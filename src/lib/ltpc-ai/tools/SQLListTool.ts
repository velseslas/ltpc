// SQLListTool — retourne les N derniers enregistrements par domaine.
import { supabase } from "@/integrations/supabase/client";
import type { Tool, RouterDecision } from "./types";
import type { AICitation } from "../types";
import { DOMAIN_SPECS, domainsWithSpec } from "./DomainSpecs";
import { runTool } from "./runTool";

const LIMIT = 8;

export const SQLListTool: Tool = {
  name: "SQLListTool",
  description: "Liste les N derniers enregistrements pour un ou plusieurs domaines.",
  supports: (d) => (d.intents.includes("list") || d.intents.includes("summarize")) && domainsWithSpec(d.domains).length > 0,
  confidence: (d) => (d.intents.includes("list") ? 0.85 : d.intents.includes("summarize") ? 0.55 : 0),
  execute: (d) => runTool(SQLListTool, async () => {
    const targets = domainsWithSpec(d.domains);
    const items: Array<{ domain: string; count: number; sample: unknown[] }> = [];
    const citations: AICitation[] = [];
    let rows = 0;
    await Promise.all(targets.map(async (dom) => {
      const spec = DOMAIN_SPECS[dom]!;
      const { data, error } = await supabase.from(spec.table)
        .select(spec.select)
        .order(spec.orderBy.column, { ascending: spec.orderBy.ascending, nullsFirst: false })
        .limit(LIMIT);
      if (error) throw error;
      const list = (data ?? []) as Record<string, unknown>[];
      rows += list.length;
      const sample = list.map((r) => ({
        id: r.id, label: spec.labelOf(r), reference: spec.refOf?.(r) ?? null,
        snippet: spec.snippetOf?.(r) ?? "", url: spec.urlOf?.(r) ?? null,
      }));
      for (const r of list) {
        citations.push({
          source_type: spec.source_type, source_id: String(r.id),
          label: spec.labelOf(r), reference: spec.refOf?.(r) ?? null,
          url: spec.urlOf?.(r) ?? null, snippet: spec.snippetOf?.(r) ?? null,
        });
      }
      items.push({ domain: dom, count: list.length, sample });
    }));
    return {
      ok: true,
      summary: `Listes : ${items.map((i) => `${i.domain}(${i.count})`).join(", ")}`,
      data: { lists: items },
      citations,
      confidence: 0.9,
      // @ts-expect-error trace meta
      rows,
    };
  }),
};
