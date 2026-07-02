// SQLCountTool — comptes exacts par domaine (repond aux "combien de X ?").
import { sb } from "./sbAny";
import type { Tool, RouterDecision } from "./types";
import { DOMAIN_SPECS, domainsWithSpec } from "./DomainSpecs";
import { runTool } from "./runTool";

export const SQLCountTool: Tool = {
  name: "SQLCountTool",
  description: "Retourne le nombre exact d'enregistrements pour chaque domaine demandé.",
  supports: (d: RouterDecision) => d.intents.includes("count") && domainsWithSpec(d.domains).length > 0,
  confidence: (d: RouterDecision) => (d.intents.includes("count") ? 0.95 : 0),
  execute: (d: RouterDecision) => runTool(SQLCountTool, async () => {
    const targets = domainsWithSpec(d.domains);
    const counts: Record<string, number> = {};
    let ok = true; let errMsg: string | undefined;
    await Promise.all(targets.map(async (dom) => {
      const spec = DOMAIN_SPECS[dom]!;
      const { count, error } = await sb.from(spec.table).select("id", { count: "exact", head: true });
      if (error) { ok = false; errMsg = error.message; counts[dom] = 0; }
      else counts[dom] = count ?? 0;
    }));
    const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      ok,
      summary: targets.map((d) => `${d}: ${counts[d]}`).join(" · ") || "Aucun domaine cible.",
      data: { counts, targets },
      citations: [],
      confidence: ok ? 1 : 0.4,
      error: errMsg,
      rows: totalRows,
    };
  }),
};

