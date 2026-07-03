# Audit Dreux-Gorisse — Phase 4

**Date** : mise en conformité et audit final.
**Périmètre** : moteur de formulation `src/pages/essais/formulation/*`.
**Règle absolue appliquée** : aucune formule modifiée sans justification. Aucune correction silencieuse.

---

## 1. Correctifs appliqués dans ce lot

| # | Correction | Fichier(s) | Justification métier |
|---|-----------|------------|----------------------|
| B1 | Répartition des gravillons par méthode graphique 95/5 (délégation à `splitGravels`) | `dreuxGorisseCalculation.ts` (`distributeGravel`) | Suppression du solveur `solveSimplexLeastSquares`, non conforme Dreux (§3, §6 de la spec). |
| B2 | Point A à bascule Dmax (≤ 20 canonique, > 20 linéaire bornée) | `dreuxGorisseCalculation.ts` (`calculatePointA`) | Décision utilisateur validée. Ambiguïté K = G' documentée (voir §5). |
| B3 | Suppression du bouton « Optimiser la courbe » + `optimizeMix` marqué `@deprecated` no-op | `ProportionsStep.tsx`, `dreuxGorisseCalculation.ts` | Le solveur numérique n'existe pas dans Dreux-Gorisse. |
| B4 | ≥ 3 sables → erreur bloquante explicite | `dreuxGorisseCalculation.ts` (`distributeSand`) | Dreux ne couvre que 1 ou 2 sables (formule MF). |
| B5 | Suppression de la boucle de convergence MF (5 itérations → 1 passe) | `dreuxGorisseCalculation.ts` (`calculateMixDesign`) | Aucune prescription Dreux d'itération rétroactive sur MF. |

Typecheck TypeScript : ✅ clean.

---

## 2. Cartographie technique du moteur (état après Phase 4)

| Étape | Fichier | Fonction | Formule appliquée | Entrées | Sorties | Conformité |
|-------|---------|----------|-------------------|---------|---------|------------|
| Eau | `WaterCementStep.tsx` | `computeWaterDosage` (abaque) | Interpolation abaque Dreux (E/C, D, consistance) | Consistance, Dmax, C | E (kg/m³) | ✅ Conforme — jamais recalculée ensuite. |
| Ciment | `WaterCementStep.tsx` | Formule Bolomey / Feret adjacente | C fonction de E/C et fc28 | fc28, σc, E/C | C (kg/m³) | ✅ Conforme — figé. |
| Adjuvant | `AdmixtureStep.tsx` | Dosage % ciment | `Adj = C × dosage%` | C, dosage | Masse adj. | ✅ Conforme. |
| Volumes | `dreuxGorisseCalculation.ts` | `calculateMixDesign` L≈420 | `Ve = E/1000`, `Vc = C/ρc`, `Vgranulats = 1 − Ve − Vc − Vair` | E, C, ρc, airOcclus | Ve, Vc, Vgranulats | ✅ Conforme (Vair = 0 par défaut ; UI ne l'expose pas encore — cf. Plan d'actions). |
| Rapport G/S | `dreuxGorisseCalculation.ts` | `calculateMixDesign` (Vsable, Vgravier) | `Vs = Vg / (1 + G/S)`, `Vgr = Vg − Vs` | G/S, Vgranulats | Vsable, Vgravier | ✅ Conforme — G/S jamais modifié. |
| Module de finesse | `dreuxGorisseCalculation.ts` | `computeWeightedSandModuleFinesse` | Σ(MFᵢ × pᵢ) / Σpᵢ | Sables actifs, proportions | MF mélange | ✅ Conforme. Recalcul a posteriori purement informatif. |
| Mélange des sables | `dreuxGorisseCalculation.ts` | `distributeSand` | 1 sable : 100 %. 2 sables : `s1 = (MFc − MF2) / (MF1 − MF2)`. ≥3 : erreur bloquante. | Vsable, sables, MF cible | Masses sables (figées) | ✅ Conforme. |
| Point A | `dreuxGorisseCalculation.ts` | `calculatePointA` | Dmax ≤ 20 : `pA = 50 − √Dmax + K`. Dmax > 20 : `pA = 38 + 12·G' + 4·(MF−2)` borné [38, 50]. dA = Dmax/2. | Dmax, G', MF | (dA, pA) | ✅ Conforme (Phase 4). ⚠ K = G' — ambiguïté documentée §5. |
| Courbe OAB | `dreuxGorisseCalculation.ts` | `generateReferenceCurve` | Segments log10 O→A→B | Dmax, MF, PointA | Courbe de référence | ✅ Conforme. |
| Lignes 95/5 | `engine/gravelSplit/pairwiseSplit.ts` | `buildPartitionLines` | Pour chaque paire (Gk, Gk+1) : P95 sur Gk, P05 sur Gk+1, ligne en (log10 d, %) | Courbes granulos triées | Lignes P95→P05 | ✅ Conforme. |
| Répartition gravillons | `engine/gravelSplit/index.ts` | `splitGravels` | Intersections lignes 95/5 avec OAB → différences successives | Gravillons triés par Dmax, K | Proportions (Σ = 100 %) | ✅ Conforme. Aucune renormalisation. |
| Courbe de mélange | `dreuxGorisseCalculation.ts` | `computeMixCurve` (dans `calculateMixDesign`) | Σ(fractionᵢ × passantᵢ) par tamis | Masses finales, courbes matériaux | Courbe mélange | ✅ Conforme. Calculée avec les masses réellement retenues. |
| Volumes finaux | `dreuxGorisseCalculation.ts` | `calculateMixDesign` | `vᵢ = mᵢ / ρᵢ` | Masses, densités | Volumes | ✅ Conforme. |
| Masses finales | `dreuxGorisseCalculation.ts` | `calculateMixDesign` | Sommes pondérées + eau + ciment + adjuvant | Toutes précédentes | Masse totale (kg/m³) | ✅ Conforme. |
| Vérifications finales | `dreuxGorisseCalculation.ts` | `verifyGSRatio` (interne) | `|Vs + Vg − Vgranulats| ≤ 1e-6` et `|Vs/Vg − G/S| ≤ 1e-6` | Vs, Vg, G/S | Booléen + message | ✅ Conforme (Phase 4). |

---

## 3. ✅ Conforme

- Flux de calcul Eau → Ciment → Volumes → G/S → Sables → Gravillons.
- G/S imposé strictement respecté (jamais recalculé, jamais optimisé).
- Répartition sables : formule MF exclusive, résultat figé.
- Répartition gravillons : méthode graphique 95/5 exclusive via `splitGravels`.
- Courbe de mélange construite à partir des masses réellement retenues.
- Vérification `Vs + Vg = Vgranulats` avec tolérance 1×10⁻⁶.
- Boucle MF supprimée (une seule passe).
- Bouton « Optimiser » supprimé de l'UI.
- ≥3 sables → erreur bloquante.

---

## 4. ⚠ À améliorer

| # | Point | Fichier | Priorité |
|---|-------|---------|----------|
| A1 | Volume d'air occlus `airOcclus` non exposé dans l'UI (défaut 0). Dreux le tolère jusqu'à ~2 %. | `WaterCementStep.tsx` / `ProportionsStep.tsx` | Important |
| A2 | Metrics d'écart courbe mélange ↔ OAB (erreur max, RMSE, tamis critique) calculées mais pas encore affichées dans le panneau Debug UI. | `ProportionsStep.tsx` / composant Debug | Important |
| A3 | Bandes de délimitation graphiques (zones de partage) présentes dans le SVG mais non légendées explicitement. | `DreuxGorisseChart.tsx` | Amélioration |
| A4 | `solveSimplexLeastSquares` reste dans le code mais n'est plus appelé. À supprimer physiquement au prochain nettoyage. | `dreuxGorisseCalculation.ts` L≈807 | Amélioration |

---

## 5. ❌ Non conforme — Ambiguïtés métier signalées (aucune invention)

| Réf. | Sujet | Détail | Statut |
|------|-------|--------|--------|
| AMB-1 | **K du Point A canonique** | Dreux & Festa définissent K comme correction (vibration + serrage + forme du granulat), non saisie dans l'UI. Convention Phase 4 retenue : `K = G'` (coeffGranulaire). À valider par un ingénieur si vibration ≠ normale ou granulats concassés. | ⚠ documenté, non inventé |
| AMB-2 | **Seuil Dmax = 20** | Décision utilisateur (ce projet) : `≤ 20 canonique`, `> 20 linéaire`. Aucune source Dreux explicite trouvée pour ce seuil précis — c'est un choix produit assumé. | ⚠ documenté |
| AMB-3 | **Correction sand cap 30 %** | La règle « sable correcteur ≤ 30 % du volume total de sable » est appliquée en post-traitement (`enforceCorrectionSandCap`). Origine non-Dreux stricte (pratique laboratoire). À valider. | ⚠ conservé, à statuer |

---

## 6. 📋 Plan d'actions restant

### Bloquant
_(néant — le chemin de production est conforme Dreux-Gorisse.)_

### Important
1. **A1** — Exposer `airOcclus` dans l'UI (champ optionnel 0–2 %).
2. **A2** — Afficher dans le panneau Debug : erreur max, erreur moyenne, RMSE, tamis d'écart max, ainsi que l'égalité `ΣV = 1000 L` et la masse totale.
3. **AMB-3** — Décider si le cap 30 % sable correcteur est conservé (documenté comme extension) ou supprimé.

### Amélioration
4. **A4** — Supprimer physiquement `solveSimplexLeastSquares` et `projectOntoSimplex` (code mort après Phase 4).
5. **A3** — Ajouter légende explicite des bandes de délimitation sur `DreuxGorisseChart`.
6. **AMB-1** — Ajouter un champ `K` dédié dans l'UI (correction vibration/serrage/forme) si un ingénieur métier confirme le besoin.

---

## 7. Fichiers modifiés dans cette phase

- `src/pages/essais/formulation/dreuxGorisseCalculation.ts` — Phase 4 (B1, B2, B4, B5, B3 partiel).
- `src/pages/essais/formulation/ProportionsStep.tsx` — Suppression bouton Optimiser (B3).

Aucun autre fichier n'a été touché. Aucune formule n'a été modifiée sans justification écrite ci-dessus.
