# AUDIT NORMATIF — MODE B « Évaluation normative des carottes »

Date : 25/07/2026 · Périmètre : `src/lib/essais/normativeCoreEvaluation.ts`, `src/pages/essais/destructif/CarottageEvaluationNormative.tsx`, `src/hooks/useEvaluationsNormativesCarottage.ts`, table `evaluations_normatives_carottage`.
**Aucun code modifié.** Mode A totalement inchangé.

## VERDICT GLOBAL : **C — ERREUR NORMATIVE À CORRIGER** (2 erreurs bloquantes, 6 réserves)

Le moteur est architecturalement sain, statistiquement juste et traçable, mais la **transposition de la clause § 8.1 de l'EN 13791:2007 est inexacte** : le facteur 0,85 est appliqué au mauvais terme et aux mauvaises grandeurs.

---

## 1. AUDIT DU MOTEUR

| Élément | Implémentation (ligne) | Vérification |
|---|---|---|
| Statistiques | `computeStatistiques` L139-157 | ✅ moyenne, médiane (pair/impair OK), écart-type **d'échantillon (n−1)**, CV = s/fm·100, étendue. Filtre `isFinite && > 0`. s = 0 si n = 1 (cohérent) |
| Filtrage carottes | L221-226 | ✅ seules les carottes `valide` avec `fcorr` fini > 0 alimentent les stats |
| Approche 1 — n min | `nMin: 15` L65 | ✅ conforme § 7.3.2 (2007) |
| Approche 1 — formule | L248-253 : `min(fm − 1,48·s ; fmin + 4)`, `s = max(s, 2)` | ✅ conforme § 7.3.2 (k₂ = 1,48 ; s ≥ 2 MPa) |
| Approche 2 — domaine | `nMin 3 / nMax 14` L74-75 | ✅ conforme § 7.3.3 |
| Approche 2 — k | `margeK` L203-208 : 3-6→7 ; 7-9→6 ; 10-14→5 | ✅ conforme Tableau 2 (2007) |
| Approche 2 — formule | L260-262 : `min(fm − k ; fmin + 4)` | ✅ conforme § 7.3.3 |
| Bascule Appr. 1 ↔ 2 | L232-241 | ✅ n < nMin et n > nMax bloquent l'évaluation (pas de bascule automatique, message explicite) — bon comportement |
| Données insuffisantes | L228-241, L351-355 | ✅ `fckIs` non calculé si `donneesManquantes.length > 0` → verdict `non_concluant`, jamais de verdict définitif |
| Unités | MPa partout ; n en carottes ; CV en % | ✅ cohérent, aucune conversion implicite |
| Arrondis | Aucun arrondi dans les comparaisons ; `toFixed(2)` uniquement à l'affichage | ⚠️ voir réserve R-3 |
| Recalcul physique | Aucun (`fcorr` consommé tel quel) | ✅ |

---

## 2. RÉFÉRENCES NORMATIVES

| Règle | Formule implémentée | Norme | Version | Clause | Correct ? |
|---|---|---|---|---|---|
| Estimation fck,is — Approche 1 | `min(fm − 1,48·s ; fmin + 4)`, s ≥ 2 | EN 13791 | 2007 | § 7.3.2 | ✅ Oui |
| Estimation fck,is — Approche 2 | `min(fm − k ; fmin + 4)`, k = 7/6/5 | EN 13791 | 2007 | § 7.3.3 | ✅ Oui |
| n ≥ 15 / 3 ≤ n ≤ 14 | contrôles de domaine | EN 13791 | 2007 | § 7.3.2 / § 7.3.3 | ✅ Oui |
| **Critère de campagne** | `fck,is ≥ 0,85 · fck,cyl` (L286-295) | EN 13791 | 2007 | § 8.1 | ❌ **Non** — voir E-1 |
| **Critère valeur individuelle** | `fmin ≥ 0,85 · fck,cyl − 4` (L300-308) | EN 13791 | 2007 | § 8.1 | ❌ **Non** — voir E-2 |
| Critère individuel par carotte | `fcorr ≥ 0,85 · fck,cyl − 4` (L341) | EN 13791 | 2007 | — | ❌ Même erreur + généralisation non normative (R-1) |
| fm,is et CV | information seule (`na`) | EN 13791 | 2007 | § 7.1 | ✅ Acceptable (informatif) |

### Ce que dit réellement l'EN 13791:2007 § 8.1
L'évaluation de la conformité d'une région d'essai à une classe se fait **sur la moyenne et la valeur la plus faible**, avec 0,85 appliqué à une **somme** :

- n ≥ 15 : `fm(n),is ≥ 0,85 · (fck + 4)` **et** `f is,lowest ≥ 0,85 · (fck − 4)`
- 3 ≤ n ≤ 14 : `fm(n),is ≥ 0,85 · (fck + k)` (k = 5/6/7) **et** `f is,lowest ≥ 0,85 · (fck − 4)`

Le fck,is du § 7.3 est une **estimation de la résistance caractéristique in situ**, pas la grandeur comparée au seuil de § 8.1.

### Différences EN 13791:2007 vs EN 13791:2019 — **AUCUNE MODIFICATION EFFECTUÉE, VALIDATION REQUISE**

| Point | 2007 | 2019 |
|---|---|---|
| Nombre minimal de carottes | 3 (Approche 2) / 15 (Approche 1) | **8 minimum** (méthode indirecte 15+) ; l'approche à 3 carottes disparaît |
| Marges k forfaitaires | 5 / 6 / 7 MPa selon n | Remplacées par un **facteur k_n tabulé** dépendant de n et de la connaissance de s |
| Écart-type | s ≥ 2 MPa | s ≥ 3 MPa (valeur par défaut si inconnu) |
| Grandeur de référence | fck (cyl. ou cube) via 0,85·(fck ± …) | Comparaison directe **fck,is ≥ 0,85 · fck** formalisée en § 9 |
| Critère « lowest » | 0,85·(fck − 4) | Critère sur valeur individuelle révisé (fis,lowest ≥ fck,is − 4 selon cas) |

**Impact** : sur un même jeu de carottes, la 2019 est en général **plus sévère** (plus de carottes exigées, s plancher plus élevé), mais la formulation « fck,is ≥ 0,85·fck » actuellement codée correspond en fait davantage à l'esprit de la **2019** qu'à la lettre de la **2007** annoncée dans l'UI. Il y a donc aujourd'hui un **mélange de deux versions** — c'est le point à trancher.
Aucune version nationale algérienne dédiée n'est référencée dans le moteur ; NF EN 13791 (reprise française) n'introduit pas de coefficient national divergent sur ces clauses.

> ⛔ Décision attendue : **rester en 2007 strict** (corriger § 8.1 comme ci-dessus), **passer en 2019** (revoir n min, s min, k_n), ou **proposer les deux référentiels** en parallèle dans `NORMES[]` (le moteur est déjà extensible pour cela).

---

## 3. AUDIT DU CRITÈRE DES 85 %

- Applicabilité : piloté par `procedure.critere85` (L269) — ✅ mécanisme correct et désactivable par procédure.
- Il s'applique aujourd'hui à **fck,is** (L286-295) : cohérent avec la 2019, **pas** avec la 2007 § 8.1 (qui l'applique à fm,is et fis,lowest).
- Il est **aussi** appliqué à **chaque carotte** (L328-345, seuil `0,85·fck − 4`) : ❌ ceci n'existe dans aucune clause. L'EN 13791 ne définit pas de critère de conformité carotte par carotte ; seule la **valeur la plus faible de la campagne** est soumise à un critère.
- Formule du critère individuel : `0,85·fck − 4` au lieu de `0,85·(fck − 4)`. Écart pour C30/37 : **21,50 au lieu de 22,10 MPa** → seuil trop permissif de 0,6 MPa.
- Grandeur de référence : `fck,cyl` — ✅ correct pour des carottes cylindriques 16×32 ; `fck_cube` est stocké mais jamais utilisé (OK).
- Dépendance à l'objectif : ❌ **aucune**. Les objectifs C (ouvrage existant) et E (expertise) — où la classe spécifiée est souvent inconnue — reçoivent le même critère 85 % obligatoire, et un verdict « NON CONCLUANT » dès que la classe n'est pas saisie, alors qu'une évaluation purement descriptive (fck,is + statistiques, sans conformité) serait la réponse normativement correcte.

---

## 4. APPROCHE 1 — vérifications ponctuelles
n min = 15 ✅ · fm = moyenne arithmétique des fcorr valides ✅ · s = écart-type d'échantillon (n−1) ✅ · plancher s = 2 MPa ✅ (`Math.max(s,2)` L249) · fmin = plus petite valeur retenue ✅ · coefficient 1,48 ✅ · `min(a ; b)` ✅.
Test n = 15 à 38 MPa : s = 0 → s forcé à 2 → `min(38 − 2,96 ; 42) = 35,04 MPa` ✅.
Insuffisance : n = 14 en Approche 1 → `non_concluant`, `fckIs = null`, aucun verdict définitif ✅.

## 5. APPROCHE 2 — balayage n = 3 → 15 (jeu homogène 38 MPa, C30/37)

| n | k | fck,is | Verdict | n | k | fck,is | Verdict |
|---|---|---|---|---|---|---|---|
| 3 | 7 | 31,00 | conforme | 10 | 5 | 33,00 | conforme |
| 4 | 7 | 31,00 | conforme | 11 | 5 | 33,00 | conforme |
| 5 | 7 | 31,00 | conforme | 12 | 5 | 33,00 | conforme |
| 6 | 7 | 31,00 | conforme | 13 | 5 | 33,00 | conforme |
| 7 | 6 | 32,00 | conforme | 14 | 5 | 33,00 | conforme |
| 8 | 6 | 32,00 | conforme | **15** | — | null | **non_concluant** (hors domaine → Approche 1) |
| 9 | 6 | 32,00 | conforme | | | | |

Table k, bornes et bascule : ✅ conformes au § 7.3.3 (2007).

## 6. TESTS DE RÉGRESSION EXÉCUTÉS (`bun`, moteur réel)

| Cas | Résultats (MPa) | Formule appliquée | Valeur | Critère | Attendu | Obtenu |
|---|---|---|---|---|---|---|
| A — 6 homogènes C30/37 | 38·39·37·40·38·39 | min(38,50−7 ; 41) | fck,is 31,50 | ≥ 25,50 | conforme | ✅ conforme |
| B — une valeur très faible | …·12 | min(27 ; 16) | 16,00 | ≥ 25,50 | non conforme | ✅ non_conforme |
| C — 3 carottes | 38·39·37 | min(38−7 ; 41) | 31,00 | ≥ 25,50 | conforme | ✅ conforme |
| D — 14 carottes | 14 × 38 | min(38−5 ; 42) | 33,00 | ≥ 25,50 | conforme | ✅ conforme |
| E — 15 carottes | 15 × 38 | Appr.2 hors domaine / Appr.1 min(35,04 ; 42) | — / 35,04 | — | non concluant / conforme | ✅ ✅ |
| F — 2 carottes | 38·39 | — | null | n ≥ 3 KO | non concluant | ✅ non_concluant |
| G — 1 carotte exclue justifiée | 6 valides + 1 exclue à 10 | min(31,50 ; 41) | 31,50 | ≥ 25,50 | exclusion sans effet sur les stats | ✅ conforme, exclue tracée |
| H — carotte à exactement 85 % (25,50) | …·25,50 | min(29,25 ; 29,50) | 29,25 | ≥ 25,50 | conforme | ✅ conforme |
| I — carotte juste sous seuil (21,49) | …·21,49 | min(28,58 ; 25,49) | 25,49 | ≥ 25,50 | non conforme | ✅ non_conforme |
| J — fck,is = seuil exact | …·21,50 | min(29,92 ; 25,50) | 25,500 | = 25,50 | conforme (≥) | ✅ conforme |
| K — fck,is juste inférieur | …·21,40 | min(29,90 ; 25,40) | 25,40 | < 25,50 | non conforme | ✅ non_conforme |
| L — fck,is juste supérieur | …·21,60 | min(29,93 ; 25,60) | 25,60 | > 25,50 | conforme | ✅ conforme |
| Sans classe béton | 6 homogènes | — | null | — | non concluant | ✅ non_concluant |

Aucune régression : le comportement logique du moteur est **déterministe et cohérent** ; les écarts relevés sont normatifs, pas algorithmiques.

## 7. ARCHITECTURE — ✅ CONFORME
`CarottageDataEntry` (Mode A) calcule section, fcore, L/D, K(L/D), fcorr et écrit `resultats` ; Mode B **lit** ces valeurs. Vérifié par recherche : aucun calcul de section, de L/D, de K ni de fcore dans `normativeCoreEvaluation.ts` ni dans la page Mode B ; aucune écriture vers `echantillons_carottage` (Mode B n'écrit que dans `evaluations_normatives_carottage`). Isolation totale ✅.

## 8. TRAÇABILITÉ

| Champ exigé | Présent | Où |
|---|---|---|
| Norme / version / date | ✅ | `norme_code`, `norme_nom`, `norme_version`, `norme_date` |
| Clause | ✅ | `procedure_label` = label + clause, et `criteres[].reference` |
| Valeur calculée / exigée / unité / résultat | ✅ | `criteres[]` |
| **Formule littérale** | ⚠️ partiel | uniquement pour fck,is via `commentaire` ; absente pour les critères min. et n |
| Statistiques + fck,is + seuil 85 | ✅ | `statistiques` (JSON enrichi) |
| Auteur et horodatage | ✅ | `created_by`, `created_by_nom`, `created_at` |
| **Immutabilité (figée)** | ✅ | RLS : `UPDATE … USING (can_write_business() AND figee = false)` → une évaluation `figee = true` ne peut plus être modifiée ; suppression réservée à `is_admin_only()` ; insertion toujours `figee: true` |

## 9. PROBLÈMES — fichier / ligne / impact / correction proposée

### ❌ E-1 (critique, normatif) — critère de campagne § 8.1 mal transposé
- Fichier : `src/lib/essais/normativeCoreEvaluation.ts` L286-295 (et L269 `seuil85`)
- Problème : `fck,is ≥ 0,85 · fck,cyl`. L'EN 13791:2007 § 8.1 exige `fm(n),is ≥ 0,85·(fck + k)` (ou `+4` si n ≥ 15) **et** `fis,lowest ≥ 0,85·(fck − 4)`.
- Impact : pour C30/37 / n = 6, le seuil devrait porter sur la moyenne à `0,85·(30+7) = 31,45 MPa` au lieu de comparer fck,is à 25,50 → des campagnes déclarées **CONFORMES** peuvent ne pas l'être (cas A : fm = 38,50 ≥ 31,45 → conforme quand même, mais un jeu à fm = 29 passerait à tort).
- Correction proposée (à valider) : conserver fck,is comme **information** § 7.3, et fonder le verdict sur les deux critères § 8.1 réels ; ou basculer explicitement en EN 13791:2019 où `fck,is ≥ 0,85·fck` est la formulation correcte.

### ❌ E-2 (critique, normatif) — parenthésage du critère « valeur la plus faible »
- Fichier : idem, L300 (`const exige = 0.85 * fckCyl - 4;`) et L341 (même formule par carotte)
- Problème : doit être `0,85 · (fck − 4)`. C30/37 : 22,10 MPa attendu vs **21,50** codé.
- Impact : seuil trop permissif de 0,6 MPa (C30/37) à 0,75 MPa (C50/60) → faux « conforme » sur les cas limites (cas I s'inverserait pour une valeur entre 21,50 et 22,10).
- Correction : `0.85 * (fckCyl - 4)`.

### ⚠️ R-1 — critère individuel appliqué à chaque carotte (L328-345)
Aucune clause de l'EN 13791 ne définit un critère de conformité carotte par carotte. Requalifier le « Niveau 1 » en **indicateur informatif** (libellé « indicatif — hors critère normatif ») pour éviter toute interprétation contractuelle.

### ⚠️ R-2 — critère 85 % indépendant de l'objectif (L269)
Objectifs C/E sans classe spécifiée → verdict « non concluant » au lieu d'un rapport descriptif. Proposer un mode « estimation sans conformité » (fck,is + statistiques, verdict `na`).

### ⚠️ R-3 — comparaisons flottantes sans tolérance (L293, L307)
`fckIs >= seuil85` en double précision : un cas exactement au seuil peut basculer selon les décimales saisies. Recommandation : comparer sur valeurs arrondies au centième (`round2(x) >= round2(seuil)`), cohérent avec l'affichage `toFixed(2)`.

### ⚠️ R-4 — critères affichés en cas de données insuffisantes
Quand n < nMin (cas F), le critère « Valeur individuelle minimale » est calculé et affiché `ok` alors que l'évaluation est non concluante. Masquer ou marquer `na` les critères lorsque `donneesManquantes.length > 0`.

### ⚠️ R-5 — formule non stockée dans `criteres[]`
Ajouter un champ `formule` (chaîne littérale) à `CritereNormatif` pour une traçabilité complète du dossier.

### ⚠️ R-6 — `SELECT` sur `evaluations_normatives_carottage` en `USING (true)`
Lecture ouverte à tout utilisateur authentifié, contrairement au scoping appliqué ailleurs. À aligner sur la politique de lecture des essais.

### ℹ️ R-7 — libellé de version
L'UI annonce « EN 13791 — 2007 » alors que la règle des 85 % codée correspond à la 2019 : l'incohérence documentaire doit être levée en même temps que E-1.

---

**Aucune correction n'a été appliquée.** Merci de trancher le point « EN 13791:2007 strict vs 2019 vs double référentiel » avant toute modification du moteur ; E-2 (parenthésage) est en revanche une erreur factuelle valable dans les deux versions et peut être corrigée immédiatement sur simple accord.
