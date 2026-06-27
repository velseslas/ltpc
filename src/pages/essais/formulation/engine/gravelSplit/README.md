# Module `gravelSplit` — méthode graphique Dreux-Gorisse

Module isolé qui implémente la **règle de partage 95/5** Dreux-Gorisse pour la
répartition des gravillons. Remplace, à terme, le solveur par moindres carrés
pondérés actuellement utilisé dans `dreuxGorisseCalculation.ts`.

Spécification de référence : `.lovable/plan.md` (sections 0 à 12).

## Statut

- ✅ Implémentation conforme à la spécification (interprétation A verrouillée,
  ordonnées littérales 95 et 5, aucune renormalisation, aucun fallback).
- ⏳ **Validation contre l'exemple numérique du document de référence : EN ATTENTE.**
  Le slot `DOCUMENT_EXAMPLE` dans `documentExampleValidation.ts` doit être
  rempli avec les valeurs réelles du livre avant toute mise en production.
- 🔄 **Migration progressive** : le moteur historique
  (`solveSimplexLeastSquares` dans `dreuxGorisseCalculation.ts`) **reste actif
  par défaut**. Utiliser `compareEngines.ts` pour faire tourner les deux en
  parallèle et collecter les écarts sur des formulations réelles. Suppression
  du solveur uniquement après recette.

## API publique

```ts
import { splitGravels } from "@/pages/essais/formulation/engine/gravelSplit";

const out = splitGravels({
  dmax_mm: 20,
  K: -2,
  gravillons: [
    { nom: "5/12",  dmax_mm: 12.5, tamis: [...] },
    { nom: "12/20", dmax_mm: 20,   tamis: [...] },
  ],
});
// out.proportions = [{ nom: "5/12", pct: ... }, { nom: "12/20", pct: ... }]
```

Toute incohérence (lignes non sécantes avec OAB, ordonnées non monotones,
proportion ≤ 0, gravillons mal classés) lève une `GravelSplitError` détaillée.
Aucune valeur n'est inventée, aucune renormalisation n'est appliquée.

## Comparaison avec le moteur historique

```ts
import { compareEngines } from "./compareEngines";

const cmp = compareEngines(input, legacyProvider);
// cmp.max_deviation_pct, cmp.deviations_pct, cmp.graphical, cmp.legacy
```

## Tests

Dossier `__tests__/` (vitest n'est pas installé dans le projet ; les fichiers
sont prêts pour activation ultérieure).
