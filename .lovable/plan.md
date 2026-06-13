# Plan — Unifier l'impression/téléchargement PDF dans toute l'app

Objectif : remplacer toute logique `html2canvas`/`jsPDF`/`window.open(...).print()` par le pattern unique basé sur l'impression du navigateur (`window.print()` + `downloadReportAsPDF(filename)` depuis `src/lib/pdf.ts`), pour garantir un rendu identique entre Aperçu / Imprimer / Télécharger.

## Portée — 37 fichiers à modifier

### A. Rapports d'essais (ont déjà un `reportRef` / `data-ref="report"`)
- `src/pages/essais/CompressionReport.tsx` ✓ déjà migré
- `src/pages/essais/SamplingBulletin.tsx` ✓ déjà migré
- `src/pages/essais/tractionfendage/TractionFendageReport.tsx`
- `src/pages/essais/permeabilite/PermeabiliteReport.tsx`
- `src/pages/essais/betonfrais/BetonFraisReport.tsx`
- `src/pages/essais/destructif/CarottageReport.tsx`
- `src/pages/essais/destructif/EtatEssaisCarottage.tsx`
- `src/pages/essais/nondestructif/UltrasonReport.tsx`
- `src/pages/essais/nondestructif/SclerometreReport.tsx`
- `src/pages/essais/moduleelasticite/ModuleElasticiteReport.tsx`
- `src/pages/essais/betondurci/EtatEssaisBetonDurci.tsx`
- `src/pages/essais/betonfrais/EtatEssaisBetonFrais.tsx`
- `src/pages/essais/granulat/EtatEssaisGranulat.tsx`
- `src/pages/essais/granulat/rapport/GranulatReport.tsx`
- `src/pages/essais/geotechnique/insitu/DensitometreReport.tsx`
- `src/pages/essais/geotechnique/insitu/PlaqueReport.tsx`
- `src/pages/essais/geotechnique/compactage/ProctorReport.tsx`
- `src/pages/essais/geotechnique/compactage/CBRReport.tsx`
- `src/pages/essais/geotechnique/identification/GranulometrieSolReport.tsx`
- `src/pages/essais/geotechnique/identification/LimitesAtterbergReport.tsx`
- `src/pages/essais/geotechnique/identification/ClassificationSolReport.tsx`
- `src/pages/essais/geotechnique/identification/TeneurEauSolReport.tsx`
- `src/pages/essais/formulation/FormulationReport.tsx`
- `src/pages/laboratoires-mobiles/ChantierEchantillonReport.tsx`
- `src/pages/laboratoires-mobiles/ChantierEchantillonBulletin.tsx`
- `src/pages/laboratoires-mobiles/EtatCoulages.tsx`

### B. Facturation
- `src/pages/facturation/FacturePreview.tsx`
- `src/pages/facturation/DevisPreview.tsx`
- `src/pages/facturation/EtatPaiementsEspece.tsx`
- `src/pages/facturation/EspeceListe.tsx`

### C. Documents (contrats, engagements, offres)
- `src/pages/documents/ContratPreviewPage.tsx`
- `src/pages/documents/EngagementPreviewPage.tsx`
- `src/pages/documents/OffreServicePreviewPage.tsx`
- `src/components/documents/ContratPreviewDialog.tsx`
- `src/components/documents/DocumentViewerDialog.tsx`

### D. Matériel
- `src/pages/materiel/MaterielMaintenance.tsx`
- `src/pages/materiel/MaterielMaintenanceHistorique.tsx`
- `src/pages/materiel/MaterielEtalonnage.tsx`
- `src/pages/materiel/MaterielEtalonnageHistorique.tsx`
- `src/pages/materiel/MaterielAffectation.tsx`
- `src/pages/materiel/MaterielAffectationHistorique.tsx`
- `src/pages/materiel/MaterielInventaire.tsx`
- `src/components/materiel/MaterielInventaireDialog.tsx`

### E. Normes (cas spécial)
- `src/pages/essais/DestructifNormes.tsx`
- `src/pages/essais/NonDestructifNormes.tsx`
- `src/pages/essais/betonfrais/BetonFraisNormes.tsx`
- `src/pages/essais/betonfrais/BetonDurciNormes.tsx`
- `src/pages/essais/granulat/GranulatMecaniquesNormes.tsx`
- `src/pages/essais/granulat/GranulatPhysiquesNormes.tsx`
- `src/pages/essais/granulat/GranulatPropreteNormes.tsx`
- `src/pages/essais/geotechnique/normes/MecaniqueNormes.tsx`
- `src/pages/essais/geotechnique/normes/InSituNormes.tsx`
- `src/pages/essais/geotechnique/normes/IdentificationNormes.tsx`
- `src/pages/essais/geotechnique/normes/CompactageNormes.tsx`
- `src/components/essais/FeuilleEssaiDialog.tsx`

### F. Autres
- `src/pages/rh/Documents.tsx`

## Transformations appliquées

**Pour chaque fichier :**

1. **Imports** — supprimer `import html2canvas from "html2canvas"` et `import jsPDF from "jspdf"`. Ajouter `import { downloadReportAsPDF } from "@/lib/pdf"`.

2. **handlePrint** — remplacer toute variante (`window.open("", "_blank")` + `printWindow.print()`, ouverture d'une nouvelle fenêtre avec HTML inline) par :
   ```ts
   const handlePrint = () => window.print();
   ```

3. **handleDownload** — remplacer la génération `html2canvas` → `jsPDF` → `pdf.save(...)` par :
   ```ts
   const handleDownload = () => downloadReportAsPDF(`<nom-fichier>`);
   ```
   (le nom de fichier conservé identique à l'existant pour chaque rapport).

4. **Container imprimable** — s'assurer que l'élément racine du contenu à imprimer porte `data-ref="report"`. Si absent, l'ajouter sur le `<div ref={printRef}>` existant.

5. **Chrome UI** — vérifier que les boutons d'action (Imprimer, Télécharger, retour, partage) et `AppBreadcrumb` portent `print:hidden`.

## Cas spécial — Pages Normes (groupe E)

Ces pages ne possèdent pas de container imprimable : elles construisent une chaîne HTML et l'envoient à une fenêtre popup. Solution :

- Ajouter dans la page un container caché `<div ref={printRef} data-ref="report" className="hidden print:block">…</div>` qui rend la norme active.
- Un état local `printingNorme: NormeData | null` détermine quel contenu rendre.
- `handlePrint(norme)` : `setPrintingNorme(norme)` → `setTimeout(() => window.print(), 50)`.
- `handleDownload(norme)` : `setPrintingNorme(norme)` → `setTimeout(() => downloadReportAsPDF(...), 50)`.
- Le contenu reste invisible à l'écran (`hidden`) mais visible à l'impression (`print:block`), avec masquage du reste de l'app via `body > *:not(.print-root) { display:none }` déjà géré dans `src/index.css`.

## Vérification

Après modifications, contrôles :
- Build TypeScript passe (auto par la sandbox).
- Aucune occurrence restante de `html2canvas` ni `jsPDF` (sauf si volontaire) : `rg -l "html2canvas|jsPDF" src/`.
- Aucun `window.open(.*)\.print()` restant : `rg "window\.open.*print" src/`.

## Livrable

Un rapport listant chaque fichier modifié et la nature du changement appliqué.
