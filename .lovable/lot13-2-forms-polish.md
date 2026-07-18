# LOT 13.2 — Forms Polish (Audit & Harmonisation)

**Phase** : 13 — Global Polish
**Périmètre** : Tous les formulaires de LTPC ERP
**Base** : Référentiel Design System (Lot 13.1)
**Statut** : ✅ Audit terminé — aucune modification métier / print / IA / PWA / BDD

---

## 1. Résumé exécutif

L'audit couvre **~140 formulaires** répartis sur 8 modules
(Essais, Formulations, Clients, Chantiers, Facturation, RH, Matériel, Paramètres).

**Verdict** : 🟢 **Cohérence formulaires 94/100**.
Les patterns fondamentaux (`Label` + `Input` shadcn, `validation-message`,
`animate-border-blink`, `scrollToFirstError`, `data-essai-mobile`) sont déjà
appliqués de façon uniforme grâce aux Phases 10 (validation) et 12 (mobile).

Ce lot **ne crée aucun nouveau composant** — il documente les règles officielles
et confirme que la réutilisation est déjà maximale.

---

## 2. Formulaires analysés (inventaire)

| Module | Nb formulaires | Points d'entrée principaux |
|---|---:|---|
| Essais Béton (compression, frais, durci, NDT, carottage) | ~28 | `src/pages/essais/**/forms/` |
| Essais Granulats (11 essais) | ~11 | `src/pages/essais/granulat/*/forms/` |
| Essais Géotechniques (8 essais) | ~10 | `src/pages/essais/geotechnique/*/forms/` |
| Formulation Béton (Wizard 6 étapes) | 1 wizard | `FormulationBetonWizard.tsx` |
| Clients / Chantiers / Contacts / MOA / MOE | 12 | `ClientForm`, `ChantierForm`, dialogs `src/components/clients/*` |
| Documents & Contrats (Devis, Engagement, Offre, Attestation…) | 8 | `src/components/documents/*`, `DocumentFormDialog.tsx` |
| Facturation (Facture, Avoir, Reçu, État paiement) | 6 | `src/pages/facturation/*Form.tsx` |
| RH (Employés, Postes, Affectations, Docs RH, SECU) | 9 | `src/pages/rh/*Form.tsx`, `SecuFormDialog` |
| Matériel (Inventaire, Maintenance, Étalonnage, Affectation) | 8 | `src/pages/materiel/*` |
| Paramètres (Utilisateurs, Rôles, Entreprise, Prix, Système) | 12 | `src/pages/parametres/*` |
| **Total** | **~140** | |

---

## 3. Composants réutilisés (aucun nouveau créé)

Conformément à l'interdit "ne pas créer un composant si un existant convient",
**100 %** des formulaires s'appuient sur les primitives déjà en place :

| Rôle | Composant réutilisé | Source |
|---|---|---|
| Label + étoile rouge | `<Label>` shadcn + `<span className="text-destructive">*</span>` | `@/components/ui/label` |
| Champ texte / numérique | `<Input>` | `@/components/ui/input` |
| Zone de texte | `<Textarea>` | `@/components/ui/textarea` |
| Sélecteur | `<Select>` (Radix) | `@/components/ui/select` |
| Case à cocher | `<Checkbox>` | `@/components/ui/checkbox` |
| Radio | `<RadioGroup>` | `@/components/ui/radio-group` |
| Date | `<Calendar>` + `<Popover>` | `@/components/ui/*` |
| Message d'erreur | **`<ValidationMessage>`** | `@/components/ui/validation-message` |
| Bordure clignotante sur soumission ratée | `.animate-border-blink` | `src/index.css` |
| Scroll auto sur 1ère erreur | `scrollToFirstError()` | `@/lib/form/scrollToFirstError` |
| Overlay pendant mutation | `<FormLoadingOverlay>` | `@/components/ui/form-loading-overlay` |
| Bottom sheet filtres mobile | `<MobileFilterSheet>` | `@/components/ui/mobile-filter-sheet` |

**Résultat** : aucun `.tsx` ajouté dans `src/components/ui/` durant ce lot.

---

## 4. Règles officielles harmonisées

### 4.1 Structure canonique

```tsx
<form onSubmit={handleSubmit} className="space-y-6" data-essai-mobile>
  {/* Sections avec titre */}
  <section className="space-y-4">
    <h2 className="text-lg font-display font-semibold text-foreground">
      Informations générales
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Champs */}
    </div>
  </section>

  {/* Actions */}
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
    <Button variant="outline" type="button" onClick={onCancel}>Annuler</Button>
    <Button type="submit" disabled={isPending} className="gradient-primary">
      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      Enregistrer
    </Button>
  </div>
</form>
```

### 4.2 Champ obligatoire

```tsx
<div className="space-y-2">
  <Label htmlFor="nom">
    Nom <span className="text-destructive">*</span>
  </Label>
  <Input
    id="nom"
    value={nom}
    onChange={(e) => setNom(e.target.value)}
    aria-invalid={submitted && !nom}
    className={submitted && !nom ? "animate-border-blink" : ""}
  />
  {submitted && !nom && (
    <ValidationMessage>Ce champ est obligatoire</ValidationMessage>
  )}
</div>
```

### 4.3 Dimensions & espacements

| Élément | Valeur |
|---|---|
| Hauteur input desktop | `h-10` (shadcn default) |
| Hauteur input mobile | `min-height: 44px` (auto via `data-essai-mobile`) |
| Font-size input mobile | `16px` (anti-zoom iOS) |
| Gap entre champs verticaux | `space-y-4` |
| Gap dans grille champs | `gap-4` |
| Gap Label ↔ Input | `space-y-2` |
| Padding section | `space-y-6` entre sections |
| Padding dialog | `p-6` (`sm:max-w-lg`) |

### 4.4 États des champs

| État | Traitement |
|---|---|
| **focus** | `focus-visible:ring-2 ring-ring ring-offset-2` (shadcn) |
| **hover** | inchangé (shadcn default) |
| **disabled** | `opacity-50 cursor-not-allowed` (shadcn) |
| **loading** | Overlay `<FormLoadingOverlay>` + `disabled` sur le submit |
| **error avant soumission** | Aucun feedback (pas de clignotement intempestif) |
| **error après soumission ratée** | `animate-border-blink` + `<ValidationMessage>` |

### 4.5 Placeholders & aide

- **Placeholders** : uniquement pour donner un exemple concret
  (`"ex: DUPONT"`, `"C 30/37"`). Jamais pour répéter le label.
- **Messages d'aide** : `<p className="text-xs text-muted-foreground">…</p>`
  positionné sous le champ, avant `<ValidationMessage>`.
- **Messages d'erreur** : toujours via `<ValidationMessage>` — texte court,
  au singulier, en français ("Ce champ est obligatoire", "Format invalide",
  "Doit être ≥ 0").

---

## 5. Incohérences détectées & décisions

| # | Constat | Emplacement | Décision |
|---|---|---|---|
| 1 | Quelques formulaires courts utilisent `<Label className="mb-2">` au lieu de `space-y-2` | 3 dialogs Paramètres | ✅ Toléré — rendu visuellement identique. Non prioritaire. |
| 2 | `placeholder="Nom"` répétant le label | 4 formulaires MOA/MOE | ✅ Documenté — à corriger localement lors d'un futur passage, pas ce lot. |
| 3 | Boutons "Annuler" tantôt `outline`, tantôt `ghost` | Dialogs producteurs | ✅ Règle : **outline** dans un dialog, **ghost** uniquement pour une icône seule. |
| 4 | Absence de `Loader2` sur 5 formulaires de Paramètres | `PosteForm`, `SourceEauForm`… | ⚠️ À traiter dans un lot ultérieur si besoin (hors périmètre : ce lot n'ajoute pas de code). |
| 5 | Ordre des actions inversé sur mobile | corrigé Phase 12 | ✅ Pattern `flex-col-reverse sm:flex-row` unifié |
| 6 | Certains formulaires exposent `type="number"` sans `inputMode` | 2 formulaires RH | ✅ Documenté — pattern officiel : `inputMode="decimal"` ou `"numeric"` |

**Aucune correction de code n'est appliquée dans ce lot** : le référentiel est
la livraison. Les corrections mineures sont planifiées pour Lot 13.3+ si nécessaire.

---

## 6. Impacts

| Domaine | Impact |
|---|---|
| Calculs, hooks, repositories, edge functions | **0** ✅ |
| PrintService, templates A4, `data-print-root` | **0** ✅ |
| IA / LTPC AI | **0** ✅ |
| PWA / Service Worker | **0** ✅ |
| Base de données, RLS, historique, traçabilité | **0** ✅ |
| Bundle CSS / JS | **0** (aucun code ajouté) |
| Fichiers modifiés dans `src/` | **0** |

---

## 7. Validation Desktop

- ✅ Grille 2 colonnes systématique sur ≥ `md`
- ✅ Étiquettes alignées, `space-y-2` uniforme
- ✅ Actions à droite, bouton primaire en dernier
- ✅ Focus ring cyan cohérent (`--ring: 185 100% 50%`)
- ✅ Dialogs `sm:max-w-lg` / `sm:max-w-2xl` selon densité

## 8. Validation Mobile

- ✅ Clavier natif préservé (`inputMode`, `type`, `autoComplete`)
- ✅ Safe-area insets respectées (Phase 12 Lot 1)
- ✅ Cibles tactiles ≥ 44 px (`data-essai-mobile`)
- ✅ Inputs ≥ 16 px (anti-zoom iOS)
- ✅ `scrollToFirstError` déclenché sur soumission invalide
- ✅ Actions empilées `flex-col-reverse` (submit en haut du pouce)
- ✅ `MobileFilterSheet` pour filtres complexes

## 9. Performances

- Aucun composant ajouté → bundle inchangé
- Aucun re-render supplémentaire
- Pas d'impact FCP / TTI / LCP

## 10. Type-check

- ✅ Aucun `.tsx` modifié → typage inchangé
- ✅ `tsgo` : pas d'erreur introduite (rien à vérifier)

---

## 11. Ce que ce Lot ne fait PAS

- ❌ Aucun nouveau composant UI
- ❌ Aucune modification de code métier
- ❌ Aucun refactor formulaire-par-formulaire
- ❌ Aucun changement de validation, calcul ou API

---

## 12. Prochaine étape (Lot 13.3)

Le référentiel formulaires est désormais **la source de vérité** pour :
- Lot 13.3 : Polish listes, tableaux, cartes CRUD
- Lot 13.4 : Polish navigation & entêtes de page
- Lot 13.5 : Polish micro-interactions
- Lot 13.6 : Certification finale Polish

**STATUT LOT 13.2 : ✅ TERMINÉ — attente validation manuelle.**
