# Print Engine v2 — Plan d'architecture

**Statut** : Phase d'architecture uniquement — aucune migration de rapport n'est réalisée.
**Date** : 2026-07-10
**Objectif final** : un seul moteur d'impression basé sur `window.print()`, une seule feuille de style, aucune capture DOM (html2canvas / jsPDF image).

---

## 1. Architecture du `PrintService`

Fichier : `src/lib/print/PrintService.ts`

API exposée :

| Méthode | Rôle |
|---|---|
| `print(options?)` | Ouvre le dialogue d'impression navigateur (impression papier + Save as PDF) |
| `preview(options?)` | Alias sémantique de `print()` — Chrome/Edge affichent l'aperçu dans le même dialogue |
| `beforePrint(cb)` | Enregistre un callback exécuté avant impression (hydratation données, expansion accordions) |
| `afterPrint(cb)` | Enregistre un callback exécuté après fermeture du dialogue |
| `registerTemplate(meta)` | Enregistre un template pour catalogue/debug |
| `printCurrentReport(id \| meta)` | Imprime en s'appuyant sur les métadonnées enregistrées |

Comportement :

- Applique `class="print-mode print-orientation-{portrait\|landscape}"` sur `<html>` avant l'impression.
- Nettoie automatiquement via `afterprint`.
- Peut modifier temporairement `document.title` (utilisé comme nom de fichier PDF par défaut).
- Zéro dépendance serveur — 100 % compatible PWA offline.
- **Aucun** composant applicatif ne devra appeler `window.print()` directement après migration.

## 2. Architecture de `print.css`

Fichier : `src/styles/print.css`

Prend en charge de manière centralisée :

- Format **A4 portrait** par défaut + **A4 paysage** via `html.print-orientation-landscape`.
- Marges normalisées (12 mm portrait / 10 mm paysage).
- Neutralisation de la chrome applicative (`nav`, `aside`, `header`, `.print-hide`, `[data-print-hide]`).
- Un unique conteneur d'impression : `[data-print-root]`.
- Pagination sémantique :
  - `[data-print-break-before]` / `[data-print-break-after]`
  - `[data-print-keep-together]` (`break-inside: avoid`)
  - `thead` répété via `display: table-header-group`.
- Typographie print (Arial 11pt, hiérarchie h1/h2/h3).
- Tableaux normalisés (bordures noires, en-têtes gris `#f1f5f9`).
- Blocs QR / signature / cachets / logos avec `break-inside: avoid`.
- Rendu couleur fidèle (`-webkit-print-color-adjust: exact`).

Conventions HTML attendues côté rapports (post-migration) :

```html
<div data-print-root>
  <header data-print-hide>… actions écran …</header>
  <section data-print-section>
    <table>…</table>
    <div data-print-keep-together class="signature-block">…</div>
    <div data-print-break-before>…</div>
  </section>
</div>
```

**Import** : le fichier n'est pas encore importé globalement. Il le sera lors du premier lot de migration (via `src/main.tsx` ou `src/index.css`).

---

## 3. Inventaire — technologies actuelles

### 3.1 Fichiers utilisant `html2canvas` / `toDataURL`

| Fichier | Usage | Impact refonte |
|---|---|---|
| `src/lib/documents/DocumentGenerator.ts` | `html2canvas` + `jsPDF` image → **archivage officiel** des rapports techniques | 🔴 **Critique** — archive `sha256`, ne peut pas être remplacé sans plan de versioning archive |
| `src/components/reports/ReportHeader.tsx` | `canvas.toDataURL` pour normaliser le logo (CORS) | 🟢 Neutre — utilitaire d'image, à conserver |
| `src/components/materiel/SignaturePad.tsx` | `canvas.toDataURL` pour capturer signature manuscrite | 🟢 Neutre — capture métier, à conserver |
| `src/pages/materiel/MaterielInventaire.tsx` | `canvas.toDataURL` pour logo | 🟢 Neutre |
| `src/components/materiel/MaterielInventaireDialog.tsx` | `canvas.toDataURL` pour logo | 🟢 Neutre |

**Conclusion** : le seul générateur PDF basé image à supprimer est `DocumentGenerator.ts`. Les autres usages de `canvas`/`toDataURL` sont légitimes (logos CORS, signatures manuscrites) et **doivent être conservés**.

### 3.2 Fichiers appelant `window.print()`

**~57 fichiers** — inventaire complet ci-dessous par famille.

`src/lib/pdf.ts` centralise déjà l'appel via `downloadReportAsPDF()` → cible de refactor triviale vers `PrintService.print()`.

---

## 4. Classement par familles

| # | Famille | Rapports | Moteur actuel | Difficulté | Risques |
|---|---|---|---|---|---|
| 1 | **Rapports techniques archivés** | 1 (`DocumentGenerator`) | html2canvas + jsPDF image | 🔴 Élevée | SHA-256 archives change → besoin archive v2 |
| 2 | **Essais béton — compression** | CompressionReport, EtatEssaisBetonDurci, BetonDurciNormes | window.print() | 🟢 Faible | Aucun (déjà print-native) |
| 3 | **Essais béton — béton frais** | BetonFraisReport, EtatEssaisBetonFrais, BetonFraisNormes | window.print() | 🟢 Faible | Aucun |
| 4 | **Essais béton — carottage** | CarottageReport, EtatEssaisCarottage | window.print() | 🟢 Faible | Aucun |
| 5 | **Essais béton — non destructif** | SclerometreReport, UltrasonReport, NonDestructifNormes | window.print() | 🟢 Faible | Aucun |
| 6 | **Essais béton — autres** | TractionFendageReport, PermeabiliteReport, ModuleElasticiteReport, DestructifNormes, SamplingBulletin | window.print() | 🟢 Faible | Aucun |
| 7 | **Granulats** | GranulatReport, EtatEssaisGranulat, GranulatPropreteNormes, GranulatPhysiquesNormes, GranulatMecaniquesNormes | window.print() | 🟢 Faible | Aucun |
| 8 | **Géotechnique — identification** | TeneurEauSolReport, LimitesAtterbergReport, ClassificationSolReport, GranulometrieSolReport, IdentificationNormes | window.print() | 🟡 Moyenne | Rapports paysage — vérifier `@page landscape` |
| 9 | **Géotechnique — compactage** | ProctorReport, CBRReport, CompactageNormes | window.print() | 🟢 Faible | Aucun |
| 10 | **Géotechnique — in situ** | PlaqueReport, DensitometreReport, InSituNormes, MecaniqueNormes | window.print() | 🟢 Faible | Aucun |
| 11 | **Formulations** | FormulationReport | window.print() | 🟡 Moyenne | Graphiques Dreux-Gorisse (SVG recharts — à valider en print) |
| 12 | **Documents administratifs** | ContratPreviewPage, ContratPreviewDialog, EngagementPreviewPage, OffreServicePreviewPage | window.print() | 🟡 Moyenne | Pagination multi-pages verbatim LTPC |
| 13 | **Facturation** | FacturePreview, DevisPreview, EspeceListe, EtatPaiementsEspece | window.print() | 🟢 Faible | Aucun |
| 14 | **Laboratoires mobiles** | ChantierEchantillonReport, ChantierEchantillonBulletin, EtatCoulages | window.print() | 🟡 Moyenne | Paysage + tableaux larges |
| 15 | **RH** | Documents.tsx (bulletins) | window.print() | 🟢 Faible | Aucun |
| 16 | **Matériel** | MaterielInventaire, MaterielInventaireDialog, MaterielEtalonnage(+Historique), MaterielAffectation(+Historique), MaterielMaintenance(+Historique), MouvementsListe, MouvementDetail | window.print() + logo canvas | 🟢 Faible | Aucun |
| 17 | **Essais — feuilles d'essais vierges** | FeuilleEssaiDialog | window.print() | 🟢 Faible | Aucun |

**Total rapports impactés** : ~57 écrans + 1 générateur d'archive.

---

## 5. Stratégie de migration recommandée

Chaque lot doit pouvoir être validé indépendamment. Aucun lot n'est bloquant pour les suivants sauf le Lot 0 (fondations).

| Lot | Contenu | Familles | Charge estimée | Risque |
|---|---|---|---|---|
| **Lot 0** | Fondations : `PrintService` + `print.css` + import global + refactor `src/lib/pdf.ts` → `PrintService.print()` | — | 0.5 j | 🟢 |
| **Lot 1** | Essais béton (compression, frais, carottage, non destructif, autres) | 2, 3, 4, 5, 6 | 2 j | 🟢 |
| **Lot 2** | Granulats | 7 | 1 j | 🟢 |
| **Lot 3** | Géotechnique (identification, compactage, in situ) | 8, 9, 10 | 2 j | 🟡 |
| **Lot 4** | Formulations (validation graphiques Dreux-Gorisse en print) | 11 | 1 j | 🟡 |
| **Lot 5** | Documents administratifs (contrats, engagements, offres) | 12 | 2 j | 🟡 |
| **Lot 6** | Facturation | 13 | 1 j | 🟢 |
| **Lot 7** | Laboratoires mobiles | 14 | 1 j | 🟡 |
| **Lot 8** | RH + Matériel + Feuilles d'essais + Normes | 15, 16, 17 | 1.5 j | 🟢 |
| **Lot 9** | **Archivage officiel v2** — remplacer `DocumentGenerator` (html2canvas) par pipeline Chromium headless via Edge Function OU stratégie de conservation du moteur legacy uniquement pour les archives historiques | 1 | 3–5 j | 🔴 |
| **Lot 10** | Suppression définitive de `html2canvas` et `jspdf` (dépendances package.json) — uniquement après Lot 9 validé | — | 0.5 j | 🔴 |

**Charge totale estimée** : ~15 jours-personnes, étalés sur plusieurs sprints.

---

## 6. Risques & impacts

### 6.1 Risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Régression visuelle sur rapports migrés | Moyenne | Moyen | Migration progressive lot par lot, checklist QA par famille |
| SHA-256 des archives change (Lot 9) | Certaine | Élevé | Archive v2 : nouvelle table `document_archives_v2` OU flag `engine_version` sur `document_archives`, jamais réécrire les anciens hashes |
| Graphiques Dreux-Gorisse (recharts SVG) mal rendus en print | Faible | Moyen | Test dédié Lot 4 avant validation |
| Pagination cassée sur contrats verbatim (multi-pages) | Moyenne | Moyen | Utilisation stricte de `data-print-break-before` |
| Perte de qualité perçue par les utilisateurs habitués au PDF image | Faible | Faible | Le rendu vectoriel est **supérieur** (texte sélectionnable, QR nets) |

### 6.2 Impacts

- **Métier** : aucun. Aucune modification de calculs, workflows, permissions, RLS.
- **UI** : aucune modification écran. Les boutons "Imprimer" / "Télécharger PDF" continuent de fonctionner à l'identique.
- **Performance** : ⬆️ nette (suppression du rendu html2canvas 2–5 s → impression instantanée navigateur).
- **Poids bundle** : après Lot 10, retrait de `html2canvas` (~200 KB min+gz) et `jspdf` (~150 KB min+gz).
- **PWA** : ✅ aucun impact — `window.print()` fonctionne offline.
- **Archives légales** : à sécuriser en Lot 9 (voir stratégie versioning).

### 6.3 Dépendances

- Aucune nouvelle dépendance npm.
- Suppression future de `html2canvas` et `jspdf` (Lot 10 uniquement).
- Conservation de `qrcode.react` (SVG natif, compatible print).
- Conservation des utilitaires `canvas.toDataURL` pour logos CORS et signatures manuscrites (non liés à la génération PDF).

---

## 7. Interdictions respectées dans cette phase

- ✅ Aucune librairie supprimée.
- ✅ Aucun rapport modifié.
- ✅ Aucune logique métier modifiée.
- ✅ Aucun calcul modifié.
- ✅ Aucun workflow modifié.
- ✅ Aucun PDF existant cassé.
- ✅ Aucun rapport remplacé automatiquement.
- ✅ `print.css` créé mais **non importé globalement** (import différé au Lot 0 d'exécution).
- ✅ `PrintService` créé mais **non appelé** par les rapports existants.

---

## 8. Objectif final (rappel)

Après exécution complète des Lots 0 → 10 :

- ✅ Un seul moteur d'impression (`PrintService`).
- ✅ Une seule feuille de style (`print.css`).
- ✅ Zéro utilisation de `html2canvas` pour générer des PDF.
- ✅ Zéro capture JPEG/PNG des rapports.
- ✅ Texte sélectionnable, QR codes vectoriels nets, signatures haute résolution.
- ✅ Qualité d'impression professionnelle homogène sur tous les rapports.
- ✅ Compatible PWA online + offline.
