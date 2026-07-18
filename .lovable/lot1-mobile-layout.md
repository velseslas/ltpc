# LOT 1 — Mobile Layout Shell

**Phase :** 12 — Mobile Experience
**Statut :** ✅ Terminé
**Périmètre :** Infrastructure de navigation uniquement (layout, sidebar, drawer, header, bottom nav, safe-area).
**Type-check :** ✅ `tsgo --noEmit` → 0 erreur.

---

## 1. Composants modifiés

| Fichier | Nature de la modification |
|---|---|
| `src/index.css` | Ajout d'utilitaires `safe-area-*`, `touch-target`, `mb-safe`, `pt-safe`, `pb-safe`. Règle `@media (max-width: 767px)` fixant `font-size: 16px` sur inputs/select/textarea pour empêcher le zoom iOS. Aucun token de couleur touché. |
| `src/components/layout/Sidebar.tsx` | 1) `menuItems` exporté. 2) Extraction du filtre de permissions dans un hook `useVisibleMenuItems()` réutilisable. 3) Ajout de `hidden md:flex` sur `<aside>` → la sidebar Desktop disparaît en dessous de 768px, elle reste **strictement inchangée** au-dessus. |
| `src/components/layout/Navbar.tsx` | Ajout prop optionnelle `onMenuClick?`. Bouton hamburger `md:hidden` en tête de barre, `touch-target` 44px. Ajout classe `safe-area-top` pour respecter le notch iOS. |
| `src/components/layout/MainLayout.tsx` | State `drawerOpen`. Marges responsives : `ml-0` mobile, `md:ml-16` / `md:ml-56` desktop. Padding bottom `pb-24 md:pb-6` pour laisser place à la Bottom Nav. Montage conditionnel automatique du `MobileDrawer` et de la `BottomNavigation` (visibilité gérée en interne par `md:hidden`). |

## 2. Composants créés

| Fichier | Rôle |
|---|---|
| `src/components/layout/MobileDrawer.tsx` | Drawer de navigation mobile via `Sheet` (côté gauche, 85vw). Réutilise `useVisibleMenuItems()` → **zéro duplication** de logique de permissions. Header (logo + entreprise), liste de liens `touch-target`, footer utilisateur + déconnexion. Se ferme automatiquement au click sur un lien. Safe-area top/bottom respectées. |
| `src/components/layout/BottomNavigation.tsx` | Barre d'onglets basse `md:hidden`. Items : Accueil / Essais / Chantier / Menu (drawer). Techniciens voient uniquement Essais/Chantier/Menu. Actif détecté via `location.pathname.startsWith(path)`. Padding bottom safe-area. Zones tactiles ≥ 44px. |

## 3. Impacts visuels

### Desktop (≥ 768px)
- **Aucun changement visuel.** Sidebar (`w-16`/`w-56`), Navbar sans hamburger, MainLayout `md:ml-16`/`md:ml-56` identiques à l'existant.
- Le hamburger n'apparaît jamais (`md:hidden`).
- Bottom Navigation invisible (`md:hidden`).

### Mobile (< 768px)
- Sidebar fixe supprimée (elle recouvrait le contenu auparavant).
- Header 56px avec hamburger à gauche → ouvre le drawer.
- Contenu principal `ml-0`, padding horizontal `px-4`, padding bottom `pb-24` pour ne pas être masqué par la Bottom Nav.
- Bottom Nav 4 items (56px + safe-area).
- Drawer plein-écran 85vw avec liens 48px minimum.

### Tablette (768-1024px)
- Comportement Desktop (breakpoint `md` = 768px). Sidebar visible, pas de bottom nav, pas de hamburger.

## 4. Risques

| Risque | Statut | Mitigation |
|---|---|---|
| Régression Desktop | 🟢 Nul | Bascule via `md:` uniquement, aucun style Desktop modifié |
| Contenu masqué par Bottom Nav | 🟢 Contrôlé | `pb-24 md:pb-6` sur `<main>` |
| Zoom iOS sur focus input | 🟢 Neutralisé | `font-size: 16px` forcé en dessous de 768px |
| Notch / gesture bar | 🟢 Traité | `safe-area-top` sur header, `pb-safe` sur bottom nav & drawer |
| Duplication permissions | 🟢 Évitée | `useVisibleMenuItems()` unique source de vérité |
| PWA / Print / Impression | 🟢 Intouché | Aucun fichier `print.css`, `PrintService`, `sw.js`, `manifest` modifié |
| Hooks/API/RLS/Repos | 🟢 Intouché | 0 fichier `hooks/`, `lib/repositories/`, `supabase/` modifié |

## 5. Validation

### Automatique
- ✅ `tsgo --noEmit` : 0 erreur.
- ✅ Aucun fichier hors `src/components/layout/*` + `src/index.css` modifié.
- ✅ Aucun hook métier importé dans les 2 nouveaux composants (seul `usePermissionContext`, `useEntreprise`, `useAuth` — déjà utilisés par `Sidebar`/`Navbar` existants).

### Manuelle recommandée (QA visuelle)
| Cas | Attendu |
|---|---|
| Desktop 1280×800 portrait | Sidebar visible, pas de hamburger, pas de bottom nav — identique à avant |
| Desktop 1024px (tablette landscape) | Comportement desktop |
| Mobile 390×844 portrait (iPhone 14) | Hamburger visible, drawer ouvre à gauche, bottom nav visible |
| Mobile 390×844 → click Essais dans bottom nav | Navigation OK, item actif surligné cyan |
| Mobile portrait → rotation landscape 844×390 | Bottom nav reste, drawer scrollable |
| Android 360×640 | Idem iPhone, safe-area = 0 (pas de notch) |
| iPhone SE 375×667 | Hamburger + bottom nav visibles, marges px-4 |
| Bouton "Menu" bottom nav | Ouvre le drawer, ferme drawer au click sur lien |
| Bouton déconnexion drawer | Ferme drawer + logout |
| Focus input mobile | Pas de zoom (font-size ≥ 16px) |

## 6. Ce qui n'a PAS été fait (par design, hors périmètre LOT 1)

- ❌ Aucune page modifiée (Dashboard, Essais, Clients, etc.)
- ❌ Aucun tableau converti en cartes
- ❌ Aucun formulaire adapté
- ❌ Aucun dialog transformé en Sheet
- ❌ Aucun FAB créé
- ❌ Aucun BottomSheet de filtres

Ces sujets seront traités **LOT 2 → LOT 10** selon la roadmap `.lovable/phase12-mobile-roadmap.md`.

## 7. Fichiers touchés (résumé)

```
modified:
  src/index.css
  src/components/layout/Sidebar.tsx
  src/components/layout/Navbar.tsx
  src/components/layout/MainLayout.tsx

created:
  src/components/layout/MobileDrawer.tsx
  src/components/layout/BottomNavigation.tsx
```

**Total :** 4 modifiés, 2 créés. **0** modification métier / hook / repository / API / PWA / Print.

---

**STOP.** LOT 1 terminé. En attente de validation avant démarrage LOT 2 (Dashboard mobile).
