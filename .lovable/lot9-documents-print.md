# LOT 9 — Migration des documents administratifs & RH

## 1. Inventaire complet des documents imprimables non techniques

| # | Document | Fichier | État avant | Orientation |
|---|---|---|---|---|
| 1 | Offre de service | `src/pages/documents/OffreServicePreviewPage.tsx` | `window.print()` + `downloadReportAsPDF` | Portrait |
| 2 | Lettre d'engagement | `src/pages/documents/EngagementPreviewPage.tsx` | `window.print()` + `downloadReportAsPDF` | Portrait |
| 3 | Contrat (page complète) | `src/pages/documents/ContratPreviewPage.tsx` | `window.print()` + `downloadReportAsPDF` | Portrait |
| 4 | Contrat (dialog) | `src/components/documents/ContratPreviewDialog.tsx` | `window.print()` + `downloadReportAsPDF` | Portrait |
| 5 | Documents RH (contrats, attestations, courriers, décharges) | `src/pages/rh/Documents.tsx` | `window.print()` + `downloadReportAsPDF` | Portrait |
| 6 | Inventaire matériel (page) | `src/pages/materiel/MaterielInventaire.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 7 | Inventaire matériel (dialog) | `src/components/materiel/MaterielInventaireDialog.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 8 | Affectations matériel | `src/pages/materiel/MaterielAffectation.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 9 | Historique des affectations | `src/pages/materiel/MaterielAffectationHistorique.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 10 | Étalonnages matériel | `src/pages/materiel/MaterielEtalonnage.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 11 | Historique des étalonnages | `src/pages/materiel/MaterielEtalonnageHistorique.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 12 | Maintenances matériel | `src/pages/materiel/MaterielMaintenance.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 13 | Historique des maintenances | `src/pages/materiel/MaterielMaintenanceHistorique.tsx` | `window.print()` + `downloadReportAsPDF` | Paysage |
| 14 | Liste des mouvements matériel | `src/pages/materiel/mouvements/MouvementsListe.tsx` | `window.print()` inline | Paysage |
| 15 | Décharge / passation matériel (mouvement) | `src/pages/materiel/mouvements/MouvementDetail.tsx` | `window.print()` inline | Portrait |

## 2. Analyse — pattern legacy identique partout

- Bouton **Imprimer** appelait `window.print()` (moteur brut).
- Bouton **Télécharger** appelait `downloadReportAsPDF(filename)` — helper legacy `@/lib/pdf` basé sur html2canvas + jsPDF (rasterisation JPEG-in-PDF).
- Aucun `@media print` local dans les fichiers ci-dessus : le CSS global `src/styles/print.css` gérait déjà les règles A4.
- Aucun composant PDF spécifique (pas de jsPDF direct ni html2canvas direct dans ces fichiers).

## 3. Documents migrés

Les 15 documents passent désormais exclusivement par :

- `PrintService.print()` (moteur unique — pipeline navigateur natif : Aperçu + Impression + Enregistrer en PDF + Microsoft Print to PDF).
- `print.css` global (aucun style d'impression local ajouté ni supprimé).
- `data-print-root` + `data-print-template` sur le conteneur imprimable (en plus de `data-ref="report"` existant pour compat).
- Un template enregistré par document via `PrintService.registerTemplate(...)`.

## 4. Templates enregistrés

| ID | Titre | Orientation |
|---|---|---|
| `offre-service-document` | Offre de service | portrait |
| `engagement-document` | Lettre d'engagement | portrait |
| `contrat-document` | Contrat | portrait |
| `document-rh` | Document RH | portrait |
| `materiel-inventaire` | Inventaire matériel | landscape |
| `materiel-affectation` | Affectations matériel | landscape |
| `materiel-affectation-historique` | Historique des affectations | landscape |
| `materiel-etalonnage` | Étalonnages matériel | landscape |
| `materiel-etalonnage-historique` | Historique des étalonnages | landscape |
| `materiel-maintenance` | Maintenances matériel | landscape |
| `materiel-maintenance-historique` | Historique des maintenances | landscape |
| `materiel-mouvements-liste` | Liste des mouvements | landscape |
| `materiel-mouvement-detail` | Mouvement matériel (décharge/passation) | portrait |

Le template `contrat-document` est partagé entre `ContratPreviewPage` et `ContratPreviewDialog` (même document rendu dans deux hôtes).

## 5. Fichiers modifiés

- `src/pages/documents/OffreServicePreviewPage.tsx`
- `src/pages/documents/EngagementPreviewPage.tsx`
- `src/pages/documents/ContratPreviewPage.tsx`
- `src/components/documents/ContratPreviewDialog.tsx`
- `src/pages/rh/Documents.tsx`
- `src/pages/materiel/MaterielInventaire.tsx`
- `src/components/materiel/MaterielInventaireDialog.tsx`
- `src/pages/materiel/MaterielAffectation.tsx`
- `src/pages/materiel/MaterielAffectationHistorique.tsx`
- `src/pages/materiel/MaterielEtalonnage.tsx`
- `src/pages/materiel/MaterielEtalonnageHistorique.tsx`
- `src/pages/materiel/MaterielMaintenance.tsx`
- `src/pages/materiel/MaterielMaintenanceHistorique.tsx`
- `src/pages/materiel/mouvements/MouvementsListe.tsx`
- `src/pages/materiel/mouvements/MouvementDetail.tsx`

## 6. Ancien code supprimé

- 13 imports `import { downloadReportAsPDF } from "@/lib/pdf";` supprimés (dans la famille documents/RH/matériel).
- Tous les appels `window.print()` remplacés par `PrintService.print({...})`.
- Tous les appels `downloadReportAsPDF(...)` remplacés par `PrintService.print({...})` — plus aucune rasterisation html2canvas/jsPDF dans les documents administratifs et RH.
- Aucune suppression de logique métier, calcul, hook, repository, RLS, workflow, PWA, IA.

## 7. Validation impression

- Aperçu impression, Impression physique, Microsoft Print to PDF et « Enregistrer en PDF » utilisent tous le même pipeline navigateur natif via `PrintService.print()` → les quatre résultats sont identiques.
- Pagination gérée nativement par `print.css` (`thead { display: table-header-group }`, `break-inside: avoid` sur les blocs signature/QR/annexes).
- `data-print-root` isole le rendu au conteneur ciblé, `data-print-template` route les règles CSS spécifiques.

## 8. Validation PDF

- L'ancien pipeline JPEG-in-PDF (html2canvas → jsPDF `addImage`) est totalement éliminé pour ces 15 documents.
- Les PDF produits par « Enregistrer en PDF » sont désormais vectoriels : texte sélectionnable, tableaux nets, QR Codes SVG nets, logos et cachets vectoriels ou raster natifs.
- SHA-256, archivage, verification page (`/verification/:token`), QR Codes, signatures, cachets et données restent inchangés — la couche impression a été la seule modifiée.

## 9. Difficultés rencontrées

- Un helper `downloadReportAsPDF` contenait des arguments avec parenthèses imbriquées (template literals `\`inventaire-materiel-${format(new Date(), "yyyy-MM-dd")}\``). Deux passes sed nécessaires pour matcher correctement.
- `MouvementsListe` n'avait pas de conteneur `data-ref="report"` : ajout d'un wrapper `<div data-print-root data-print-template="materiel-mouvements-liste" data-ref="report">` autour du Card imprimable.
- Le composant `ContratPreviewDialog` partage le rendu avec `ContratPreviewPage` : réutilisation du même ID de template (`contrat-document`) — l'appel `registerTemplate` étant idempotent, aucun conflit.

## 10. Type-check

- `tsgo --noEmit` : **0 erreur**.

## 11. Documents restant hors périmètre (à couvrir en LOT 10)

Fichiers utilisant encore `downloadReportAsPDF` ou `window.print()` en dehors du périmètre LOT 9 (rapports techniques et bulletins essais — déjà couverts par les Lots 1-7, ou hors scope administratif) :

- `src/lib/pdf.ts` — helper legacy `downloadReportAsPDF`. Reste utilisé par les feuilles d'essais blanches et les pages de normes. À supprimer intégralement dans le LOT 10 (audit final).
- `src/lib/documents/DocumentGenerator.ts` — moteur d'archivage historique (rapports archivés SHA-256). Système parallèle non lié à l'impression écran — à auditer séparément.
- Pages de normes / catalogues (`BetonFraisNormes`, `BetonDurciNormes`, `NonDestructifNormes`, `DestructifNormes`, `GranulatPhysiquesNormes`, `GranulatMecaniquesNormes`, `GranulatPropreteNormes`, `CompactageNormes`, `IdentificationNormes`, `MecaniqueNormes`, `InSituNormes`) — catalogues de références normatives, hors périmètre "documents administratifs".
- Rapports techniques déjà migrés dans Lots 1-7 mais qui référencent encore `@/lib/pdf` en import mort à nettoyer en LOT 10.
- `src/components/essais/FeuilleEssaiDialog.tsx` — feuille d'essai blanche imprimable, à migrer en LOT 10 avec les feuilles de saisie.

## Recommandations LOT 10 (audit final)

1. Supprimer intégralement `src/lib/pdf.ts` et son export `downloadReportAsPDF` une fois toutes les pages de normes / feuilles d'essais migrées.
2. Auditer les pages « Normes » et « Feuilles d'essais » restantes (11 fichiers listés ci-dessus).
3. Vérifier `DocumentGenerator.ts` (archivage) : décider si le pipeline serveur d'archivage doit également migrer vers un rendu vectoriel (Puppeteer/headless Chromium en Edge Function) — hors scope impression écran mais lié à la stratégie PDF globale.
4. Confirmer qu'aucun composant du projet n'importe plus `@/lib/pdf` (`rg "@/lib/pdf"`).
5. Passer à l'harmonisation finale : orientation, pagination, marges A4 uniformes, dernier passage `print.css`.

## FIN LOT 9 — En attente de validation avant LOT 10.
