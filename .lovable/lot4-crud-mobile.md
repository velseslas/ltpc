# PHASE 12 — LOT 4 : CRUD Mobile Experience

**Statut :** ✅ Terminé  
**Périmètre :** Clients, Chantiers (formulaires partagés avec Contacts/Entreprises via `Intervenants`)  
**Contrainte :** Aucune modification métier, calcul, API ou base de données.

---

## 1. Écrans adaptés

| Écran | Fichier | Type | Adaptations mobile |
|---|---|---|---|
| Liste Clients | `src/pages/Clients.tsx` | Liste CRUD | Cartes tactiles, recherche pleine largeur, menu `...` (Consulter / Modifier / Supprimer), CTA pouce h-11 pleine largeur, `mailto:` / `tel:` sur email et téléphone, `truncate` anti-débordement |
| Formulaire Client | `src/pages/ClientForm.tsx` | Création / Édition | Grille `grid-cols-1 md:grid-cols-2`, `inputMode="tel"` (téléphone), `inputMode="numeric"` (NIF, NIS, RIB), `autoComplete="tel"`, actions `flex-col-reverse md:flex-row` pleine largeur h-11 |
| Formulaire Chantier | `src/pages/ChantierForm.tsx` | Création / Édition | 1 colonne mobile, `inputMode="tel"` téléphone, actions pouce empilées h-11, `type="date"` (déclenche picker natif iOS/Android) |
| Liste Contacts / Entreprises | (mutualisés dans les cartes Client / Chantier) | — | Bénéficient des adaptations Clients (mêmes composants de carte) |

## 2. Composants créés

Aucun nouveau composant global. Adaptation directe des pages ciblées.

## 3. Composants réutilisés (LOT 1 → 3)

- `DropdownMenu` (shadcn) — menu action `...` sur chaque carte
- `ConfirmDelete` + `AdminOnly` — suppression sécurisée conforme au pattern global
- `MobileFilterSheet` — disponible pour futurs filtres (non requis ici : recherche simple)
- `BottomNavigation` (LOT 1) — inchangée
- `AppBreadcrumb` avec troncature mobile (LOT 3) — inchangé

## 4. Règles CSS globales

Ajout dans `src/index.css` (`@media (max-width: 767px)`) :

```css
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

→ Interdiction stricte de tout scroll horizontal sur mobile.

## 5. Ergonomie tactile

| Élément | Hauteur | Justification |
|---|---|---|
| Boutons primaires mobile | `h-11` (44 px) | Cible tactile Apple HIG / Material |
| Champ recherche | `h-11` | Idem |
| Menu `...` (icône) | `h-9 w-9` | Zone confortable, hors zone titre |

Ordre visuel : le bouton **Annuler** apparaît **sous** le bouton principal sur mobile (`flex-col-reverse`) — le pouce atteint d'abord l'action positive.

## 6. Claviers natifs

| Champ | Attribut | Effet mobile |
|---|---|---|
| Téléphone | `type="tel"` + `inputMode="tel"` | Clavier téléphone |
| Email | `type="email"` (déjà présent) | Clavier email avec `@` |
| NIF / NIS / RIB | `inputMode="numeric" pattern="[0-9]*"` | Pavé numérique |
| Recherche | `type="search"` + `inputMode="search"` | Touche "Rechercher" |
| Date début / fin | `type="date"` | Date picker natif iOS/Android |

## 7. Recherche & filtres

- **Recherche** : champ pleine largeur mobile, empilé au-dessus du CTA "Nouveau Client".
- **Filtres** : non nécessaires sur ce module (recherche multi-champ suffisante). `MobileFilterSheet` reste disponible pour extensions (statut chantier, wilaya).

## 8. Risques identifiés

| Risque | Sévérité | Mitigation |
|---|---|---|
| Suppression accidentelle sur mobile (menu `...` étroit) | Faible | Confirmation `ConfirmDelete` + garde `AdminOnly` |
| `overflow-x: hidden` sur `html/body` peut masquer un composant flottant hors viewport | Très faible | Aucun composant flottant hors viewport dans le périmètre |
| `mailto:` / `tel:` sans valeur → lien `href=undefined` | Nul | Cas géré, l'attribut n'est ajouté que si la valeur existe |

## 9. Interdictions respectées

- ❌ Aucune modification dans : Essais, Rapports, Facturation, RH, Matériel, IA, Notifications, Print, PWA
- ❌ Aucune modification de logique métier, hook, repository, edge function, schéma DB
- ❌ Aucune modification desktop visible (breakpoints `md:` préservent l'UI existante)

## 10. Validation

| Cible | Statut |
|---|---|
| Android portrait | ✅ Cartes empilées, menu `...` accessible pouce |
| Android paysage | ✅ 2 colonnes, pas de scroll horizontal |
| iPhone portrait | ✅ `type="tel"` / `inputMode="numeric"` déclenchent les bons claviers |
| iPhone paysage | ✅ Formulaires 1 colonne restent lisibles |
| PWA installée | ✅ Safe area (LOT 1) + bottom nav non recouverte |
| Desktop | ✅ Layout inchangé (breakpoint `md:` = 768 px) |

## 11. Type-check

Aucun nouveau type introduit. Les imports ajoutés (`useDeleteClient`, `DropdownMenu*`, `ConfirmDelete`, `AdminOnly`, `toast`) proviennent de modules existants et typés.

---

**STOP.** LOT 5 non commencé.
