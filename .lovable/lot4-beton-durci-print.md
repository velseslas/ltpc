# LOT 4 — Migration Béton Durci (hors Compression) vers PrintService

## Périmètre migré
Après inventaire de `src/pages/essais/**` filtré sur béton durci hors compression, quatre rapports concernés :

| Essai | Fichier | Template ID |
|---|---|---|
| Carottage | `src/pages/essais/destructif/CarottageReport.tsx` | `carottage-report` |
| Traction par fendage | `src/pages/essais/tractionfendage/TractionFendageReport.tsx` | `traction-fendage-report` |
| Module d'élasticité | `src/pages/essais/moduleelasticite/ModuleElasticiteReport.tsx` | `module-elasticite-report` |
| Perméabilité | `src/pages/essais/permeabilite/PermeabiliteReport.tsx` | `permeabilite-report` |

Les essais non destructifs (Sclérométrie, Ultrasons) sont hors périmètre du LOT 4 (traités comme famille séparée « Non destructif » lors d'un lot ultérieur).

## Modifications appliquées (identiques aux LOT 2 / LOT 3)
Pour chaque fichier :
1. Suppression de l'import `downloadReportAsPDF` depuis `@/lib/pdf`.
2. Ajout de `import { PrintService } from "@/lib/print/PrintService"`.
3. Enregistrement du template (`PrintService.registerTemplate({ id, title, orientation: "portrait" })`) au niveau module.
4. Remplacement de `handlePrint` / `handleDownloadPDF` par un unique `triggerPrint()` s'appuyant sur `PrintService.print({ title, orientation: "portrait" })`.
5. Ajout de `data-print-root` et `data-print-template="<id>"` sur le conteneur imprimable (`data-ref="report"` conservé pour rétro-compat).
6. Suppression des `toast.success/error` autour de l'export PDF (le dialogue navigateur est déjà l'UI officielle).

## Interdictions respectées
- ❌ Aucune modification des calculs (`Fc = F/A`, correction K, module E, profondeur perméabilité, résistance traction par fendage).
- ❌ Aucun changement de hook (`useEchantillonCarottage`, `useEchantillonTractionFendageById`, `useEchantillonModuleElasticiteById`, `useEchantillonPermeabiliteById`, `useFormulationDetails`, `useEntreprise`).
- ❌ Aucune modification de `ReportHeader`, QR Code, signature, cachet, logo, workflow, SHA-256, archivage.
- ❌ Pas d'html2canvas, html2pdf, jsPDF, canvas, JPEG, PNG introduits — 100 % vectoriel via `window.print()` natif encapsulé dans `PrintService`.

## Charte visuelle
La structure existante (déjà conforme LOT 2) a été préservée intégralement :
- `ReportHeader` en-tête entreprise + titre + sous-titre normatif.
- `identification-table` bordurée noire.
- Tableaux de résultats identiques.
- Zone signatures / observations inchangée.
- QR Code produit par `ShareButton` / `ReportHeader` inchangé.

Aucune régression visuelle : seule la couche « déclenchement d'impression » a bougé.

## Pagination & impression
- Orientation `portrait` explicitement déclarée dans le template et dans l'appel `PrintService.print`.
- `print.css` global (importé via `src/index.css`) applique désormais les règles de pagination `[data-print-root]` (avoid break-inside sur `table`, `signatures`, `qr-block`).
- Aperçu impression, Imprimer, Microsoft Print to PDF et Enregistrer en PDF partagent maintenant le même code path (`window.print()`) → sorties strictement identiques.

## Validation
- [x] Type-check : 0 erreur TypeScript.
- [x] Aucun `downloadReportAsPDF` restant dans les 4 fichiers.
- [x] Aucun `window.print()` direct restant dans les 4 fichiers.
- [x] 4 templates enregistrés et découvrables via `PrintService.listTemplates()`.
- [x] `data-print-root` posé sur les 4 conteneurs.

## Difficultés rencontrées
- Doublons `handlePrint` transitoires lors des remplacements successifs (levés en une itération par suppression de l'ancienne ligne).
- Aucun blocage sur les hooks ou la logique métier.

## Éléments restant à améliorer (non bloquants, à traiter en fin de Phase 11)
- Les blocs `<style>{'@media print { … }'}</style>` inline encore présents dans `CarottageReport.tsx` et `TractionFendageReport.tsx` — à factoriser dans `print.css` en fin de Phase 11 après migration complète, une fois que toutes les familles auront confirmé les mêmes règles.
- L'harmonisation fine des paddings (`p-8` vs `p-6`) entre Carottage/Traction/ModuleE/Perméabilité et Compression sera un pass cosmétique en fin de phase.
- `@/lib/pdf` reste importable — sera supprimé après migration de la dernière famille (Béton durci non destructif, Géotechnique, Granulat, Facturation, Documents, RH, Matériel).

## Prochaine famille proposée
**LOT 5 — Béton durci non destructif** : `SclerometreReport.tsx`, `UltrasonReport.tsx`.
Structure quasi identique aux 4 rapports de ce lot → migration rapide et faible risque.

**STOP — En attente de validation utilisateur avant lancement du LOT 5.**
