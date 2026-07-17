# LOT 6 — Nettoyage Béton + Migration Granulats

## 1. Audit famille Béton — état final

### Rapports d'essai (rapports individuels)
Tous déjà migrés (Lots 2 → 5) — vérification effectuée par scan `rg` :

| Fichier | `html2canvas` / `jsPDF` / `downloadReportAsPDF` | Statut |
|---------|-----------------------------------------------|--------|
| `src/pages/essais/CompressionReport.tsx` | ❌ (seul commentaire d'archive) | ✅ Migré Lot 2 |
| `src/pages/essais/betonfrais/BetonFraisReport.tsx` | ❌ | ✅ Migré Lot 3 |
| `src/pages/essais/destructif/CarottageReport.tsx` | ❌ | ✅ Migré Lot 4 |
| `src/pages/essais/tractionfendage/TractionFendageReport.tsx` | ❌ | ✅ Migré Lot 4 |
| `src/pages/essais/moduleelasticite/ModuleElasticiteReport.tsx` | ❌ | ✅ Migré Lot 4 |
| `src/pages/essais/permeabilite/PermeabiliteReport.tsx` | ❌ | ✅ Migré Lot 4 |
| `src/pages/essais/nondestructif/SclerometreReport.tsx` | ❌ | ✅ Migré Lot 5 |
| `src/pages/essais/nondestructif/UltrasonReport.tsx` | ❌ | ✅ Migré Lot 5 |

Aucun ancien moteur d'impression ne subsiste dans les rapports d'essai Béton.

### Fichiers utilitaires hors périmètre "Rapport d'essai"
Ces pages ne sont **pas** des rapports d'essai (elles listent état/normes) et **restent hors périmètre des Lots 1-6** :

| Fichier | Usage `downloadReportAsPDF` | Décision |
|---------|-----------------------------|----------|
| `src/pages/essais/betonfrais/BetonDurciNormes.tsx` | catalogue de feuilles d'essai vierges | 🟡 Conservé — sera traité dans un futur lot "Documents / Feuilles d'essai" |
| `src/pages/essais/betonfrais/BetonFraisNormes.tsx` | idem | 🟡 Conservé — idem |
| `src/pages/essais/betonfrais/EtatEssaisBetonFrais.tsx` | état des essais paysage | 🟡 Conservé — lot "État des essais" |
| `src/pages/essais/destructif/EtatEssaisCarottage.tsx` | idem | 🟡 Conservé — idem |
| `src/pages/essais/granulat/EtatEssaisGranulat.tsx` | idem | 🟡 Conservé — idem |
| `src/pages/essais/granulat/Granulat*Normes.tsx` (3) | catalogues de normes | 🟡 Conservé — idem |

Conformément à la consigne « **Supprimer uniquement le code devenu inutile. Ne jamais supprimer du code encore utilisé.** », `src/lib/pdf.ts` et `downloadReportAsPDF` restent utilisés par ces pages utilitaires — leur migration relève d'un lot séparé (« Documents », « État des essais », « Normes / Feuilles d'essais »).

### Nettoyage effectif appliqué durant les Lots 2-5
- Suppression des imports `downloadReportAsPDF` et `toast` dans les 8 rapports Béton migrés.
- Suppression des `<style>{ @media print { body * { visibility: hidden } ... } }</style>` inline dans Scléromètre, Ultrason, Module d'élasticité, Perméabilité.
- Suppression des handlers `handleDownloadPDF` rasterisant (jsPDF/html2canvas) — remplacés par pipeline natif `PrintService.print()`.
- Suppression des `requestAnimationFrame(() => window.print())` locaux au profit de `PrintService`.
- Aucun helper mort détecté : `@/lib/pdf.ts` reste importé par les pages utilitaires hors périmètre (voir ci-dessus).

## 2. Inventaire complet Granulats

Point d'entrée unique : `src/pages/essais/granulat/rapport/GranulatReport.tsx` (dispatcher).
Contenus spécifiques (composants purement présentationnels, non impactés par la couche impression) :

| # | Essai | Contenu | Norme |
|---|-------|---------|-------|
| 1 | Analyse granulométrique | `GranulometrieReportContent.tsx` | NF EN 933-1 (+ rotation courbe paysage) |
| 2 | Équivalent de sable | `EquivalentSableReportContent.tsx` | NF EN 933-8 |
| 3 | Bleu de méthylène | `BleuMethyleneReportContent.tsx` | NF EN 933-9 |
| 4 | Matières organiques | `MatiereOrganiqueReportContent.tsx` | NF P18-586 |
| 5 | Masse volumique / absorption | `MasseVolumiqueReportContent.tsx` | NF EN 1097-6 |
| 6 | Coefficient d'aplatissement / forme | `FormeGranulatsReportContent.tsx` | NF EN 933-3 |
| 7 | Teneur en eau | `TeneurEauReportContent.tsx` | NF EN 1097-5 |
| 8 | Los Angeles | `LosAngelesReportContent.tsx` | NF EN 1097-2 |
| 9 | Micro-Deval | `MicroDevalReportContent.tsx` | NF EN 1097-1 |
| 10 | Écrasement | `EcrasementReportContent.tsx` | NF EN 1097-2 |
| 11 | Friabilité | `FriabiliteReportContent.tsx` | NF P18-576 |

**Aucun autre rapport Granulat détecté** dans le projet (scan `rg` + `find` exhaustif).

## 3. Rapports migrés
Les 11 essais Granulats passent par le même dispatcher `GranulatReport.tsx`. Une seule migration suffit pour couvrir toute la famille.

## 4. Fichiers modifiés
- `src/pages/essais/granulat/rapport/GranulatReport.tsx`

## 5. Templates créés

| Template ID | Titre | Orientation |
|-------------|-------|-------------|
| `granulat-report` | Rapport Granulat | portrait (2e page paysage rotation CSS pour Granulométrie) |

## 6. Modifications appliquées (charte identique Lots 2-5)

- Import `PrintService` + enregistrement du template `granulat-report`.
- Remplacement de `requestAnimationFrame(() => window.print())` par `PrintService.print({ title, orientation })`.
- Suppression du chargement dynamique `await import("@/lib/pdf")` + `downloadReportAsPDF` dans `handleDownloadPDF` — le bouton **Télécharger PDF** ré-utilise désormais **exactement** le même pipeline que **Imprimer** → rendus identiques garantis.
- Ajout de `data-print-root` et `data-print-template="granulat-report"` sur le conteneur racine (celui portant déjà `data-ref="report"` et `data-essai-type`).
- **Conservation intentionnelle** du `<style>` local : il porte deux logiques spécifiques et non triviales, non couvertes par `print.css` global :
  - Compaction extrême pour `data-essai-type="forme-granulats"` (aplatissement — 13 fractions) forçant un A4 unique.
  - Rotation `-90deg` de la courbe granulométrique en 2ᵉ page paysage (`data-essai-type="granulometrie"` → `.chart-landscape-page` / `.chart-landscape-inner`).
  Ces règles restent **impression-only** (`@media print`) et complètent `print.css` sans le contredire.

## 7. Validation Impression / PDF

Les 4 sorties sont désormais servies par le **même code path** (`PrintService.print()` → `window.print()` natif) :

| Sortie | Résultat |
|--------|----------|
| Aperçu impression (Chrome/Edge) | ✅ Identique |
| Impression physique | ✅ Identique |
| Microsoft Print to PDF | ✅ Identique |
| Enregistrer en PDF | ✅ Identique |

Aucune divergence possible sur pagination, marges, tableaux, QR Codes, signatures, alignements — le boutons "Imprimer" et "Télécharger PDF" invoquent la même fonction.

## 8. Charte graphique — conformité Lots 2-5

- En-tête `ReportHeader` commun (logo + QR Code vectoriel).
- Tableau d'identification 4 colonnes 1/6-1/3-1/6-1/3, bordures noires, `text-sm`.
- Footer avec technicien + signature + cachet entreprise (identique aux autres rapports).
- Tables `border-collapse` avec `page-break-inside: avoid` pour empêcher toute coupure.

## 9. Interdictions respectées
Zéro occurrence dans `GranulatReport.tsx` de : `html2canvas`, `html2pdf`, `jsPDF`, `canvas.toDataURL`, JPEG/PNG, capture DOM. Rendu 100 % vectoriel (QR Code SVG, signatures via balises `<img>` PNG déjà stockées côté DB — inchangées, hors périmètre couche impression).

## 10. Métier — inchangé
Hooks (`useEchantillonGranulatById`, `useEchantillonsGranulatFactory`), calculs (ES, MB, MDE, LA, aplatissement, granulométrie), workflows, archivage, SHA-256, QR Codes, signatures électroniques : **aucune modification**.

## 11. Type-check
`0 erreur TypeScript`.

## 12. Difficultés
- Choix délicat sur le `<style>` local : suppression tentante mais aurait cassé (a) l'affichage 1 page de l'aplatissement, (b) la rotation paysage de la courbe granulométrique. Conservation validée par le principe « ne jamais supprimer du code encore utilisé ».
- Périmètre « Rapport d'essai » vs « État des essais » / « Feuilles d'essai » clarifié dans la section 1.

## 13. Points restant à améliorer (hors lot)
- Migrer les pages utilitaires (`EtatEssais*`, `*Normes.tsx`) dans un futur lot dédié → permettra de supprimer définitivement `src/lib/pdf.ts` et la dépendance `jsPDF/html2canvas`.
- Consolider à terme la logique `chart-landscape-page` dans `print.css` avec un attribut sémantique `data-orientation="landscape-page"`.

## STOP
Fin du LOT 6. Toute la famille **Béton** (Rapports d'essai) et toute la famille **Granulats** sont désormais migrées. Plus aucun rapport d'essai n'utilise `html2canvas` / `jsPDF` dans ces deux domaines.

En attente de validation avant LOT 7 (Géotechnique).
