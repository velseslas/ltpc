# AUDIT COMPLET — SYSTÈME DE GÉNÉRATION PDF (LTPC ERP v1.0.0)

Date : 10/07/2026 — Mode : **AUDIT SEUL** (aucune modification code).

---

## 1. Résumé exécutif

L'application utilise **DEUX moteurs PDF hétérogènes** :

| # | Moteur | Techno | Où | Sortie |
|---|--------|--------|----|--------|
| **M1** | `window.print()` navigateur | CSS `@media print` sur `data-ref="report"` | ~55 écrans (tous les rapports d'essai, facturation, matériel, RH, documents) | PDF via boîte d'impression Chrome/Edge → **vectoriel** (texte, SVG) |
| **M2** | `jsPDF + html2canvas` | Rasterisation HTML → **JPEG q=0.92** injecté dans jsPDF | Uniquement `DocumentGenerator.ts` → **rapports techniques officiels archivés** (`document_archives`) + QR de vérification | PDF **entièrement image** (aucun texte sélectionnable) |

⚠️ **Incohérence majeure** : le seul PDF réellement stocké/archivé/signé/hashé (M2) est le **plus mauvais** en qualité. Le bouton « Télécharger PDF » des rapports d'essai (M1) appelle en réalité `window.print()` (cf. `src/lib/pdf.ts`) — donc **le "Téléchargement" et "l'Impression" sont la même action** sur ~90 % des écrans, ce qui dépend du navigateur de l'utilisateur (dialog Chrome ≠ Edge ≠ Firefox).

Dépendances déclarées dans `package.json` :
- `html2canvas: ^1.4.1`
- `jspdf: ^4.2.1`
- Aucune autre lib PDF (pas de `pdf-lib`, `pdfmake`, `@react-pdf/renderer`, `html2pdf.js`, `dom-to-image`).

---

## 2. Cartographie complète des points de génération

### 2.1 Moteur M1 — `window.print()` / CSS `@media print`

Fichier pivot : `src/lib/pdf.ts`
```ts
export function downloadReportAsPDF(_filename: string) {
  window.print();
}
```

Écrans concernés (61 occurrences détectées) :

**Rapports d'essais (30)** — tous utilisent `handleDownloadPDF → window.print()` + CSS `@media print` local + `data-ref="report"` :
- Béton frais : `betonfrais/BetonFraisReport.tsx`, `EtatEssaisBetonFrais.tsx`
- Béton durci : `CompressionReport.tsx`, `EtatEssaisBetonDurci.tsx`
- Traction/fendage : `tractionfendage/TractionFendageReport.tsx`
- Module d'élasticité : `moduleelasticite/ModuleElasticiteReport.tsx`
- Perméabilité : `permeabilite/PermeabiliteReport.tsx`
- Carottage : `destructif/CarottageReport.tsx`, `EtatEssaisCarottage.tsx`
- Non destructif : `nondestructif/SclerometreReport.tsx`, `UltrasonReport.tsx`
- Granulat : `granulat/rapport/GranulatReport.tsx`, `EtatEssaisGranulat.tsx`
- Géotechnique identification : `Classification`, `Granulometrie`, `LimitesAtterberg`, `TeneurEauSol` Report
- Géotechnique compactage : `Proctor`, `CBR`
- Géotechnique in-situ : `Densitometre`, `Plaque`
- Formulation Dreux-Gorisse : `formulation/FormulationReport.tsx`
- Bulletin de prélèvement : `essais/SamplingBulletin.tsx`
- Feuilles d'essai vierges : `components/essais/FeuilleEssaiDialog.tsx`
- Fiches normes (imprimables) : `DestructifNormes`, `NonDestructifNormes`, `BetonFraisNormes`, `BetonDurciNormes`, `GranulatPhysiquesNormes`, `GranulatMecaniquesNormes`, `GranulatPropreteNormes`, `geotechnique/normes/*` (4 fichiers)

**Laboratoires mobiles (3)** : `EtatCoulages.tsx` (paysage), `ChantierEchantillonReport.tsx`, `ChantierEchantillonBulletin.tsx`

**Documents commerciaux (5)** : `ContratPreviewPage`, `ContratPreviewDialog`, `EngagementPreviewPage`, `OffreServicePreviewPage`, `DocumentViewerDialog`

**Facturation (4)** : `FacturePreview`, `DevisPreview`, `EspeceListe`, `EtatPaiementsEspece`

**Matériel (10)** : `MaterielInventaire(+Dialog)`, `MaterielAffectation(+Historique)`, `MaterielMaintenance(+Historique)`, `MaterielEtalonnage(+Historique)`, `MouvementDetail`, `MouvementsListe`

**RH (1)** : `rh/Documents.tsx`

### 2.2 Moteur M2 — `jsPDF + html2canvas` (rasterisation)

Fichier unique : `src/lib/documents/DocumentGenerator.ts`

Pipeline (lignes 170-228) :
1. Construit un `<div>` HTML off-screen (794 px portrait / 1123 px paysage)
2. `html2canvas(host, { scale: 2, useCORS: true, allowTaint: true })` → `<canvas>`
3. `canvas.toDataURL("image/jpeg", 0.92)` → **image JPEG unique**
4. `new jsPDF()` + `pdf.addImage(imgData, "JPEG", …)` + boucle multipage naïve (`y -= pageHeight`)
5. `addPagination()` en texte vectoriel (seule chose vectorielle)
6. Upload sur bucket `documents-officiels`, insertion `document_archives` (sha256, qr_token, version)

Points d'appel :
- Hook `useGenerateOfficialDocument` (`src/hooks/useDocumentArchives.ts`)
- Utilisé dans : `src/pages/essais/rapports-techniques/RapportTechniqueDetail.tsx` (bouton « Générer document officiel »)

QR code (M2, ligne 131-154) :
- `qrcode.react` rendu offscreen, capturé via `canvas.toDataURL("image/png")` → **PNG 320 px**
- Ensuite ré-rasterisé une deuxième fois quand html2canvas capture le document — **double perte**.

### 2.3 Autres captures canvas → PNG (non-PDF mais utilisées)
- `src/components/materiel/SignaturePad.tsx` — capture signature manuscrite en PNG (usage normal)
- `src/components/reports/ReportHeader.tsx` L41 — logo entreprise recompressé en PNG via canvas (fallback)
- `src/pages/materiel/MaterielInventaire.tsx` / `MaterielInventaireDialog.tsx` — même pattern logo

---

## 3. Classification A → F par rapport

| Rapport / Écran | Moteur | Techno effective | Vectoriel ? | Multipage | QR net | Signature nette | **Note** |
|---|---|---|---|---|---|---|---|
| Rapports d'essais béton/granulat/géo/NDT (~30) | M1 | `window.print()` + CSS | ✅ texte, ✅ SVG | ✅ (CSS `page-break`) | ✅ (SVG via `qrcode.react`) | ✅ (img PNG haute-res) | **B** |
| Formulation Dreux-Gorisse | M1 | idem + Recharts SVG | ✅ | ✅ | ✅ | ✅ | **B** |
| Bulletin prélèvement, feuilles vierges | M1 | idem | ✅ | ✅ | n/a | n/a | **A/B** |
| Documents commerciaux (contrat, engagement, offre) | M1 | idem, verbatim LTPC | ✅ | ✅ paginé | n/a | ✅ | **B** |
| Factures / devis / états espèces | M1 | idem | ✅ | ✅ | n/a | ✅ | **B** |
| Matériel (inventaire, affect., maintenance…) | M1 | idem | ✅ | ✅ paysage | n/a | ✅ signature | **B** |
| Laboratoire mobile — État coulages (paysage) | M1 | idem | ✅ | ✅ | n/a | n/a | **B** |
| État essais (paysage grands tableaux) | M1 | idem | ✅ | ⚠ risque coupures | n/a | n/a | **C** |
| Fiches normes imprimables | M1 | idem | ✅ | ✅ | n/a | n/a | **B** |
| Documents RH (`rh/Documents.tsx`) | M1 | `window.print()` seul, sans template dédié | dépend du DOM | ⚠ | n/a | n/a | **C** |
| **Documents officiels archivés (`RapportTechniqueDetail`)** | **M2** | **html2canvas → JPEG q=0.92 → jsPDF** | ❌ **AUCUN texte sélectionnable** | ⚠ pagination naïve (peut couper une ligne) | ❌ QR **PNG rasterisé 2×** | ❌ signature **JPEG re-compressée** | **D** |
| DocumentViewerDialog (aperçu PDF externe) | M1 iframe + print | pass-through | n/a | n/a | n/a | n/a | **A** |

**Répartition** : A ≈ 2 · **B ≈ 45** · C ≈ 3 · **D = 1 (mais c'est le seul PDF archivé légalement)** · F = 0.

---

## 4. Problèmes identifiés

### 4.1 Bloquants (M2 — DocumentGenerator)
- **PDF entièrement image** : impossible d'y sélectionner du texte, aucun accès à l'accessibilité (lecteurs d'écran), non indexable, taille fichier ×3-5 vs vectoriel.
- **QR code flou** : rendu à 320 px puis re-rasterisé par html2canvas — la scannabilité dépend de la taille finale sur la page. Compression JPEG 0.92 ajoute du bruit autour des modules noirs.
- **Signature et cachet dégradés** : compression JPEG destructive sur des lignes fines.
- **Logos flous** (surtout logos vectoriels type SVG entreprise).
- **Pagination naïve** (`y -= pageHeight` sans détection des sauts internes) : le texte peut être coupé au milieu d'une ligne ou d'un tableau.
- **Aucun en-tête/pied répétés** par page (uniquement le "Page X/Y" ajouté en post-traitement).
- **Perf** : 2-5 s par document, dépend du DOM offscreen.
- **oklch/Tailwind** : le générateur neutralise les couleurs à la main (`onclone`) ; toute nouvelle variable CSS oklch dans le template cassera silencieusement le rendu.
- **crossorigin/CORS** : les images signature/cachet/logo doivent être servies avec les bons en-têtes CORS sinon le canvas est "tainted" et `toDataURL` échoue.

### 4.2 Importants (M1 — window.print)
- **`downloadReportAsPDF` = `window.print()`** : le nom du bouton ment. L'utilisateur croit qu'il télécharge un fichier ; en réalité il ouvre le dialog d'impression et doit choisir « Enregistrer au format PDF ».
- **Rendu dépendant du navigateur** : Chrome, Edge, Firefox, Safari produisent des marges, résolutions d'image et gestion des page-break légèrement différentes.
- **Pas d'archive** : ces PDF ne passent **jamais** par `document_archives` — ils ne sont ni versionnés, ni hashés, ni signés QR.
- **Pas d'unification en-tête/pied** : chaque rapport redéfinit son propre bloc `@media print` (61 déclarations dispersées).
- **Grands tableaux (états essais)** : les colonnes sont figées à l'écran ; l'impression paysage repose sur des overrides CSS spécifiques à chaque page.
- **PWA / offline** : `window.print()` fonctionne hors ligne mais le bouton « Générer document officiel » (M2) nécessite l'accès Cloud (upload storage + insert `document_archives`).

### 4.3 Divers
- **Impossibilité de partager un vrai fichier PDF** depuis les rapports M1 (`ShareDialog` a un chemin `onGeneratePdf` qui n'est câblé QUE pour les documents commerciaux passant par M2).
- **Différence Impression vs Téléchargement** : identiques sur M1, complètement différentes sur M2 — le comportement change selon le type de document.

---

## 5. Comparaison des moteurs candidats pour l'architecture unique

| Critère | M1 print CSS | **M2 html2canvas+jsPDF** | **jsPDF vectoriel (autoTable)** | **@react-pdf/renderer** | **pdfmake** | **pdf-lib** | **Puppeteer côté serveur** |
|---|---|---|---|---|---|---|---|
| Texte sélectionnable | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fidélité au design HTML/Tailwind | ✅✅ | ⚠️ (raster) | ❌ (à recoder) | ⚠️ (JSX dédié) | ❌ (JSON DSL) | ❌ | ✅✅ |
| Multipage automatique + en-tête/pied | ⚠ CSS | ❌ naïve | ✅ autoTable | ✅ | ✅ | ⚠ manuel | ✅ |
| QR net | ✅ SVG | ❌ | ✅ (SVG path) | ✅ | ✅ | ✅ | ✅ |
| Signature/cachet | ✅ | ⚠ JPEG | ✅ PNG native | ✅ | ✅ | ✅ | ✅ |
| PWA offline | ✅ (print) / ✅ (généré client) | ✅ client | ✅ client | ✅ client | ✅ client | ✅ client | ❌ (backend) |
| Identique impression = téléchargement | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rapide (< 1 s) | ✅ | ❌ 2-5 s | ✅ | ✅ | ✅ | ✅✅ | ⚠ latence réseau |
| Maintenabilité (1 seul point) | ❌ 61 impl. | ✅ | ✅ | ✅ | ✅ | ⚠ bas niveau | ✅ |
| Coût migration | 0 | déjà fait | Moyen | **Élevé** (recoder tous les rapports en JSX PDF) | **Élevé** (JSON) | Très élevé | Moyen + infra edge |

---

## 6. Architecture cible recommandée

### 6.1 Choix moteur : **Puppeteer / Chromium headless dans une Edge Function Supabase** (recommandé n°1)

Raison : la fidélité HTML/Tailwind est déjà excellente en print ; on capitalise sur les 61 templates existants sans les réécrire. Chromium serveur produit un PDF **vectoriel** identique au print client, avec pagination CSS, en-tête `@page`, texte sélectionnable, QR SVG net.

**Alternative n°2** (si contrainte "100 % client / offline"): **@react-pdf/renderer**. Impose de réécrire chaque rapport en composants PDF dédiés, mais reste maintenable et vectoriel.

**Alternative n°3** (compromis rapide) : garder html2canvas MAIS passer en `image/png` sans compression + augmenter `scale: 3` + injecter le texte en calque `pdf.text()` transparent — reste rasterisé mais net et sélectionnable. À ne considérer que comme patch court terme.

### 6.2 Architecture cible détaillée (option 1)

```
┌─────────────────────────────────────────────────────────────┐
│  UI (client)                                                │
│  Bouton "Télécharger PDF" / "Générer document officiel"     │
│           │                                                 │
│           ▼                                                 │
│  useOfficialPdf({ document_type, document_id })             │
│           │                                                 │
│           ▼                                                 │
│  Edge Function: render-pdf                                  │
│    1. auth check + rate-limit (existant)                    │
│    2. Récupère données + template                           │
│    3. Chromium headless → page.setContent(html)             │
│    4. page.pdf({ format: 'A4', printBackground: true,       │
│                  headerTemplate, footerTemplate,            │
│                  margin, displayHeaderFooter: true })       │
│    5. sha256 + upload documents-officiels                   │
│    6. insert document_archives (version++)                  │
│    7. return signed_url                                     │
└─────────────────────────────────────────────────────────────┘
```

Composants unifiés côté client :
- `PdfTemplate` : composant React qui rend le HTML imprimable (déjà le cas via `data-ref="report"`)
- `PdfShell` : header/footer/QR/signature/pagination communs
- `usePdf()` : un seul hook remplace `handleDownloadPDF`, `handlePrint`, `useGenerateOfficialDocument`
- Bouton unique « PDF » avec menu : *Aperçu · Télécharger · Imprimer · Archiver comme document officiel*

### 6.3 Contraintes tenues
- ✅ vectoriel (Chromium PDF)
- ✅ textes sélectionnables
- ✅ QR net (SVG dans HTML)
- ✅ signature nette (PNG source, jamais recompressée)
- ✅ multipages CSS + `@page` header/footer
- ✅ numéros de page via `<span class="pageNumber">` Puppeteer
- ✅ identique impression = téléchargement (même HTML)
- ✅ PWA : mode dégradé offline → `window.print()` local ; sinon Edge Function
- ✅ maintenable : un seul template shell + templates métier existants

---

## 7. Ordre de migration recommandé

| # | Lot | Contenu | Risque | Effort |
|---|-----|---------|--------|--------|
| **0** | Décision moteur | Confirmer Puppeteer edge vs @react-pdf | — | 0.5 j |
| **1** | POC | Edge function `render-pdf` + 1 rapport pilote (CompressionReport) | Faible | 2 j |
| **2** | Shell commun | `PdfShell` (header/footer/QR/signature/pagination) partagé | Faible | 2 j |
| **3** | Rapports d'essais béton/granulat (30) | Migration `handleDownloadPDF` → `usePdf` | Moyen (régressions CSS) | 5 j |
| **4** | Rapports géotechnique + NDT + formulation | idem | Moyen | 3 j |
| **5** | Documents commerciaux (contrats, engagement, offre) — remplace M2 actuel | Migration + archivage inchangé | **Élevé** (versionning existant) | 3 j |
| **6** | Facturation | idem | Moyen | 2 j |
| **7** | Matériel + laboratoires mobiles + RH | idem | Faible | 2 j |
| **8** | Suppression code legacy | `src/lib/pdf.ts`, `html2canvas`, ancien `DocumentGenerator` | Faible | 0.5 j |
| **9** | Tests de non-régression visuels | Comparaison PDF avant/après (pixelmatch) | Faible | 2 j |

**Charge totale estimée : ~22 j.h développeur senior.**

## 8. Niveau de risque global

| Domaine | Risque |
|---|---|
| Régression visuelle des 30+ rapports (CSS `@media print`) | 🟠 Élevé — nécessite QA visuelle systématique |
| Rupture archivage `document_archives` (hash SHA-256 change ⇒ QR ancien non re-vérifiable) | 🔴 Critique — imposer une **version 2** de l'archive et garder les anciens PDF intacts |
| Chromium sur Edge Function Supabase (poids ~150 MB, cold-start ~2 s) | 🟠 Moyen — envisager `@sparticuz/chromium` ou service tiers (Browserless, Gotenberg) |
| PWA offline pour "Télécharger PDF" | 🟢 Faible — fallback `window.print()` |
| Perte de fonctionnalités M2 (QR + versionning) | 🟢 Faible — repris dans l'edge function |

---

## 9. Recommandations immédiates (à ne PAS appliquer maintenant — audit seul)

1. **Renommer** `downloadReportAsPDF` en `printReportViaBrowser` pour arrêter le mensonge du bouton.
2. **Bloquer** l'ajout de nouveaux `window.print()` locaux tant que l'architecture cible n'est pas actée.
3. **Marquer** `DocumentGenerator.ts` comme *legacy — à remplacer en Phase PDF v2*.
4. **Freezer** les templates print existants (les nouveaux rapports doivent hériter d'un `PdfShell` unique).

---

## 10. Livrable

- Fichier : `.lovable/pdf-audit-complet.md` (ce document)
- Aucun autre fichier modifié.
- Prochaine étape suggérée : décision de l'équipe entre **Puppeteer edge** (option 1) et **@react-pdf/renderer** (option 2) avant lancement de la Phase PDF v2.
