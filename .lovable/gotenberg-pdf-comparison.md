# PHASE 1-2 — PROTOTYPE GOTENBERG / CHROMIUM : RAPPORT DE COMPARAISON

Date : 07/08/2026 — **PROTOTYPE PARALLÈLE UNIQUEMENT.**
Aucun fichier applicatif modifié. Moteur d'impression Phase 11 intact. Templates A4 intacts. Archivage HTML actuel intact.

---

## 1. Dispositif de test

Gotenberg = **Chromium headless + `page.pdf()`**. Le prototype exécute exactement ce moteur (Chromium 141, backend PDF Skia vectoriel) en environnement de test isolé, hors application.

Deux variantes ont été mesurées pour chaque rapport :

| Variante | Ce qui est envoyé au moteur | Équivaut à |
|---|---|---|
| **LIVE** | Chromium ouvre la **route LTPC du rapport**, `emulate_media('print')`, puis `page.pdf(A4, printBackground)` | Gotenberg en mode **URL** (`/forms/chromium/convert/url`) |
| **GOTENBERG-HTML** | Le HTML autonome produit comme `buildStandaloneReportHtml()` (outerHTML de `[data-ref="report"]` + CSS collecté) est injecté puis converti | Gotenberg en mode **HTML** (`/forms/chromium/convert/html`) |

Paramètres identiques : A4, marges 8 mm, `printBackground: true`.

---

## 2. Résultats

| # | Rapport | Route | Pages LIVE | Pages HTML | Texte sélectionnable | Format | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Rapport technique | `/essais/rapports-techniques/:id` | — | — | — | — | ⚠️ **non testé** : la page ne possède pas de conteneur `data-ref="report"` |
| 2 | **Béton — compression** | `…/compression/:id/rapport` | **1** | 1 | ✅ 1 369 car. | A4 595×842 pt | ✅ LIVE conforme / ❌ HTML débordé |
| 3 | **Labo mobile — échantillon** | `…/echantillon/:id/rapport` | **2** | 1 | ✅ 1 425 car. | A4 | ✅ LIVE conforme / ❌ HTML débordé |
| 4 | **Granulats — granulométrie** | `…/granulometrie/:id/rapport` | **2** | 3 | ✅ 1 856 car. | A4 | ✅ LIVE conforme / ❌ HTML : courbe cassée |
| 5 | **Géotechnique — plaque** | `…/in-situ/plaque/:id/rapport` | **1** | 1 | ✅ 901 car. | A4 | ✅ LIVE conforme |
| 6 | **Formulation Dreux-Gorisse (multi-pages)** | `…/formulation/:id/rapport` | **14** | 14 | ✅ 17 725 car. | A4 | ✅ LIVE conforme |
| 7 | **Carottage** | `…/carottage/:id/rapport` | **1** | 1 | ✅ 740 car. | A4 | ✅ LIVE conforme |
| 8 | État des coulages (paysage) | `…/etat-coulages` | — | — | — | — | ⚠️ non testé : rendu conditionné par filtres UI |
| 9 | État essais béton durci (tableaux longs, paysage) | `…/etat-essais` | — | — | — | — | ⚠️ non testé : idem |
| 10 | Granulats — forme | `…/forme/:id/rapport` | — | — | — | — | ⚠️ non testé : identifiant d'échantillon invalide |

**6 rapports réellement convertis, 12 PDF produits.**

### Contrôles techniques (tous les PDF produits)

| Critère P0 | Résultat |
|---|---|
| Producteur | `Skia/PDF m141` → **vectoriel natif Chromium** |
| Format | **595,92 × 842,88 pt = A4 exact** sur 100 % des pages |
| Texte sélectionnable / recherchable / copiable | ✅ **`pdftotext` extrait l'intégralité du contenu** (ex. « RAPPORT D'ESSAI DE COMPRESSION », « SARL MAKSEM ENGENEERING », valeurs des tableaux) |
| Rasterisation | ❌ aucune — **1 seule image par page = le logo entreprise** (image légitime), tout le reste est du vecteur/texte |
| Polices | intégrées, rendu identique à l'écran d'impression |
| QR code | rendu **SVG vectoriel net** (aucune recompression) |
| Signatures / cachet / en-tête | conservés, non dégradés |
| Couleurs & fonds | ✅ `printBackground` respecte `-webkit-print-color-adjust: exact` |
| Multi-pages | ✅ 14 pages générées sans coupure de ligne (formulation) |
| Graphiques Recharts (SVG) | ✅ vectoriels en mode LIVE, y compris la rotation d'impression de la courbe granulométrique |
| Poids | 55 – 90 Ko (rapport simple), 359 Ko (14 pages avec graphiques) |

### Performance mesurée

| Étape | Temps |
|---|---|
| Chargement de la page rapport (données + rendu React) | 3,4 – 4,1 s |
| **Conversion PDF LIVE** | **35 – 213 ms** |
| Conversion PDF depuis HTML autonome | 570 – 913 ms |
| Poids moyen PDF | ≈ 100 Ko |

Le coût réel n'est pas la conversion (< 0,25 s) mais le chargement du rapport. Aucun impact sur l'usage courant de LTPC : la conversion se ferait hors du navigateur de l'utilisateur.

---

## 3. ⚠️ DIFFÉRENCE VISUELLE IMPORTANTE DÉTECTÉE — STOP DEMANDÉ

**La variante GOTENBERG-HTML (conversion du HTML archivé autonome) n'est PAS fidèle.**

Constats reproductibles :

1. **Débordement horizontal** — rapport compression et labo mobile : les tableaux dépassent la largeur A4, les dernières colonnes (« Moy. Rc (MPa) 16×32 », « Gravier 3 », signature) sont **coupées au bord droit**. En mode LIVE, elles sont intégralement présentes.
2. **Graphiques cassés** — granulométrie : la courbe Recharts est décalée hors cadre et étalée sur une page supplémentaire (3 pages au lieu de 2). Cause : Recharts dimensionne son SVG à partir de la **largeur mesurée du conteneur au runtime** ; dans le HTML détaché, le conteneur parent de mise en page n'existe plus.
3. **Pagination divergente** — labo mobile : 1 page au lieu de 2 ; granulométrie : 3 au lieu de 2.

Cause racine commune : `buildStandaloneReportHtml()` extrait `[data-ref="report"]` **hors de son arbre de mise en page** (conteneurs, largeurs, `flex`/`grid` parents). Le CSS est bien collecté, mais les contraintes de largeur héritées et les mesures runtime sont perdues.

**Conformément à votre consigne, aucun template n'a été modifié et aucune correction n'a été appliquée. Je signale et je m'arrête.**

**En revanche, la variante LIVE (Chromium ouvre la route du rapport) est visuellement identique au rendu Phase 11**, au pixel près sur les 6 rapports testés — sans aucune retouche de template. C'est donc **le mode URL de Gotenberg** qui satisfait le critère P0, pas le mode HTML.

---

## 4. Conclusion

| Question | Réponse |
|---|---|
| Chromium produit-il un PDF vectoriel à partir du HTML existant ? | ✅ Oui, sans réécriture de template |
| Texte sélectionnable / recherchable / copiable ? | ✅ Oui, vérifié par extraction |
| Rendu A4 fidèle ? | ✅ **en mode URL (LIVE)** — ❌ en mode HTML autonome |
| Interdits respectés (jsPDF, html2canvas, raster, react-pdf, SaaS) ? | ✅ Aucun utilisé |
| Performance acceptable ? | ✅ conversion < 0,25 s |
| Prêt pour Phase 3 ? | ⛔ **Non : deux points bloquants à arbitrer (§5)** |

---

## 5. Points à arbitrer AVANT toute intégration (Phase 3)

1. **Mode de conversion.** Le mode fidèle est le mode **URL** : Gotenberg doit ouvrir la route LTPC du rapport. Cela implique que le service Chromium accède à une **route d'impression authentifiée** de l'application (jeton de rendu à usage unique, à courte durée de vie, portée limitée à un rapport). Le mode HTML — qui n'exposerait rien — est aujourd'hui infidèle et nécessiterait une adaptation des conteneurs de rapport, ce que vous avez interdit.
2. **Hébergement.** Gotenberg est un conteneur Docker. **Lovable Cloud / Supabase Edge ne peut pas l'héberger** (isolat Deno, pas de Docker). Il faut un hôte que vous fournissez (VPS, Fly.io, Railway, Render…), avec : réseau fermé, authentification par en-tête secret, appel exclusivement depuis une Edge Function, aucun accès direct aux données métier, conversion seule autorisée (Phase 4).
3. Rapports 1, 8, 9, 10 non couverts par ce prototype (pas de `data-ref="report"` ou rendu conditionné par filtres) — à retester une fois le mode de conversion arrêté.

**Arrêt demandé ici. Aucune intégration ne sera engagée sans votre validation de ces deux points.**

Artefacts du prototype (hors dépôt) : `/tmp/browser/gotenberg/out/` — 12 PDF + rendus JPEG de contrôle.
