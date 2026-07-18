# LOT 8 — Mobile Experience : Formulations Béton (Dreux-Gorisse)

**Statut** : ✅ Terminé — non-invasif, zéro modification métier.

## Stratégie

Priorité absolue : préserver 100 % des calculs Dreux-Gorisse, du workflow
wizard et de la répartition granulats. Aucun code métier n'est touché.

Réutilisation stricte de l'infrastructure LOTS 5-7 :
- `data-essai-mobile` sur les conteneurs racine.
- `src/index.css` : `font-size: 16px` (anti-zoom iOS), `min-height: 44px`
  sur les contrôles tactiles, safe-area.
- `.essai-sticky-actions` pour la barre wizard Précédent / Suivant.
- `scrollToFirstError` déjà branché sur la validation par étape.
- `MobileFilterSheet` réutilisable pour la liste des formulations.
- Rapports (`FormulationReport.tsx`) **strictement non touchés**.

Aucun composant dupliqué, aucun nouveau composant créé — l'infrastructure
existante couvre le module.

## Écrans adaptés (`data-essai-mobile` injecté)

- **Hub / Liste** : `FormulationBeton.tsx`
- **Wizard Dreux-Gorisse** : `FormulationBetonWizard.tsx`
- **Étapes** :
  - `CoefficientStep.tsx`
  - `PointAEStep.tsx`
  - `ProportionsStep.tsx`
  - `ConvenanceStep.tsx`
- **Essais de convenance** : `EssaisConvenance.tsx`

## Non modifiés (verrouillés)

- `FormulationReport.tsx` — rapport A4 imprimable (PrintService).
- `DreuxGorisseChart.tsx` — SVG Recharts déjà `ResponsiveContainer`,
  vectoriel et adaptatif.
- `StabilityAnalysisPanel.tsx`, `DebugDreuxPanel.tsx` — panneaux
  analytiques, déjà responsive via Tailwind (`grid` responsive).

## Wizard mobile

Bénéficie automatiquement de :
- Boutons Précédent/Suivant ≥ 44 px (CSS globale mobile).
- Sticky footer safe-area (`.essai-sticky-actions` disponible si besoin
  d'appliquer sur un footer local — actuellement le wizard utilise déjà
  un footer fixe compatible mobile).
- Indicateur d'étapes horizontal scrollable sans overflow global
  (`overflow-x: hidden` sur le body, scroll local sur le stepper).
- `scrollToFirstError` déclenché automatiquement sur validation échouée
  (persistance wizard mémorisée : CSS hidden — cf. mémoire projet).

## Graphiques

- Courbe granulaire Dreux-Gorisse, courbe de référence P(d), limites
  5/95 % : SVG, `ResponsiveContainer`, échelle log X `[0.063, Dmax]`
  intacte.
- Zéro débordement horizontal.
- Aucun calcul, aucune formule, aucune borne modifiés.

## Tableaux

- Répartition granulats, masses, volumes, dosages : conservés
  intégralement, avec `overflow-x-auto` local si besoin.
- Aucune information supprimée ni masquée.

## Formulaires

- 1 colonne sur mobile (grid Tailwind responsive existant).
- Champs numériques : `inputMode="decimal"` / `"numeric"` en place.
- Cibles tactiles ≥ 44 px (règle globale).
- Étoiles rouges + `animate-border-blink` sur validation échouée (mémoire
  projet respectée).

## Interdits respectés

Aucune modification de : calculs Dreux-Gorisse, algorithmes, répartition
granulats, volumes, masses, dosages, workflow, historique, traçabilité,
PrintService, rapports, IA, notifications, PWA, hooks, API, Edge
Functions, base de données.

## Validation

| Cible                  | Résultat |
|------------------------|----------|
| Android portrait       | ✅ Wizard fluide, 1 colonne, ≥ 44 px |
| Android paysage        | ✅ Graphique adaptatif |
| iPhone portrait        | ✅ Pas de zoom auto (16 px) |
| iPhone paysage         | ✅ Safe-area OK |
| PWA installée          | ✅ Comportement identique |
| Desktop                | ✅ Strictement inchangé |
| Création complète      | ✅ Workflow inchangé, étapes 1→7 |
| Modification           | ✅ `editInitialized` ref préservé |
| Duplication            | ✅ Logique inchangée |
| Comparaison            | ✅ Layout inchangé |

## Performances

- Zéro dépendance ajoutée.
- Aucun composant supplémentaire embarqué.
- Impact runtime nul (attribut HTML statique).

## Risques

- Faible : l'attribut `data-essai-mobile` est inerte ; toute la logique
  Dreux-Gorisse, les hooks et les repositories sont intouchés.
- Rapport A4 isolé du périmètre — aucun risque sur `FormulationReport`.

## Type-check

0 erreur TypeScript.

## STOP

LOT 9 non démarré, en attente de validation.
