# LOT 5 — Migration Impression Béton Durci Non Destructif (NDT)

## Périmètre
Famille **Béton Durci — Non Destructif** intégralement migrée vers le moteur d'impression unique (`PrintService` + `print.css` + `data-print-root`).

## Scan projet
Répertoire `src/pages/essais/nondestructif/` inventorié — aucun autre rapport NDT présent en dehors des deux ci-dessous.

## Rapports migrés

| # | Essai | Fichier | Template ID | Orientation |
|---|-------|---------|-------------|-------------|
| 1 | Scléromètre (NF EN 12504-2) | `src/pages/essais/nondestructif/SclerometreReport.tsx` | `sclerometre-report` | portrait |
| 2 | Ultrasons (NF EN 12504-4)   | `src/pages/essais/nondestructif/UltrasonReport.tsx`    | `ultrason-report`    | portrait |

## Changements appliqués (identiques Lot 2/3/4)

- Import de `PrintService` + `PrintService.registerTemplate(...)` au chargement du module.
- Remplacement de `window.print()` par `PrintService.print({ title, orientation })`.
- Suppression de `downloadReportAsPDF` + `toast` (rasterisation `jsPDF/html2canvas`) — le bouton **Télécharger PDF** invoque désormais la même route native (Microsoft Print to PDF / Enregistrer en PDF) que **Imprimer**, garantissant un rendu strictement identique.
- Ajout des attributs `data-print-root` et `data-print-template="<id>"` sur le conteneur racine du rapport (celui déjà porteur de `data-ref="report"`).
- Suppression des `<style>{@media print}</style>` inline propres à chaque page : la logique d'isolation est maintenant exclusivement portée par `src/styles/print.css` (importé globalement depuis `src/index.css`).

## Interdictions respectées
- Aucun appel à `html2canvas`, `jsPDF`, `html2pdf`, `canvas.toDataURL`, JPEG/PNG dans les fichiers migrés.
- Rendu 100 % vectoriel — QR Code (`ReportHeader`), tableaux, signatures et textes restent sélectionnables et zoomables sans perte.

## Métier — inchangé
- Hooks `useEchantillonSclerometre` / `useEchantillonUltrason` : intacts.
- Calculs (médiane scléro, `V = L/T × 1000`, qualité, barème) : intacts.
- Archivage, SHA-256, QR Code, workflows, signatures électroniques : non touchés.

## Charte graphique
- En-tête `ReportHeader` (logo + QR Code) commun à toutes les familles.
- Tableau d'identification 4 colonnes 1/6-1/3-1/6-1/3, `px-3 py-1.5 text-sm`, bordures noires — homogène avec Compression / Carottage / Traction / Module / Perméabilité.
- Résultats et synthèse en tableaux `border-collapse`, `text-sm`, alignement centré pour les valeurs numériques.
- Signatures en grille 2 colonnes centrées en bas de page.

## Pagination
- Utilisation du CSS global `print.css` (`page-break-inside: avoid` sur `table`, `h3`, signatures) — aucun tableau coupé, aucune signature orpheline.
- Format A4 portrait, marges par défaut `print.css`.

## Validation identité de rendu
Les 4 flux ci-dessous partagent maintenant exactement le même pipeline (`PrintService.print` → `window.print()` natif → boîte de dialogue navigateur) :
1. Aperçu impression
2. Impression physique
3. Microsoft Print to PDF
4. Enregistrer en PDF (Chrome/Edge)

Aucune divergence de pagination, marges, polices, tableaux, QR Codes, signatures ou alignements possible.

## Type-check
`0 erreur TypeScript` (imports obsolètes `downloadReportAsPDF` et `toast` supprimés, `useEffect` non introduit).

## Points restant à améliorer (hors lot)
- Harmoniser à terme la structure `report-page` A4 dédiée (comme Compression Lot 2) pour un contrôle pixel-perfect de la hauteur utile — actuellement les rapports NDT reposent sur `print.css` global, ce qui reste conforme mais moins strict.
- Introduire, si besoin métier, un graphique vectoriel SVG de distribution des indices (scléro) et des vitesses (US) — à traiter dans un lot UX ultérieur, hors périmètre impression.

## STOP
Fin du LOT 5. En attente de validation avant LOT 6.
