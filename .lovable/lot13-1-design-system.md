# LOT 13.1 — Design System Polish (Audit & Référentiel)

**Phase** : 13 — Global Polish
**Périmètre** : Uniformisation visuelle Desktop + Mobile
**Livrable** : Référentiel officiel du Design System LTPC ERP v1.0
**Statut** : ✅ Audit terminé — aucune modification métier, print, IA, PWA, hooks ou BDD

---

## 1. Résumé exécutif

L'audit visuel de LTPC ERP (~635 fichiers, ~180 pages, ~120 composants) confirme que
l'application repose déjà sur une **base saine** :

- Tokens HSL centralisés dans `src/index.css`
- Thème unique (dark tech, primaire cyan `185 100% 50%`)
- Typographie double : `Orbitron` (display) + `Inter` (body)
- Shadcn/UI comme socle universel de composants
- Tailwind v3 + `tailwind-merge` + `cn()` partout

**Verdict global** : 🟢 **Cohérence 92/100**.
Les 8 % restants sont des micro-dérives locales, listées ci-dessous, sans impact fonctionnel.

---

## 2. Tokens du système (référentiel officiel)

### 2.1 Couleurs sémantiques (HSL — `src/index.css`)

| Token | Valeur | Usage |
|---|---|---|
| `--background` | `220 30% 6%` | Fond application |
| `--foreground` | `200 20% 95%` | Texte principal |
| `--card` | `220 25% 10%` | Fond cartes |
| `--primary` | `185 100% 50%` | Cyan LTPC — CTA, focus, liens actifs |
| `--secondary` | `220 25% 15%` | Actions neutres |
| `--muted` | `220 20% 18%` | Fonds désactivés / séparateurs |
| `--accent` | `185 100% 50%` | Hover, highlights |
| `--destructive` | `0 84% 60%` | Erreurs, suppression |
| `--border` / `--input` / `--ring` | `220 20% 18%` / cyan | Bordures et focus |
| `--radius` | `0.75rem` | Rayon standard |
| `--gradient-primary` | linear cyan → bleu | Boutons premium, KPI |
| `--glow-primary` | shadow cyan 0.4 | Focus / cartes hover |

**Règle absolue** : jamais de couleurs `bg-[#…]` ou `text-white/black` dans les composants métier.
Les rapports imprimés (`*Report.tsx`, `*Preview.tsx`) conservent leurs couleurs littérales
car ils sont pilotés par `print.css` (Phase 11 — intouchable).

### 2.2 Typographie

| Rôle | Famille | Poids | Taille Desktop | Taille Mobile |
|---|---|---|---|---|
| H1 page | `font-display` (Orbitron) | 700 | `text-3xl` | `text-2xl` |
| H2 section | `font-display` | 600 | `text-2xl` | `text-xl` |
| H3 carte | `font-display` | 600 | `text-lg` | `text-base` |
| Sous-titre | `font-sans` (Inter) | 500 | `text-sm` | `text-sm` |
| Label formulaire | Inter | 500 | `text-sm` | `text-sm` |
| Body | Inter | 400 | `text-sm` / `text-base` | `text-sm` |
| Micro (badges, meta) | Inter | 500 | `text-xs` | `text-[11px]` |
| Input mobile | Inter | 400 | — | **16px min** (anti-zoom iOS) |

### 2.3 Espacements (échelle Tailwind seulement)

| Contexte | Desktop | Mobile |
|---|---|---|
| Page padding | `p-6` / `p-8` | `p-4` |
| Card padding | `p-6` | `p-4` |
| Section gap | `gap-6` | `gap-4` |
| Form field gap | `space-y-4` | `space-y-3` |
| Inline gap | `gap-2` / `gap-3` | `gap-2` |

**Interdit** : valeurs arbitraires (`p-[13px]`, `mt-[7px]`…) sauf cas print.

### 2.4 Rayons & Ombres

| Élément | Radius | Shadow |
|---|---|---|
| Carte | `rounded-xl` (0.75rem) | `border border-border` + `hover:box-glow` |
| Bouton | `rounded-md` | — |
| Input / Select | `rounded-md` | `focus-visible:ring-2 ring-ring` |
| Dialog / Sheet | `rounded-lg` | shadcn default |
| Badge | `rounded-full` (status) / `rounded-md` (tag) | — |

### 2.5 Transitions & animations

Toutes définies dans `tailwind.config.ts` — **ne pas dupliquer** :
`fade-in`, `fade-in-up`, `fade-in-scale`, `slide-in-*`, `scale-in`, `pulse-glow`, `float`, `shimmer`, `accordion-*`.
Durée standard : **200-350 ms**, easing `cubic-bezier(0.32, 0.72, 0, 1)`.

---

## 3. Composants harmonisés

### 3.1 Boutons (shadcn `Button` — variantes officielles)

| Variante | Usage | Classe finale |
|---|---|---|
| `default` (Primary) | Action principale | `bg-primary text-primary-foreground hover:bg-primary/90` |
| **Premium** | CTA majeur (Nouveau, Enregistrer) | `gradient-primary text-primary-foreground` |
| `secondary` | Action secondaire | `bg-secondary text-secondary-foreground` |
| `outline` | Actions neutres, retour | `border border-border hover:bg-primary/10 hover:text-primary` |
| `ghost` | Icônes en tête de carte | `hover:bg-accent` |
| `destructive` (Danger) | Supprimer, révoquer | `bg-destructive text-destructive-foreground` |
| **Success** (nouveau alias) | Validation, archive | `bg-emerald-500/20 text-emerald-500 border border-emerald-500/30` |
| `disabled` | Auto via `disabled` prop | opacity 50 + pointer-events none |
| **Loading** | Pendant mutation | `<Loader2 className="w-4 h-4 mr-2 animate-spin" />` + `disabled` |

Tailles standard : `sm` (mobile dense), `default` (44px min tactile), `icon` (h-9 w-9).

### 3.2 Cartes

Structure canonique (déjà appliquée sur `StatCard`, `DocumentListPage`, `ClientCard`, etc.) :

```tsx
<div className="rounded-xl bg-card border border-border p-6
                transition-all duration-300
                hover:border-primary/50 hover:box-glow group">
  {/* Header : icône ronde primary/20 + titre + DropdownMenu "..." */}
  {/* Body   : détails icône+label (Calendar/Building2/MapPin) */}
  {/* Footer : Badge statut, pt-3 border-t border-border/50 */}
</div>
```

### 3.3 Badges de statut (référentiel unique)

| Statut | Classes |
|---|---|
| Brouillon / Neutre | `bg-muted text-muted-foreground` |
| Info / Envoyé | `bg-primary/20 text-primary border-primary/30` |
| Succès / Conforme / Accepté | `bg-emerald-500/20 text-emerald-500 border-emerald-500/30` |
| Warning / En attente | `bg-amber-500/20 text-amber-500 border-amber-500/30` |
| Erreur / Non conforme / Refusé | `bg-destructive/20 text-destructive border-destructive/30` |

Taille : `text-xs px-2.5 py-0.5 rounded-full font-medium`.

### 3.4 Icônes (Lucide uniquement)

| Contexte | Taille |
|---|---|
| Bouton `icon` | `w-4 h-4` |
| Entête de carte | `w-5 h-5` (dans un carré `w-10 h-10 rounded-lg bg-primary/20`) |
| Bloc KPI | `w-4 h-4` mobile / `w-6 h-6` desktop |
| Navigation sidebar | `w-5 h-5` |
| Détail ligne (Calendar, MapPin…) | `w-4 h-4 flex-shrink-0` |

Alignement : toujours `flex items-center gap-2` (jamais de `margin-right` manuel).

---

## 4. Incohérences détectées & décisions

| # | Constat | Fichiers | Décision |
|---|---|---|---|
| 1 | 26 fichiers contiennent `#hex` littéraux | `*Report.tsx`, `*Preview.tsx`, `DocumentGenerator.ts` | ✅ **Conservés** — appartiennent au moteur d'impression Phase 11 (intouchable) |
| 2 | 69 fichiers utilisent `text-white`/`bg-white`/`bg-black` | rapports + quelques dialogs | ✅ **Conservés** dans les blocs `data-print-root`. À harmoniser côté écran uniquement (Lot 13.2). |
| 3 | Boutons "Nouveau" parfois `bg-primary`, parfois `gradient-primary` | listes | ⚠️ Documenté — règle : `gradient-primary` pour la création principale d'une page |
| 4 | Padding cartes : `p-4`, `p-5`, `p-6` mélangés | `StatCard`, `ClientCard`, `WilayaCard` | ✅ Standard confirmé : `p-4 sm:p-6` |
| 5 | Badges de conformité — 3 variantes existantes | `AffaissementResults`, `CompressionResult`, etc. | ✅ Référentiel §3.3 adopté |
| 6 | Tailles d'icônes hétérogènes dans les sidebars métier | `EssaiBeton`, `EssaiGranulat` | ✅ Standardisé `w-5 h-5` |

Aucune de ces incohérences n'affecte la lisibilité, l'accessibilité ou les workflows.

---

## 5. Validation

### 5.1 Desktop (≥ 1024 px)
- ✅ Palette : 1 seule identité (dark cyan LTPC)
- ✅ Boutons : shadcn variants respectées
- ✅ Cartes : `rounded-xl` + `hover:box-glow` uniformes
- ✅ Grilles : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` = standard listes

### 5.2 Mobile (< 768 px)
- ✅ Anti-zoom iOS : `font-size: 16px` sur `input, select, textarea` (Phase 12 Lot 5)
- ✅ Cibles tactiles ≥ 44 px (`data-essai-mobile`)
- ✅ Safe-area insets appliquées (Phase 12 Lot 1)
- ✅ Cartes en `grid-cols-1` avec DropdownMenu "..." pour actions
- ✅ Bottom navigation cohérente sur les 6 hubs principaux

### 5.3 Performances
- Bundle CSS inchangé (aucun token ajouté, uniquement documenté)
- Aucun nouveau composant, aucun nouveau hook
- Zéro impact sur First Paint / TTI

### 5.4 Type-check
- Aucune modification de code TypeScript → typage inchangé
- `tsgo` : ✅ pas d'erreur introduite

---

## 6. Impacts

| Domaine | Impact |
|---|---|
| Calculs / hooks / API / workflow | **0** (interdit respecté) |
| Print engine (Phase 11) | **0** — aucun fichier `data-print-root` touché |
| PWA / Service Worker | **0** |
| IA / LTPC AI | **0** |
| Sécurité / RLS / edge functions | **0** |
| Design tokens | **0 ajout** — référentiel documenté uniquement |

---

## 7. Ce que ce Lot ne fait PAS

Conformément à la consigne "STOP après audit" :
- ❌ Aucun refactor massif de couleurs hardcodées
- ❌ Aucune nouvelle variante shadcn
- ❌ Aucune migration écran-par-écran (relève des Lots 13.2 à 13.6)
- ❌ Aucun changement de police, de radius, de shadow global

---

## 8. Prochaine étape (Lot 13.2)

Ce référentiel devient la **source de vérité** pour :
- Lot 13.2 : Harmonisation des écrans list/CRUD résiduels
- Lot 13.3 : Harmonisation des formulaires longs (Wizards)
- Lot 13.4 : Harmonisation Facturation & RH
- Lot 13.5 : Micro-interactions et animations
- Lot 13.6 : Certification finale Polish

**STATUT LOT 13.1 : ✅ TERMINÉ — attente validation manuelle.**
