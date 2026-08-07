# PHASE 3 — READINESS GOTENBERG (MODE URL) — AUDIT COMPLET

Date : 07/08/2026 — **AUDIT UNIQUEMENT. AUCUN FICHIER APPLICATIF MODIFIÉ.**
Aucun template, aucun CSS, aucune route, aucun moteur d'impression n'a été touché.
`buildStandaloneReportHtml()` n'est **pas** utilisé. Aucune extraction de `[data-ref="report"]` hors du DOM.

Méthode retenue et testée : **Chromium 141 ouvre la route d'impression réelle LTPC**
→ `emulate_media('print')` → `page.pdf(A4, printBackground, marges 8 mm)` = équivalent exact du mode
`/forms/chromium/convert/url` de Gotenberg.

---

## 1. ÉTAPE 1 — COUVERTURE DES 10 CATÉGORIES

| # | Rapport | Route d'impression réelle | Composant React | Conteneur | Résultat PDF | Verdict |
|---|---|---|---|---|---|---|
| 1 | Rapport technique | `/reports/rapport-technique/:id/print` | `pages/essais/rapports-techniques/RapportTechniquePrintView.tsx` | `[data-print-root]` | **1 page BLANCHE, 0 caractère, 966 o** | ⛔ **BLOQUANT — §7.1** |
| 2 | Béton — compression | `/essais/beton/beton-durci/compression/:id/rapport` | `pages/essais/CompressionReport.tsx` | `[data-ref="report"]` | 1 p. / A4 / 1 336 car. / 59 Ko | ✅ |
| 3 | Labo mobile — échantillon | `/laboratoires-mobiles/chantier/:cid/echantillon/:id/rapport` | `ChantierEchantillonReport.tsx` | `[data-ref="report"]` | 2 p. / A4 / 1 390 car. / 59 Ko | ✅ |
| 4 | Granulats — granulométrie | `/essais/granulat/physiques/granulometrie/:id/rapport` | `granulat/rapport/GranulatReport.tsx` | `[data-ref="report"]` | 2 p. / A4 / 1 817 car. / 88 Ko | ✅ (courbe Recharts vectorielle) |
| 5 | Géotechnique — plaque | `/essais/geotechnique/in-situ/plaque/:id/rapport` | rapport géotechnique in-situ | `[data-ref="report"]` | 1 p. / A4 / 873 car. / 77 Ko | ✅ |
| 6 | Formulation Dreux-Gorisse | `/essais/beton/formulation/:id/rapport` | `FormulationReport.tsx` | `[data-ref="report"]` | **12 p.** / A4 / 13 418 car. / 247 Ko | ✅ multi-pages |
| 7 | Carottage | `/essais/beton/destructif/carottage/:id/rapport` | `destructif/CarottageReport.tsx` | `[data-ref="report"]` | 1 p. / A4 / 706 car. / 55 Ko | ✅ |
| 8 | État des coulages (paysage) | `/laboratoires-mobiles/chantier/:cid/etat-coulages` | `EtatCoulages.tsx` | `[data-ref="report"]` **après clic « Générer »** | URL nue → **page blanche** ; après clic → 1 p. A4 paysage / 1 153 car. | ⚠️ **§7.2** |
| 9 | État essais béton durci (paysage) | `/essais/beton/beton-durci/etat-essais` | `EtatEssaisBetonDurci` (routes `betonRoutes.tsx:105`) | `[data-ref="report"]` **après clic « Générer »** | URL nue → **page blanche** ; après clic → 1 p. A4 paysage / 510 car. | ⚠️ **§7.2** |
| 10 | Granulats — forme | `/essais/granulat/physiques/forme/:id/rapport` | `granulat/rapport/GranulatReport.tsx` | `[data-ref="report"]` | 1 p. / A4 / 1 317 car. / 49 Ko | ✅ |

**Bilan : 7 catégories validées / 10. 1 bloquante (n° 1). 2 conditionnées (n° 8 et 9).**

### Contrôles détaillés (catégories validées)

| Critère | Résultat |
|---|---|
| Producteur PDF | `Skia/PDF m141` — **vectoriel natif**, aucune rasterisation |
| Format | **595,92 × 842,88 pt** (portrait) / **842,88 × 595,92 pt** (paysage) = A4 exact, 100 % des pages |
| Marges | 8 mm uniformes, identiques au moteur Phase 11 |
| Tableaux | 2 à 15 tableaux par rapport, aucune colonne coupée, aucun débordement horizontal |
| Graphiques | Recharts rendus en **SVG vectoriel** (granulométrie, formulation) — mesures runtime préservées |
| QR codes | SVG vectoriel net, non recompressé |
| Signatures / cachet | image `cachet_url` présente et non dégradée |
| Logos / en-têtes | `ReportHeader` complet, couleurs respectées (`-webkit-print-color-adjust: exact`) |
| Annexes / multi-pages | formulation : 12 pages enchaînées, aucune ligne coupée |
| Texte sélectionnable / recherchable / copiable | ✅ `pdftotext` extrait 100 % du contenu (706 → 13 418 caractères) |
| Erreurs console pendant le rendu | **aucune** sur les 7 catégories validées |
| Filtres modifiant le rendu | catégories 2-7 et 10 : **aucun** (rendu déterministe piloté uniquement par `:id`) |

---

## 2. ÉTAPE 2 — CONCEPTION DU TOKEN DE RENDU (spécification, non implémentée)

Table dédiée `public.render_tokens` (séparée de `document_archives.qr_token`, qui reste le token de **partage**) :

| Colonne | Rôle |
|---|---|
| `token` | 32 octets aléatoires (`gen_random_bytes(32)`, base64url) — jamais dérivé d'un id métier |
| `report_kind` | énuméré : une des 10 catégories |
| `resource_id` | l'unique ressource autorisée |
| `params` | **jsonb figé côté serveur** (filtres des rapports 8/9) — jamais lu depuis la query string |
| `expires_at` | `now() + interval '2 minutes'` |
| `consumed_at` | horodatage de la consommation — **usage unique** |
| `created_by` | utilisateur à l'origine du partage (traçabilité) |

Règles :
- RLS : `SELECT`/`UPDATE` réservés au `service_role` ; **aucun accès `anon`/`authenticated`**.
- Consommation atomique : `UPDATE … SET consumed_at = now() WHERE token = $1 AND consumed_at IS NULL AND expires_at > now() RETURNING …`.
- Le token n'ouvre **que** la route de rendu ; il n'ouvre **aucune** route applicative LTPC, ne crée pas de session Supabase, n'accorde aucun droit d'écriture, et ne donne accès à aucune autre ressource que `resource_id`.
- Toute donnée est résolue **côté serveur** à partir du token ; les paramètres d'URL ne sont jamais pris en compte.
- Le token n'est jamais journalisé ni renvoyé au client final ; il circule uniquement entre l'Edge Function et Gotenberg.

---

## 3. ÉTAPE 3 — ROUTE DE RENDU DÉDIÉE (spécification)

Route unique **hors navigation LTPC** : `/__render/:token`.
- Aucun layout applicatif, aucune sidebar, aucun `ProtectedRoute` classique : elle échange le token contre les données via une Edge Function `render-context` (service_role), puis **monte le composant de rapport existant, inchangé**.
- Elle réutilise donc l'arbre DOM complet, le CSS hérité, les dimensions, les mesures runtime, Recharts, la pagination, les en-têtes/pieds, les signatures, le QR et la mise en page A4.
- Rendu déterministe : les filtres (rapports 8 et 9) proviennent de `render_tokens.params`, pas de l'utilisateur.
- Elle expose un marqueur `window.__RENDER_READY__ = true` après hydratation complète, que Gotenberg attend (`waitForExpression`), pour supprimer toute temporisation aveugle.

---

## 4. ÉTAPE 4 — ARCHITECTURE GOTENBERG (spécification)

```
Bouton Partager (LTPC)
  → Edge Function  archive-report      (service_role)
      • crée render_token (2 min, usage unique)
      • POST https://pdf.interne/forms/chromium/convert/url
        - url = https://ltpc.lovable.app/__render/<token>
        - header X-Gotenberg-Secret (secret Lovable Cloud)
        - A4, marges 8 mm, printBackground, waitForExpression
      • reçoit application/pdf
      • archive le PDF dans Storage + qr_token de partage
  → document-file?t=<qr_token>   (inchangé)
  → navigateur : application/pdf, Content-Disposition inline
```

Contraintes respectées :
- Gotenberg ne reçoit **que** l'URL de rendu + le secret de service. Aucune credential Supabase, aucun accès direct à la base.
- Appel exclusivement serveur→serveur depuis l'Edge Function ; Gotenberg n'est jamais joignable depuis le navigateur.
- Aucun SaaS PDF. Auto-hébergement uniquement.

### Prérequis VPS

| Élément | Recommandation |
|---|---|
| Hôte | VPS Docker (Hetzner CX22, Fly.io, Railway…) — 2 vCPU / 4 Go |
| Image | `gotenberg/gotenberg:8` |
| Réseau | pas d'IP publique ouverte ; TLS + pare-feu limitant aux IP sortantes Supabase Edge, ou tunnel privé |
| Auth | en-tête secret obligatoire (`X-Gotenberg-Secret`), rejet sinon |
| Limites | `--chromium-max-queue-size`, `--api-timeout=60s`, redémarrage automatique |
| Coût | ≈ 5–10 €/mois |
| Journalisation | pas de contenu de rapport dans les logs ; URL de rendu masquée (le token y figure) |

---

## 5. ÉTAPE 5 — TESTS DE NON-RÉGRESSION (exécutés)

12 PDF produits (`/tmp/browser/gotenberg3/out/`, hors dépôt). Comparaison au rendu Phase 11 :

| Critère | Résultat |
|---|---|
| A4 | ✅ 10/10 des PDF produits |
| Marges | ✅ identiques (8 mm) |
| Pagination | ✅ conforme (1, 2 et 12 pages) |
| Tableaux | ✅ complets, aucune colonne tronquée (dont « Moy. Rc (MPa) 16×32 ») |
| Textes | ✅ intégralement extraits |
| Graphiques | ✅ vectoriels |
| QR / signatures / logos | ✅ présents et nets |
| Annexes | ✅ (formulation 12 p.) |
| Couleurs | ✅ fonds et badges conservés |
| Sélection / recherche / copier-coller | ✅ vérifiés par extraction |
| Vectoriel | ✅ `Skia/PDF m141`, seules images = logo + cachet (légitimes) |
| html2canvas / jsPDF / rasterisation / réécriture de template / CSS correctif | ❌ **aucun** |

---

## 6. ÉTAPE 6 — PERFORMANCES MESURÉES

| Mesure | Valeur |
|---|---|
| Chargement de la route rapport (données + React) | 5,0 – 5,9 s (séquentiel) |
| **Conversion PDF seule** | **54 – 330 ms** (réf. prototype 35–213 ms ; 330 ms = formulation 12 pages) |
| Rapport 1 page | 49 – 78 Ko |
| Rapport 2 pages | 59 – 90 Ko |
| Rapport 12 pages | 247 Ko / 326 ms |
| **4 générations simultanées** | **7,23 s au total** (vs ~24 s en séquentiel) — conversions 66/73/137/326 ms |
| Mémoire | 1 contexte Chromium partagé, 4 onglets parallèles sans dégradation ; prévoir 4 Go pour 4 workers |

Le coût dominant reste le chargement du rapport, pas la conversion. Il disparaît côté utilisateur (traitement serveur).

---

## 7. PROBLÈMES DÉTECTÉS — VALIDATION DEMANDÉE (CRITÈRE P0)

Conformément au P0, **aucun template n'a été corrigé**. Les deux points ci-dessous doivent être arbitrés.

### 7.1 ⛔ BLOQUANT — Rapport technique (catégorie 1) : PDF entièrement blanc

Cause racine identifiée, sans ambiguïté : la règle globale d'impression de `src/index.css` (≈ l. 380)

```css
@media print { body * { visibility: hidden !important; }
  [data-ref="report"], [data-ref="report"] * { visibility: visible !important; } }
```

masque tout le document puis ne **révèle que `[data-ref="report"]`**. Or `RapportTechniquePrintView.tsx` utilise
`[data-print-root]` (moteur Phase 11 / `print.css`) et **jamais** `data-ref="report"`. Mesuré en média `print` :
`visibility: hidden` sur le conteneur → PDF vide de 966 octets.

Conséquence : ce rapport est le seul dont l'impression dépend du chemin `PrintService` et non du DOM en place ;
Chromium en mode URL ne peut pas le produire en l'état.

Deux issues possibles — **je n'en applique aucune sans votre accord** :
- (a) restreindre la règle de `index.css` aux pages qui l'utilisent réellement (elle est aujourd'hui globale et masque tout conteneur `data-print-root`) ;
- (b) laisser la catégorie 1 hors périmètre PDF vectoriel.

### 7.2 ⚠️ Rapports 8 et 9 (états paysage) : rendu non déterministe par URL

Le bloc `[data-ref="report"]` n'existe qu'après un clic sur « Générer », et les filtres (client, chantier, centrale, période) vivent uniquement dans l'état React — **aucun paramètre d'URL**. Une URL nue produit donc une page blanche.
Après clic simulé, les deux PDF sont conformes (A4 paysage, texte extrait, tableaux intacts) : le rendu lui-même est bon.

Il faut donc que la route `/__render/:token` **injecte les filtres depuis `render_tokens.params` et déclenche le rendu sans interaction**. Cela ne modifie pas les templates mais suppose que le composant accepte des valeurs initiales — point à valider avant Phase 3.

### 7.3 Points mineurs

- Aucune erreur console détectée sur les 7 catégories validées.
- Les composants `GranulatReport` et `BetonFraisReport` étant génériques, la validation des catégories 4 et 10 couvre par construction les autres essais granulats/béton frais partageant la même route paramétrée.

---

## 8. CONCLUSION

| Question | Réponse |
|---|---|
| Mode URL fidèle sans réécriture de template ? | ✅ oui, sur 7 catégories sur 10 |
| PDF vectoriel, texte sélectionnable/recherchable/copiable ? | ✅ vérifié |
| Interdits respectés (jsPDF, html2canvas, raster, reconstruction, CSS correctif) ? | ✅ aucun utilisé |
| Performance conforme à la référence prototype ? | ✅ 54–330 ms, 4 jobs parallèles en 7,2 s |
| Token de rendu et architecture Gotenberg définis ? | ✅ spécifiés (§2-§4), non implémentés |
| 10/10 catégories validées ? | ⛔ **non — 7/10** |

**ARRÊT ICI, comme demandé.** Le partage n'est pas branché sur Gotenberg.
Deux décisions attendues : §7.1 (rapport technique) et §7.2 (états 8 et 9).
