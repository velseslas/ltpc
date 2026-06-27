# Note technique — Validation mathématique de la méthode graphique 95/5 (Dreux-Gorisse)

> Document de validation pré-production. Aucune intégration dans le moteur principal
> ne sera effectuée avant levée explicite des ambiguïtés signalées en §6.
>
> Référence : Dreux G., Festa J., *Nouveau guide du béton et de ses constituants*,
> 8ᵉ éd., Eyrolles, 1998 — chapitre « Méthode pratique de composition des bétons ».

---

## 1. Repère de travail

Toute la construction se fait dans le repère **semi-logarithmique** standard
des courbes granulométriques :

```text
X = log10( d_mm )      Y = passant cumulé (%)
```

C'est le repère explicitement utilisé par le document de référence (planche
Dreux-Gorisse, axe des abscisses gradué en modules AFNOR / ouvertures
tamis en échelle logarithmique).

---

## 2. Courbe de référence OAB

Définie par le document :

| Point | Abscisse (mm) | Ordonnée (%) |
|---|---|---|
| O | 0,080 | 0 |
| A | Dmax / 2 | pA = 50 − √Dmax + K |
| B | Dmax | 100 |

Polyligne OA puis AB. Implémentation conforme : `referenceCurve.ts`,
`buildReferenceCurve(dmax, K)`.

**Conformité** : strictement identique au texte du document. Pas d'ambiguïté.

---

## 3. Ligne de partage 95/5 — point central de la validation

### 3.1 Texte exact du document

> « On trace une ligne de partage joignant le point correspondant à **95 %**
> des granulats fins au point correspondant à **5 %** des gros granulats. »

### 3.2 Lecture géométrique retenue

Deux points sont nécessaires. Pour chacun, le document fournit :

- l'**identité de la courbe** sur laquelle on lit l'abscisse (la courbe brute
  du granulat fin pour le premier point, la courbe brute du granulat suivant
  pour le second) ;
- la **valeur du passant** (95 % pour le premier, 5 % pour le second).

D'où les coordonnées **littérales** :

```text
P95 = ( log10( d95 ),  95 )       avec  d95 = ouverture telle que passant(G_fin)     = 95 %
P05 = ( log10( d05 ),   5 )       avec  d05 = ouverture telle que passant(G_suivant) = 5 %
```

**`d95` et `d05` se lisent sur les courbes BRUTES des deux fractions
voisines**, par interpolation log-linéaire (`granuloCurve.dAt`).

### 3.3 Démonstration que ces coordonnées correspondent au texte

| Élément du texte | Traduction mathématique | Vérification |
|---|---|---|
| « point correspondant à 95 % » | ordonnée Y = **95** | Valeur littérale, pas un passant projeté |
| « des granulats fins » | abscisse lue sur la courbe **brute** du fin | `d95 = dAt(95, G_fin)` |
| « point correspondant à 5 % » | ordonnée Y = **5** | Valeur littérale |
| « des gros granulats » | abscisse lue sur la courbe **brute** du suivant | `d05 = dAt(5, G_suivant)` |

Les ordonnées **ne sont jamais recalculées** comme un passant OAB. Toute
projection sur OAB serait une réinterprétation hors-document.

Implémentation conforme : `partitionLine.ts → buildPartitionLine`.

---

## 4. Intersection de la ligne de partage avec OAB

### 4.1 Texte du document

> « L'ordonnée du point d'intersection de cette ligne de partage avec la
> courbe granulaire de référence donne le pourcentage en volume absolu de
> sable (ou du cumul des fractions situées au-dessous). »

### 4.2 Justification mathématique

OAB est une **polyligne à deux segments** :

```text
Segment 1 : O → A
Segment 2 : A → B
```

La ligne de partage `[P95, P05]` est un segment unique. L'intersection se
résout segment/segment par la méthode paramétrique (Cramer) :

```text
P(t) = P95 + t · (P05 − P95)
Q(u) = S0  + u · (S1  − S0 )       S0,S1 = extrémités d'un segment OAB
P(t) = Q(u)    ⇒    système 2×2    ⇒    (t, u)
On retient la solution telle que   t ∈ [0,1]   ET   u ∈ [0,1].
```

Le couple `(t, u)` valide garantit que le point est :

- sur **le segment** ligne de partage (pas son prolongement) ;
- sur **la polyligne** OAB (pas son prolongement).

Implémentation conforme : `partitionLine.ts → intersectSegments`,
`intersectWithReference`.

### 4.3 Unicité

Géométriquement, une droite peut couper la polyligne OAB en 0, 1 ou 2 points.

- **1 intersection** : cas standard documenté.
- **0 intersection** : configuration géométriquement impossible si les
  données respectent les hypothèses Dreux-Gorisse. Le code lève une
  erreur métier (`PARTITION_NO_INTERSECTION`). **Aucune valeur n'est
  inventée**.
- **2 intersections** : cas dégénéré (ligne de partage quasi tangente au
  point A). Le code retient le point le plus proche de A, comportement
  déterministe documenté. Voir **§6 — ambiguïtés**.

---

## 5. Démonstration : différences d'ordonnées ⇒ proportions

### 5.1 Énoncé

Pour `n` gravillons triés par Dmax croissant, on obtient `n−1` ordonnées
de partage :

```text
y_1 < y_2 < … < y_{n-1}        (strictement croissantes par construction)
```

On pose `y_0 = 0` et `y_n = 100`. Les proportions sont :

```text
G_k = y_k − y_{k-1}      pour k = 1 … n
```

### 5.2 Démonstration de Σ G_k = 100 %

Somme télescopique :

```text
Σ G_k = (y_1 − y_0) + (y_2 − y_1) + (y_3 − y_2) + … + (y_n − y_{n-1})
      =  y_n − y_0
      =  100 − 0
      =  100                            CQFD
```

**Conséquence** : la somme à 100 % est garantie **par construction
mathématique**, sans renormalisation. Tout écart > 1e-6 signale un bug
amont, jamais une dérive à corriger silencieusement.

### 5.3 Interprétation métier

`y_k` représente, conformément au §4.1 du texte cité, le **pourcentage en
volume absolu du cumul des fractions situées au-dessous** du tamis de
partage. Donc :

```text
y_k − y_{k-1}  =  cumul jusqu'à G_k  −  cumul jusqu'à G_{k-1}
              =  part isolée de G_k dans le mélange granulats
```

Ce qui est exactement la définition d'une proportion fractionnaire.

Implémentation conforme : `pairwiseSplit.ts → cutoffsToProportions`.

---

## 6. Ambiguïtés du document — à lever avant production

Les points suivants ne sont **pas explicitement tranchés** par le document
de référence. Ils relèvent d'une extension logique cohérente avec la
méthode, mais doivent être validés explicitement par le métier avant mise
en production :

### 6.1 Généralisation à 3-4 gravillons (extension logique)

Le document n'illustre la règle 95/5 que pour **1 sable + 2 gravillons**
(une seule ligne de partage). L'application séquentielle aux paires
`(G_k, G_{k+1})` pour `n ≥ 3` est une extension logique :

- avantage : règle locale, pas de courbe intermédiaire inventée ;
- limite : non démontrée explicitement par le document.

**Action requise** : validation métier formelle pour `n = 3` et `n = 4`,
ou bornage de la méthode à `n = 2`.

### 6.2 Cas de la double intersection (ligne ↔ OAB au voisinage de A)

Comportement actuel : on retient le point le plus proche de A. Le
document ne traite pas ce cas dégénéré.

**Action requise** : confirmer que ce comportement déterministe est
acceptable, ou décider d'une erreur bloquante.

### 6.3 Lecture de `d95` / `d05` hors bornes des tamis fournis

Si la courbe brute d'un gravillon ne contient pas explicitement de point
à 95 % ou 5 %, le code interpole en log10. Si la valeur recherchée est
hors bornes des tamis fournis, le code lève une erreur (pas
d'extrapolation).

**Action requise** : confirmer cette politique stricte (vs. tolérance
sur le tamis le plus proche).

### 6.4 Sable composé

Le module gravillons ne traite pas la composition des sables (gérée
amont par le module de finesse Mf). Configuration confirmée comme
hors-périmètre dans la spec — rappelé ici pour traçabilité.

---

## 7. Plan de validation numérique

### 7.1 Reproduction de l'exemple du document

**Bloqué** : le slot `DOCUMENT_EXAMPLE` (`documentExampleValidation.ts`)
attend les valeurs numériques précises du livre :

- granulométries brutes du sable + 2 gravillons de l'exemple ;
- Dmax, K, pA attendu ;
- proportions attendues ± tolérance (le document indique ±1 %).

**Action requise** : transmission du tableau de l'exemple.

### 7.2 Tests de propriétés mathématiques

À exécuter dès activation de vitest (`__tests__/`) :

- somme = 100 % exactement (machine epsilon) sur 1000 cas aléatoires ;
- monotonie stricte des `y_k` ;
- cohérence `dAt(passantAt(d)) = d` à 1e-9 près ;
- intersection OAB stable sous perturbation ±0,5 % du passant ;
- erreur métier déclenchée sur tous les cas dégénérés énumérés en §6.

### 7.3 Recette sur formulations réelles

Via `compareEngines.ts` : exécution parallèle moteur historique / moteur
graphique sur les formulations du laboratoire, log des écarts par
fraction. Seuils d'alerte à fixer avec le métier.

---

## 8. Décision attendue

Cette note ne déclenche **aucune intégration**. Elle requiert :

1. validation des points §6.1, §6.2, §6.3 par le métier ;
2. transmission du tableau de l'exemple du livre (§7.1) ;
3. accord sur les seuils de recette (§7.3).

Tant que ces trois conditions ne sont pas remplies, le moteur historique
(`solveSimplexLeastSquares`) reste **seul actif** en production.
