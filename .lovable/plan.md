
# Spécification technique — Nouveau moteur Dreux-Gorisse

> Document de spécification uniquement. Aucune modification de code dans cette phase.
> Le solveur numérique actuel (`solveSimplexLeastSquares`, `SIEVE_WEIGHTS`, gradient projeté) est **abandonné** et sera supprimé lors de l'implémentation.

---

## 1. Architecture des modules

Arborescence cible sous `src/pages/essais/formulation/engine/` :

```text
engine/
├── index.ts                      # Point d'entrée: calculateFormulation()
├── types.ts                      # Types I/O partagés
├── steps/
│   ├── 01_water.ts               # Pass-through (eau imposée)
│   ├── 02_cement.ts              # Pass-through (ciment imposé)
│   ├── 03_volumes.ts             # Bilan volumique (Vgranulats = 1 - Ve - Vc)
│   ├── 04_sandGravelSplit.ts     # Application du G/S imposé
│   ├── 05_sandMix.ts             # Module de finesse (réutilise existant)
│   ├── 06_gravelSplit/
│   │   ├── referenceCurve.ts     # Courbe OAB (Point A inchangé)
│   │   ├── granuloCurve.ts       # Normalisation + interpolation log d'une courbe granulo
│   │   ├── partitionLine.ts      # Construction et intersection ligne 95/5 ↔ OAB
│   │   └── splitGravels.ts       # Orchestration 2/3/4 gravillons
│   ├── 07_fractionVolumes.ts     # %vol → V_i
│   └── 08_masses.ts              # Masse_i = V_i × ρ_abs_i
└── checks/
    └── coherence.ts              # Contrôles physiques et diagnostics
```

Le fichier actuel `dreuxGorisseCalculation.ts` deviendra un mince adaptateur qui appelle `engine/index.ts` (le temps de migrer les appels), puis sera supprimé.

---

## 2. Types I/O (résumé)

```text
EngineInput {
  eau_kg, ciment_kg, densite_ciment,
  rapport_GS,             // G/S imposé
  sables:    Material[],  // 1 ou 2 entrées
  gravillons: Material[], // 2 à 4 entrées, triés par Dmax croissant
  dmax_mm, mf_sable_cible?,
}

Material {
  nom, rho_abs,                 // densité absolue (kg/L)
  tamis: { ouverture_mm, passant_pct }[],  // courbe granulo normalisée
  module_finesse?,
}

EngineOutput {
  volumes:  { Ve, Vc, Vgranulats, Vsable, Vgravier, fractions: Record<nom, V_i> },
  masses:   Record<nom, kg>,
  proportions_pct: Record<nom, pct>,
  reference_curve: Point[],   // pour le graphique
  partition_lines: PartitionLine[],
  warnings: string[],
}
```

---

## 3. Étapes détaillées

### Étape 1 — Eau

`step01_water(input) → { Ve_L: input.eau_kg / 1000 }`. Aucune règle, pas de plafond, pas de correction.

### Étape 2 — Ciment

`step02_cement(input) → { Vc_L: input.ciment_kg / input.densite_ciment }`. `densite_ciment` est lue dans la fiche produit (déjà disponible). Si absente → erreur bloquante (pas de fallback 3.1).

### Étape 3 — Bilan volumique

Pour 1 m³ = 1000 L :

```text
Ve   = eau_kg / 1000               (en L)
Vc   = ciment_kg / ρ_ciment        (en L)
Vgr  = 1000 - Ve - Vc              (en L)   // air = 0
```

Contrôle : si `Vgr ≤ 0` → erreur bloquante "Eau+Ciment > 1 m³".
La formule pédagogique `VG = 1000·γ − Vc` est explicitement **interdite** dans le moteur.

### Étape 4 — Split Sable / Gravier

```text
Vsable   = Vgr / (1 + G/S)
Vgravier = Vgr - Vsable
```

Le G/S est lu dans l'input et n'est jamais recalculé.

### Étape 5 — Mélange de sables

- 1 sable → `{ sable1: 100% }`.
- 2 sables → formule du module de finesse existante (réutilisation telle quelle, aucun changement).
- 3+ sables → hors périmètre, signaler un warning et retomber sur la formule 2 sables avec les 2 premiers (à confirmer).

### Étape 6 — Répartition des gravillons (cœur de la refonte)

#### 6.1 Courbe de référence OAB

Identique à l'existant :
- O = (0.080 mm, 0%)
- A = (Dmax/2, pA) avec pA = 50 − √Dmax + K (K = G' + correction MF) — conserver le calcul actuel du Point A.
- B = (Dmax, 100%)
- Deux segments log-linéaires en `(log10(d), %)`.

Exposée comme `referenceCurve(dmax, K) → Segment[]` + `passantRef(d) → %`.

#### 6.2 Normalisation des courbes granulo

Chaque granulat est ramené à une fonction `passant_i(d)` par interpolation **linéaire en log(d)** entre les tamis fournis. Hors bornes : clamp à 0% (sous le plus petit tamis non nul) et 100% (au-dessus du plus grand).

Fonction inverse `dAt_i(p)` par dichotomie (`p ∈ [0, 100]`) sur la courbe interpolée — utilisée pour trouver les points "95%" et "5%".

#### 6.3 Construction de la ligne de partage (règle 95/5)

Pour chaque paire ordonnée `(G_fin, G_suivant)` :

```text
P95 = ( log10( dAt_Gfin(95) ),  passantRef( dAt_Gfin(95) ) )       // point sur OAB à l'abscisse du 95% fin
P05 = ( log10( dAt_Gsuivant(5) ), passantRef( dAt_Gsuivant(5) ) )   // idem pour 5% suivant
```

Important : la lecture se fait **sur la courbe de référence OAB**, conformément à la phrase « on lit alors sur la courbe de référence, au point de croisement avec la droite de partage ». Le segment `[P95, P05]` représente la ligne de partage en repère semi-log `(log10 d, %)`.

#### 6.4 Point d'intersection ↔ OAB

Comme OAB est une polyligne en `(log10 d, %)`, on calcule l'intersection segment/segment entre `[P95, P05]` et chacun des 2 segments d'OAB. On retient l'unique intersection dont l'abscisse est dans `[log10(P95.x_lin), log10(P05.x_lin)]`. L'ordonnée `y_partage` est le **% cumulé de partage** entre les deux gravillons.

Cas dégénérés à signaler en warning (sans bloquer) :
- aucune intersection → fallback : milieu géométrique de `[P95, P05]`, warning "Ligne de partage hors OAB".
- multiples intersections → prendre la plus proche du milieu de la ligne.
- `dAt_i(95)` ou `dAt_i(5)` indéfini (courbe plate) → warning + utiliser respectivement Dmax_i et dmin_i tabulés.

#### 6.5 Déduction des proportions

Pour `n` gravillons triés croissants par Dmax, on obtient `n-1` ordonnées `y_1 < y_2 < ... < y_{n-1}` (à imposer monotones — sinon réordonner et warning). Les proportions **volumiques cumulées sur la part gravier seule** sont :

```text
p_G1 = y_1 - y_sable_top
p_Gk = y_k - y_{k-1}        pour 2 ≤ k ≤ n-1
p_Gn = y_top - y_{n-1}
```

où `y_sable_top` = % cumulé OAB au sommet du dernier sable (lecture analogue 95/5 entre sable composé et G1) et `y_top` = % OAB au Dmax du dernier gravillon (≈ 100).

Renormalisation finale sur 100% de la **part gravier** uniquement (les sables ne sont pas retouchés). Aucune optimisation, aucune itération.

#### 6.6 Couverture

- 2 gravillons → 1 ligne de partage.
- 3 gravillons → 2 lignes (G1↔G2, G2↔G3).
- 4 gravillons → 3 lignes.
- ≥5 → warning "non couvert par la méthode standard".

### Étape 7 — Volumes des fractions

```text
V_sable_i   = Vsable   × p_sable_i   / 100
V_gravier_k = Vgravier × p_Gk         / 100
```

### Étape 8 — Masses

```text
masse_i = V_i × ρ_abs_i      (V en L, ρ en kg/L → kg)
```

Adjuvant : conservé tel quel (% du ciment), hors moteur granulats.

---

## 4. Interpolations nécessaires

| Usage | Type |
|---|---|
| `passant_i(d)` | linéaire en `log10(d)` entre tamis voisins |
| `dAt_i(p)` | dichotomie sur `passant_i` (10 itérations suffisent) |
| OAB | exact (2 segments analytiques) |
| Intersection ligne 95/5 ↔ OAB | algèbre segment/segment 2D |

---

## 5. Cas particuliers à gérer explicitement

1. `Ve + Vc ≥ 1000 L` → erreur bloquante.
2. `ρ_ciment` absent → erreur bloquante (plus de fallback 3.1).
3. Granulat sans tamis à 95% ou 5% atteint → warning + bornes Dmax/dmin.
4. Lignes de partage qui se croisent (`y_k` non monotone) → tri + warning "chevauchement de fractions".
5. Recouvrement total entre deux gravillons (Dmax_fin ≥ Dmax_suivant) → warning "gravillons mal ordonnés" et fusion en un seul.
6. 1 seul gravillon → 100% direct, étape 6 court-circuitée.
7. Sable + gravillon sans fraction intermédiaire 5/6.3 mm (gap granulaire) → warning informatif.

---

## 6. Contrôles de cohérence (post-calcul)

- Σ masses + eau + ciment ≈ ρ_théorique × 1000 (tolérance ±2%).
- Σ proportions sables = 100 ± 0.5.
- Σ proportions gravillons = 100 ± 0.5.
- Chaque V_i > 0.
- G/S réel = Vgravier/Vsable conforme à l'input (±0.01).

Tout écart > tolérance → warning, jamais une correction silencieuse.

---

## 7. Diagnostics retournés (pour l'UI)

- `reference_curve` : points pour Recharts.
- `partition_lines` : `[{ from: P95, to: P05, y_partage }]` pour overlay graphique.
- `warnings[]` : messages humains à afficher dans le wizard.
- Suppression définitive des indicateurs liés au solveur : `rmse`, `convergence`, `iterations`, `pointA_offset_solver`, etc.

---

## 8. Tests unitaires à prévoir

Sous `src/pages/essais/formulation/engine/__tests__/` :

1. `volumes.test.ts` — Ve, Vc, Vgr pour cas standards et cas limite (Ve+Vc > 1m³).
2. `sandGravelSplit.test.ts` — G/S = 1.5, 2.0, 2.5.
3. `referenceCurve.test.ts` — Point A, passage par O, A, B pour Dmax = 12.5 / 20 / 25 / 40.
4. `granuloCurve.test.ts` — interpolation log + `dAt(95)` / `dAt(5)` sur fractions types 3/8, 8/15, 15/25.
5. `partitionLine.test.ts` — intersection ligne/OAB sur cas analytique vérifié à la main.
6. `splitGravels.test.ts` :
   - 2 gravillons standards 3/8 + 8/15 → vérifier % attendu vs exemple du livre.
   - 3 gravillons 3/8 + 8/15 + 15/25 → 2 partitions, monotonie.
   - 4 gravillons → 3 partitions.
   - Cas dégénéré "courbes plates" → warning + fallback.
7. `masses.test.ts` — bilan massique.
8. `coherence.test.ts` — déclenchement des warnings.
9. Snapshot d'un cas complet de bout en bout vs résultat de référence (exemple du livre Dreux-Gorisse).

---

## 9. Ambiguïtés à lever AVANT implémentation

À confirmer par le métier avant de coder :

1. **Sommet du sable composé pour la première ligne de partage (sable ↔ G1)** : la règle 95/5 s'applique-t-elle entre la courbe du sable composé et celle de G1 exactement comme entre deux gravillons ? Le document cité ne le précise pas explicitement dans l'extrait fourni.
2. **Choix entre les courbes des composants vs courbe du mélange** : pour la ligne G_k ↔ G_{k+1}, lit-on `dAt(95)` sur la courbe brute de `G_k` ou sur la courbe du mélange déjà composé jusqu'à `G_k` ? L'extrait fourni suppose la **courbe brute** ; à confirmer.
3. **Lecture sur OAB vs sur la courbe enveloppe** : confirmation que la lecture du % se fait bien sur OAB (cf. phrase citée) et non sur la courbe réelle du mélange.
4. **Plus de 4 gravillons** : comportement attendu (refus ? extension naturelle ?).
5. **3 sables ou plus** : aucune méthode dans le document — confirmer le fallback proposé (2 sables MF + warning).

Une fois ces 5 points tranchés, l'implémentation pourra démarrer en suivant strictement cette spécification.
