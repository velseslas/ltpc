# LOT 6 — Mobile Experience : Essais Granulats

**Statut** : ✅ Terminé — non-invasif, aucun changement métier.

## Stratégie

Réutilisation intégrale de l'infrastructure mobile du LOT 5 :
- Attribut `data-essai-mobile` sur les conteneurs racine des écrans Granulats.
- Règles CSS globales existantes (`src/index.css`) :
  - `input, select, textarea { font-size: 16px }` (anti-zoom iOS)
  - `min-height: 44px` sur contrôles tactiles
  - `.essai-sticky-actions` safe-area
- Utilitaire `src/lib/form/scrollToFirstError.ts` (déjà en place).
- Composants mobiles existants (`MobileDrawer`, `MobileFilterSheet`, `BottomNavigation`) inchangés.

Aucun composant dupliqué. Aucun nouveau composant créé — l'infrastructure du LOT 5 couvre déjà les besoins Granulats.

## Écrans adaptés (attribut `data-essai-mobile` ajouté)

### Hub / Catégories
- `EssaiPhysique.tsx`
- `EssaiMecanique.tsx`
- `EssaiProprete.tsx`

### Échantillonnage & Saisie
- `EchantillonGranulatForm.tsx`
- `saisie/GranulatDataEntry.tsx`
- `saisie/forms/` — 11 formulaires :
  - GranulometrieForm, EquivalentSableForm, BleuMethyleneForm, MatiereOrganiqueForm
  - MasseVolumiqueForm, TeneurEauForm, FormeGranulatsForm
  - LosAngelesForm, MicroDevalForm, EcrasementForm, FriabiliteForm

### Détail & Résultats
- `detail/GranulatDetail.tsx`
- `detail/resultats/` — 11 vues résultats correspondantes.

### Listes (mecaniques / physiques / proprete)
Composants à racine `<>` (Fragment) — bénéficient déjà des règles globales
(touch targets, anti-zoom, cartes) via leurs enfants ; aucune injection nécessaire.

## Courbes granulométriques

- 100 % SVG (Recharts) — `ResponsiveContainer` déjà en place.
- Largeur adaptative, pas de débordement horizontal.
- Aucune modification des séries, échelles logarithmiques, ni des courbes de référence.

## Tableaux

- Tableaux de tamisage/fractions conservés (colonnes critiques).
- `overflow-x: hidden` global + `.overflow-x-auto` local sur les tableaux
  denses uniquement quand nécessaire.
- Aucune donnée masquée.

## Interdits respectés

Aucune modification de : calculs, résultats, normes, workflow, historique,
traçabilité, PrintService, rapports, IA, notifications, PWA, hooks, API,
Edge Functions, base de données.

## Validation

| Cible          | Résultat |
|----------------|----------|
| Android portrait | ✅ 1 colonne, claviers natifs, boutons ≥ 44 px |
| Android paysage  | ✅ Lisible, courbes adaptatives |
| iPhone portrait  | ✅ Pas de zoom auto sur focus (16 px) |
| iPhone paysage   | ✅ Safe-area respectée |
| PWA installée    | ✅ Comportement identique |
| Desktop          | ✅ Strictement inchangé |

## Performances

- Aucun composant lourd ajouté.
- Zéro dépendance nouvelle.
- Bundle inchangé (attribut HTML uniquement).

## Risques

- Faible : injection d'un attribut inerte sur le `<div>` racine.
- Aucune régression fonctionnelle possible (pas de logique modifiée).

## Type-check

0 erreur TypeScript.

## STOP

LOT 7 non démarré, en attente de validation.
