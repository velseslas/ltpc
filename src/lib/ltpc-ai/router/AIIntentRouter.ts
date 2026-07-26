// AIIntentRouter — étape 1 de l'architecture Agent + Tools.
// Analyse la question de l'utilisateur → intents + domains + mots-clés + confiance.
// Ne connaît ni Gemini, ni Supabase. Purement déterministe (regex + vocabulaire).
import type { AIContext } from "../types";
import type { RouterDecision, ToolDomain, ToolIntent } from "../tools/types";

const STOPWORDS = new Set([
  "le","la","les","un","une","des","de","du","d","et","ou","à","a","au","aux",
  "en","dans","sur","pour","par","avec","sans","est","sont","ce","cette","ces",
  "quel","quels","quelle","quelles","qui","que","quoi","où","ou","combien",
  "y","il","elle","ils","elles","je","tu","nous","vous","mon","ma","mes",
  "notre","nos","votre","vos","son","sa","ses","leur","leurs","tous","toutes",
  "tout","toute","liste","donne","montre","affiche","cherche","trouve","voir",
  "peux","dois","faut","faire","avoir","être","etre","plus","moins","pourquoi",
  "comment","quand","dernier","dernière","récent","recente","recent",
]);

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const INTENT_PATTERNS: Array<{ intent: ToolIntent; re: RegExp; weight: number }> = [
  // count — priorité maximale, doit toujours produire intent=count avant tout autre.
  // Couvre : combien, combien de, nombre de, total de/des/d', j'ai combien,
  // nous avons combien, on a combien, combien avons-nous, nb, comptez, compte.
  // Tolérant aux fautes de frappe fréquentes (combient, conbien, cbien, kombien)
  // et aux formulations « nombre de », « nb », « total de », « quantité de ».
  { intent: "count",      re: /\b(c[oö]mb?ien[tsz]?|conbien[tsz]?|kombien|cbien|combien|nombre|nbre|nb|total|totaux|quantit[ée]s?|compt(?:e|es|ez|er|age)s?)\b/i, weight: 0.95 },

  { intent: "list",       re: /\b(liste|listez?|donne(?:z|r)?|montre(?:z|r)?|affiche(?:z|r)?|quels?|quelles?|tous les|toutes les|derniers?|dernières?)\b/i, weight: 0.7 },
  { intent: "search",     re: /\b(cherche|trouve|où|ou est|concernant|à propos|sur le|sur la|contenant)\b/i, weight: 0.7 },
  { intent: "compare",    re: /\b(compare(?:r|z)?|comparaison|versus|vs\b|différence entre|par rapport à)\b/i, weight: 0.85 },
  { intent: "analyse",    re: /\b(analyse(?:r|z)?|pourquoi|explique(?:r|z)?|diagnostique(?:r|z)?|cause|raison)\b/i, weight: 0.85 },
  { intent: "summarize",  re: /\b(résume(?:r|z)?|resume(?:r|z)?|synthèse|synthese|résumé|resume|bilan|récapitulatif|recapitulatif)\b/i, weight: 0.8 },
  { intent: "recommend",  re: /\b(recommande(?:r|z)?|suggère(?:r|z)?|suggere(?:r|z)?|conseil|préconise(?:r|z)?|préconisation|preconisation|que dois-je|que faire)\b/i, weight: 0.85 },
  { intent: "trend",      re: /\b(tendance|évolution|evolution|progression|dérive|derive|au fil du temps|historique)\b/i, weight: 0.85 },
  { intent: "statistics", re: /\b(moyenne|médiane|mediane|écart|ecart|variance|statistiques?|min|max|dispersion|distribution)\b/i, weight: 0.9 },
  { intent: "workflow",   re: /\b(workflow|processus|étape|etape|avancement|statut|state)\b/i, weight: 0.6 },
  { intent: "document",   re: /\b(document|rapport pdf|générer un|generer un|archive|attestation|certificat|preuve)\b/i, weight: 0.7 },
];

const DOMAIN_KEYWORDS: Record<ToolDomain, string[]> = {
  clients:          ["client","clients","société","societe","sociétés","donneur d'ordre"],
  entreprises:      ["entreprise","entreprises","raison sociale"],
  chantiers:        ["chantier","chantiers","projet","projets","site","sites","travaux","ouvrage","ouvrages"],
  essais:           ["essai","essais","test","tests","analyse laboratoire"],
  compression:      ["compression","résistance","resistance","éprouvette","eprouvette","cube","cylindre","fc","béton durci","beton durci","28j","fcm"],
  granulometrie:    ["granulométrie","granulometrie","tamis","tamisage","module de finesse","mf","fuseau","sable","gravier","granulat"],
  formulations:     ["formulation","formulations","dreux","gorisse","mélange","melange","recette","bps","bpc","dosage","ciment","adjuvant","e/c"],
  rapports:         ["rapport","rapports","technique","expertise","expertises","procès-verbal","proces-verbal","pv"],
  documents:        ["document","documents","archive","archives","officiel","pdf","contrat","contrats","attestation","certificat"],
  materiels:        ["matériel","materiel","matériels","materiels","équipement","equipement","instrument","machine","balance","presse","étuve","etuve"],
  etalonnages:      ["étalonnage","etalonnage","calibration","vérification","verification","expire","expiré","expiration"],
  non_conformites:  ["non-conformité","non-conformite","non conformité","nc","anomalie","anomalies","défaut","defaut","écart","ecart","incident"],
  audits:           ["audit","auditer","journal","traçabilité","tracabilite","historique","log","logs","action utilisateur"],
  utilisateurs:     ["utilisateur","utilisateurs","technicien","techniciens","ingénieur","ingenieur","opérateur","operateur","personnel","équipe","equipe","user","users"],
  knowledge:        ["connaissance","base","norme","normes","procédure","procedure","documentation","référence","reference","standard","iso","eurocode","nf en"],
  monitoring:       ["alerte","alertes","monitoring","surveillance","incident","proactif","dashboard ia","résumé quotidien","resume quotidien"],
};

const DOMAIN_ALIASES: Record<string, ToolDomain[]> = {
  entreprises: ["clients"],
};

function tokenize(q: string): string[] {
  return norm(q)
    .split(/[^a-z0-9]+/i)
    .filter((w) => w && w.length > 1 && !STOPWORDS.has(w));
}

function detectIntents(q: string): { intents: ToolIntent[]; conf: number } {
  const hits: ToolIntent[] = [];
  let conf = 0;
  for (const p of INTENT_PATTERNS) if (p.re.test(q)) { hits.push(p.intent); conf = Math.max(conf, p.weight); }
  // Défaut : si aucun intent, on considère "search" faible.
  if (!hits.length) return { intents: ["search"], conf: 0.35 };
  return { intents: [...new Set(hits)], conf };
}

function detectDomains(q: string, tokens: string[]): { domains: ToolDomain[]; conf: number } {
  const n = norm(q);
  const matched = new Set<ToolDomain>();
  let bestConf = 0;
  for (const [dom, kws] of Object.entries(DOMAIN_KEYWORDS) as [ToolDomain, string[]][]) {
    for (const kw of kws) {
      const k = norm(kw);
      // match "mot entier" ou substring (mots composés)
      if (n.includes(k) || tokens.includes(k)) {
        matched.add(dom);
        // pondération : mot dédié > substring générique
        bestConf = Math.max(bestConf, k.length >= 5 ? 0.9 : 0.6);
        // aliases (ex : entreprises → clients)
        for (const alias of DOMAIN_ALIASES[dom] ?? []) matched.add(alias);
        break;
      }
    }
  }
  return { domains: [...matched], conf: matched.size ? bestConf : 0.15 };
}

function extractKeywords(tokens: string[], domains: ToolDomain[]): string[] {
  const bag = new Set<string>();
  for (const d of domains) for (const w of DOMAIN_KEYWORDS[d]) bag.add(norm(w));
  return tokens.filter((t) => !bag.has(t)).slice(0, 12);
}

export const AIIntentRouter = {
  route(query: string, context?: AIContext | null): RouterDecision {
    const q = (query ?? "").trim();
    const tokens = tokenize(q);
    const { intents, conf: ic } = detectIntents(q);
    const { domains, conf: dc } = detectDomains(q, tokens);
    const keywords = extractKeywords(tokens, domains);

    // Injection du contexte de route (ex. sur /chantiers/:id → force domaine chantiers)
    if (context?.entity_type) {
      const map: Record<string, ToolDomain> = {
        chantier: "chantiers", client: "clients", formulation: "formulations",
        rapport: "rapports", materiel: "materiels", essai: "essais",
      };
      const forced = map[context.entity_type];
      if (forced && !domains.includes(forced)) domains.push(forced);
    }

    // Confiance globale = moyenne pondérée intent (60 %) + domain (40 %),
    // relevée si un keyword utile est présent.
    const confidence = Math.min(1, ic * 0.6 + dc * 0.4 + (keywords.length ? 0.05 : 0));

    return {
      original_query: q,
      keywords,
      intents,
      domains,
      confidence,
      entity_context: context?.entity_type
        ? { entity_type: context.entity_type, entity_id: context.entity_id }
        : null,
    };
  },
};
