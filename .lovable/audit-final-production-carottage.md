# AUDIT FINAL DE PRODUCTION — MODULE CAROTTAGE
Date : 25/07/2026 — **Aucun code, aucune formule, aucune RLS, aucune migration n'a été modifié.**

Périmètre inspecté :
`src/pages/essais/destructif/Carottage{Test,SampleForm,Detail,DataEntry,Report,EvaluationNormative,EvaluationLecture}.tsx`,
`src/lib/essais/normative/{types,shared,domaine,en13791-2007,en13791-2019,index}.ts`,
`src/hooks/{useEvaluationsNormativesCarottage,useDmaxContexte}.ts`, `src/routes/betonRoutes.tsx`,
RLS `pg_policies`, `src/lib/print/PrintService.ts`.

---

## 1. Parcours complet — PASS
Routes vérifiées (betonRoutes.tsx L134-142) : liste → `/nouveau` → `/:id` → `/:id/saisie` → `/:id/evaluation-normative`
→ `/:id/evaluation-normative/:evaluationId` (lecture seule) → `/:id/rapport` → `/etat-essais`.
Aucune rupture : chaque étape possède un point d'entrée UI (bouton « Évaluation normative » sur `CarottageDetail`,
bouton « Ouvrir en lecture seule » dans l'historique de `CarottageEvaluationNormative`).

## 2. Mode A — PASS
`computeCarotte` (DataEntry L144-225) : section π D²/4 (mm²), volume mm³→m³, ρ = P/V (kg/m³),
fcore = F·1000/A (MPa), fcorr = K(L/D)·fcore, valeurs brutes stockées (`*_raw`), arrondis **uniquement à l'affichage**
(`toFixed`/`Math.round` sur les champs texte, jamais réinjectés dans un calcul ; moyennes calculées sur `fcorr_raw`, L299-309).

Tests L/D (table NF P18-418, interpolation linéaire, L105) :
| L/D | K | Statut |
|---|---|---|
| 0,99 | — | hors domaine (aucun fcorr) |
| 1,00 | 0,900 | valide |
| 1,50 | 1,000 | valide |
| 1,999 | 1,0300 | valide |
| 2,00 | 1,030 | valide — **aucune discontinuité** |
| 2,001 | — | hors domaine |

Verdicts Mode A : `getVerdict` (L136-142) → « Au-dessus du seuil indicatif » / « À examiner » / « En dessous du seuil indicatif ».
Les termes CONFORME / NON CONFORME n'apparaissent **que** dans le disclaimer L579 qui renvoie explicitement le verdict officiel au Mode B. Conforme à l'exigence.

## 3. Mode B — EN 13791:2007 vs 2019 — PASS (isolation stricte)
Aucune constante croisée : `en13791-2007.ts` (s ≥ 2 MPa, k = 7/6/5, n ≥ 3 pour l'Approche 2, § 7.3.2/7.3.3 + § 8.1 :
fm ≥ 0,85(fck+M), fis,lowest ≥ 0,85(fck−4)) ; `en13791-2019.ts` (s ≥ 3 MPa, kn = 7/6, n ≥ 8 pour l'Approche B,
§ 8.1/8.2 + § 9 : fck,is ≥ 0,85·fck, fis,lowest ≥ fck,is − 4). `index.ts` ne contient aucune règle (routeur seul).

Garde-fous testés (exécution réelle) :
- procédure 2007 + référentiel 2019 → `non_concluant`, « Procédure incompatible avec EN13791-2019 » ✔
- objectif A + procédure à effectif réduit → `non_concluant`, « Cette procédure n'est pas applicable à l'objectif sélectionné » ✔
- marges : `margeK2007` [3-6]=7, [7-9]=6, [10-14]=5, 15→null ✔ ; `margeKn2019` [8-9]=7, [10-14]=6, 7 et 15→null ✔
- 15 carottes C25/30 : 2007-A `conforme`, 2019-A `conforme` ✔
- objectif C sans classe, 2019-B, n=10 : verdict `estimation`, fck,is = 24,90 MPa, seuil 85 % non appliqué ✔

## 4. Objectifs — PASS
| Obj | Mode | Classe obligatoire | Procédures autorisées |
|---|---|---|---|
| A conformité béton neuf | conformité | oui | 2007-A / 2019-A |
| B résistance en place | estimation | non | A + B |
| C ouvrage existant | estimation | non | A + B |
| D doute / investigation | conformité | oui | 2007-A / 2019-A |
| E diagnostic | estimation | non | A + B |
UI (`CarottageEvaluationNormative` : Select procédure `disabled` sans objectif, liste filtrée) et moteur (`procedure.objectifs`) appliquent la **même** table.

## 5. Domaine des carottes — PASS
`domaine.ts` : Ø ≥ 50 mm (bloquant), Ø < 100 mm → à examiner, Ø ≥ 3·Dmax (bloquant), 1,0 ≤ L/D ≤ 2,0 (bloquant),
armature → à examiner, données manquantes / fcorr absente → hors domaine, Dmax absent → à examiner.
Priorité vérifiée dans `prepareCampagne` : HORS DOMAINE > À EXAMINER > VALIDÉE (le hors-domaine écrase le choix utilisateur).
Tests : Ø100/Dmax20 → valide ; Ø100/Dmax40 → hors domaine (3·40 > 100) ; carotte hors domaine ajoutée → n reste 15 ;
carotte « à examiner » → n reste 15. Aucune contamination des statistiques.

## 6. Données et précision — PASS
`EvaluationInput.carottes[].fcorr` alimenté par `fcorr_raw` ; `computeStatistiques` opère sur les valeurs brutes ;
aucun `parseFloat(valeurAffichée)` réutilisé en amont d'un calcul (seul fallback `c.fcorr_raw ?? parseFloat(...)` pour les données héritées).

## 7. Brouillon / Validation / Gel — PASS
Hook : `useCreateEvaluationNormative` (figee=false par défaut), `useUpdateEvaluationNormative` (pose `validee_at/par/par_nom`).
Horodatage : `created_at`, `updated_at`, `validee_at`, `created_by(_nom)`, `validee_par(_nom)`.
RLS `evaluations_normatives_carottage` :
`UPDATE USING (can_write_business() AND figee = false)` → **toute modification après gel est refusée côté base** ✔
UI : l'historique n'ouvre une évaluation figée qu'en lecture seule ; le gel demande une confirmation explicite (« Valider et figer »).

## 8. Historique — PASS
Chaque ligne archive : objectif, norme/version/date, procédure + clause, classe, fck cyl/cube, Dmax + source,
snapshot complet des carottes (données brutes), statistiques, critères (formule, seuil, résultat), verdict, conclusion.
`CarottageEvaluationLecture` affiche exclusivement ces colonnes — **aucun appel à `evaluateNormative`** : pas de recalcul.

## 9. Relecture — PASS (1 réserve mineure)
Sections présentes : identification, objectif, référentiel/version, procédure/clause, Dmax + source, carottes retenues /
exclues / hors domaine avec motifs, données individuelles + fcorr, statistiques, critères + formules + seuils, verdict,
conclusion, validation/traçabilité. Aucun bouton de modification/suppression (seulement Retour et Imprimer).

## 10. Rapport et impression — PASS
Mode A (`CarottageReport`) et Mode B (`CarottageEvaluationNormative` + `CarottageEvaluationLecture`) sont deux rapports distincts.
Tous utilisent `PrintService.print()` → `window.print()`, HTML/CSS natif, `@page { size: A4 portrait }`,
`thead { display: table-header-group }`, `break-inside: avoid`, `print:hidden` sur breadcrumbs/boutons/historique.
Aucun `canvas`, `html2canvas`, `jsPDF`, image ou capture pour le contenu → texte 100 % sélectionnable, export PDF via le dialogue d'impression.

## 11. Unités — PASS
mm (Ø, L, Dmax), mm² (section), m³ (volume), kg (masse), kN (charge), MPa (fcore, fcorr, fck, fck,is), kg/m³ (ρ), L/D et K sans unité.
Conversions explicites et correctes : N = kN·1000, m³ = mm³/1e9.

## 12. Sécurité — PASS AVEC RÉSERVE
| Action | Politique |
|---|---|
| SELECT | `true` (authenticated) |
| INSERT | `can_write_business()` |
| UPDATE | `can_write_business() AND figee = false` |
| DELETE | `is_admin_only()` |

**Réserve S-1 (importance moyenne)** : un administrateur peut **supprimer** une évaluation figée (`eval_norm_delete = is_admin_only()`).
Impact : perte d'une pièce de traçabilité normative sans trace. Recommandation (non appliquée) : interdire le DELETE sur `figee = true`
ou journaliser la suppression. Données client : politiques existantes inchangées, `clients` sans policy permissive résiduelle.

## 13. Régression — PASS
Typecheck `tsgo --noEmit` : **0 erreur**. Aucune erreur console sur le parcours (snapshot vide).
Création / modification / saisie / calcul Mode A / sauvegarde / rapport Mode A / état des essais / Mode B / brouillon / gel /
historique normatif / relecture / impression : tous opérationnels, aucune régression détectée.

## 14. A-2 — statut inchangé
Documenté dans `.lovable/audit-a2-nf-p18-418-en13791-2019.md`, dans l'en-tête de `en13791-2019.ts` (L20-26), dans
`NORME_2019.entreeAttendue` et via un avertissement affiché à chaque évaluation 2019.
Aucune double correction : le Mode B consomme `fcorr` sans recalculer K. Moteur stable et déterministe.
Aucune hypothèse présentée comme règle officielle. → 🟠 **A-2 EN ATTENTE DE VALIDATION DOCUMENTAIRE**.

---

## 16. Tableau final

| Domaine | Statut | Problème | Gravité |
|---|---|---|---|
| Mode A | 🟢 PASS | — | — |
| Mode B | 🟢 PASS | — | — |
| EN 13791:2007 | 🟢 PASS | — | — |
| EN 13791:2019 | 🟠 RÉSERVE | chaîne d'entrée A-2 non tranchée (documentée) | Mineure (≤ 3 %) |
| A-2 | 🟠 EN ATTENTE | décision documentaire externe | Normative |
| Objectifs | 🟢 PASS | — | — |
| Domaine | 🟢 PASS | — | — |
| Précision | 🟢 PASS | — | — |
| Brouillon | 🟢 PASS | — | — |
| Gel | 🟢 PASS | protégé UI + hook + RLS | — |
| Historique | 🟢 PASS | — | — |
| Relecture | 🟠 RÉSERVE | bandeau « évaluation figée » affiché aussi pour un brouillon ouvert en lecture (Lecture L172-176) | Cosmétique |
| Rapport | 🟢 PASS | — | — |
| Impression | 🟢 PASS | 100 % natif A4, texte sélectionnable | — |
| Unités | 🟢 PASS | — | — |
| Sécurité | 🟠 RÉSERVE | S-1 : suppression possible d'une évaluation figée par un admin | Moyenne |
| Régression | 🟢 PASS | typecheck 0 erreur | — |

### 1. Problèmes critiques
Aucun.

### 2. Problèmes importants
- **S-1** — `eval_norm_delete = is_admin_only()` autorise la suppression d'une évaluation **figée**
  (base : policy `evaluations_normatives_carottage`). Impact : traçabilité normative destructible.
  Recommandation : `USING (is_admin_only() AND figee = false)` ou archivage/journalisation. *Non appliqué.*

### 3. Problèmes mineurs
- **UX-1** — `CarottageEvaluationLecture.tsx` L172-176 : le bandeau annonce « Cette évaluation est figée » même
  lorsqu'un brouillon est ouvert (l'en-tête, lui, affiche correctement « brouillon »).
- **UX-2** — `CarottageEvaluationLecture.tsx` L147 : la flèche « Retour » renvoie vers l'écran d'évaluation (Mode B)
  plutôt que vers l'historique/détail ; aucun risque de modification (nouvelle évaluation vierge) mais navigation ambiguë.

### 4. Améliorations facultatives
- Reprise d'un brouillon existant dans l'écran Mode B (aujourd'hui un brouillon ouvert en lecture n'est pas rechargé dans le formulaire).
- Export CSV des données archivées d'une évaluation figée.
- Affichage de `k`/`K(L/D)` par carotte dans le rapport Mode B (déjà archivé en base).

### 5. Risques normatifs
- A-2 uniquement : applicabilité de NF P18-418 en amont d'EN 13791:2019 (convention nationale, écart ≤ 3 %),
  signalée à l'utilisateur à chaque évaluation 2019. Aucun autre écart détecté.

### 6. Risques techniques
- S-1 (suppression d'une évaluation figée).
- Dmax absent (formulation non renseignée) → carottes en « à examiner » : comportement voulu, mais peut bloquer l'utilisateur si la formulation du chantier est incomplète.

### 7. Risques UX
- UX-1 / UX-2 ci-dessus, non bloquants.

### 8. Verdict final

## 🟠 PRÊT POUR PRODUCTION AVEC RÉSERVES

Réserves : **A-2** (décision documentaire volontairement ouverte) et **S-1** (suppression d'une évaluation figée par un administrateur).
Fonctionnel, technique, normatif (hors A-2), traçabilité, impression et UX : conformes. Aucune correction appliquée.
