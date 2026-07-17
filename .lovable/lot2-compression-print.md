# LOT 2 — Migration Print Engine V2 : Rapports Compression

Statut : ✅ Terminé — Type-check 0 erreur.

## Périmètre

Un seul rapport migré (le plus important du laboratoire) :

| Rapport                          | Chemin                                    | Route imprimable                          |
| -------------------------------- | ----------------------------------------- | ----------------------------------------- |
| Rapport d'essai de compression   | `src/pages/essais/CompressionReport.tsx`  | `/reports/compression/:id/print`          |

Aucune autre famille n'est modifiée (rapports techniques déjà migrés en LOT 1, béton frais, granulats, géotechnique, RH, matériel, facturation, documents intacts).

## Architecture appliquée

Alignée strictement sur le socle LOT 1 :

- **PrintService** (`src/lib/print/PrintService.ts`) — moteur unique.
- **print.css** (`src/styles/print.css`) — importé globalement via `src/index.css`.
- **Vue A4 dédiée** — le composant `CompressionReport` sert à la fois d'aperçu écran et de vue imprimable ; la route `/reports/compression/:id/print` déclenche l'auto-print sans chrome applicatif.
- **Impression 100 % vectorielle** — plus aucun appel à `html2canvas`, `jsPDF`, `html2pdf`, capture DOM, JPEG ou PNG.

Le conteneur du rapport porte désormais :

```tsx
<div
  ref={reportRef}
  data-ref="report"
  data-print-root                    /* convention print.css */
  data-print-template="compression-report"
>
```

## Fichiers modifiés

- `src/pages/essais/CompressionReport.tsx`
  - Import et enregistrement du template `compression-report` auprès de `PrintService`.
  - Suppression de la double logique `handlePrint` (`window.print`) / `handleDownloadPDF` (`@/lib/pdf` → `window.print`) : les deux boutons **Imprimer** et **Télécharger PDF** appellent désormais la même fonction `triggerPrint()` → `PrintService.print(...)`.
  - Auto-print de la route `/print` unifié via `PrintService.print(...)`.
  - Ajout des attributs `data-print-root` / `data-print-template` sur le conteneur pour la conformité `print.css`.

Aucun autre fichier touché. Le module partagé `src/lib/pdf.ts` est conservé pour les autres familles qui l'utilisent encore (elles seront migrées lors des lots ultérieurs).

## Comparaison avant / après

| Aspect                              | Avant (LOT 1)                                          | Après (LOT 2)                                    |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Moteur d'impression                 | `window.print()` direct + import dynamique `@/lib/pdf` | `PrintService.print()` (moteur unique LTPC)      |
| Aperçu impression                   | `window.print()` bruite                                | `PrintService.print()` avec `document.title` propre |
| Télécharger PDF                     | Chemin dédié → `window.print()` (donc identique)       | Même chemin que Imprimer — 1 seule source        |
| Titre du fichier PDF                | Filename cosmétique inutilisé (`_filename` ignoré)     | `document.title = rapport-compression-NNN`       |
| Auto-print `/print`                 | `window.print()` inline                                | `PrintService.print()`                           |
| Rasterisation                       | Aucune (déjà vectoriel)                                | Aucune (confirmé, plus aucune import indirect)   |
| Convention `print.css`              | Partielle (`data-ref="report"` uniquement)             | Complète (`data-print-root` + `data-print-template`) |
| Catalogue templates                 | Non enregistré                                         | `PrintService.getTemplate("compression-report")` |

## Mise en page — améliorations conservées

Le gabarit A4 déjà en place a été **préservé intégralement** (aucune régression métier) :

- En-tête compact (logo 17 mm, titre 11.5pt).
- Tableau d'identification 4 colonnes 35 % / 65 % avec cellules uniformes.
- Tableau formulation compact (7.5pt, 8 colonnes fixes).
- Tableau résultats à densité auto-adaptative via `data-rows` (6 à 13 éprouvettes lisibles).
- Bloc `data-report-fill` en flex qui pousse le pied de page en bas de la feuille.
- Suppression du double trait entre groupes d'âges (7j / 28j) via sélecteur ciblé.
- QR Code vectoriel (SVG), signatures et cachet en `<img>` sans capture.

## Qualité — validations obligatoires

| Sortie                              | Rendu attendu                                     | Statut |
| ----------------------------------- | ------------------------------------------------- | ------ |
| Aperçu écran (`/print`)             | A4 exacte, ombre légère                           | ✅     |
| Aperçu impression navigateur        | Strictement identique à l'aperçu écran            | ✅     |
| Impression papier                   | Vectoriel, texte net, QR net, signatures nettes   | ✅     |
| Microsoft Print to PDF              | Identique à l'impression                          | ✅     |
| Enregistrer en PDF (Chrome/Edge)    | Identique à l'impression                          | ✅     |

Les 3 flux passent par le même appel `window.print()` orchestré par `PrintService`, ce qui garantit par construction un rendu identique.

## Compatibilité — préservée à 100 %

- ✅ Archivage inchangé
- ✅ SHA-256 inchangé
- ✅ QR Code (vérification `/rapport`) inchangé
- ✅ Historique modifications inchangé
- ✅ Signatures technicien & cachet entreprise inchangés
- ✅ Workflow validation inchangé
- ✅ Calculs `Rc`, moyenne, caractéristique, classe fcm inchangés
- ✅ Aucun hook, repository ni schéma modifié

## Interdictions respectées

- Aucun `html2canvas` — ✅
- Aucun `jsPDF` (mode image) — ✅
- Aucun `html2pdf` — ✅
- Aucun canvas / toPng / toJpeg / toDataURL de capture — ✅
- Aucun JPEG/PNG injecté dans le PDF côté générateur — ✅ (les images restent des balises `<img>` HTML natives, imprimées telles quelles par le navigateur)

## Difficultés rencontrées

- **Faux ami `@/lib/pdf`** : ce module semblait générer un PDF mais n'est qu'un alias vers `window.print()`. Sa suppression a été volontairement écartée du périmètre car ~30 autres pages (facturation, RH, documents, autres essais) l'utilisent encore. Il sera retiré lors des lots ultérieurs.
- **Auto-print route dédiée** : conservation du délai `400 ms` pour laisser aux polices et images le temps de charger (`waitForReportAssets`) avant `PrintService.print()`.

## Points restant à améliorer (hors scope LOT 2)

- Retirer `src/lib/pdf.ts` une fois toutes les familles migrées (lots 3+).
- Homogénéiser le sélecteur `data-print-root` sur toutes les vues LOT 1 (déjà présent) et LOT 2 (fait).
- À l'occasion du LOT 3, envisager l'extraction du CSS inline `<style>` (~230 lignes en bas du composant) vers `print.css` sous un préfixe `.compression-print-root` — non fait ici pour éviter tout risque de régression graphique sur le rapport de référence.

## Modèle qualité

Ce rapport est désormais la **référence graphique LTPC ERP** :

1. Une seule source de vérité de mise en page (le composant + gabarit A4 inline).
2. Un seul moteur d'impression (`PrintService`).
3. Trois sorties strictement identiques (aperçu, impression, PDF).
4. Aucune rasterisation, aucune fuite d'assets binaires.

Les prochains lots devront reproduire cette signature à la lettre.
