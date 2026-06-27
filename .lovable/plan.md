
# Spécification — Module de répartition des gravillons (méthode graphique Dreux-Gorisse)

> Spécification uniquement. Aucun code ne sera écrit tant qu'elle n'est pas validée.
> Seul le module de **répartition des gravillons** est refondu. Tout le reste du moteur actuel (eau, ciment, bilan volumique, G/S imposé, mélange de sables au module de finesse) est conservé tel quel.

---

## 1. Architecture du nouveau module

Nouveau dossier isolé, sans dépendance au solveur actuel :

```text
src/pages/essais/formulation/engine/gravelSplit/
├── index.ts                # API publique : splitGravels(input) → output
├── types.ts                # Types I/O
├── referenceCurve.ts       # Courbe OAB (réutilise le calcul du Point A existant)
├── granuloCurve.ts         # Interpolation log-linéaire d'une courbe granulo, inverse dAt(p)
├── partitionLine.ts        # Construction d'une ligne 95/5 et intersection avec OAB
└── pairwiseSplit.ts        # Application séquentielle aux n-1 paires de gravillons
```

Le fichier `dreuxGorisseCalculation.ts` actuel n'est touché que sur **un seul endroit** : l'appel au solveur de gravillons est remplacé par un appel à `splitGravels(...)`. Tout le reste (volumes, sables, masses, contrôles) reste inchangé.

Le code du solveur (`solveSimplexLeastSquares`, `SIEVE_WEIGHTS`, gradient projeté) sera supprimé à la fin de l'implémentation, après recette.

---

## 2. Fonctions à créer

| Fichier | Fonction | Rôle |
|---|---|---|
| `referenceCurve.ts` | `buildReferenceCurve(dmax, K)` | Renvoie les 2 segments OAB en `(log10 d, %)` |
| `referenceCurve.ts` | `passantRef(d, curve)` | % cumulé OAB à un tamis donné |
| `granuloCurve.ts` | `normalizeCurve(tamis[])` | Trie + valide la courbe granulo d'un gravillon |
| `granuloCurve.ts` | `passantAt(d, curve)` | Interpolation linéaire en `log10(d)` |
| `granuloCurve.ts` | `dAt(p, curve)` | Inverse par dichotomie sur `passantAt` |
| `partitionLine.ts` | `buildPartitionLine(gFin, gSuivant)` | Renvoie `{P95, P05}` en coordonnées semi-log |
| `partitionLine.ts` | `intersectWithReference(line, refCurve)` | Calcule l'intersection segment/polyligne ; renvoie `{x_log, y_pct}` |
| `pairwiseSplit.ts` | `computeCutoffs(gravillons[], refCurve)` | Renvoie `[y_1, …, y_{n-1}]` (ordonnées de partage cumulées) |
| `pairwiseSplit.ts` | `cutoffsToProportions(cutoffs, n)` | Transforme les ordonnées en proportions volumiques par fraction |
| `index.ts` | `splitGravels(input)` | Orchestration + contrôles |

Aucune autre fonction. Pas de boucle d'optimisation, pas de minimisation, pas de gradient.

---

## 3. Entrées

```text
SplitGravelsInput {
  dmax_mm:    number,                     // Dmax global du mélange
  K:          number,                     // correction Dreux (G' + MF) pour le Point A
  gravillons: GravillonInput[],           // 2 à 4 entrées, triées par Dmax croissant
}

GravillonInput {
  nom:       string,
  dmax_mm:   number,                      // Dmax propre de la fraction (pour validations)
  tamis:     { ouverture_mm: number, passant_pct: number }[],   // courbe granulo brute
}
```

Pré-conditions vérifiées en entrée :
- `gravillons.length ∈ [2, 4]` (sinon erreur explicite, cf. §8).
- Chaque courbe contient au moins 3 points de tamis.
- Les Dmax sont strictement croissants.

---

## 4. Sorties

```text
SplitGravelsOutput {
  proportions: { nom: string, pct: number }[],     // somme = 100 sur la part gravier
  cutoffs:     { y_pct: number, x_log10d: number }[],  // n-1 intersections OAB
  partition_lines: { from: Point, to: Point }[],   // pour l'overlay graphique
  reference_curve: Point[],                        // OAB échantillonnée pour Recharts
  warnings:    string[],                           // non bloquants
}
```

Les pourcentages sont exprimés **en volume absolu**, à appliquer ensuite au `Vgravier` calculé par la partie conservée du moteur.

---

## 5. Calculs géométriques

### 5.1 Repère

Tous les calculs s'effectuent dans le plan `(X = log10(d_mm), Y = passant_%)`.
La courbe OAB est une polyligne à 2 segments analytiques :
- Segment 1 : O = (log10(0.080), 0) → A = (log10(Dmax/2), pA)
- Segment 2 : A → B = (log10(Dmax), 100)
- `pA = 50 − √Dmax + K` (calcul actuel conservé).

### 5.2 Ligne de partage entre deux gravillons voisins (G_fin, G_suivant)

```text
d95  = dAt(95, G_fin)            // ouverture où la courbe brute du fin passe à 95 %
d05  = dAt( 5, G_suivant)        // ouverture où la courbe brute du suivant passe à 5 %
P95  = ( log10(d95),  passantRef(d95)  )    // point sur OAB à l'abscisse d95
P05  = ( log10(d05),  passantRef(d05)  )    // point sur OAB à l'abscisse d05
```

La ligne de partage est le segment `[P95, P05]`. Conformément au document :
- abscisses `d95` et `d05` lues sur les **courbes brutes** des gravillons,
- ordonnées de `P95` et `P05` lues sur la **courbe de référence OAB**.

### 5.3 Intersection ligne ↔ OAB

OAB n'a que 2 segments → on teste l'intersection paramétrique segment/segment pour chacun. On retient l'unique point dont le paramètre `t ∈ [0,1]` sur la ligne de partage **et** sur le segment OAB.

L'ordonnée `y_partage` (% cumulé sur OAB) est le pourcentage en volume absolu **du cumul des fractions jusqu'à G_fin inclus**.

### 5.4 De `n−1` ordonnées de partage aux proportions

Pour `n` gravillons (n = 2, 3 ou 4) triés croissant par Dmax :

```text
y_0     = y_sable_top   // ordonnée OAB au sommet du sable composé (cf. §8)
y_1…y_{n-1} = ordonnées des n-1 lignes de partage
y_n     = 100           // sommet OAB en B = Dmax

p_Gk = y_k − y_{k-1}     pour k = 1..n           (en % du mélange total)
```

Renormalisation finale sur la **part gravier seule** (les sables ne sont pas touchés) :

```text
p_Gk_gravier = p_Gk / Σ p_Gk × 100
```

Aucun ajustement itératif, aucune optimisation.

---

## 6. Interpolations nécessaires

| Usage | Méthode | Précision |
|---|---|---|
| `passantAt(d)` sur courbe granulo brute | Linéaire en `log10(d)` entre tamis adjacents | exacte entre points |
| `dAt(p)` (inverse) | Dichotomie sur `passantAt`, 30 itérations max | 1e-4 mm |
| OAB | 2 segments analytiques en `(log10 d, %)` | exacte |
| Intersection segment/segment | Résolution 2×2 (Cramer) | exacte |

Hors bornes :
- sous le plus petit tamis → 0 %
- au-dessus du plus grand tamis → 100 %

---

## 7. Contrôles de cohérence

Effectués **après** calcul des proportions, sans rien corriger silencieusement :

1. `gravillons` triés par Dmax strictement croissant.
2. `y_1 < y_2 < … < y_{n-1}` (monotone). Si violation → warning "lignes de partage croisées".
3. Chaque `p_Gk > 0`. Sinon warning "fraction nulle, vérifier les courbes".
4. `Σ p_Gk_gravier = 100 ± 0.5`.
5. `y_partage ∈ (y_{k-1}, 100)` pour chaque ligne.
6. Pour chaque paire, `d95(G_fin) < d05(G_suivant)` recommandé (chevauchement granulaire normal sinon mal classement).

Tout échec déclenche un warning lisible dans la sortie, jamais une correction automatique.

---

## 8. Cas particuliers

| Cas | Comportement |
|---|---|
| 1 seul gravillon | Court-circuit : `{ G1: 100% }`. |
| 2 gravillons | 1 ligne de partage, cas standard du document. |
| 3 gravillons | 2 lignes appliquées séquentiellement aux paires (G1↔G2) puis (G2↔G3). **Non explicitement documenté** dans l'extrait — cf. §10. |
| 4 gravillons | 3 lignes (G1↔G2, G2↔G3, G3↔G4). **Non explicitement documenté** — cf. §10. |
| ≥5 gravillons | Erreur bloquante "non couvert par la méthode Dreux-Gorisse". |
| `d95(G_fin)` ≥ `d05(G_suivant)` (chevauchement total) | Warning "gravillons mal classés / chevauchement", calcul poursuivi. |
| Courbe quasi-plate empêchant `dAt(95)` ou `dAt(5)` | Warning + utilisation des bornes Dmax/dmin de la fraction. |
| Aucune intersection ligne/OAB | Warning + fallback : milieu géométrique de `[P95, P05]`. |
| Sable composé déterminé par MF (étape 5 conservée) | Sa proportion globale est imposée par G/S, donc `y_0` est **uniquement** utilisée si l'on a besoin du % cumulé OAB au sommet du sable pour le graphique (informatif). Elle ne corrige pas les sables. |

---

## 9. Tests unitaires à prévoir

Sous `src/pages/essais/formulation/engine/gravelSplit/__tests__/` :

1. `referenceCurve.test.ts` — passage par O, A, B pour Dmax = 12.5, 20, 25, 40.
2. `granuloCurve.test.ts` :
   - interpolation linéaire en log sur 3/8, 8/15, 15/25 ;
   - `dAt(95)` et `dAt(5)` retournent une valeur cohérente avec les tamis fournis ;
   - clamps hors bornes.
3. `partitionLine.test.ts` :
   - construction `{P95, P05}` sur un cas analytique vérifié à la main ;
   - intersection segment/segment avec OAB pour les 2 segments ;
   - cas "aucune intersection" → fallback.
4. `pairwiseSplit.test.ts` :
   - **2 gravillons** — reproduction numérique de l'exemple du document Dreux-Gorisse (1 sable + 2 gravillons). Tolérance ±1 %.
   - **3 gravillons** — vérification que les 2 ordonnées sont monotones et que la somme = 100 %.
   - **4 gravillons** — vérification que les 3 ordonnées sont monotones.
   - cas dégénéré "courbes plates" → warning + fallback.
5. `index.test.ts` — orchestration complète + contrôles de cohérence, vérification de la structure `SplitGravelsOutput`.
6. Snapshot d'un cas complet de bout en bout sur l'exemple du document.

---

## 10. Généralisation à 3 et 4 gravillons — point à valider

**Honnêteté métier requise** : l'extrait du document fourni n'illustre la méthode que pour **1 sable + 2 gravillons** (une seule ligne de partage). La généralisation à 3 ou 4 gravillons n'est **pas démontrée** par le texte cité.

Deux interprétations possibles, à trancher par le métier avant implémentation :

**Interprétation A — extension naturelle par paires successives (proposition retenue dans cette spec)**
- Pour chaque paire `(G_k, G_{k+1})`, on construit une ligne 95/5 entre les **courbes brutes** de `G_k` et `G_{k+1}`.
- Les n-1 lignes produisent n-1 ordonnées de partage `y_k` sur OAB.
- Les proportions sont les différences `y_k − y_{k-1}`.
- Avantage : symétrique, déterministe, conforme à la lettre de la règle 95/5 appliquée localement à chaque paire.
- Limite : non explicitement écrit dans l'extrait fourni.

**Interprétation B — ligne 95/5 entre le mélange déjà composé et le gravillon suivant**
- Pour `G_3`, on lit `dAt(95)` sur la **courbe du mélange (G_1 + G_2)** déjà calculée avec les proportions précédentes, puis `dAt(5)` sur `G_3`.
- Avantage : plus proche d'un raisonnement séquentiel.
- Inconvénient : introduit une dépendance d'ordre, et la "courbe du mélange" elle-même n'est pas définie graphiquement dans le texte cité.

**Action requise avant codage** : valider explicitement **A** ou **B** (ou produire un autre extrait du livre décrivant la procédure pour ≥ 3 gravillons). Tant que cette ambiguïté n'est pas levée :
- l'implémentation se limitera à **2 gravillons** ;
- 3 et 4 gravillons renverront une **erreur bloquante** "généralisation non validée par le métier", plutôt qu'une règle inventée.

Aucune autre interprétation ne sera implémentée sans documentation supplémentaire.
