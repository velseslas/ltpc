# AUDIT TECHNIQUE — Documents RH & Facturation

Date : 2026-07-23 · Périmètre : `src/pages/rh/`, `src/components/rh/`, `src/pages/facturation/`, `src/pages/documents/`, `src/components/documents/`, `src/lib/print/`, `src/styles/print.css`. **Aucune modification de code effectuée.**

---

## 0. SYNTHÈSE EXÉCUTIVE

Les deux modules partagent **un unique pipeline d'impression 100 % HTML/CSS natif** basé sur `window.print()` centralisé dans `src/lib/print/PrintService.ts`. **Aucun canvas, aucun `html2canvas`, aucun `jsPDF`, aucune rasterisation** n'intervient dans le rendu des Documents RH ou de la Facturation. Le PDF produit est **vectoriel** et le texte est **sélectionnable**.

Le bouton « Télécharger PDF » est un **alias direct** de « Imprimer » (`handleDownload = handlePrint`) dans les deux modules. Il n'y a **aucune génération PDF programmatique distincte** : l'utilisateur doit choisir « Enregistrer au format PDF » dans la boîte système du navigateur.

Les problèmes détectés sont donc **CSS/structurels**, pas architecturaux.

| Verdict | RH | Facturation |
|---|---|---|
| Pipeline sain (pas de canvas/image) | 🟢 | 🟢 |
| Aperçu ↔ Impression ↔ PDF cohérents (même DOM) | 🟢 | 🟢 |
| Texte PDF sélectionnable / vectoriel | 🟢 | 🟢 |
| Attestation tient sur 1 page A4 | 🔴 | — |
| Certificat / Avertissement / Contrat protégés du même bug | 🔴 | — |
| Bulletin de paie implémenté | 🔴 | — |
| Contrats / Engagement / Offre : sauts de page A4 fiables | — | 🔴 |
| Bon de commande imprimable | — | 🔴 |
| Avoir / Proforma / Bon de livraison | — | 🔴 (absents) |
| Numérotation page X/Y multi-pages | — | 🟠 |

---

## 1. ARCHITECTURE COMMUNE

### 1.1 Chaîne de rendu

```text
Données Supabase (hooks React Query)
        │
        ▼
Composant page/preview React (JSX + styles inline)
        │
        ▼
DOM HTML unique wrappé :
  <div data-print-root
       data-print-template="<id>"
       data-ref="report"
       style={{ width: "210mm", transform: "scale(--doc-scale)" }}>
    ... contenu réel ...
  </div>
        │
        ├── Aperçu écran : rendu direct, avec scale d'aperçu responsive
        │
        ├── Impression   : PrintService.print()
        │                    → ajoute .print-mode sur <html>
        │                    → @media print applique src/styles/print.css
        │                    → neutralise scale, positionne en fixed inset:0
        │                    → window.print()
        │
        └── Téléchargement PDF : STRICTEMENT identique à Impression
                                 (handleDownload = handlePrint)
```

### 1.2 `PrintService` (`src/lib/print/PrintService.ts:99-127`)

- Ne rasterise rien, n'ouvre pas d'iframe.
- Ajoute sur `<html>` : `print-mode`, `print-orientation-{portrait|landscape}`.
- Modifie `document.title` (nomme le fichier PDF).
- `requestAnimationFrame → window.print()`.
- `afterprint` : cleanup des classes et du titre.
- `registerTemplate()` (`PrintService.ts:64-66`) : registre décoratif — `doPrint()` **ne l'utilise pas** (voir §2.10 problème 🟠).

### 1.3 CSS impression (`src/styles/print.css`)

- `@page { size: A4 portrait; margin: 12mm 12mm 14mm 12mm; }` → zone imprimable utile ≈ **186 × 271 mm**.
- `[data-print-root]` (l.78-97) : `position: fixed; inset: 0; transform: none; zoom: 1; --doc-scale: 1;` — neutralise le scale d'aperçu.
- `[data-print-root] > *, [data-print-root] [data-pdf-page]` (l.101-110) : `width: 100%; position: static`. **Aucune neutralisation de `min-height`** au niveau générique.
- Bloc scoped **existant uniquement** pour `[data-print-template="document-rh"]` (l.186-227) qui neutralise `min-height` et compacte l'attestation.
- **Aucun bloc scoped équivalent** pour `facture-document`, `devis-document`, `contrat-document`, `engagement-document`, `offre-service-document`.

---

## 2. MODULE DOCUMENTS RH

### 2.1 Pipeline détaillé

| Étape | Fichier:ligne |
|---|---|
| Données | `src/hooks/useDocumentsRH.ts:20-31` (métadonnées uniquement — contenu recalculé depuis fiche employé) |
| Sélection & enrichissement | `src/pages/rh/Documents.tsx:70-92` |
| Ouverture aperçu | `Documents.tsx:120-123` (remplace le contenu de la page, pas de Dialog) |
| Wrapper d'impression | `Documents.tsx:429-440` (`data-print-root data-print-template="document-rh" data-ref="report"`) |
| Rendu contenu | `src/components/rh/DocumentPreview.tsx:40-438` |
| Bouton Imprimer | `Documents.tsx:410-413` → `handlePrint` (l.147-152) |
| Bouton Télécharger | `Documents.tsx:414-417` → `handleDownload = doPrint` (l.153) |
| Service d'impression | `PrintService.ts:99-127` |

### 2.2 Types de documents disponibles

| Type | Fichier | Statut |
|---|---|---|
| Attestation de travail | `DocumentPreview.tsx:175-207` | ✅ Rendu implémenté |
| Certificat de travail | `DocumentPreview.tsx:211-250` | ✅ Rendu implémenté |
| Avertissement | `DocumentPreview.tsx:253-320` | ✅ Rendu implémenté |
| Contrat de travail | `DocumentPreview.tsx:322-437` | ✅ Rendu implémenté |
| Bulletin de paie | listé `Documents.tsx:65` | ❌ **Aucune branche** dans `DocumentPreview.tsx` — création autorisée mais aperçu impossible |
| Décision / Congé / Autorisation | — | ❌ Non implémentés, non listés |
| SECU-01 (CNAS) | `src/components/rh/SecuFormDialog.tsx` | ⚠️ Pipeline **séparé** (`window.open` + clonage DOM + `win.print()`, l.130-168) — hors `PrintService` |

### 2.3 Aperçu = Impression = PDF ?

**Oui** pour les 4 types de `DocumentPreview` (même DOM, `data-print-root` extrait en fixed en print).
**Non** pour SECU-01 (fenêtre dupliquée, risque de désynchronisation CSS bundlé).

### 2.4 Recherche Canvas / Image / Rasterisation — RH

Recherche complète sur `Documents.tsx`, `DocumentPreview.tsx`, `SecuFormDialog.tsx`, `EmployeDetail.tsx`, `useDocumentsRH.ts`, `PrintService.ts`, `print.css` des motifs : `canvas`, `HTMLCanvasElement`, `toDataURL`, `toBlob`, `html2canvas`, `dom-to-image`, `jsPDF`, `jspdf`, `pdf-lib`, `pdfmake`, `puppeteer`, `DocumentGenerator`, `image/png`, `getImageData`.

**Résultat : 1 seule occurrence, purement documentaire** — `PrintService.ts:6` (commentaire d'en-tête décrivant la migration hors html2canvas/jsPDF).

**Aucun code actif de rasterisation dans le périmètre RH.** Le logo entreprise est une simple `<img>` (`DocumentPreview.tsx:97`).

### 2.5 Comment fonctionne réellement le « Téléchargement PDF »

`Documents.tsx:153` : `const handleDownload = doPrint;` → alias direct de `handlePrint`. Le bouton n'effectue **aucun téléchargement fichier** : il ouvre la même boîte d'impression système. L'utilisateur doit sélectionner « Enregistrer au format PDF » / « Microsoft Print to PDF ». Libellé **trompeur**.

### 2.6 CSS impression scoped RH (`print.css:186-227`)

- `[data-print-template="document-rh"] > *` : `min-height: 0; height: auto; padding: 4mm 8mm; font-size: 11pt; line-height: 1.5;` — **neutralise** `minHeight: 297mm` + `padding: 40px 50px`.
- `[data-doc-title]` : `margin: 8mm 0 6mm 0`.
- `[data-doc-body]` : `line-height: 1.7; font-size: 11.5pt`.
- `[data-doc-body] p` : `margin-bottom: 5mm`.
- `[data-doc-signature]` : `margin-top: 14mm`.
- `[data-doc-signature] > div` : `margin-bottom: 8mm`.
- `[data-doc-attestation]` : `break-inside: avoid`.

### 2.7 Dimensions fixes dans `DocumentPreview.tsx`

| Valeur | Ligne | Neutralisée en print ? |
|---|---|---|
| `padding: "40px 50px"` (containerStyle) | 79 | 🟢 Oui (`print.css:195`) |
| `minHeight: "297mm"` | 80 | 🟢 Oui (`print.css:193`) |
| `width: "210mm"` | 81 | 🟢 Oui (`print.css:103`) |
| `lineHeight: "1.6"` | 84 | 🟢 Oui (`print.css:196`) |
| **En-tête encadré** `marginBottom: 24px`, `padding: 16px`, logo 96×96, tailles inline `16/12/11px` | 92-135 | 🔴 **NON neutralisé** — aucune règle scoped ne cible le header |
| `margin: "50px 0"` titre | 142 (tag `data-doc-title`) | 🟢 Oui (mais résiduel 14mm) |
| `lineHeight: "2"` bodyStyle | 161 | 🟠 Oui **pour attestation seulement** (via `data-doc-body`) |
| `marginBottom: "20px"` paragraphStyle | 166 | 🟠 Oui **pour attestation seulement** |
| `marginTop: "80px"` signature | 171 | 🟠 Oui **pour attestation seulement** |
| `marginBottom: 60px / 50px` blocs signature | 199,202,242,245,312,315,428,432 | 🟠 Ciblés par `[data-doc-signature] > div` seulement **si l'attribut est posé** — **absent pour certificat, avertissement, contrat** |

### 2.8 Cause probable de la page blanche / page 2 (Attestation)

Zone imprimable A4 = **271 mm** de hauteur.

Malgré la neutralisation de `min-height: 297mm` par `print.css:193`, plusieurs blocs restent **non compactés** en impression :

1. **En-tête encadré** (`DocumentPreview.tsx:90-136`) : `padding: 16px` + `marginBottom: 24px` + logo/QR 96×96px + tailles de police en px explicites — **aucune règle print scoped ne le cible**. Les `!important` de `print.css:195-200` ne s'appliquent qu'au niveau `> *` racine, pas récursivement sur les descendants (donc les `fontSize: "16px/12px/11px"` inline du header restent en px, non convertis en pt).
2. **Titre** `data-doc-title` : résiduel `margin: 8mm 0 6mm 0` = 14mm.
3. **Body** `lineHeight: 1.7` reste généreux.
4. **Signature** : résiduel `margin-top: 14mm` + `margin-bottom: 8mm` × 3 blocs = ~38 mm.

La somme peut dépasser légèrement 271 mm selon la police système Windows et la marge d'impression réelle (Windows ajoute parfois une marge non-imprimable de 5-10 mm), provoquant le débordement d'une ou deux lignes sur une **seconde page quasi vide**.

Pour **Certificat / Avertissement / Contrat**, les data-attributes de compactage **ne sont pas posés** (`DocumentPreview.tsx:216, 241, 287, 311, 328`) — donc **le bug est présent aussi**, non corrigé.

### 2.9 Problèmes RH — classement

#### 🔴 Critique

- **[R-C1]** `DocumentPreview.tsx:216, 241, 287, 311, 328` (certificat, avertissement, contrat) : **absence des attributs** `data-doc-body`, `data-doc-signature`, `data-doc-attestation`, `data-doc-header`. Les règles de compactage `print.css:209-226` ne s'appliquent qu'à l'attestation.
  *Correction* : ajouter les data-attributes sur les 3 branches manquantes.
- **[R-C2]** En-tête RH non compacté en print (`DocumentPreview.tsx:90-136`). Contribue au débordement page 2 sur l'attestation malgré la correction précédente.
  *Correction* : ajouter `data-doc-header` sur le wrapper, cibler dans `print.css` (padding réduit, marginBottom réduit, tailles de police en pt).
- **[R-C3]** `Documents.tsx:61-67` : « Bulletin de paie » listé comme type créable mais **aucun template** dans `DocumentPreview.tsx`. `isDocumentPreviewable()` (l.171-178) l'exclut silencieusement.
  *Correction* : soit retirer de la liste, soit implémenter le template.
- **[R-C4]** `Documents.tsx:153` : `handleDownload = doPrint` — bouton « Télécharger » ne télécharge rien, ouvre juste la boîte d'impression. **Trompeur**.
  *Correction* : soit renommer en « Imprimer / Exporter », soit implémenter une vraie génération PDF (peu recommandé, casserait le pipeline sain).

#### 🟠 Important

- **[R-I1]** `SecuFormDialog.tsx:130-168` : pipeline distinct (`window.open` + clone `outerHTML` + réinjection stylesheets + `win.print()`) au lieu de `PrintService`. Risque de désynchronisation CSS (styles injectés dynamiquement par Vite peuvent ne pas suivre).
  *Correction* : migrer SECU-01 vers `PrintService` + `data-print-root`.
- **[R-I2]** `Documents.tsx:5` : `PrintService.registerTemplate({ id: "document-rh" })` déclaré mais `doPrint()` (l.147-151) n'appelle pas `printCurrentReport("document-rh")` — registre décoratif.
  *Correction* : utiliser `printCurrentReport()` pour bénéficier des metadata.
- **[R-I3]** Styles inline en px/mm mêlés sans `!important` → override par `print.css` fragile, dépendant de la hiérarchie DOM. Toute évolution JSX peut casser silencieusement.
  *Correction* : privilégier des classes CSS dédiées + design tokens.

#### 🟡 Amélioration

- **[R-A1]** Aperçu remplace le contenu de la page au lieu d'utiliser un Dialog (incohérent avec les Dialogs utilisés lignes 328, 499 du même fichier).
- **[R-A2]** `DocumentPreview.tsx:38` : `fontFamily: 'Times New Roman'` inline entre en conflit avec `print.css:115` (`Arial, Helvetica`) — l'inline gagne, `print.css` silencieusement ignoré.
- **[R-A3]** `Documents.tsx:437` : `calc((1 - var(--doc-scale, 0.85)) * -297mm)` — hack de compensation du scale, fragile.

#### 🟢 Conforme

- Aucune rasterisation/canvas dans le pipeline RH.
- `[data-print-root]` et masquage chrome bien conçus.
- `useDocumentsRH` propre et découplé.

---

## 3. MODULE FACTURATION

### 3.1 Pipeline détaillé

| Étape | Fichier:ligne |
|---|---|
| Données | `useFacture`, `useDevis`, `useContratsDocuments` (`src/hooks/useDocuments.ts`), `useEntreprise` |
| Aperçu Facture | `src/pages/facturation/FacturePreview.tsx:80-292` |
| Aperçu Devis | `src/pages/facturation/DevisPreview.tsx` |
| En-tête partagé | `src/components/documents/DocumentPageHeader.tsx:25-53` |
| Aperçu Contrat | `src/pages/documents/ContratPreviewPage.tsx:169+254` (+ `ContratPreviewDialog.tsx`) |
| Aperçu Engagement | `src/pages/documents/EngagementPreviewPage.tsx:168` |
| Aperçu Offre Service | `src/pages/documents/OffreServicePreviewPage.tsx:207` |
| État paiements espèce | `src/pages/facturation/EtatPaiementsEspece.tsx:20-25, 177` (landscape) |
| Bouton Imprimer | Ex. `FacturePreview.tsx:102-105` |
| Bouton Télécharger | `handleDownload = doPrint` (Facture:106, Devis:99, Contrat:101, Engagement:101, OffreService:112) |
| Fallback global | `src/lib/pdf.ts:1-3` — `downloadReportAsPDF() { window.print(); }` |

### 3.2 Types de documents facturation

| Type | Preview implémenté ? | Route |
|---|---|---|
| Facture | ✅ `FacturePreview.tsx` | `/facturation/factures/:id/apercu` |
| Devis | ✅ `DevisPreview.tsx` | `/facturation/devis/:id/apercu` |
| État paiements espèce | ✅ (landscape) | via `EtatPaiementsEspece.tsx` |
| Contrat commercial | ✅ 6 pages logiques | via `ContratPreviewPage.tsx` |
| Lettre d'engagement | ✅ | via `EngagementPreviewPage.tsx` |
| Offre de service | ✅ | via `OffreServicePreviewPage.tsx` |
| **Bon de commande** | ❌ Formulaire seul (`routes/facturationRoutes.tsx:47-48`) — **aucune preview** | — |
| **Avoir** (note crédit) | ❌ Aucun fichier trouvé | — |
| **Proforma** | ❌ Aucun fichier trouvé | — |
| **Bon de livraison** | ❌ Aucun fichier trouvé | — |

### 3.3 Recherche Canvas / Image / Rasterisation — Facturation

Recherche complète sur `src/pages/facturation`, `src/pages/documents`, `src/components/documents` des motifs canvas/html2canvas/jsPDF/toDataURL/toBlob/DocumentGenerator/image.

**Résultat : 0 occurrence.**

- `html2canvas` et `jspdf` présents dans `package.json` mais utilisés **uniquement** dans les rapports d'essais labo (`RapportTechniquePrintView.tsx`, `CompressionReport.tsx`) — **hors périmètre**.
- `DocumentGenerator.ts` importé uniquement par `useDocumentArchives` et `DocumentRepository`, **jamais** par les composants Facture/Devis/Contrat/Engagement/OffreService.

**Le pipeline Facturation est 100 % HTML/CSS vectoriel.**

### 3.4 Aperçu = Impression = PDF ?

**Oui, DOM strictement identique** pour les 3 chemins. Différence unique : classes `.print-mode` sur `<html>` + règles `@media print`.

### 3.5 CSS impression appliqué

- Règles génériques `print.css:20-185` (voir §1.3).
- **Aucun bloc scoped** pour `facture-document`, `devis-document`, `contrat-document`, `engagement-document`, `offre-service-document`.
- `data-print-template` recensés : `facture-document` (`FacturePreview.tsx:155`), `devis-document` (`DevisPreview.tsx:147`), `contrat-document` (`ContratPreviewPage.tsx:169`, `ContratPreviewDialog.tsx:102`), `engagement-document` (`EngagementPreviewPage.tsx:168`), `offre-service-document` (`OffreServicePreviewPage.tsx:207`), `etat-paiements-espece` (`EtatPaiementsEspece.tsx:177`).

### 3.6 Dimensions fixes

- `width: "210mm"` sur `data-print-root` — 🟢 neutralisé par `print.css:101-110`.
- **`minHeight: "1100px"`** sur `pageStyle`, dupliqué à l'identique dans Facture (`:24`), Devis (`:24`), Contrat (`:21`), Engagement (`:21`), OffreService (`:24`) — 🔴 **non neutralisé** (contrairement à RH).
- `zoom` d'aperçu mobile — 🟢 neutralisé (`print.css:95`).

### 3.7 Documents longs vs courts / pagination

- **Facture / Devis / État espèce** : un seul `<div data-pdf-page>`, `<table>` HTML natif + `thead { display: table-header-group }` (`print.css:133`) → coupure de page automatique correcte avec répétition d'en-tête tableau. **Risque limité.**
- **Contrat / Engagement / Offre de service** : pagination **manuelle codée en dur** — ex. `ContratPreviewPage.tsx:254` `{[[1,2,3],[4,5],[6,7,8]].map((group, gi) => <div data-pdf-page>...)}`. Chaque `<div data-pdf-page>` = une page logique voulue = 1 page physique attendue.
  🔴 **Aucune règle CSS `break-before: page`** appliquée à `[data-pdf-page]` dans `print.css` (seul `[data-print-break-before]` est reconnu, jamais posé sur les composants).
  Conséquence : si le contenu d'un groupe dépasse la hauteur A4, il déborde et **toutes les pages logiques suivantes se décalent**. Si le contenu est plus court, `minHeight: 1100px` non neutralisé peut créer des **pages blanches intermédiaires**.

### 3.8 En-tête / logo / QR / TVA / totaux / signatures / pied de page

- **En-tête + logo + QR** : `DocumentPageHeader.tsx:25-53`. Logo `<img crossOrigin="anonymous">` (l.35) — reliquat html2canvas inutile ici. QR = `QRCodeSVG` vectoriel, imprime correctement (`print.css:160-164`).
- **TVA / totaux** : calculés côté React, valeurs figées HTML (`FacturePreview.tsx:229-244`).
- **Montant en lettres** : `numberToFrenchWords()` (`FacturePreview.tsx:29-78`) **dupliqué probablement dans DevisPreview**.
- **Signatures** : simples `<div>` avec `borderBottom` (`FacturePreview.tsx:270-278`). 🟠 **N'utilisent PAS** `className="signature-block"` ni `data-signature` prévues par `print.css:165-169` → pas de `break-inside: avoid` → risque de coupure signature/nom.
- **Cachet** : non implémenté dans Facture/Devis (les règles `.stamp img, [data-stamp] img` de `print.css` ne sont pas utilisées).
- **Pied de page / numérotation « Page X/Y »** : 🟠 **inexistants**, notamment gênant pour les Contrats 6-8 pages.

### 3.9 Problèmes Facturation — classement

#### 🔴 Critique

- **[F-C1]** `ContratPreviewPage.tsx:254`, `EngagementPreviewPage.tsx`, `OffreServicePreviewPage.tsx`, `ContratPreviewDialog.tsx` : **pagination manuelle par `<div data-pdf-page>` sans `break-before: page`**. Cause de décalages et de pages blanches intermédiaires sur documents longs.
  *Correction* : ajouter dans `print.css` : `[data-print-root] [data-pdf-page] + [data-pdf-page] { break-before: page; page-break-before: always; }` + neutraliser `min-height` en print.
- **[F-C2]** `minHeight: "1100px"` non neutralisé en print (Facture, Devis, Contrat, Engagement, OffreService).
  *Correction* : ajouter blocs scoped `[data-print-template="facture-document"] [data-pdf-page]` etc. avec `min-height: 0 !important`, comme fait pour `document-rh`.
- **[F-C3]** Bon de commande : **aucune preview / impression / PDF** (`routes/facturationRoutes.tsx:47-48` = liste + création uniquement).
  *Correction* : créer `BonCommandePreview.tsx` sur le patron `FacturePreview.tsx`.
- **[F-C4]** **Avoir / Proforma / Bon de livraison absents** du code. À valider avec le métier — comptabilité algérienne les impose souvent.

#### 🟠 Important

- **[F-I1]** Signatures Facture/Devis n'utilisent pas `.signature-block` / `[data-signature]` → non protégées par `break-inside: avoid`.
- **[F-I2]** Aucune numérotation « Page X/Y » sur documents multi-pages (Contrat 6-8 pages).
- **[F-I3]** Pas de bloc scoped `print.css` pour aucun template facturation — toute la migration LOT documentée `print.css:7-9` est **incomplète**.

#### 🟡 Amélioration

- **[F-A1]** `numberToFrenchWords()` dupliqué (`FacturePreview.tsx:29-78` + probablement Devis). *Correction* : extraire vers `src/lib/numberToWords.ts`.
- **[F-A2]** `crossOrigin="anonymous"` sur logo (`DocumentPageHeader.tsx:35`) — reliquat html2canvas inutile.

#### 🟢 Conforme

- Pipeline vectoriel, texte sélectionnable, pas de rasterisation.
- QR SVG imprimé nativement.
- Masquage chrome + overlays Radix (`ContratPreviewDialog`).

---

## 4. RÉCAPITULATIF DES CORRECTIONS À VALIDER

**Aucune correction n'est appliquée à ce stade.** Ci-dessous les actions recommandées, groupées par lot.

### Lot A — Attestation de travail (bug immédiat signalé)

1. Ajouter `data-doc-header` sur le wrapper en-tête `DocumentPreview.tsx:92`.
2. Étendre `print.css:186-227` avec règles compactant l'en-tête (padding, marginBottom, tailles de police en pt).
3. Réduire encore `[data-doc-title] margin` et `[data-doc-body] line-height` pour marge de sécurité.

### Lot B — Certificat / Avertissement / Contrat RH

1. Poser `data-doc-body`, `data-doc-signature`, `data-doc-attestation`/`-certificat`/`-avertissement`/`-contrat` sur les 3 branches manquantes de `DocumentPreview.tsx`.
2. Étendre les sélecteurs `print.css:186-227` pour couvrir les 4 types.

### Lot C — Facturation (Facture, Devis, États)

1. Ajouter dans `print.css` un bloc scoped :
   ```css
   [data-print-template^="facture"] [data-pdf-page],
   [data-print-template^="devis"] [data-pdf-page],
   [data-print-template^="contrat"] [data-pdf-page],
   [data-print-template^="engagement"] [data-pdf-page],
   [data-print-template^="offre-service"] [data-pdf-page] {
     min-height: 0 !important;
     padding: 4mm 8mm !important;
   }
   ```
2. Ajouter `[data-pdf-page] + [data-pdf-page] { break-before: page; }` pour forcer les sauts de page logiques.
3. Ajouter `data-signature` sur les blocs signature Facture/Devis.

### Lot D — Fonctionnalités manquantes (à confirmer)

1. Bulletin de paie (RH) : décider retrait ou implémentation.
2. Bon de commande (Facturation) : ajouter preview.
3. Avoir / Proforma / Bon de livraison (Facturation) : décider selon besoin métier.

### Lot E — Nettoyages / cohérence

1. SECU-01 : migrer vers `PrintService`.
2. Renommer bouton « Télécharger » ou l'implémenter réellement.
3. Extraire `numberToFrenchWords` en util partagé.
4. Retirer `crossOrigin="anonymous"` obsolète du logo.
5. `registerTemplate` : réellement utiliser `printCurrentReport(id)`.

---

## 5. RÉPONSES SYNTHÉTIQUES AUX QUESTIONS DE L'AUDIT

| Question | Réponse |
|---|---|
| Canvas utilisé pour RH ? | **Non.** 0 occurrence active. |
| Canvas utilisé pour Facturation ? | **Non.** 0 occurrence. |
| PDF vectoriel ? Texte sélectionnable ? | **Oui**, dans les deux modules. |
| Pipeline PDF distinct de window.print() ? | **Non.** `handleDownload = handlePrint` partout. |
| Deux pipelines distincts existent-ils ? | Non pour RH principal + Facturation. Oui pour SECU-01 (RH) qui utilise `window.open`. |
| Même DOM aperçu ↔ impression ↔ PDF ? | **Oui**, sauf SECU-01. |
| Cause principale du bug attestation page 2 ? | En-tête + espaces cumulés non compactés en print, dépassent 271 mm imprimables. |
| Cause principale bug Contrat multi-pages ? | Absence de `break-before: page` sur `[data-pdf-page]` + `minHeight: 1100px` non neutralisé. |

---

**Fin de l'audit. En attente de validation pour appliquer les corrections par lots.**
