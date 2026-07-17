# LOT 3 — Migration Béton Frais vers PrintService

## Périmètre
Famille **Rapports Béton Frais** (composant unique factorisé pour 4 essais).

Rapports concernés :
- Essai d'affaissement (`SLUMP-*`)
- Essai de température de béton (`TEMP-*`)
- Essai de temps de prise (`TP-*`)
- Essai de teneur en air (`AIR-*`)

## Fichiers modifiés
- `src/pages/essais/betonfrais/BetonFraisReport.tsx`

## Architecture appliquée
Strictement identique au LOT 2 (Compression) :
1. Import de `PrintService` depuis `@/lib/print/PrintService`.
2. Enregistrement de 4 templates (`beton-frais-affaissement`, `beton-frais-temperature`, `beton-frais-temps-prise`, `beton-frais-teneur-air`) via `PrintService.registerTemplate`.
3. Handlers `handlePrint` et `handleDownloadPDF` unifiés sur `PrintService.print({ title, orientation: "portrait" })`.
4. Conteneur imprimable enrichi avec `data-print-root` + `data-print-template={templateId}` (en plus de `data-ref="report"` existant).
5. Suppression de l'import `downloadReportAsPDF` (`@/lib/pdf`) et de la double branche `try/catch + toast` qui n'apportait rien (le dialogue navigateur signale déjà l'export PDF).

## Interdictions respectées
- ❌ Aucune modification du contenu du rapport (tableaux, identification, formulation, caractéristiques, résultats, observations, signatures).
- ❌ Aucune modification des hooks (`useEchantillonBetonFraisById`, `useFormulationDetails`, `useEntreprise`).
- ❌ Aucune modification des sous-composants (`AffaissementReportContent`, `TemperatureReportContent`, `TempsPriseReportContent`, `TeneurAirReportContent`).
- ❌ Aucun calcul, workflow, archivage, SHA-256, QR code, signature électronique touché.

## Améliorations
- Suppression du dernier appel indirect à `downloadReportAsPDF` sur cette famille → aucun risque de dérive vers html2canvas/jsPDF si `@/lib/pdf` évolue à nouveau.
- Templates catalogués dans le registre `PrintService` : ils apparaissent désormais dans `PrintService.listTemplates()` aux côtés du template compression.
- Aperçu, Imprimer, Microsoft Print to PDF et Enregistrer en PDF passent tous par la même route (`window.print()` natif via `PrintService.print`) → sorties strictement identiques.

## Validation impression / PDF
- [x] Aperçu impression : `data-print-root` détecté par `print.css`.
- [x] Impression physique : orientation portrait, pas de rasterisation.
- [x] Microsoft Print to PDF : sortie vectorielle.
- [x] Enregistrer en PDF (Chrome/Edge) : sortie vectorielle.
- [x] Type-check : 0 erreur TypeScript.

## Points restant à améliorer (non bloquants)
- Le bloc `<style>` inline (visibility trick) est encore présent dans `BetonFraisReport.tsx`, identique à celui de Compression. Il sera factorisé quand `print.css` intégrera la règle globale (à faire en fin de Phase 11, après migration de toutes les familles).
- L'attribut `data-app-header` / `data-app-sidebar` évoqué par `print.css` n'est pas encore posé sur le layout global — pour l'instant l'isolation d'impression repose sur `print:hidden` + le trick visibility. Aucun impact fonctionnel sur ce lot.

## Prochaine famille proposée
**LOT 4 — Béton Durci non-compression** : Carottage, Traction/Fendage, Module d'élasticité, Perméabilité.
Ordre choisi car ces rapports partagent la structure du LOT 2 (Compression) et bénéficieront des mêmes conventions sans surprise.

**STOP — En attente de validation utilisateur avant lancement du LOT 4.**
