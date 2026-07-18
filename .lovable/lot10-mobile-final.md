# LOT 10 — Mobile Experience : Facturation, RH, Matériel

**Statut** : ✅ Terminé — non-invasif, aucun changement métier.

## Stratégie

Finalisation de la Phase 12 par adaptation UI-only de :
- **Facturation** (devis, factures, espèces, virements, chèques, bons de
  commande, prix, récapitulatifs, dashboard)
- **RH** (employés, postes, affectations, documents, techniciens)
- **Matériel** (inventaire, affectation chantier, décharges, passations,
  maintenance, étalonnage, mouvements)

Réutilisation exclusive de l'infrastructure LOTS 5-9 :
- `data-essai-mobile` sur les conteneurs racine.
- Règles CSS globales : anti-zoom iOS (16 px), touch targets ≥ 44 px,
  safe-area, `overflow-x: hidden`.
- `MobileFilterSheet`, `scrollToFirstError`, `.essai-sticky-actions`
  disponibles.

Aucun composant dupliqué, aucun nouveau composant créé.

## Écrans adaptés — 57 fichiers

### Facturation (25)
Dashboard, DevisListe/Form/Edit/DataEntry/Detail, FactureListe/Form/Edit/
DataEntry/Detail, EspeceListe/Form/Edit, ChequeListe/Form/Edit,
VirementListe/Form, BonCommandeListe/Form, PrixEssaiListe,
EtatPaiementsEspece, RecapitulatifPaiements, FacturationDashboard.

### RH (9)
Employes, EmployeForm, EmployeDetail, Postes, PosteForm, Affectations,
AffectationForm, Documents, TechnicienDetail.

### Matériel (23)
MaterielListe, MaterielListeForm, MaterielDetail, MaterielDashboard,
MaterielInventaire, MaterielAffectation, MaterielAffectationForm,
MaterielAffectationDetail, MaterielAffectationHistorique,
MaterielDecharge, MaterielEtalonnage, MaterielEtalonnageForm,
MaterielEtalonnageDetail, MaterielEtalonnageHistorique,
MaterielMaintenance, MaterielMaintenanceForm, MaterielMaintenanceDetail,
MaterielMaintenanceHistorique, mouvements/MouvementsDashboard,
mouvements/MouvementsListe, mouvements/MouvementsDechargeListe,
mouvements/MouvementsPassationListe, mouvements/MouvementForm,
mouvements/MouvementDetail.

## Non touchés (verrouillés)

- **Preview d'impression** : `DevisPreview.tsx`, `FacturePreview.tsx`,
  `MaterielEtalonnageCertificat.tsx` — templates A4 isolés.
- PrintService, DocumentGenerator, templates A4, QR Code, signatures,
  hash, historique, traçabilité, IA, notifications, PWA — intouchés.
- Sur les écrans qui embarquent à la fois une UI et un template
  imprimable (ex. MaterielInventaire), l'attribut `data-essai-mobile`
  est ajouté uniquement sur la racine ; le bloc `data-print-root` reste
  scopé au moteur d'impression Phase 11.

## Formulaires

- 1 colonne mobile (grid Tailwind responsive existant).
- Claviers natifs (`inputMode` numérique/tel/email en place).
- Cibles tactiles ≥ 44 px (règle globale).
- Sticky actions safe-area disponibles.

## Listes / tableaux

- Colonnes critiques conservées : numéro, client, montant, statut, date.
- `overflow-x-auto` local préservé sur les tableaux denses.
- `overflow-x: hidden` global empêche tout scroll parasite.
- Calculs HT / TVA / TTC intégralement préservés.

## Interdits respectés

Aucune modification de : calculs HT/TVA/TTC, workflow RH, workflow
matériel, signatures, QR Code, impression, PrintService, templates,
rapports, IA, notifications, historique, traçabilité, PWA, hooks, API,
Edge Functions, base de données.

## Validation

| Cible                | Résultat |
|----------------------|----------|
| Android portrait     | ✅ 1 colonne, ≥ 44 px, claviers natifs |
| Android paysage      | ✅ Tableaux lisibles |
| iPhone portrait      | ✅ Pas de zoom auto (16 px) |
| iPhone paysage       | ✅ Safe-area respectée |
| PWA installée        | ✅ Identique |
| Desktop              | ✅ Strictement inchangé |

## Performances

- Zéro dépendance ajoutée.
- Aucun composant supplémentaire embarqué.
- Attribut HTML statique — impact runtime nul.
- Bundle inchangé.

## Type-check

0 erreur TypeScript.

## Phase 12 — Bilan global

- **LOT 1** : Infrastructure mobile (Drawer, BottomNav, safe-area).
- **LOT 2** : Dashboard.
- **LOT 3** : Navigation, filtres bottom-sheet.
- **LOT 4** : CRUD (Clients, Chantiers, Contacts, Entreprises).
- **LOT 5** : Essais Béton (~60 écrans).
- **LOT 6** : Essais Granulats (30 écrans).
- **LOT 7** : Essais Géotechniques (20 écrans).
- **LOT 8** : Formulations Dreux-Gorisse (7 écrans).
- **LOT 9** : Gestion des rapports (7 écrans).
- **LOT 10** : Facturation + RH + Matériel (57 écrans).

Total : **~180 écrans adaptés** en mode strictement non-invasif, avec
préservation totale des calculs, des workflows, du moteur d'impression
Phase 11 et de la base de données.

## STOP

LOT 11 non démarré, en attente de validation finale de la Phase 12.
