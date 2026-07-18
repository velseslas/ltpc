# LOT 2 — Dashboard Mobile

**Phase :** 12 — Mobile Experience
**Statut :** ✅ Terminé
**Périmètre :** `src/pages/Index.tsx` (Tableau de bord) + `src/components/dashboard/StatCard.tsx`.
**Type-check :** ✅ `tsgo --noEmit` → 0 erreur.

---

## 1. Composants modifiés

| Fichier | Nature de la modification |
|---|---|
| `src/pages/Index.tsx` | Grille responsive : titre plus compact mobile, KPI grid **2 cols mobile / 4 cols desktop**, gaps `gap-3 md:gap-6`, ajout `min-w-0` sur toutes les colonnes de charts (évite débordement Recharts), Quick Actions empilé verticalement mobile avec bouton **pleine largeur `touch-target`**. |
| `src/components/dashboard/StatCard.tsx` | Padding responsive `p-4 sm:p-6`, typo adaptée (`text-xl sm:text-3xl` valeur, `text-[11px] sm:text-sm` titre), icône `w-4 h-4 sm:w-6 sm:h-6`, `truncate` sur titre, `line-clamp-2` sur subtitle, `flex-wrap` sur trend. Zéro modification structurelle. |

## 2. Composants NON modifiés (rendu géré par leurs propriétés internes)

- `MonthlyTestsChart`, `ConformityGauge`, `TestTypeDistribution`, `ActivityChart`, `EquipmentStatus`, `RecentTests`, `QuickStats` : ces widgets utilisent déjà **Recharts `ResponsiveContainer`** et se redimensionnent naturellement à `100%` de leur conteneur. Le conteneur passe désormais en pleine largeur (`grid-cols-1` mobile), donc les graphiques adoptent automatiquement la bonne largeur.
- Aucun hook (`useEssaisStats`, `useDashboardStats`, etc.) touché.

## 3. Impacts visuels

### Desktop (≥ 1024px)
- Layout **strictement identique** à avant : 4 colonnes KPI, charts 2/3 + 1/3, Quick Actions horizontal.
- Padding `p-6` sur StatCards → aucun changement visuel.

### Tablette (768-1023px)
- KPI en 2 colonnes (au lieu de 4) — comportement déjà présent avant via `md:grid-cols-2`, désormais `grid-cols-2 lg:grid-cols-4`.
- Charts en 1 colonne empilée.

### Mobile (< 768px)
| Élément | Avant | Après |
|---|---|---|
| Titre H1 | 30px | 22px |
| Sous-titre | 16px | 14px |
| KPI grid | 1 colonne | **2 colonnes** |
| StatCard padding | 24px | 16px |
| StatCard value | 30px | 20px |
| StatCard icon | 24px | 16px |
| Charts | 1 col mais overflow possible | 1 col + `min-w-0` (safe) |
| Quick Actions | Layout `justify-between` → bouton compressé à droite | Empilé vertical, bouton **pleine largeur 44px+** |
| Bouton "Voir le planning" | `px-4 py-2` | `px-4 py-3` + `touch-target` |

## 4. Performances

- **Aucun re-render supplémentaire** : les 4 hooks React Query (`useEssaisStats`, `useIntervenantsStats`, `useLaboratoiresMobilesStats`, `useDashboardStats`) sont inchangés.
- **Aucun bundle ajouté** : uniquement des classes Tailwind (`grid-cols-2`, `min-w-0`, `touch-target`, `line-clamp-2`).
- `line-clamp-2` évite les débordements verticaux sur les subtitles longues (`"X en attente de validation"`).
- `truncate` sur titles évite les cassures ligne inélégantes mobile.

## 5. Responsive

| Cas testé | Attendu | Résultat |
|---|---|---|
| Desktop 1440px | 4 KPI + charts 2/3-1/3 identiques | ✅ Inchangé |
| Desktop 1024px | 4 KPI, charts 2/3-1/3 | ✅ Inchangé |
| Tablette 768px | 2 KPI, charts empilés | ✅ OK |
| Mobile 390px portrait | 2 KPI compacts, charts pleine largeur | ✅ OK |
| Mobile 390px paysage (844×390) | 2 KPI + charts pleine largeur, pas de scroll H | ✅ OK |
| iPhone SE 375px | Idem 390 avec padding `px-4` du MainLayout | ✅ OK |
| Android 360px | Pas de scroll horizontal, StatCards lisibles | ✅ OK |
| PWA installée | Header 56px + bottom nav visibles (via LOT 1) | ✅ OK |

## 6. Validation

- ✅ `tsgo --noEmit` : **0 erreur**.
- ✅ Aucun scroll horizontal introduit (`min-w-0` systématique sur cols de grille).
- ✅ Toutes les informations Desktop restent visibles sur mobile (KPI, charts, tables, quick actions).
- ✅ Aucun hook / repository / API / calcul / RLS / PWA / print touché.
- ✅ Zone tactile bouton "Voir le planning" ≥ 44px sur mobile.
- ✅ Zoom iOS bloqué (règle globale LOT 1).

## 7. Fichiers touchés

```
modified:
  src/pages/Index.tsx
  src/components/dashboard/StatCard.tsx
```

**Total :** 2 fichiers modifiés, 0 créé. **0** modification métier.

## 8. Ce qui n'a PAS été fait (hors périmètre LOT 2)

- ❌ Aucune adaptation de RecentTests (contient une mini-table — sera traité au LOT 5 essais si nécessaire).
- ❌ Aucune adaptation d'EquipmentStatus, ActivityChart (rendus déjà responsifs via Recharts).
- ❌ Aucune autre page modifiée (Clients, Essais, Facturation, RH, Matériel, etc.).

---

**STOP.** LOT 2 terminé. En attente de validation avant démarrage LOT 3 (Clients / MOA / MOE / Chantiers).
