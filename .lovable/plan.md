# Plan: Bouton "Dupliquer" sur tous les rapports

## Objectif
Ajouter un bouton "Dupliquer" (icône Copy) à côté des boutons Partager / Télécharger / Imprimer dans chaque rapport. Au clic, ouvrir un modal contenant le formulaire d'enregistrement pré-rempli avec les données d'identification du rapport courant (sauf N° échantillon, qui est auto-généré). À la soumission, créer un nouvel échantillon, copier l'intégralité du champ `resultats` (mesures, charges, Rc, densités, etc.) et rediriger automatiquement vers le nouveau rapport.

## Architecture proposée

### 1. Hook partagé `useDuplicateEssai`
Fichier : `src/hooks/useDuplicateEssai.ts`

Signature :
```ts
useDuplicateEssai({
  tableName: string,          // ex: "echantillons_compression"
  reportRoute: (id) => string // ex: id => `/essais/compression/${id}/rapport`
})
```

Comportement :
- `duplicate(sourceRecord, overrides)` :
  1. construit le payload : copie tous les champs sauf `id`, `numero`, `numero_chantier`, `created_at`, `updated_at`, `statut`
  2. applique `overrides` (les valeurs venues du formulaire)
  3. `insert` sur la table → récupère le nouvel `id`
  4. `navigate(reportRoute(newId))`

Avantage : un seul hook pour les ~40 tables `echantillons_*` et `formulations`, parce que toutes partagent la même forme (colonnes identification + JSONB `resultats`).

### 2. Composant partagé `DuplicateReportButton`
Fichier : `src/components/reports/DuplicateReportButton.tsx`

- Bouton avec icône Copy, classe `print:hidden`
- Ouvre `DuplicateReportDialog`
- Props : `sourceRecord`, `tableName`, `formComponent`, `reportRoute`

### 3. Composant partagé `DuplicateReportDialog`
Fichier : `src/components/reports/DuplicateReportDialog.tsx`

- Dialog modal large (max-w-4xl, scrollable)
- Affiche le `formComponent` reçu en prop, en mode « duplication »
- Le formulaire reçoit les valeurs initiales depuis `sourceRecord` (sans le N°)
- À la soumission, appelle `useDuplicateEssai.duplicate(...)`

### 4. Adaptation des formulaires existants
Chaque formulaire d'enregistrement (`*Form.tsx`) doit accepter un mode « embedded » :
- prop `initialValues` (override des valeurs par défaut)
- prop `onSuccess(newId)` (au lieu de `navigate` interne)
- prop `mode: "create" | "duplicate"` pour ajuster le titre / cacher breadcrumb

Pour limiter le risque, j'ajouterai ces props de façon **non breaking** (toutes optionnelles, fallback = comportement actuel).

### 5. Intégration dans chaque rapport
Dans chaque fichier `*Report.tsx`, ajouter dans la barre d'action :
```tsx
<DuplicateReportButton
  sourceRecord={echantillon}
  tableName="echantillons_xxx"
  formComponent={XxxForm}
  reportRoute={(id) => `/essais/xxx/${id}/rapport`}
/>
```

## Périmètre des rapports concernés

**Béton (destructif/non-destructif)** :
- Compression, Carottage, BetonFrais (Affaissement, Température, TempsPrise, TeneurAir), TractionFendage, Sclérométrie, Ultrason, Module élasticité, Perméabilité, Écrasement

**Granulats** (tous via `GranulatReport.tsx` factorisé) :
- BleuMéthylène, ÉquivalentSable, FormeGranulats, Friabilité, Granulométrie, LosAngeles, MasseVolumique, MatièreOrganique, MicroDeval, TeneurEau, MatièreOrganique

**Géotechnique** :
- CBR, Proctor (normal/modifié), Atterberg, Classification, TeneurEau sol, Granulométrie sol, Densitomètre, Plaque, Cisaillement, Œdométrique, Pénétromètre, Pressiomètre, Sondage, Triaxial, DensitéPlace, CompressionSimple

**Formulation** : 1 rapport

**Laboratoires mobiles** : `ChantierEchantillonReport.tsx` + bulletin

## Étapes d'implémentation

1. Créer `useDuplicateEssai.ts` (hook générique)
2. Créer `DuplicateReportDialog.tsx` + `DuplicateReportButton.tsx`
3. Refactor d'**un** formulaire pilote (Compression) pour supporter `initialValues` / `onSuccess`
4. Brancher le bouton dans `CompressionReport.tsx` → valider l'UX de bout en bout
5. Étendre aux familles de rapports une par une (Béton, Granulats via le wrapper factorisé `GranulatReport`, Géotechnique, Formulation, Labos mobiles)
6. Vérifier le build après chaque famille

## Question avant de me lancer

L'ampleur est importante (~50 fichiers touchés). Deux options :

**A. Implémentation complète en une livraison** (Compression + Carottage + toutes les autres familles d'un coup). Plus long, plus de fichiers modifiés, plus de risque de régression à valider.

**B. Implémentation incrémentale validée** : je livre d'abord l'infrastructure (hook + modal + bouton) **+ Compression et Carottage** comme pilotes. Vous validez le comportement, puis je propage aux autres familles dans des messages suivants. Recommandé.

Confirmez l'option (A ou B) avant que je commence à écrire le code.
