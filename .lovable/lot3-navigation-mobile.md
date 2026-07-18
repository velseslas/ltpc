# PHASE 12 — LOT 3 : Navigation & Recherche Mobile

**Statut** : ✅ Terminé
**Date** : 2026-07-18
**Périmètre** : Navigation, recherche, filtres, breadcrumbs, sélecteurs, états.
**Contrainte respectée** : 0 modification métier, 0 API, 0 base, 0 calcul.

---

## 1. Objectifs

Optimiser toutes les surfaces de navigation et de recherche pour un usage mobile
(portrait/paysage, iOS/Android, PWA installée) sans altérer le desktop.

## 2. Éléments adaptés

| Zone | Composant | Changement mobile |
|---|---|---|
| Header | `Navbar.tsx` (LOT 1) | Hamburger visible < md, nom entreprise masqué |
| Drawer | `MobileDrawer.tsx` (LOT 1) | 85 vw, safe-area, touch-target 44 px |
| Bottom bar | `BottomNavigation.tsx` (LOT 1) | 3-4 raccourcis + Menu, safe-area |
| Sidebar desktop | `Sidebar.tsx` | Inchangé, masqué < md |
| Fil d'Ariane | `AppBreadcrumb.tsx` | **Compacté** : troncature à 2 derniers items + `…`, `max-w-[55vw]` sur item courant |
| Recherche liste | `EchantillonFilters.tsx` | Input pleine largeur ; Select statut passe en `w-full` (< sm) au lieu de `w-[180px]` |
| Filtres regroupés | `ui/mobile-filter-sheet.tsx` **(nouveau)** | Bottom Sheet réutilisable — trigger `md:hidden`, header sticky, footer Réinitialiser / Appliquer |
| Utilitaires CSS | `index.css` | `.scroll-touch` (momentum + overscroll-contain), `.no-mobile-hscroll` (garde-fou anti-débordement < 768 px) |

## 3. Nouveau composant : `MobileFilterSheet`

Shell purement présentationnel pour regrouper des filtres dans un bottom sheet
mobile. Aucune logique métier ; les listes existantes peuvent l'adopter lot par
lot sans casser le desktop.

```tsx
<MobileFilterSheet activeCount={2} onReset={reset} title="Filtres échantillons">
  {/* inputs / selects existants — inchangés */}
</MobileFilterSheet>
```

- Trigger : `md:hidden` — invisible sur desktop.
- Contenu : `max-h-[85dvh]`, scroll interne, `safe-area-bottom`.
- Boutons : hauteur 44 px (`touch-target`).

## 4. Règles UX appliquées

- Barre de recherche : **pleine largeur** sur mobile (`flex-1` déjà présent + Select passé en `w-full`).
- Sélecteurs : hauteur ≥ 44 px, `font-size` 16 px (hérité de LOT 1 → pas de zoom iOS).
- Breadcrumbs : plus jamais de scroll horizontal — troncature + `…`.
- Navigation au pouce : actions primaires accessibles via Bottom Nav + Drawer.
- Momentum scroll : `.scroll-touch` disponible pour tout conteneur horizontal légitime.

## 5. Périmètre strictement respecté (aucune modification)

Clients • Chantiers • Essais • Rapports • Facturation • RH • Matériel •
Notifications • IA • Print • PWA.

Les listes de ces modules pourront adopter `MobileFilterSheet` dans un lot
ultérieur si nécessaire — il n'est **pas** branché aujourd'hui.

## 6. Fichiers modifiés

| Fichier | Type |
|---|---|
| `src/components/layout/AppBreadcrumb.tsx` | modifié — troncature mobile |
| `src/components/essais/EchantillonFilters.tsx` | modifié — select `w-full sm:w-[180px]` |
| `src/components/ui/mobile-filter-sheet.tsx` | **nouveau** — bottom sheet réutilisable |
| `src/index.css` | ajout utilitaires `.scroll-touch`, `.no-mobile-hscroll` |
| `.lovable/lot3-navigation-mobile.md` | livrable |

## 7. Validation

- ✅ Desktop (≥ 768 px) : rendu strictement inchangé.
- ✅ Mobile portrait 390 × 621 : plus de débordement horizontal du breadcrumb sur pages profondes.
- ✅ Mobile paysage : bottom sheet respecte `85dvh`.
- ✅ PWA installée : `safe-area-*` respectées (hérité LOT 1).
- ✅ TypeScript : 0 erreur.

---

**STOP.** LOT 4 non commencé — en attente de validation.
