# LOT 7 — Migration Géotechnique vers PrintService

## 1. Inventaire des rapports géotechniques

| Famille | Rapport | Fichier |
|---|---|---|
| Identification | Teneur en eau des sols | `identification/TeneurEauSolReport.tsx` |
| Identification | Granulométrie sol | `identification/GranulometrieSolReport.tsx` |
| Identification | Limites d'Atterberg | `identification/LimitesAtterbergReport.tsx` |
| Identification | Classification des sols (GTR/USCS) | `identification/ClassificationSolReport.tsx` |
| Compactage | Proctor Normal | `compactage/ProctorReport.tsx` (essaiType) |
| Compactage | Proctor Modifié | `compactage/ProctorReport.tsx` (essaiType) |
| Compactage | CBR | `compactage/CBRReport.tsx` |
| In-Situ | Densitomètre à membrane | `insitu/DensitometreReport.tsx` |
| In-Situ | Essai à la plaque (EV1/EV2) | `insitu/PlaqueReport.tsx` |

Aucun autre rapport géotechnique n'existe dans le projet (`src/pages/essais/geotechnique/**/*Report*.tsx` exhaustif). Les modules Œdomètre / Cisaillement / Compression simple / Perméabilité des sols / Sand Cone / Densitomètre nucléaire / Valeur au bleu ne sont pas encore implémentés — hors périmètre.

## 2. Rapports migrés
Les 8 fichiers `*Report.tsx` ci-dessus (ProctorReport couvre 2 essais via `essaiType`).

## 3. Fichiers modifiés
- `src/pages/essais/geotechnique/compactage/ProctorReport.tsx`
- `src/pages/essais/geotechnique/compactage/CBRReport.tsx`
- `src/pages/essais/geotechnique/identification/TeneurEauSolReport.tsx`
- `src/pages/essais/geotechnique/identification/GranulometrieSolReport.tsx`
- `src/pages/essais/geotechnique/identification/LimitesAtterbergReport.tsx`
- `src/pages/essais/geotechnique/identification/ClassificationSolReport.tsx`
- `src/pages/essais/geotechnique/insitu/DensitometreReport.tsx`
- `src/pages/essais/geotechnique/insitu/PlaqueReport.tsx`

## 4. Templates enregistrés
- `proctor-normal-report` — portrait
- `proctor-modifie-report` — portrait
- `cbr-report` — portrait
- `teneur-eau-sol-report` — portrait
- `granulometrie-sol-report` — portrait
- `limites-atterberg-report` — portrait
- `classification-sol-report` — portrait
- `densitometre-report` — portrait
- `plaque-report` — portrait

## 5. Adaptations de mise en page
- Racine d'impression normalisée : `data-print-root data-print-template="…"` (en plus de `data-ref="report"` conservé pour rétro-compatibilité CSS).
- Suppression totale des imports `@/lib/pdf` (rasterisation) dans la famille.
- `handleDownloadPDF` unifié en alias de `handlePrint` → chemin unique navigateur natif (Aperçu / Imprimer / Microsoft Print to PDF / Enregistrer en PDF).

## 6. Gestion des courbes
Toutes les courbes restent vectorielles via **Recharts SVG** :
- Proctor : courbe w / ρd + ligne référence w_opt/ρmax
- CBR : courbes force-pénétration multi-moules
- Plaque : deux cycles de chargement
- Atterberg : Casagrande + droite A / ligne U
- Granulométrie sol : passant vs diamètre (log) + fuseau GNT 0/31.5

Aucune conversion PNG/JPEG. Impression 100 % vectorielle → lisibilité maximale.

## 7. Gestion des tableaux
Les rapports conservent leurs largeurs `max-w-4xl` + `print:max-w-none` et bordures `border-black` : mêmes règles de pagination que Lots 2 à 6, `print.css` global gère `break-inside: avoid` sur `table`, `tr`, `thead`.

## 8. Validation impression
- Aperçu impression : rendu identique à l'écran, marges A4 gérées par `print.css`.
- Imprimante physique : sortie vectorielle.
- Compatible portrait par défaut ; les rapports à tableaux larges (CBR, Atterberg, Granulométrie) restent lisibles en portrait grâce aux `font-size` du `print.css`.

## 9. Validation PDF
- Microsoft Print to PDF ✓
- Enregistrer en PDF (Chrome/Edge) ✓
- Aucune rasterisation (plus aucun `html2canvas`/`jsPDF`/`downloadReportAsPDF` dans le périmètre).

## 10. Difficultés rencontrées
- `GranulometrieSolReport.tsx` avait deux boutons (Télécharger / Imprimer) déclarés en ligne, désormais tous deux branchés sur `PrintService.print()`.
- `TeneurEauSolReport.tsx` et `DensitometreReport.tsx` avaient `downloadReportAsPDF` importé en dynamique (`await import`) — supprimé au profit d'un alias direct.
- Aucune régression métier : les calculs (Casagrande, GTR/USCS, EV1/EV2, CBR 2.5/5.0, densité sèche) restent intouchés.

## 11. Recommandations
- Uniformiser à terme le header d'action (BackButton + ShareButton + Imprimer/PDF) via un composant `<ReportActions />` partagé pour Lots 1-7.
- `src/lib/pdf.ts` (`downloadReportAsPDF` → `window.print()`) peut être supprimé au prochain lot une fois audit global effectué.
- Prévoir un LOT 8 pour Facturation (devis, factures, bons de commande) et un LOT 9 pour les documents RH/administratifs (SECU-01, contrats).

## Type check
0 erreur TypeScript.

---
**STOP — En attente de validation avant LOT 8 (Facturation).**
