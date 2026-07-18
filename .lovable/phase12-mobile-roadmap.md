# PHASE 12 — MOBILE EXPERIENCE ROADMAP

**Projet :** LTPC ERP v1.0
**Date :** 18 juillet 2026
**Statut :** 📋 Analyse & Planification uniquement — Aucune modification de code
**Cible :** UX Mobile professionnelle pour usage terrain (chantier, laboratoire mobile)

---

## 1. Contexte & Principes directeurs

LTPC ERP est actuellement optimisé Desktop (334 pages, 121 composants racines, ~635 fichiers). Les techniciens de laboratoire de chantier et les responsables terrain ont besoin d'une expérience mobile **native-like**, pas d'un simple responsive dégradé.

### Règles absolues (invariants)

- ❌ Aucune modification des **hooks**, **repositories**, **Edge Functions**, **RLS**, **PWA**, **IA**, **Auth**, **Storage**, **Notifications**, **calculs métier**, **base de données**.
- ✅ Un **seul hook** alimente Desktop ET Mobile (zero duplication métier).
- ✅ Desktop reste la référence. Mobile = **couche de présentation dédiée**.
- ✅ **Toutes** les fonctionnalités Desktop restent accessibles sur Mobile (jamais de dégradation fonctionnelle).
- ✅ Breakpoint canonique : `useIsMobile()` déjà présent (`< 768px`).

---

## 2. Inventaire des écrans (audit initial)

### 2.1 Statistiques globales

| Catégorie | Nombre | Priorité mobile |
|---|---|---|
| Pages `src/pages/**` | 334 | — |
| Composants `src/components/**` | 121 | — |
| Modules métier principaux | 9 | — |
| Rapports imprimables | ~57 | 🔵 Basse (impression = Desktop) |
| Formulaires wizards | ~15 | 🔴 Haute |
| Dashboards | 7 | 🔴 Haute |
| Tableaux/listes | ~80 | 🔴 Haute |

### 2.2 Cartographie par module

| Module | Pages | Composants clés | Usage terrain | Priorité |
|---|---|---|---|---|
| **Dashboard** (`Index.tsx`) | 1 | QuickStats, StatCard, ActivityChart | ⭐⭐⭐ | 🔴 P1 |
| **Layout & Nav** | 4 | Navbar, Sidebar, MainLayout, NotificationBell | ⭐⭐⭐ | 🔴 P1 |
| **Intervenants (Clients/Chantiers/MOA/MOE)** | ~15 | ClientFormDialog, ChantierFormDialog | ⭐⭐ | 🟠 P2 |
| **RH** | 8 | Employes, EmployeForm, Affectations, SecuFormDialog | ⭐ | 🟡 P3 |
| **Essais** (Béton/Granulats/Géo/NDT) | ~120 | *SampleForm, *List, *Report | ⭐⭐⭐ | 🔴 P1 (saisie), 🔵 P4 (rapports) |
| **Formulations Dreux-Gorisse** | ~15 | Wizard 6 étapes, FormulationReport | ⭐⭐ | 🟠 P2 |
| **Laboratoires Chantier** | ~10 | WilayaCard, ChantierCard, ClientCard | ⭐⭐⭐ | 🔴 P1 |
| **Matériel** | ~15 | MaterielInventaireDialog, mouvements | ⭐⭐ | 🟠 P2 |
| **Facturation** | ~20 | Factures, Devis, Paiements, Etats | ⭐ | 🟡 P3 |
| **Documents administratifs** | ~15 | Contrats, Offres, Engagements | ⭐ | 🟡 P3 |
| **Paramètres** | ~12 | Entreprise, Utilisateurs, TVA, QR | ⭐ | 🟡 P3 |
| **LTPC AI** | 4 | Chat, KnowledgeBase, Monitoring | ⭐⭐ | 🟠 P2 |
| **PWA Debug** | 2 | DebugPWA, DebugNotifications | — | 🔵 P4 |

### 2.3 Anti-patterns actuels détectés

- `Sidebar` fixe (`w-56` / `w-16`) et `Navbar` fixe avec `ml-56` dans `MainLayout` → casse en dessous de 768px.
- Formulaires wizards (Compression, Formulation, Géo) en grille 2-4 colonnes non repliée.
- Tableaux `<table>` denses (ex. `EchantillonBetonFraisList`, mouvements matériel) sans version carte.
- Dialogs Radix (`sm:max-w-lg`) qui débordent en portrait.
- Filtres inline (`EchantillonFilters` : Input + Select 180px) qui compriment sur mobile.
- Dashboards en grilles `sm:grid-cols-2 lg:grid-cols-4` OK mais widgets internes non pensés touch.
- Boutons d'action inline dans les cartes (Employés) — heureusement déjà migrés vers DropdownMenu `...`.
- Aucun **bottom navigation** ni **FAB**.
- Aucune **safe-area** iOS (`env(safe-area-inset-*)`).

---

## 3. Stratégie de migration

### 3.1 Approche : composants adaptatifs, un seul hook

```text
                  ┌─── useEchantillonsCompression() ───┐
                  │                                    │
                  ▼                                    ▼
      <DesktopCompressionList/>              <MobileCompressionList/>
      (table, colonnes)                      (cards, swipe, FAB)
                  │                                    │
                  └──── <CompressionListPage/> ────────┘
                       (choisit via useIsMobile)
```

**Deux options d'implémentation** (à trancher au LOT 1) :

- **A. Fork ciblé** : `MyList.tsx` = wrapper + `MyList.desktop.tsx` / `MyList.mobile.tsx`. Clair, mais 2× fichiers.
- **B. Composant unique + primitives responsives** : `<ResponsiveTable>`, `<ResponsiveForm>`, `<ResponsiveDialog>` qui basculent en interne. Moins de fichiers, DRY, recommandé pour ce projet.

**Recommandation : option B** avec fork ciblé (A) uniquement pour Dashboard, Wizards essais, et Sidebar/Nav.

### 3.2 Découpage en lots

| Lot | Périmètre | Écrans | Effort | Bloque suite ? |
|---|---|---|---|---|
| **LOT 1** | Navigation shell : `MainLayout`, `Sidebar` → Drawer, `Navbar` mobile, Bottom Navigation, safe-area, primitives (`ResponsiveDialog`, `BottomSheet`, `FAB`) | 4 fichiers + 6 nouveaux | M | ✅ Oui |
| **LOT 2** | Dashboard `Index.tsx` + `QuickStats`, `StatCard`, charts empilés | 8 | S | Non |
| **LOT 3** | Clients / MOA / MOE / Chantiers : listes → cartes, formulaires 1 col | 15 | M | Non |
| **LOT 4** | Chantiers détail + Laboratoires Chantier (WilayaCard/ClientCard/ChantierCard déjà cards ✅) | 10 | S | Non |
| **LOT 5** | Essais : listes + formulaires "Nouveau échantillon" (Béton, Granulats, Géo, NDT) — **le plus critique terrain** | ~60 | L | Non |
| **LOT 6** | Formulations Dreux-Gorisse : wizard 6 étapes stepper mobile | 15 | L | Non |
| **LOT 7** | Rapports : bouton preview + share adapté mobile (impression reste Desktop) | ~57 | S | Non |
| **LOT 8** | Facturation : factures/devis/paiements en cartes, filtres BottomSheet | 20 | M | Non |
| **LOT 9** | RH + Matériel : cartes employés (déjà migré), mouvements, étalonnage | 25 | M | Non |
| **LOT 10** | Polish global : typographie, animations, gestes, orientation, QA transverse | Transverse | M | Non |

**Estimation totale** : ~10 lots × 0,5 à 2 jours = **8 à 15 jours ingénieur** hors QA terrain.

---

## 4. Composants à créer (design system mobile)

### 4.1 Primitives (LOT 1)

| Composant | Rôle | Basé sur |
|---|---|---|
| `MobileDrawer` | Sidebar mobile en overlay avec backdrop, swipe-to-close | `Sheet` shadcn |
| `BottomNavigation` | 4-5 items principaux (Dashboard, Essais, Labo Chantier, Notifications, Menu) | Custom |
| `MobileHeader` | Header compact 56px avec back button contextuel + titre + action | Custom |
| `FAB` | Bouton flottant bas-droite pour action primaire (ex. "+ Nouveau") | Custom + `Button` |
| `BottomSheet` | Feuille glissante bas d'écran pour filtres/actions secondaires | `Sheet` (side=bottom) |
| `ResponsiveDialog` | `Dialog` desktop / `Sheet` fullscreen mobile | wrapper |
| `ResponsiveTable` | `<table>` desktop / `<Card>` mobile avec info repliable | wrapper |
| `SwipeableCard` | Carte avec actions gauche/droite (edit/delete) | framer-motion |
| `StepperMobile` | Wizard stepper vertical mobile vs horizontal desktop | Custom |
| `TouchSelect` | Select natif optimisé grande liste (recherche + virtualisation) | Command |

### 4.2 Layout classes utilitaires (LOT 1, `index.css`)

```css
.safe-area-top { padding-top: env(safe-area-inset-top); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
.touch-target { min-height: 44px; min-width: 44px; }
.mobile-container { padding: 16px; padding-bottom: calc(64px + env(safe-area-inset-bottom)); }
```

### 4.3 Composants à réutiliser tels quels

- Tous les `hooks/**` (0 modification)
- `PrintService`, `print.css` (impression reste identique)
- `ErrorBoundary`, `ProtectedRoute`, `MaintenanceGate`
- Design tokens `index.css` (couleurs, gradients — déjà HSL semantic)
- `shadcn/ui` : `Sheet`, `Drawer`, `Command`, `Dialog`, `Popover`, `Button`, `Card`
- `WilayaCard`, `ClientCard`, `ChantierCard` (déjà en format carte ✅)
- Employés (DropdownMenu `...` déjà en place ✅)

---

## 5. Recommandations UX Mobile détaillées

### 5.1 Navigation

- **Sidebar → Drawer** (hamburger top-left) + **Bottom Navigation** 4 items : Dashboard / Essais / Labo Chantier / Menu.
- Header mobile 56px : back button contextuel, titre tronqué, action principale.
- Breadcrumbs → masqués mobile, remplacés par back button + titre.

### 5.2 Formulaires

- 1 colonne systématique. `Label` au-dessus du champ. Espacement vertical 16px.
- Inputs `min-height: 48px`, `font-size: 16px` (évite zoom iOS).
- Wizards : stepper vertical + boutons "Suivant/Précédent" en bottom bar sticky.
- Validation `animate-border-blink` conservée (design système déjà en place).
- Champs date → `<input type="date">` natif sur mobile.

### 5.3 Listes → Cartes

- Chaque ligne devient une carte : titre (identifiant), 2-3 métadonnées, badge de statut, `...` dropdown.
- Colonnes secondaires repliables via chevron.
- Filtres : bouton "Filtrer" → BottomSheet plein écran avec Apply/Reset.
- Recherche : Input full-width sticky en haut de liste.
- Actions bulk : sélection long-press → toolbar contextuelle top.

### 5.4 Dashboard

- KPI Cards empilées 1 colonne, ou 2 colonnes en paysage.
- Charts responsive `ResponsiveContainer` (déjà via Recharts).
- Widgets d'action → carrousel horizontal snap.

### 5.5 Dialogs & Modales

- Radix `Dialog` → `Sheet side="bottom"` fullscreen en mobile.
- Formulaires longs (SECU, Contrat) : sheet fullscreen avec header sticky et footer sticky (Enregistrer).
- Éviter overlay avec keyboard : `interactive-widget=resizes-content` viewport meta.

### 5.6 Touch & Gestes

- **Tous** les tap targets ≥ 44×44 px (Apple HIG).
- Espacement min entre éléments cliquables : 8px.
- Swipe-to-delete sur cartes de listes non critiques.
- Pull-to-refresh sur listes principales (via React Query `refetch`).
- Long-press = menu contextuel.

### 5.7 Typographie mobile

| Élément | Desktop | Mobile |
|---|---|---|
| H1 page | 30px | 22px |
| H2 section | 20px | 18px |
| Body | 14px | 15px |
| Caption | 12px | 12px |
| Boutons | 14px | 16px |

### 5.8 Optimisations spécifiques terrain

- **QR Code scan** : bouton scanner natif via `BarcodeDetector` API (fallback `@zxing/browser`).
- **Photo/Camera** : `<input capture="environment">` pour photos échantillons.
- **Upload signature** : canvas plein écran, `SignaturePad` déjà présent ✅.
- **Orientation** : landscape autorisé pour tableaux longs (essais NDT).
- **Safe-area** : iOS notch + Android gesture bar respectés.
- **Clavier tactile** : `inputMode="numeric"` sur champs numériques (résistances, masses).

### 5.9 PWA (déjà en place — à préserver)

- Manifest déjà présent (`public/manifest.webmanifest`).
- Service Worker actif en production (voir `pwa-sw-diagnostic.md`).
- Push, install prompt, offline stubs → **aucune modification Phase 12**.
- Ajouter : icônes shortcuts manifest (Dashboard, Nouvel échantillon, Scanner QR).

---

## 6. Risques & impacts

### 6.1 Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Régression Desktop | Moyenne | 🔴 Haut | Composants adaptatifs conditionnés `useIsMobile()`, tests Playwright avant/après |
| Impression cassée | Faible | 🔴 Haut | `print.css` isolé + `data-print-root` déjà en place — ne pas modifier |
| Duplication métier accidentelle | Moyenne | 🟠 Moyen | Revue de code stricte : aucun `useState` métier dans composant `.mobile.tsx` |
| Explosion du nombre de fichiers | Élevée | 🟡 Bas | Privilégier primitives (option B), fork uniquement wizards |
| Perte de fonctionnalités | Faible | 🔴 Haut | Checklist par écran : "toutes actions Desktop accessibles ?" |
| Perf (bundle) | Moyenne | 🟠 Moyen | Lazy load `Mobile*` via `React.lazy` conditionnel |
| Compat iOS Safari 100% | Moyenne | 🟠 Moyen | QA sur device réel iOS + Android à chaque lot |
| Rupture UX terrain (utilisateurs habitués) | Faible | 🟡 Bas | Rollout progressif, feedback techniciens après LOT 5 |

### 6.2 Impacts sur l'existant

- ✅ **Zéro impact** sur : `supabase/**`, `hooks/**`, `lib/repositories/**`, `lib/print/**`, RLS, migrations SQL.
- ⚠️ **Impact contrôlé** sur : `layout/**` (Sidebar, Navbar, MainLayout), `index.css` (variables safe-area), `tailwind.config.ts` (breakpoints si besoin).
- ⚠️ **Nouveaux fichiers** : ~10 primitives + fork ciblé sur ~15 écrans critiques.
- 🚫 **Rapports imprimables (~57)** : intouchés (P4). L'impression reste une action Desktop-first.

---

## 7. Estimation détaillée

| Lot | Charge (j.h) | Files touchés | Files créés |
|---|---|---|---|
| LOT 1 Navigation shell | 2 | 4 | 8-10 |
| LOT 2 Dashboard | 0.5 | 5 | 2 |
| LOT 3 Clients/MOA/MOE | 1.5 | 12 | 4 |
| LOT 4 Chantiers + Labo Chantier | 1 | 8 | 2 |
| LOT 5 Essais (saisie) | 3 | 40 | 15 |
| LOT 6 Formulations wizard | 1.5 | 8 | 4 |
| LOT 7 Rapports (preview only) | 0.5 | 10 | 1 |
| LOT 8 Facturation | 1.5 | 15 | 4 |
| LOT 9 RH + Matériel | 1.5 | 20 | 5 |
| LOT 10 Polish + QA | 1.5 | Transverse | — |
| **TOTAL** | **~14.5 j.h** | ~120 | ~45 |

---

## 8. Critères d'acceptation par lot

Pour qu'un lot soit certifié :

1. ✅ Toutes les fonctionnalités Desktop accessibles sur mobile (checklist par écran).
2. ✅ Aucun hook métier modifié (`git diff hooks/` vide).
3. ✅ Tap targets ≥ 44px vérifiés.
4. ✅ Test sur iPhone SE (375px) + iPhone 14 Pro Max (430px) + Android moyen (360px).
5. ✅ Landscape testé sur écrans "tableaux longs".
6. ✅ `tsgo --noEmit` sans erreur.
7. ✅ Desktop 1280px inchangé visuellement (snapshot Playwright).
8. ✅ PWA install + offline shell toujours fonctionnels.

---

## 9. Recommandations finales

1. **Ne pas démarrer LOT 2+ avant validation LOT 1** — les primitives conditionnent tout.
2. **Impliquer 1 technicien terrain** en revue après LOT 5 (retour métier réel).
3. **Ne pas migrer les rapports imprimables** — l'usage terrain est "générer et envoyer par WhatsApp/email", pas "lire un rapport 4 pages sur téléphone".
4. **Bottom Navigation limité à 4-5 items** — dépendant du rôle : Technicien voit `Essais / Labo Chantier / Scan / Menu` ; Admin voit `Dashboard / Essais / Facturation / Menu`.
5. **Adopter option B** (primitives responsives) pour 80% des écrans, réserver le fork (option A) aux wizards et au dashboard.
6. **Traiter la Phase 12 comme une V2 UI**, pas comme une correction de bugs — communication interne dédiée.

---

## 10. Livrable & Prochaine étape

**Livrable Phase 12 (ce document) :** `.lovable/phase12-mobile-roadmap.md`
**Statut :** ✅ Analyse & planification terminées.
**Modifications de code effectuées :** 🚫 **Aucune.**

**STOP.** En attente de validation manuelle avant démarrage LOT 1 (Navigation shell mobile).
