
# Spécification — Module de répartition des gravillons (méthode graphique Dreux-Gorisse)

> Version révisée. Spécification uniquement, aucun code.
> Seul le module de **répartition des gravillons** est refondu. Le reste du moteur (eau, ciment, bilan volumique Vgranulats = 1 − Ve − Vc, G/S imposé, mélange de sables par module de finesse) est conservé tel quel.

---

## 0. Décisions verrouillées

1. **Interprétation A définitivement retenue.** Application séquentielle de la règle 95/5 sur chaque paire de gravillons voisins `(G_k, G_{k+1})`, en utilisant uniquement les **courbes brutes** de chaque fraction. L'interprétation B est abandonnée : il est **interdit** de construire ou d'utiliser une courbe granulométrique d'un mélange déjà calculé (G1+G2) pour déterminer la fraction suivante (G3, G4). Cela introduirait une dépendance circulaire étrangère à la méthode Dreux-Gorisse.
2. **Méthode strictement graphique et déterministe.** Aucun solveur, aucune optimisation, aucun gradient, aucune moindre carré.
3. **Aucun fallback inventé.** Toute incohérence géométrique produit une erreur métier explicite.
4. **Aucune renormalisation artificielle** (cf. §6).

---

## 1. Architecture du module

```text
src/pages/essais/formulation/engine/gravelSplit/
├── index.ts                # API publique : splitGravels(input) → output
├── types.ts                # Types I/O et erreurs métier
├── referenceCurve.ts       # Courbe OAB (réutilise le calcul du Point A existant)
├── granuloCurve.ts         # Interpolation log-linéaire, inverse dAt(p)
├── partitionLine.ts        # Ligne de partage 95/5 + intersection avec OAB
└── pairwiseSplit.ts        # Application séquentielle aux n-1 paires
```

`dreuxGorisseCalculation.ts` n'est modifié qu'en un seul endroit : l'appel au solveur de gravillons est remplacé par `splitGravels(...)`. Après recette, l'ancien solveur (`solveSimplexLeastSquares`, `SIEVE_WEIGHTS`, gradient projeté) est supprimé.

---

## 2. Fonctions

| Fichier | Fonction | Rôle |
|---|---|---|
| `referenceCurve.ts` | `buildReferenceCurve(dmax, K)` | Polyligne OAB en `(log10 d, %)` |
| `referenceCurve.ts` | `passantRef(d, curve)` | % cumulé OAB à un tamis donné (informatif uniquement) |
| `granuloCurve.ts` | `normalizeCurve(tamis[])` | Tri + validation d'une courbe granulo |
| `granuloCurve.ts` | `passantAt(d, curve)` | Interpolation linéaire en `log10(d)` |
| `granuloCurve.ts` | `dAt(p, curve)` | Inverse par dichotomie |
| `partitionLine.ts` | `buildPartitionLine(gFin, gSuivant)` | Renvoie `{P95, P05}` en coordonnées `(log10 d, %)` |
| `partitionLine.ts` | `intersectWithReference(line, refCurve)` | Intersection segment/polyligne ; **erreur si vide** |
| `pairwiseSplit.ts` | `computeCutoffs(gravillons[], refCurve)` | Renvoie `[y_1, …, y_{n-1}]` strictement croissantes |
| `pairwiseSplit.ts` | `cutoffsToProportions(cutoffs)` | Transforme les ordonnées en proportions par différences successives |
| `index.ts` | `splitGravels(input)` | Orchestration + contrôles métier |

Aucune autre fonction.

---

## 3. Entrées / Sorties

```text
SplitGravelsInput {
  dmax_mm:    number,
  K:          number,
  gravillons: GravillonInput[],   // 2 à 4 entrées, triées par Dmax croissant
}

GravillonInput {
  nom:       string,
  dmax_mm:   number,
  tamis:     { ouverture_mm: number, passant_pct: number }[],
}

SplitGravelsOutput {
  proportions:     { nom: string, pct: number }[],
  cutoffs:         { y_pct: number, x_log10d: number }[],
  partition_lines: { from: Point, to: Point }[],
  reference_curve: Point[],
  warnings:        string[],
}
```

Toute violation des pré-conditions ou des contrôles (§6) lève une **erreur métier typée**, jamais une correction silencieuse.

---

## 4. Construction de la ligne de partage (CORRIGÉ)

Conformément au document de référence :

> « On trace une ligne de partage joignant le point correspondant à **95 %** des granulats fins au point correspondant à **5 %** des gros granulats. »

La ligne de partage est donc construite **dans le repère semi-log de la courbe de référence**, en reliant deux points dont :
- l'abscisse est lue sur la **courbe brute** de chaque gravillon (`dAt(95)` du fin, `dAt(5)` du suivant) ;
- l'**ordonnée est la valeur littérale 95 % et 5 %**, pas un passant OAB recalculé.

```text
d95  = dAt(95, G_fin)             // sur la courbe brute du fin
d05  = dAt( 5, G_suivant)         // sur la courbe brute du suivant
P95  = ( log10(d95), 95 )
P05  = ( log10(d05),  5 )
```

L'ordonnée du point d'intersection de `[P95, P05]` avec la polyligne **OAB** donne le **pourcentage cumulé en volume absolu** du cumul des fractions jusqu'à `G_fin` inclus.

Cette correction supprime l'erreur de la version précédente qui projetait `P95` et `P05` sur OAB.

---

## 5. Calculs géométriques

### 5.1 Repère
Tous les calculs s'effectuent dans `(X = log10(d_mm), Y = passant_%)`.

### 5.2 Courbe OAB (inchangé)
- O = (log10(0.080), 0)
- A = (log10(Dmax/2), pA), avec `pA = 50 − √Dmax + K`
- B = (log10(Dmax), 100)

### 5.3 Intersection ligne ↔ OAB
Résolution paramétrique segment/segment (Cramer) sur chacun des 2 segments OAB. On retient l'unique point dont les paramètres `t, u ∈ [0,1]`. Si aucun point valide n'est trouvé → **erreur métier bloquante** (cf. §6 et §7).

### 5.4 Ordonnées de partage → proportions
Pour `n` gravillons triés par Dmax croissant, on obtient `n−1` ordonnées `y_1 < y_2 < … < y_{n-1}` strictement croissantes, complétées par `y_0 = 0` et `y_n = 100` :

```text
G_1 = y_1
G_k = y_k − y_{k-1}    pour k = 2 .. n-1
G_n = 100 − y_{n-1}
```

Ces proportions sont exprimées en **% de la part gravier** du mélange.

---

## 6. Renormalisation (SUPPRIMÉE)

Démonstration de la conservation exacte :

```text
Σ G_k = y_1 + (y_2 − y_1) + (y_3 − y_2) + … + (y_{n-1} − y_{n-2}) + (100 − y_{n-1})
      = 100
```

La construction par différences successives garantit mathématiquement `Σ G_k = 100 %`. **Aucune renormalisation n'est appliquée.** Si une somme s'écarte de 100 % (même de 0.001 %), c'est nécessairement le signe d'une erreur en amont (ordonnées non monotones, intersection manquée, bug d'interpolation) → erreur métier, pas correction.

---

## 7. Fallback (SUPPRIMÉ)

L'ancien fallback « milieu géométrique de `[P95, P05]` » est **supprimé**. Il n'est documenté nulle part dans la méthode Dreux-Gorisse.

Si une ligne de partage ne coupe pas OAB, le moteur lève une erreur métier explicite, par exemple :

```text
ERREUR — Ligne de partage non sécante avec la courbe de référence OAB.
Paire : G_fin = "<nom>"  →  G_suivant = "<nom>"
Cause probable :
  • Courbes granulométriques incompatibles avec la courbe de référence (Dmax/K).
  • Fractions mal classées par Dmax croissant.
  • Données granulométriques incohérentes (passants non monotones, tamis manquants).
Aucune valeur n'est inventée. Corrigez les données d'entrée puis relancez le calcul.
```

---

## 8. Généralisation à 3 et 4 gravillons

**Statut documentaire** : l'extrait du document de référence n'illustre la règle 95/5 que pour **1 sable + 2 gravillons** (une seule ligne de partage). La généralisation à 3 et 4 gravillons est donc une **extension logique de la règle graphique**, **non démontrée explicitement** par le document, mais cohérente avec son esprit :
- la règle 95/5 est une règle **locale** entre deux courbes brutes adjacentes ;
- son application à chaque paire `(G_k, G_{k+1})` n'introduit aucune hypothèse supplémentaire ;
- aucune courbe de mélange intermédiaire n'est utilisée (interprétation B explicitement rejetée).

Cette distinction doit apparaître clairement dans la JSDoc du module et dans le rapport généré (mention « extension logique » pour n ≥ 3).

Plafond : 4 gravillons. Au-delà → erreur bloquante « non couvert par la méthode Dreux-Gorisse ».

---

## 9. Contrôles de cohérence

Effectués dans `splitGravels(...)`, **sans correction silencieuse**. Chaque échec produit un message métier détaillé.

| # | Contrôle | Sévérité |
|---|---|---|
| 1 | `gravillons.length ∈ [2, 4]` | Erreur |
| 2 | Dmax strictement croissants | Erreur |
| 3 | Chaque courbe contient au moins 3 points et passants monotones décroissants en `log10 d` | Erreur |
| 4 | `dAt(95)` et `dAt(5)` existent dans les bornes des tamis fournis | Erreur |
| 5 | **Chaque ligne de partage coupe effectivement OAB** | Erreur (§7) |
| 6 | **Ordonnées de partage `y_1 < y_2 < … < y_{n-1}` strictement croissantes** | Erreur |
| 7 | **Chaque proportion `G_k > 0`** strictement | Erreur |
| 8 | **Σ G_k = 100 % exactement** (à la précision machine, tolérance 1e-6) | Erreur si violé — diagnostic interne |
| 9 | `d95(G_fin) < d05(G_suivant)` recommandé | Warning (chevauchement granulaire) |

Tout message d'erreur cite : la paire concernée, les valeurs lues (`d95`, `d05`, `y_k`), et la cause probable.

---

## 10. Cas particuliers

| Cas | Comportement |
|---|---|
| 1 seul gravillon | Court-circuit : `{ G1: 100 % }`. Pas de ligne de partage. |
| 2 gravillons | 1 ligne de partage, cas standard documenté. |
| 3 gravillons | 2 lignes successives `(G1,G2)` puis `(G2,G3)`, extension logique (§8). |
| 4 gravillons | 3 lignes successives, extension logique (§8). |
| ≥ 5 gravillons | Erreur bloquante. |
| Sable composé | Sa proportion globale reste imposée par G/S ; le module gravillons n'y touche pas. |

---

## 11. Tests unitaires

Sous `src/pages/essais/formulation/engine/gravelSplit/__tests__/` :

1. `referenceCurve.test.ts` — passage par O, A, B pour Dmax ∈ {12.5, 20, 25, 40}.
2. `granuloCurve.test.ts` — interpolation log-linéaire, `dAt(95)` et `dAt(5)`, clamps hors bornes (erreur, pas extrapolation).
3. `partitionLine.test.ts` :
   - `{P95, P05}` avec ordonnées **littérales 95 et 5** (régression du bug corrigé en §4) ;
   - intersection segment/segment sur les 2 segments OAB ;
   - cas « aucune intersection » → erreur métier (vérifier le message).
4. `pairwiseSplit.test.ts` :
   - **2 gravillons** — reproduction numérique de l'exemple du document, tolérance ±1 % ;
   - **3 gravillons** — monotonie stricte des `y_k`, somme = 100 % sans normalisation ;
   - **4 gravillons** — monotonie stricte des `y_k`, somme = 100 % sans normalisation ;
   - cas dégénéré (courbes plates, fractions inversées) → erreur typée.
5. `index.test.ts` — orchestration complète + tous les contrôles du §9.
6. Snapshot end-to-end sur l'exemple du document de référence.

---

## 12. Synthèse des changements vs version précédente

| Point | Avant | Après |
|---|---|---|
| Interprétation 3-4 gravillons | A ou B à trancher | **A verrouillée, B interdite** |
| Coordonnées `P95` / `P05` | Ordonnées projetées sur OAB | **Ordonnées littérales 95 et 5** |
| Renormalisation finale | Prévue | **Supprimée** (somme = 100 % par construction) |
| Fallback « milieu géométrique » | Prévu | **Supprimé**, erreur métier explicite |
| Statut 3-4 gravillons | Ambigu | Documenté comme **extension logique** non démontrée |
| Contrôles | Warnings | **Erreurs métier détaillées** pour les violations critiques |

