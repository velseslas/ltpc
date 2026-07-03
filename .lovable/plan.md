## Objectif
Rendre le moteur de formulation strictement conforme à la méthode graphique Dreux-Gorisse. Supprimer le solveur numérique du chemin de production. Aucun invention silencieuse : les ambiguïtés levées par vos réponses sont documentées dans le code.

## Décisions métier validées
1. **Point A** : bascule par Dmax — `Dmax ≤ 20 mm` → canonique `pA = 50 − √Dmax + K` (K = G' + correction MF) — `Dmax > 20 mm` → linéaire `pA = 38 + 12·G' + 4·(MF−2)` bornée [38, 50].
2. **Bouton « Optimize Curve »** : suppression complète de l'UI.
3. **≥3 sables** : erreur bloquante avec message explicite (Dreux ne couvre que 1-2 sables).
4. **Boucle MF** : suppression — une seule passe (MF cible → distribution figée → pas de recalcul).

## Corrections — Lot 1 (bloquant)

### B1. Brancher `splitGravels()` conforme dans le flux principal
- Fichier : `src/pages/essais/formulation/engine/dreuxGorisseCalculation.ts`
- Remplacer le contenu de `distributeGravel` (`:916-946`) :
  - Si 1 gravillon → `100 %`.
  - Si ≥2 gravillons → appel `splitGravels({ gravillons, refCurve })` de `engine/gravelSplit/index.ts`.
  - Propager `GravelSplitError` avec message métier.
- Supprimer `solveSimplexLeastSquares` de ce chemin.

### B2. Formule Point A avec bascule Dmax
- `dreuxGorisseCalculation.ts:214-221` (`calculatePointA`) : implémenter la bascule Dmax≤20/>20.
- `engine/gravelSplit/referenceCurve.ts` : accepter la même règle (paramètre `pA` calculé côté appelant plutôt que reconstruit).
- Corriger le commentaire JSDoc (`:108`).

### B3. Suppression bouton Optimize
- `src/pages/essais/formulation/ProportionsStep.tsx:381-390` : retirer `handleOptimize` et le bouton associé.
- `dreuxGorisseCalculation.ts` : marquer `optimizeMix` `@deprecated`, non exporté.

### B4. Blocage ≥3 sables
- `dreuxGorisseCalculation.ts:651-666` (`distributeSand`) : si `sables.length > 2` → throw erreur explicite « Dreux-Gorisse ne couvre que 1 ou 2 sables. Réduisez la sélection matériaux. ». Retirer le fallback solveur pour les sables.

### B5. Une seule passe MF
- `dreuxGorisseCalculation.ts:408-463` : supprimer la boucle 5-itérations. Calcul en une passe : MF cible → distribution figée.

## Corrections — Lot 2 (important)

### I1. Exposer `airOcclus` dans l'UI
- `ProportionsStep.tsx:346` : lire depuis l'input matériaux (adjuvant entraîneur d'air) au lieu du `0` hardcodé.

### I2. `calcVolumes` affiché
- `ProportionsStep.tsx:425-435` : utiliser la densité ciment réelle et inclure Vair : `Vg = 1 − Ve − Vc − Vair`.

### I3. Vérifications finales étendues + panneau Debug
- Ajout dans `DebugDreuxPanel.tsx` :
  - Erreur max, erreur moyenne, RMSE de la courbe de mélange vs OAB.
  - Tamis présentant le plus grand écart.
  - Vérification `Vsable + Vgravier = Vgranulats` (tol 1e-6) et `Vsable/Vgravier = G/S` (tol 1e-6).
  - Vérification `Σ volumes = 1000 L`.

## Non-corrigé (signalé comme ambiguïté / hors périmètre)
- `DOCUMENT_EXAMPLE` (`documentExampleValidation.ts:35`) laissé à `null` — je ne dispose pas des valeurs de référence du livre. À remplir manuellement par vous, ou fournissez le tableau et je l'intègre.
- Tests Vitest du module `gravelSplit` : non activés dans ce lot.

## Livrable final
Après application : rapport structuré (✅/⚠/❌) commité dans `.lovable/audit-dreux-gorisse-phase4.md` avec pour chaque étape : fichier, fonction, formule, entrées, sorties, conformité.

## Ordre d'exécution
1. B2 (Point A bascule) — base pour les autres modules.
2. B1 (brancher splitGravels).
3. B4 + B5 (bloquer ≥3 sables, supprimer boucle MF).
4. B3 (supprimer bouton Optimize).
5. I1 + I2 (air occlus + calcVolumes affiché).
6. I3 (métriques Debug).
7. Rédaction rapport d'audit final.

Confirmez-vous ce plan pour que je lance les corrections ?