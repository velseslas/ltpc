// SQLCountTool — comptes exacts par domaine (répond aux "combien de X ?").
// N'exécute PLUS aucune requête propre : délègue au Repository partagé pour
// garantir que le chiffre retourné = chiffre affiché à l'écran.
import type { Tool, RouterDecision } from "./types";
import { domainsWithSpec } from "./DomainSpecs";
import { runTool } from "./runTool";
import { getRepository, REPOSITORY_CONFIGS, type RepositoryName } from "@/lib/repositories";

// Mapping domaine LTPC AI → Repository partagé UI/IA.
const DOMAIN_TO_REPO: Partial<Record<string, RepositoryName>> = {
  clients: "clients",
  entreprises: "clients",
  chantiers: "chantiers",
  compression: "compression",
  essais: "essais",
  granulometrie: "granulometrie",
  formulations: "formulations",
  rapports: "rapports",
  documents: "documents",
  materiels: "materiels",
  etalonnages: "etalonnages",
  non_conformites: "rapports",
  audits: "audits",
  utilisateurs: "utilisateurs",
};

export const SQLCountTool: Tool = {
  name: "SQLCountTool",
  description: "Retourne le nombre exact d'enregistrements (via Repository partagé UI/IA).",
  supports: (d: RouterDecision) => d.intents.includes("count") && domainsWithSpec(d.domains).length > 0,
  confidence: (d: RouterDecision) => (d.intents.includes("count") ? 0.95 : 0),
  execute: (d: RouterDecision) => runTool(SQLCountTool, async () => {
    const targets = domainsWithSpec(d.domains).filter((x) => DOMAIN_TO_REPO[x]);
    const counts: Record<string, number> = {};
    const repo_debug: NonNullable<ReturnType<typeof buildDebug>>[] = [];
    let ok = true; let errMsg: string | undefined;

    await Promise.all(targets.map(async (dom) => {
      const repoName = DOMAIN_TO_REPO[dom]!;
      const repo = getRepository(repoName);
      try {
        const { count, debug } = await repo.count();
        counts[dom] = count;
        repo_debug.push(buildDebug(dom, debug));
      } catch (e) {
        ok = false;
        errMsg = e instanceof Error ? e.message : String(e);
        counts[dom] = 0;
        repo_debug.push({
          repository: repoName, table: REPOSITORY_CONFIGS[repoName].table,
          operation: "count", select: "count(*)", filters: {},
          sql_preview: `-- erreur: ${errMsg}`,
          rows_returned: 0, count_exact: 0, warning: errMsg, duration_ms: 0,
        });
      }
    }));

    const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      ok,
      summary: targets.map((d) => `${d}: ${counts[d]}`).join(" · ") || "Aucun domaine cible.",
      data: { counts, targets, source: "Repository partagé UI/IA" },
      citations: [],
      confidence: ok ? 1 : 0.4,
      error: errMsg,
      rows: totalRows,
      repo_debug,
    };
  }),
};

function buildDebug(domain: string, d: { repository: string; table: string; operation: string; select: string; filters: Record<string, unknown>; sql_preview: string; rows_returned: number; count_exact?: number; warning?: string; duration_ms: number }) {
  return {
    repository: `${d.repository} (domaine=${domain})`,
    table: d.table, operation: d.operation, select: d.select,
    filters: d.filters, sql_preview: d.sql_preview,
    rows_returned: d.rows_returned, count_exact: d.count_exact,
    warning: d.warning, duration_ms: d.duration_ms,
  };
}
