# PHASE 3 — RAPPORT FINAL DE READINESS GOTENBERG (§7.1 + §7.2)

Date : 07/08/2026 — Corrections §7.1 et §7.2 implémentées puis validées.
**Aucun template, aucun calcul, aucun rendu écran, aucun workflow métier modifié.**
**Gotenberg n'est PAS déployé. Le partage en production n'est PAS branché.**

---

## 1. §7.1 — RAPPORT TECHNIQUE (page blanche corrigée)

Cause : `@media print { body * { visibility: hidden } }` ne révélait que `[data-ref="report"]`,
alors que le Print Engine V2 (rapports techniques) utilise `[data-print-root]`.

Correction — **uniquement dans la logique CSS d'impression** (`src/index.css`) :

```css
[data-ref="report"], [data-ref="report"] *,
[data-print-root], [data-print-root] * { visibility: visible !important; }
[data-print-root] { display:block; position:static; overflow:visible; box-shadow:none; }
```

Aucun template touché, aucun composant modifié, aucun rendu écran affecté
(la règle vit intégralement dans `@media print`).

Résultat : `/reports/rapport-technique/:id/print` → **1 page A4, 732 caractères extractibles,
82 115 o, Skia/PDF m141** (avant : 966 o, 0 caractère, page blanche).

---

## 2. §7.2 — RENDU DÉTERMINISTE PAR JETON DE RENDU

### 2.1 Table `public.render_tokens`

| Colonne | Rôle |
|---|---|
| `token` | 32 octets aléatoires (`crypto.getRandomValues`), base64url |
| `report_kind` | catalogue fermé côté serveur (9 types) |
| `resource_id` | ressource unique autorisée (UUID validé) |
| `params` | **filtres figés côté serveur** (jsonb, ≤ 4 Ko) |
| `expires_at` | `now() + 2 minutes` |
| `consumed_at` | usage unique |
| `created_by` | traçabilité de l'émetteur |

RLS activée, **aucune policy**, `REVOKE ALL` pour `anon`/`authenticated`, `GRANT ALL` au seul `service_role`.
Vérifié : lecture REST par un utilisateur connecté → **403 / 42501**.

### 2.2 Edge Functions

- `render-token` (JWT obligatoire) : valide le type de rapport contre un catalogue fermé,
  valide l'UUID de ressource, **fige les filtres**, crée le jeton, renvoie `/__render/<token>`.
- `render-context` (appelée par le moteur PDF) : **consommation atomique**
  (`UPDATE … WHERE consumed_at IS NULL AND expires_at > now() RETURNING …`),
  renvoie type + ressource + filtres figés + route d'impression réelle LTPC.

Le chemin d'impression est **reconstruit côté serveur** ; la query string du client n'est jamais lue.

### 2.3 Route `/__render/:token`

`src/pages/render/RenderBootstrap.tsx` : échange le jeton, mémorise les paramètres figés
(`src/lib/render/renderParams.ts`, mémoire process, non modifiables) puis redirige vers la
**route d'impression réelle LTPC inchangée**. Aucun template dupliqué, aucun HTML autonome,
`buildStandaloneReportHtml()` n'est pas utilisé.

### 2.4 Auto-génération sans clic

`EtatCoulages.tsx` et `EtatEssaisBetonDurci.tsx` initialisent leurs états depuis les paramètres
figés (`useRenderParams(kind)`), et `generated` vaut `true` d'emblée **uniquement** en contexte de
rendu PDF. Hors jeton, `frozen === null` → comportement écran strictement identique à aujourd'hui
(le bloc rapport n'apparaît qu'après clic « Générer »).

### 2.5 Tests de sécurité du jeton

| Scénario | Résultat |
|---|---|
| Création sans JWT | **401** |
| Type de rapport hors catalogue | **400** |
| `resource_id` non UUID | **400** |
| Première consommation | **200** + chemin serveur correct |
| Rejeu du même jeton | **403** |
| Jeton inconnu / falsifié | **403** |
| Lecture directe de `render_tokens` (utilisateur connecté) | **403 (42501)** |

---

## 3. VALIDATION DES 10 CATÉGORIES (après corrections)

| # | Rapport | Mode | Pages | Format | Caractères | Taille | PDF ms | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | Rapport technique | URL directe | 1 | 595,92 × 842,88 (A4) | 732 | 82 Ko | 50 | ✅ |
| 2 | Béton — compression | URL directe | 1 | A4 portrait | 1 336 | 60 Ko | 56 | ✅ |
| 3 | Labo mobile — échantillon | URL directe | 2 | A4 portrait | 1 390 | 61 Ko | 38 | ✅ |
| 4 | Granulats — granulométrie | URL directe | 2 | A4 portrait | 1 817 | 90 Ko | 74 | ✅ |
| 5 | Géotechnique — plaque | URL directe | 1 | A4 portrait | 873 | 79 Ko | 45 | ✅ |
| 6 | Formulation Dreux-Gorisse | URL directe | 12 | A4 portrait | 13 418 | 253 Ko | 158 | ✅ |
| 7 | Carottage | URL directe | 1 | A4 portrait | 706 | 57 Ko | 29 | ✅ |
| 8 | État des coulages | **jeton `/__render/:token`** | 1 | 842,88 × 595,92 (A4 paysage) | 1 153 | 79 Ko | 47 | ✅ |
| 9 | État essais béton durci | **jeton `/__render/:token`** | 1 | A4 paysage | 510 | 66 Ko | 45 | ✅ |
| 10 | Granulats — forme | URL directe | 1 | A4 portrait | 1 317 | 49 Ko | 39 | ✅ |

**10 / 10 validées. Aucune page blanche. Zéro erreur console sur les 10 rendus.**

### Critères P0

| Critère | Résultat |
|---|---|
| Aucune page blanche | ✅ 10/10 |
| A4 exact | ✅ 595,92 × 842,88 pt (portrait) / 842,88 × 595,92 pt (paysage) |
| Texte sélectionnable / recherchable | ✅ `pdftotext` : 510 → 13 418 caractères |
| Vectoriel | ✅ `Skia/PDF m141`, aucune rasterisation |
| Recharts | ✅ SVG conservés (29 à 49 `<svg>` par rapport) |
| QR | ✅ présent et net sur les 10 |
| Cachet / signature | ✅ images présentes, non dégradées |
| Pagination identique à Phase 11 | ✅ (formulation : 12 pages, labo mobile : 2 pages) |
| Templates modifiés | ❌ aucun |
| Moteur d'impression Phase 11 modifié | ❌ aucun (`PrintService`, `print.css` intacts) |

---

## 4. FICHIERS TOUCHÉS

| Fichier | Nature |
|---|---|
| `src/index.css` | §7.1 — révélation de `[data-print-root]` (bloc `@media print` uniquement) |
| `public.render_tokens` (migration) | §7.2 — table technique service_role |
| `supabase/functions/render-token/index.ts` | §7.2 — émission du jeton |
| `supabase/functions/render-context/index.ts` | §7.2 — consommation atomique |
| `src/lib/render/renderParams.ts` | §7.2 — paramètres figés |
| `src/pages/render/RenderBootstrap.tsx` | §7.2 — route `/__render/:token` |
| `src/App.tsx` | §7.2 — déclaration de la route |
| `EtatCoulages.tsx`, `EtatEssaisBetonDurci.tsx` | §7.2 — init des états depuis les paramètres figés (écran inchangé hors jeton) |

---

## 5. RESTE À FAIRE (non exécuté, conformément à la consigne)

1. **Session de rendu pour Gotenberg** : le navigateur de Gotenberg est anonyme ; les routes
   d'impression restent protégées. Il faudra soit injecter une session de service, soit rendre
   `/__render/:token` porteuse d'un contexte de données résolu côté serveur. Décision à arbitrer.
2. **Déploiement Gotenberg** (Docker/VPS) — non réalisé.
3. **Branchement du partage en production** — non réalisé.

**STOP ici, comme demandé.**
