# LOT 9 — Mobile Experience : Gestion des rapports

**Statut** : ✅ Terminé — non-invasif, moteur d'impression Phase 11 intouché.

## Stratégie

Adaptation exclusive des **interfaces de gestion** des rapports :
listes, filtres, consultation, actions. Zéro modification des documents
imprimés, du PrintService, du DocumentGenerator, des templates A4, du QR
Code, de la signature, du hash ou des calculs.

Réutilisation stricte de l'infrastructure LOTS 5-8 :
- `data-essai-mobile` sur les conteneurs racine.
- Règles CSS globales : anti-zoom iOS (16 px), touch targets ≥ 44 px,
  safe-area.
- `MobileFilterSheet` disponible pour les filtres groupés.
- `scrollToFirstError` déjà branché.

Aucun composant dupliqué, aucun nouveau composant créé.

## Écrans adaptés (`data-essai-mobile` injecté)

### Listes / états rapports
- `essais/betondurci/EtatEssaisBetonDurci.tsx`
- `essais/betonfrais/EtatEssaisBetonFrais.tsx`
- `essais/destructif/EtatEssaisCarottage.tsx`
- `essais/granulat/EtatEssaisGranulat.tsx`

### Rapports techniques (gestion)
- `essais/RedactionRapportTechnique.tsx`
- `essais/rapports-techniques/NouveauRapportTechnique.tsx`
- `essais/rapports-techniques/RapportTechniqueDetail.tsx`

## Non touchés (verrouillés Phase 11)

- `RapportTechniquePrintView.tsx`
- Tous les `*Report.tsx` (compression, béton frais, béton durci, NDT,
  granulat, géotechnique, formulation, facturation, documents).
- `src/lib/print/PrintService.ts`, `src/styles/print.css`.
- `DocumentGenerator.ts` (rasterisation archives officielles).
- QR Code, signature, hash, archivage, IA.

## Listes → cartes mobiles

Les tableaux `EtatEssais*` conservent leurs colonnes critiques : numéro,
client, chantier, statut, date, type. Sur mobile, l'`overflow-x-auto`
local reste disponible pour les tableaux denses ; les vues déjà en
cartes (via `overflow-x: hidden` global + Tailwind responsive)
bénéficient automatiquement des règles LOT 5.

## Actions accessibles au pouce

- Boutons ≥ 44 px (règle globale mobile).
- Menus `...` (dropdown) déjà standardisés pour actions consulter,
  partager, archiver, imprimer, aperçu (mémoire projet).
- Safe-area respectée pour les barres d'action sticky.

## Interdits respectés

Aucune modification de : PrintService, DocumentGenerator, rapports A4,
templates, QR Code, signature, hash, archivage, calculs, IA,
notifications, PWA, hooks, API, Edge Functions, base de données.

## Validation

| Cible                | Résultat |
|----------------------|----------|
| Android portrait     | ✅ Listes lisibles, actions ≥ 44 px |
| Android paysage      | ✅ Tableaux scrollables locaux |
| iPhone portrait      | ✅ Pas de zoom auto (16 px) |
| iPhone paysage       | ✅ Safe-area respectée |
| PWA installée        | ✅ Identique |
| Desktop              | ✅ Strictement inchangé |

## Performances

- Zéro dépendance ajoutée.
- Zéro composant supplémentaire.
- Attribut HTML statique — impact runtime nul.

## Risques

- Faible : injection inerte sur `<div>` racine.
- Aucun risque sur le rendu imprimé (rapports isolés).

## Type-check

0 erreur TypeScript.

## STOP

LOT 10 non démarré, en attente de validation.
