# LOT 8 — Migration des documents de facturation

## 1. Inventaire des documents imprimables (facturation)

| Document | Fichier | État avant | Orientation |
|---|---|---|---|
| Facture | `src/pages/facturation/FacturePreview.tsx` | `window.print()` + `downloadReportAsPDF` | Portrait |
| Devis | `src/pages/facturation/DevisPreview.tsx` | `window.print()` + `downloadReportAsPDF` | Portrait |
| État des paiements en espèce | `src/pages/facturation/EtatPaiementsEspece.tsx` | `window.print()` + `downloadReportAsPDF` + CSS local | Paysage |
| Aperçu reçu (dialog) | `src/pages/facturation/EspeceListe.tsx` | `window.print()` + import mort `downloadReportAsPDF` | Portrait |

Documents ne produisant pas d'impression dédiée (formulaires de saisie, listes tabulaires, dashboards) : hors périmètre. Les avoirs / factures d'acompte / relevés / bons de commande imprimables ne sont pas encore implémentés dans le projet (aucune page d'aperçu correspondante).

## 2. Analyse

- **Tableaux multi-pages** : `FacturePreview` et `DevisPreview` contiennent le tableau des lignes + le tableau des totaux (HT/TVA/TTC) ; l'en-tête `<thead>` se répète automatiquement grâce à `print.css` (`thead { display: table-header-group }`).
- **Calculs financiers** : HT, TVA, TTC, remises, arrondis — non touchés (uniquement affichés via `Number(...).toLocaleString`).
- **QR Codes** : générés par `DocumentPageHeader` — inchangés.
- **Signatures / cachets** : blocs `Le Client / Le Directeur` inchangés.
- **Conditions de paiement / observations** : blocs conservés à l'identique.

## 3. Documents migrés

Tous les documents facturation utilisent désormais exclusivement :

- `PrintService.print()` (moteur unique)
- `print.css` global
- `data-print-root` + `data-print-template` sur le conteneur imprimable
- Templates enregistrés dans le registre `PrintService`

## 4. Templates enregistrés

| ID template | Titre | Orientation |
|---|---|---|
| `facture-document` | Facture | portrait |
| `devis-document` | Devis | portrait |
| `etat-paiements-espece` | État des paiements en espèce | landscape |

## 5. Fichiers modifiés

- `src/pages/facturation/FacturePreview.tsx`
- `src/pages/facturation/DevisPreview.tsx`
- `src/pages/facturation/EtatPaiementsEspece.tsx`
- `src/pages/facturation/EspeceListe.tsx`

## 6. Vérification des calculs (inchangés)

Aucun changement dans :
- `hooks/useFacturation.ts` (queries, mutations, agrégats HT/TVA/TTC).
- Fonction `numberToFrenchWords` (montants en lettres).
- Arrondis (`Math.floor`, `toLocaleString('fr-FR', { minimumFractionDigits: 2 })`).
- Numérotation (`facture.numero`, `devis.numero`).
- Workflow de validation (statuts, dates d'émission/échéance/validité).

## 7. Validation impression / PDF

- Aperçu impression = Impression = Microsoft Print to PDF = Enregistrer en PDF (moteur unique navigateur).
- `data-print-root` + `data-print-template` respectent la convention des lots 1–7.
- `body * { visibility: hidden }` + `[data-ref="report"] { visibility: visible }` isolent le contenu à imprimer.
- Orientation paysage (`etat-paiements-espece`) via `@page { size: A4 landscape }` et `PrintService.print({ orientation: "landscape" })`.
- `-webkit-print-color-adjust: exact` conservé pour en-têtes colorés `#1e5a7a` et badges statuts.

## 8. Nettoyage effectué

- Suppression de tous les `import { downloadReportAsPDF } from "@/lib/pdf"` dans la famille facturation (4 fichiers).
- Suppression des `import { toast } from "sonner"` inutilisés dans `FacturePreview` et `DevisPreview`.
- Correction du sélecteur CSS obsolète `[data-print-area]` → `[data-ref="report"]` dans `EtatPaiementsEspece`.
- Ancien handler `handleDownload` (rasterisation via `html2canvas`/`jsPDF`) remplacé par `PrintService.print()` : le bouton « Télécharger PDF » utilise désormais l'export natif du navigateur (Enregistrer en PDF).

## 9. Difficultés

- Aucun blocage. Les composants utilisaient déjà `window.print()` en fallback + `data-ref="report"` : la migration s'est limitée à basculer sur `PrintService` et à ajouter les attributs `data-print-root` / `data-print-template`.
- `EspeceListe` contient un aperçu par `<iframe>`/`<img>` externe (URL storage) : l'export « Télécharger » reste un lien direct vers le fichier stocké (non rasterisé), l'impression passe désormais par `PrintService`.

## 10. Recommandations

- Lorsque de nouveaux documents financiers seront implémentés (avoirs, factures d'acompte, relevés, reçus imprimables autonomes), reprendre le même patron : `PrintService.registerTemplate(...)` + `data-print-root` + `data-print-template`.
- À terme, supprimer complètement `src/lib/pdf.ts` (`downloadReportAsPDF`) une fois les dernières pages hors-périmètre (`FeuilleEssaiDialog`, `MaterielInventaireDialog`, `ContratPreviewDialog`) migrées — cible d'un lot ultérieur.
- Type-check : 0 erreur TypeScript.

## FIN LOT 8 — En attente de validation avant LOT 9.
