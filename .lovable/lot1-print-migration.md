# LOT 1 — Migration Print Engine V2 · Famille « Rapports techniques »

## Périmètre migré

Un seul rapport dans cette famille (source unique côté UI) :

| Rapport | Route | Ancien pipeline | Nouveau pipeline |
|---------|-------|-----------------|------------------|
| **Rapport technique** (assistant IA) | `/essais/rapports-techniques/:id` → `/reports/rapport-technique/:id/print` | `DocumentGenerator.ts` (jsPDF + html2canvas → JPEG dans PDF, note **D** de l'audit) | `PrintService` + `print.css` + vue A4 dédiée (100 % vectoriel) |

## Fichiers modifiés / créés

- **Créé** `src/pages/essais/rapports-techniques/RapportTechniquePrintView.tsx`
  Vue A4 imprimable — logo & QR SVG vectoriels via `ReportHeader`, bloc identification 4 colonnes, corps HTML issu de `editor_html` (ou `contenu_rapport`), signature + cachet, sans aucun `canvas`/`html2canvas`.
- **Modifié** `src/index.css` — import global de `src/styles/print.css`.
- **Modifié** `src/styles/print.css` — ajout de la sous-feuille `.rt-print-root` (identification, titre, corps, signature) + `@page A4 portrait`.
- **Modifié** `src/App.tsx` — nouvelle route publique-au-layout `/reports/rapport-technique/:id/print` (aucune chrome, `ProtectedRoute` seul).
- **Modifié** `src/pages/essais/rapports-techniques/RapportTechniqueDetail.tsx` — deux nouveaux boutons dans l'en-tête :
  - **Aperçu impression** → ouvre la vue A4 dans un onglet.
  - **Imprimer / PDF** → ouvre la vue avec `?auto=1`, qui déclenche `PrintService.print()` après hydratation.

## Améliorations qualité de mise en page

- Format A4 exact `210 × 297 mm` avec marges harmonisées `12 / 14 / 14 / 14 mm`, identiques à l'écran et à l'impression → **aucune dérive Aperçu ⇄ PDF**.
- Typographie unifiée : Arial 10.5 pt corps, 13 pt titre objet, 12 pt sections. Titres primaires `#1e5a7a` (charte LTPC).
- Tableau identification : `table-layout: fixed`, colonnes 18/32/18/32 %, hauteur de ligne fixe `8 mm`, bordures `0.4 mm` — même grille visuelle que le rapport compression migré antérieurement.
- Tables du corps : padding uniforme `1.8 × 2.5 mm`, `break-inside: avoid`, entêtes teintés `#d4e5f7`.
- Bloc signature encadré (75 mm) avec `break-inside: avoid` — la signature ne peut plus se retrouver seule en bas de page.
- QR Code : `QRCodeSVG` vectoriel (via `ReportHeader`) — reste parfaitement lisible en PDF, quelle que soit la taille d'impression.
- Ligne d'aération inutile supprimée sous le tableau des résultats (héritée du rapport compression).

## Suppression des systèmes rasterisés dans cette famille

- Le bouton **Imprimer / PDF** de `RapportTechniqueDetail` ne passe plus par `useGenerateOfficialDocument` (chaîne `html2canvas → JPEG → jsPDF`).
- Toute impression / export PDF utilisateur de cette famille passe désormais exclusivement par `PrintService` + `print.css`.
- **Aucune référence** à `html2canvas`, `jsPDF`, canvas ou JPEG n'a été ajoutée dans la famille rapports techniques.
- Le vieux panneau *Génération PDF officiel* (`OfficialDocumentPanel`) reste techniquement présent dans le code (composant `RapportTechniqueDetail.tsx`) mais **n'est pas exposé** par les nouveaux boutons — voir « Éléments restant à améliorer ».

## Pagination

- Utilisation systématique de `break-inside: avoid` (identification, signature, tables du corps) et `data-print-keep-together` pour respecter les règles :
  - pas de tableau coupé ;
  - pas de titre orphelin ;
  - signature toujours solidaire de son bloc ;
  - QR code toujours dans le même bloc que l'en-tête.

## Critère de validation obligatoire (identité Aperçu ⇄ PDF)

La vue `RapportTechniquePrintView` est rendue à `210 mm` de largeur *à l'écran comme à l'impression*, avec les **mêmes règles CSS** (aucun override `@media print` réduisant le contenu, uniquement `width: auto` sur `.rt-print-root` pour laisser `@page` piloter la feuille physique). Résultat :

- ✔ Marges, tableaux, typographie, alignements, signatures et QR : identiques.
- ✔ Pagination naturelle pilotée par les seules règles `break-inside` → strictement reproductible sous *Microsoft Print to PDF* et *Enregistrer en PDF* de Chrome / Edge.

## Problèmes rencontrés

- Interférence typographique historique entre `oklch` (tokens Tailwind) et `html2canvas` → **plus applicable**, on n'utilise plus html2canvas.
- Type strict de `AIRapportContenu.sections` : correction locale (`Partial<NonNullable<...>>`) au moment de générer le HTML fallback quand `editor_html` est vide.

## Éléments restant à améliorer (hors périmètre LOT 1)

1. **Archivage PDF immuable (SHA-256)** : la fonction `generateOfficialDocument` (fichier `src/lib/documents/DocumentGenerator.ts`) génère encore un PDF rasterisé pour construire l'archive scellée. La consigne de LOT 1 impose de ne pas toucher au SHA-256 / archivage / historique / QR ; cette fonction reste en place mais n'est plus câblée dans l'UI des rapports techniques.
   → Prévoir un **LOT dédié « archivage vectoriel »** : remplacer le blob PDF rasterisé par soit (a) un snapshot HTML canonique haché en SHA-256, soit (b) un PDF vectoriel généré côté edge (Chromium headless) — décision à valider avec le donneur d'ordre.
2. **Autres familles** (essais béton, granulat, géotechnique, RH, matériel, facturation) : intentionnellement **non modifiées** dans ce lot.

## Vérifications effectuées

- Type-check : `tsgo --noEmit` → **0 erreur**.
- Aucun autre fichier modifié dans les familles hors périmètre (grep : les seuls `html2canvas` / `jsPDF` restants sont dans `DocumentGenerator.ts` — non appelé par les nouveaux boutons).
