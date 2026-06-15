# Déplacer "Dupliquer" dans le menu actions des listes

## Changement de comportement

Aujourd'hui le bouton "Dupliquer" est dans l'en-tête du rapport et ouvre une modale qui crée immédiatement le doublon. À la place :

1. **Retirer** `DuplicateReportButton` de tous les rapports (et supprimer la modale `DuplicateReportDialog`).
2. **Ajouter** une entrée "Dupliquer" dans le dropdown `…` de chaque liste d'échantillons, juste avant "Modifier".
3. Au clic, naviguer vers la page **"Nouveau échantillon"** existante (route normale, pas de popup) avec un paramètre `?duplicateFrom={id}`.
4. La page formulaire détecte ce paramètre, charge l'échantillon source, **pré-remplit** tous les champs d'identification (client, chantier, ouvrage, partie ouvrage, opérateur, dates, etc.) sauf le **N°** qui reste vide.
5. **Aucune création automatique** : l'utilisateur modifie ce qu'il veut puis clique "Créer l'échantillon" pour persister (logique existante du bouton).

## Périmètre (listes + formulaires concernés)

- Béton : Compression, Carottage, BétonFrais, TractionFendage, Sclérométrie, Ultrason, Module élasticité, Perméabilité
- Granulats : toutes les pages de saisie (via `EchantillonGranulatForm` + chaque page liste)
- Géotechnique : Proctor, CBR, Atterberg, Classification, Granulométrie sol, Teneur eau, Densitomètre, Plaque
- Formulation : `FormulationBeton` (liste) + `FormulationForm`
- Laboratoires mobiles : `ChantierEchantillonsList` + `ChantierEchantillonForm`

## Détails techniques

- Le hook `useDuplicateEssai` est conservé mais simplifié : il expose une fonction `prepareDuplicateOverrides(sourceRow)` qui retire `id, numero, numero_chantier, created_at, updated_at` et est réutilisée par les formulaires. La logique d'insertion immédiate est supprimée — l'insertion passe par le `createMutation` existant du formulaire.
- Chaque `*SampleForm` / `*Form` lit `searchParams.get("duplicateFrom")`, appelle son hook `useEchantillon<X>(duplicateId)` (même hook que pour l'édition) et applique les valeurs dans un `useEffect` (avec un `duplicateInitialized` ref pour ne pas écraser les saisies utilisateur, conformément à la mémoire `editInitialized`).
- Le titre devient "Nouveau" (et non "Modifier") et le bouton reste "Créer l'échantillon" : le formulaire n'est pas en mode édition, juste pré-rempli.
- Pour granulats / géotechnique qui partagent un formulaire générique, on ajoute la logique une seule fois dans `EchantillonGranulatForm` et l'équivalent géotechnique.
- Composants supprimés : `src/components/reports/DuplicateReportButton.tsx`, `src/components/reports/DuplicateReportDialog.tsx`.

## Livrables

- ~20 fichiers liste modifiés (ajout entrée dropdown)
- ~15 fichiers formulaire modifiés (lecture `duplicateFrom`, pré-remplissage)
- 20 fichiers rapport modifiés (retrait du bouton et de l'import)
- 2 fichiers supprimés (button + dialog)
- 1 hook légèrement remanié
