// Fonction pure de sélection d'outils — isolée pour être testable
// sans charger les imports Supabase des outils réels.
import type { Tool, RouterDecision, ToolScoreTrace } from "./types";

export function selectTools(
  decision: RouterDecision,
  tools: readonly Tool[],
  opts: { minConfidence?: number; max?: number } = {},
): { picked: Tool[]; scores: ToolScoreTrace[]; reason: string } {
  const min = opts.minConfidence ?? 0.4;
  const max = opts.max ?? 6;

  const isCount = decision.intents.includes("count");
  const hasSearch = decision.intents.includes("search");
  const countOnly = isCount && !hasSearch;

  const scores: ToolScoreTrace[] = tools.map((t) => {
    const supported = t.supports(decision);
    const score = supported ? t.confidence(decision) : 0;
    return { tool: t.name, score, supported, selected: false };
  });

  // Règle 1 : intent=count → SQLSearchTool est BANNI (sauf si "search" explicite aussi).
  if (countOnly) {
    for (const s of scores) if (s.tool === "SQLSearchTool") {
      s.supported = false;
      s.score = 0;
      s.reason = "banni: intent=count exclut la recherche ILIKE";
    }
  }

  let candidates = scores
    .filter((s) => s.supported && s.score >= min)
    .sort((a, b) => b.score - a.score);

  // Règle 1-bis : BusinessDataTool (données métier réelles) est toujours conservé
  // s'il est compétent — c'est lui qui garantit qu'aucune donnée métier existante
  // ne provoque un « je n'ai pas accès à cette information ».
  {
    const biz = scores.find((s) => s.tool === "BusinessDataTool" && s.supported);
    if (biz && !candidates.includes(biz)) candidates = [biz, ...candidates];
  }

  // Règle 2 : intent=count → SQLCountTool doit être en tête, quoi qu'il arrive.
  if (isCount) {
    const countIdx = candidates.findIndex((s) => s.tool === "SQLCountTool");
    if (countIdx > 0) {
      const [c] = candidates.splice(countIdx, 1);
      candidates.unshift(c);
    } else if (countIdx === -1) {
      const forced = scores.find((s) => s.tool === "SQLCountTool" && s.supported);
      if (forced) candidates = [forced, ...candidates];
    }
  }

  const picked = candidates.slice(0, max);
  for (const p of picked) {
    p.selected = true;
    if (!p.reason) {
      p.reason =
        isCount && p.tool === "SQLCountTool"
          ? "prioritaire: intent=count → SQLCountTool imposé"
          : `score ${p.score.toFixed(2)} ≥ min ${min}`;
    }
  }

  const reason = isCount
    ? countOnly
      ? "Intent=count détecté → SQLCountTool prioritaire, SQLSearchTool banni."
      : "Intent=count + search détectés → SQLCountTool prioritaire, SQLSearchTool autorisé."
    : `Aucun intent count. Outils triés par score (min ${min}).`;

  return {
    picked: picked.map((s) => tools.find((t) => t.name === s.tool)!).filter(Boolean),
    scores,
    reason,
  };
}
