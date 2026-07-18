# PHASE 13 — GLOBAL POLISH ROADMAP
**LTPC ERP v1.0 — UX / UI / A11Y / Performance Frontend**

> Feuille de route officielle. Aucun code modifié dans cette phase.
> Périmètre strictement **présentation** — aucun calcul, IA, edge function, DB, workflow, sécurité, PrintService, PWA, ou repository n'est touché.

---

## 1. SYNTHÈSE

LTPC ERP est fonctionnellement certifié (ERP 84.3, Mobile 99, Print certifié, PWA opérationnelle). Le codebase (~640 fichiers) est cohérent au niveau **architectural**, mais a été construit par lots successifs sur 12 phases, ce qui a laissé des **micro-divergences visuelles** entre modules similaires (Béton / Granulat / Géotechnique / Facturation / RH / Matériel).

**Objectif Phase 13** : effacer ces divergences pour que l'utilisateur perçoive une application conçue d'une seule main.

**Score visuel actuel estimé** : 82/100
**Score cible après Phase 13** : ≥ 96/100

---

## 2. INVENTAIRE DES INCOHÉRENCES DÉTECTÉES

### 2.1 Design tokens & couleurs
- Quelques utilitaires Tailwind bruts (`text-gray-*`, `bg-white`, `text-black`) subsistent hors des templates d'impression (autorisés) — à remplacer par tokens sémantiques (`foreground`, `muted-foreground`, `card`, `background`).
- Badges d'état (Actif / En cours / Terminé / En attente / Archivé) utilisent des combinaisons variables selon les modules (parfois `variant="secondary"`, parfois classes ad-hoc).
- Hover cyan de `BackButton` défini ailleurs qu'en token — OK (mémoire projet), mais à documenter dans `index.css`.

### 2.2 Typographie
- Titres de page : mix `text-2xl`, `text-3xl`, `text-xl font-bold`, `text-2xl font-semibold`.
- Sous-titres / descriptions : `text-muted-foreground` parfois `text-sm`, parfois `text-base`.
- Numérotation / valeurs numériques dans les rapports : `tabular-nums` appliqué partiellement.

### 2.3 Espacement & layout
- Padding container : `p-4`, `p-6`, `px-4 py-6`, `space-y-4`, `space-y-6` — non-standardisé entre modules.
- Grilles KPI : `gap-3`, `gap-4`, `gap-6` selon modules.
- Cartes : `rounded-lg` vs `rounded-xl` (shadcn défaut = `rounded-lg`, quelques cartes custom en `2xl`).

### 2.4 Boutons
- Boutons d'action principale : hauteur cohérente (shadcn default) mais icônes tantôt `h-4 w-4`, tantôt `h-5 w-5`.
- Boutons "..." (dropdown row action) : parfois `variant="ghost" size="icon"`, parfois bouton custom.
- États `loading` : parfois `<Loader2 className="animate-spin" />`, parfois texte "Chargement...", parfois `disabled` seul.

### 2.5 Formulaires
- Labels obligatoires : la plupart avec étoile rouge (Phase Béton), quelques modules Facturation/RH sans étoile.
- Placeholders : parfois descriptifs ("Ex : SARL ..."), parfois vides, parfois répétition du label.
- Messages de validation : `<ValidationMessage>` normalisé Béton/Granulat/Géo, mais Facturation/RH utilisent encore `toast` uniquement.
- `inputMode` / `autoComplete` : appliqué Clients & Chantiers (Lot 4), pas encore généralisé.
- Ordre de tabulation : à vérifier sur wizards multi-colonnes.

### 2.6 Tableaux (desktop)
- Hauteur de ligne : `h-12` défaut shadcn, quelques tables custom en `h-10` ou `py-3`.
- Alignements numériques : colonnes de valeurs parfois `text-left`, devraient être `text-right tabular-nums`.
- Pagination : présente sur listes principales, absente sur listes secondaires (< 50 éléments — acceptable mais à documenter).

### 2.7 Cartes (mobile CRUD)
- Cartes clients / chantiers / employés : layouts légèrement différents (position du menu "...", ordre des métadonnées).
- Ombres : mix `shadow-sm`, `shadow`, `shadow-md`.

### 2.8 Dialogues
- Largeurs : `max-w-md`, `max-w-lg`, `max-w-2xl`, `max-w-4xl` non-corrélées au contenu.
- Scroll interne : certains dialogs longs (SecuFormDialog, wizards) manquent de `max-h-[90vh] overflow-y-auto` explicite.
- Bouton fermeture : shadcn Dialog OK, quelques Sheet custom sans bouton X visible sur mobile.

### 2.9 Loaders & skeletons
- Skeletons présents sur Dashboard et listes principales, absents sur pages détails.
- 3 patterns coexistent : `<Skeleton>`, `<Loader2 spin>`, texte "Chargement...".

### 2.10 Icônes
- `lucide-react` partout ✓
- Tailles : mix `h-4 w-4` / `h-5 w-5` / `size-4` / `size-5` — normaliser sur `size-4` (16px) inline, `size-5` (20px) en boutons standalone.

### 2.11 Composants dupliqués candidats
- Multiples implémentations de "en-tête de page" (BackButton + titre + actions) — un composant `<PageHeader>` unifierait ~80 pages.
- Multiples implémentations de "empty state" (icône + message + CTA).
- Multiples "stat card" (Dashboard, hubs Béton/Granulat/Géo) — un `<StatCard>` unifierait.

---

## 3. PLAN PRIORISÉ

### P0 — Quick Wins (impact élevé, risque nul, < 1 lot)
| # | Item | Fichiers | Effort |
|---|------|----------|--------|
| Q1 | Standardiser tokens couleurs : remplacer `text-gray-*`, `bg-white`, `text-black` restants par tokens sémantiques | ~30 fichiers | S |
| Q2 | Normaliser tailles d'icônes : `size-4` inline, `size-5` en icon-button | global | S |
| Q3 | Uniformiser radius cartes sur `rounded-lg` (shadcn default) | ~15 fichiers | S |
| Q4 | Uniformiser ombres : `shadow-sm` par défaut, `shadow-md` au hover | global cards | S |
| Q5 | Titres de page → `text-2xl font-semibold tracking-tight` partout | ~80 pages | S |
| Q6 | Sous-titres → `text-sm text-muted-foreground` partout | ~80 pages | S |
| Q7 | Chiffres dans tables → `tabular-nums text-right` | tables essais/facturation | S |
| Q8 | Ajouter `aria-label` sur tous boutons icon-only restants | ~40 boutons | S |
| Q9 | Loaders : remplacer texte "Chargement..." par `<Skeleton>` ou `<Loader2>` | ~20 pages | S |
| Q10 | Focus visible : vérifier `focus-visible:ring` sur composants custom | global | S |

### P1 — Optimisations UI (structurantes, 1-2 lots)
| # | Item | Effort |
|---|------|--------|
| U1 | Créer composant `<PageHeader title subtitle actions backTo>` unifié + migration progressive | M |
| U2 | Créer composant `<StatCard>` (valeur + label + icône + tendance) + migration Dashboard/hubs | M |
| U3 | Créer composant `<EmptyState icon title description action>` + migration listes | S |
| U4 | Uniformiser badges d'état : mapping status → variant centralisé (`getStatusBadge()`) | S |
| U5 | Standardiser largeurs Dialog : `sm` (confirm), `md` (form court), `lg` (form long), `xl` (wizard) | S |
| U6 | Container global : `container mx-auto px-4 md:px-6 lg:px-8 py-6` sur MainLayout | S |
| U7 | Grilles KPI : `grid gap-4` (mobile 2 col, desktop 4 col) | S |

### P2 — Optimisations UX (comportement)
| # | Item | Effort |
|---|------|--------|
| X1 | Autofocus premier champ dans tous les formulaires/dialogs | S |
| X2 | `Enter` submit sur tous formulaires simples | S |
| X3 | Confirmation destructive homogène : AlertDialog avec bouton rouge, message d'action clair | S |
| X4 | Toasts : 3 catégories seulement (success / error / info), durée standardisée (3s / 5s / 4s) | S |
| X5 | Breadcrumbs : présents sur toutes les pages internes (>1 niveau) | M |
| X6 | Généraliser `<ValidationMessage>` + `animate-border-blink` aux modules Facturation & RH | M |
| X7 | `inputMode` (`tel` / `numeric` / `email` / `decimal`) sur tous inputs de tous les formulaires | M |

### P3 — Mobile Polish
| # | Item | Effort |
|---|------|--------|
| M1 | Vérifier safe-area sur pages avec sticky footer/actions | S |
| M2 | Bottom sheet : hauteur max `85vh`, drag handle visible | S |
| M3 | Cartes CRUD mobile : layout unique (titre + 2 lignes meta + menu "...") | M |
| M4 | Zones tactiles : audit final `min-h-11 min-w-11` sur icon-only mobile | S |
| M5 | Scroll horizontal : audit final `overflow-x-hidden` sur root pages | S |
| M6 | Orientation paysage mobile : vérifier drawers/dialogs | S |

### P4 — Desktop Polish
| # | Item | Effort |
|---|------|--------|
| D1 | Sidebar : espacement items, active state, hover cohérent | S |
| D2 | Layout large screens (≥1440px) : max-width container éviter que le contenu s'étire à l'infini | S |
| D3 | Dashboards : ratio graphiques constant, légendes lisibles | S |
| D4 | Tables : colonnes flexibles vs fixes documentées | S |

### P5 — Accessibilité
| # | Item | Effort |
|---|------|--------|
| A1 | Audit contraste WCAG AA sur muted-foreground + badges | S |
| A2 | `aria-label` sur tous boutons icon-only | S |
| A3 | Structure `<h1>`/`<h2>` : une seule `<h1>` par page | M |
| A4 | `<main>` unique par page (déjà dans layout, vérifier absence de doublons) | S |
| A5 | Navigation clavier complète : sidebar, dropdowns, tables | M |
| A6 | Skip-link "Aller au contenu" | S |
| A7 | `lang="fr"` sur `<html>` (vérifier) | S |

### P6 — Performances Frontend
| # | Item | Effort |
|---|------|--------|
| P1 | Audit imports inutilisés (via `tsgo` + `knip` en analyse) | M |
| P2 | Retirer CSS mort (classes non référencées, animations orphelines) | M |
| P3 | Code-splitting : vérifier que rapports lourds (Recharts) sont en `React.lazy` | M |
| P4 | Memoization : `useMemo`/`useCallback` sur listes lourdes (>500 lignes) | M |
| P5 | Images : vérifier `loading="lazy"` + dimensions explicites | S |
| P6 | Bundle analyzer : mesurer avant/après, cible < 400kb gzip pour route initiale | M |
| P7 | Suppression composants ui shadcn non utilisés | S |

---

## 4. LOTS D'EXÉCUTION PROPOSÉS

Phase 13 se déroulerait en **6 lots courts** (aucun ne touche la logique métier) :

- **Lot 13.1 — Design Tokens & Typographie** : Q1, Q2, Q3, Q4, Q5, Q6, Q7 + audit `index.css`.
- **Lot 13.2 — Composants unifiés** : U1 (`PageHeader`), U2 (`StatCard`), U3 (`EmptyState`), U4 (badges status).
- **Lot 13.3 — Formulaires & Dialogues** : X1, X2, X6, X7, U5, Q8, Q9.
- **Lot 13.4 — Mobile Finish** : M1–M6.
- **Lot 13.5 — Desktop Finish + A11y** : D1–D4, A1–A7.
- **Lot 13.6 — Performance & Cleanup** : P1–P7 + rapport final `phase13-polish-certification.md`.

**Ordre** : 13.1 → 13.2 → 13.3 en parallèle possible avec 13.4 → 13.5 → 13.6.

---

## 5. ESTIMATION

| Lot | Effort | Fichiers touchés (est.) | Risque |
|-----|--------|-------------------------|--------|
| 13.1 | S | ~60 (recherche/remplacement guidé) | Très faible |
| 13.2 | M | ~90 (migration progressive `PageHeader`) | Faible |
| 13.3 | M | ~50 (formulaires Facturation/RH) | Faible |
| 13.4 | S | ~30 (mobile) | Très faible |
| 13.5 | S | ~40 (a11y attributs) | Très faible |
| 13.6 | M | audit + suppressions | Faible (couverture tests) |

**Total** : ~6 lots courts. Aucune régression métier attendue.

---

## 6. RISQUES

- **R1** — Migration `PageHeader` : risque de casser un titre exotique. **Mitigation** : migration progressive, ancien pattern conservé jusqu'à validation.
- **R2** — Suppression composants ui shadcn : risque d'import restant. **Mitigation** : vérifier via `rg` avant suppression, build TypeScript en garde-fou.
- **R3** — Changement de tokens couleurs : risque de casser un template d'impression. **Mitigation** : `data-print-root` isole les templates, mais audit visuel systématique après chaque lot.
- **R4** — Autofocus dans dialogs : peut gêner clavier virtuel mobile. **Mitigation** : appliquer uniquement desktop (`hidden md:block` sur input focus trap) ou différer sur mobile.
- **R5** — Modification `focus-visible` ring : risque de conflit avec thème sombre. **Mitigation** : tester les deux thèmes après changement.

---

## 7. DÉFINITION DE "TERMINÉ" (DoD Phase 13)

À la clôture de Phase 13, les critères suivants doivent être satisfaits :

1. Aucun `text-gray-*` / `bg-white` / `text-black` hors templates `data-print-root`.
2. Toutes les pages internes utilisent `<PageHeader>` unifié.
3. Toutes les cartes KPI utilisent `<StatCard>`.
4. Tous les états vides utilisent `<EmptyState>`.
5. Tous les boutons icon-only ont un `aria-label`.
6. Tous les inputs ont un `inputMode` / `autoComplete` pertinent.
7. Toutes les listes ont un `<Skeleton>` de chargement.
8. Contraste WCAG AA validé sur `muted-foreground` et badges.
9. Bundle initial < 400kb gzip.
10. Un utilisateur ne peut pas distinguer visuellement deux modules similaires.

---

## 8. HORS-PÉRIMÈTRE PHASE 13 (RAPPEL)

Interdits stricts :
- Calculs métier, algorithmes essais, IA, edge functions, DB, RLS, auth, PrintService, templates A4, PWA, Service Worker, API, repositories, hooks métier, historique, traçabilité.
- Ajouts fonctionnels (nouveaux écrans, nouveaux champs, nouvelles règles).

Tout écart devra faire l'objet d'une phase distincte.

---

**STOP.** Feuille de route livrée. En attente de validation utilisateur avant démarrage du Lot 13.1.
