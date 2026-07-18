# LOT 7 — Mobile Experience : Essais Géotechniques

**Statut** : ✅ Terminé — non-invasif, aucun changement métier.

## Stratégie

Réutilisation intégrale de l'infrastructure des LOTS 5 et 6 :
- Attribut `data-essai-mobile` sur les conteneurs racine.
- `src/index.css` : `font-size: 16px` sur inputs (anti-zoom iOS),
  `min-height: 44px` sur contrôles tactiles, safe-areas.
- `.essai-sticky-actions` déjà disponible.
- `src/lib/form/scrollToFirstError.ts` déjà en place.
- `MobileFilterSheet`, `MobileDrawer`, `BottomNavigation` réutilisés.
- **Rapports (`*Report.tsx`) strictement non touchés** — verrouillage PrintService.

Aucun composant dupliqué. Aucun nouveau composant nécessaire.

## Écrans adaptés (`data-essai-mobile` injecté)

### Hubs & Normes
- `EssaiCompactage.tsx`, `EssaiIdentification.tsx`, `EssaiInSitu.tsx`, `EssaiMecaniqueSol.tsx`
- `normes/` : CompactageNormes, IdentificationNormes, InSituNormes, MecaniqueNormes

### Échantillonnage & Saisie
- `EchantillonGeotechniqueForm.tsx`
- `GeotechniqueDataEntry.tsx`
- `compactage/` : ProctorDataEntry, CBRDataEntry
- `identification/` : GranulometrieSolDataEntry, LimitesAtterbergDataEntry,
  TeneurEauSolDataEntry, ClassificationSolDataEntry
- `insitu/` : DensitometreDataEntry, PlaqueDataEntry

### Détails
- `GeotechniqueDetail.tsx`

## Écrans non modifiés

- **Rapports** (`*Report.tsx`) : verrouillés (PrintService, rendu A4).
- **Listes** (`compactage/ProctorNormal.tsx`, `ProctorModifie.tsx`, `CBR.tsx`,
  `DensitePlace.tsx`, `identification/*.tsx` listes, `insitu/{Densitometre,
  Plaque, Penetrometre, Pressiometre, Sondage}.tsx`, `mecanique/*.tsx`) :
  racine `<>` (Fragment). Ces vues consomment déjà les règles CSS globales
  mobiles (touch targets, anti-zoom, cartes) via leurs enfants — aucune
  injection nécessaire, aucune régression.

## Courbes

- Proctor (compactage), CBR (charge-enfoncement), courbes de plasticité :
  SVG Recharts, `ResponsiveContainer` en place, adaptatifs, zéro overflow-x.
- Aucun calcul modifié.

## Tableaux

- Tableaux de tamisage, points Proctor, feuilles CBR : conservés intégralement.
- `overflow-x: hidden` global + `overflow-x-auto` local uniquement où requis.
- Aucune donnée masquée.

## Formulaires

- 1 colonne en mobile (grid responsive existant).
- Claviers natifs (`inputMode` déjà en place sur champs numériques).
- Boutons ≥ 44 px via CSS globale.
- Compatibles gants (cibles tactiles agrandies).

## Interdits respectés

Aucune modification de : calculs, normes, résultats, workflow, historique,
traçabilité, PrintService, rapports, IA, notifications, PWA, hooks, API,
Edge Functions, base de données.

## Validation

| Cible            | Résultat |
|------------------|----------|
| Android portrait | ✅ 1 colonne, claviers natifs, ≥ 44 px |
| Android paysage  | ✅ Courbes adaptatives lisibles |
| iPhone portrait  | ✅ Pas de zoom auto (16 px) |
| iPhone paysage   | ✅ Safe-area respectée |
| PWA installée    | ✅ Identique |
| Desktop          | ✅ Strictement inchangé |

## Performances

- Aucun composant ajouté au bundle.
- Zéro dépendance nouvelle.
- Impact runtime nul (attribut HTML statique).

## Risques

- Faible : injection d'un attribut inerte sur `<div>` racine.
- Rapports isolés — aucun risque de régression sur le rendu A4.

## Type-check

0 erreur TypeScript.

## STOP

LOT 8 non démarré, en attente de validation.
