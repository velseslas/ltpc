// Tests automatiques du routage LTPC AI (count intent + priorité SQLCountTool).
// Exécution : `bun src/lib/ltpc-ai/__tests__/routing.test.ts`
// Aucune dépendance Supabase — on utilise des mocks conformes à `Tool`.
import { AIIntentRouter } from "../router/AIIntentRouter";
import { selectTools } from "../tools/ToolRegistry";
import type { Tool, RouterDecision } from "../tools/types";

// -- utils ---------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond: unknown, label: string) {
  if (cond) { passed++; console.log("  ✅", label); }
  else { failed++; console.error("  ❌", label); }
}
function group(name: string, fn: () => void) {
  console.log("\n▶", name);
  fn();
}

// -- mocks : tools autonomes qui reproduisent les vraies règles ----------
const mkTool = (name: string, opts: { supports: (d: RouterDecision) => boolean; confidence: (d: RouterDecision) => number }): Tool => ({
  name, description: name,
  supports: opts.supports, confidence: opts.confidence,
  execute: async () => ({ tool: name, ok: true, summary: "", data: {}, citations: [], confidence: 1, duration_ms: 0 }),
});

const domainsWithSpecMock = (d: RouterDecision) => d.domains.length > 0;

const SQLCountToolMock = mkTool("SQLCountTool", {
  supports: (d) => d.intents.includes("count") && domainsWithSpecMock(d),
  confidence: (d) => (d.intents.includes("count") ? 0.95 : 0),
});
const SQLSearchToolMock = mkTool("SQLSearchTool", {
  // réplique de la nouvelle règle : banni si count-only.
  supports: (d) =>
    !(d.intents.includes("count") && !d.intents.includes("search")) &&
    d.keywords.length > 0 && domainsWithSpecMock(d),
  confidence: (d) =>
    d.intents.includes("count") && !d.intents.includes("search")
      ? 0
      : d.intents.includes("search") ? 0.8 : d.keywords.length ? 0.55 : 0,
});
const SQLListToolMock = mkTool("SQLListTool", {
  supports: (d) => (d.intents.includes("list") || d.intents.includes("search")) && domainsWithSpecMock(d),
  confidence: () => 0.7,
});

const TOOLS = [SQLCountToolMock, SQLSearchToolMock, SQLListToolMock];

// ------------------------------------------------------------------------
group("Router : intent=count sur toutes les tournures demandées", () => {
  const queries = [
    "Combien de clients ?",
    "Combien avons-nous de clients ?",
    "Nombre de clients",
    "Total des clients",
    "J'ai combien de clients ?",
    "Nous avons combien de clients ?",
    "On a combien de clients ?",
    "Combien avons-nous de rapports ?",
  ];
  for (const q of queries) {
    const d = AIIntentRouter.route(q);
    assert(d.intents.includes("count"), `intents.includes("count") pour « ${q} » → [${d.intents.join(",")}]`);
    assert(d.domains.length > 0, `domaine détecté pour « ${q} » → [${d.domains.join(",")}]`);
  }
});

group("Selection : SQLCountTool prioritaire, SQLSearchTool jamais sélectionné", () => {
  const queries = [
    "Combien de clients ?",
    "Combien avons-nous de clients ?",
    "Nombre de clients",
    "Total des clients",
    "J'ai combien de clients ?",
    "Nous avons combien de clients ?",
  ];
  for (const q of queries) {
    const d = AIIntentRouter.route(q);
    const { picked, scores, reason } = selectTools(d, TOOLS);
    const names = picked.map((t) => t.name);
    assert(names[0] === "SQLCountTool", `${q} → 1er outil = SQLCountTool (got ${names[0] ?? "aucun"})`);
    assert(!names.includes("SQLSearchTool"), `${q} → SQLSearchTool absent (got [${names.join(",")}])`);
    const sSearch = scores.find((s) => s.tool === "SQLSearchTool");
    assert(sSearch?.selected === false, `${q} → trace: SQLSearchTool.selected = false`);
    assert(sSearch?.score === 0, `${q} → trace: SQLSearchTool.score = 0`);
    assert(typeof reason === "string" && reason.length > 0, `${q} → reason non vide`);
  }
});

group("Selection : count + search explicite → SQLSearchTool autorisé mais SQLCount reste 1er", () => {
  const d = AIIntentRouter.route("Combien de clients contenant ACME cherche-moi");
  const { picked } = selectTools(d, TOOLS);
  const names = picked.map((t) => t.name);
  assert(d.intents.includes("count") && d.intents.includes("search"), `intents inclut count ET search`);
  assert(names[0] === "SQLCountTool", `SQLCountTool en tête même avec search présent`);
});

group("Selection : pas de count → SQLSearchTool peut être choisi normalement", () => {
  const d = AIIntentRouter.route("Cherche les clients ACME");
  const { picked } = selectTools(d, TOOLS);
  const names = picked.map((t) => t.name);
  assert(!d.intents.includes("count"), `intents ne contient pas count`);
  assert(names.includes("SQLSearchTool") || names.includes("SQLListTool"), `Search ou List disponible: [${names.join(",")}]`);
});

// ------------------------------------------------------------------------
console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passés · ${failed} échoués`);
if (failed > 0) (globalThis as { process?: { exit: (n: number) => void } }).process?.exit(1);
