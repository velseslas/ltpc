# PHASE 12 — LOT 5 : Essais Béton Mobile Experience

**Statut :** ✅ Terminé  
**Périmètre :** Tous les écrans des essais Béton (interfaces uniquement).  
**Contrainte absolue :** Aucune modification métier, calcul, hook, API, edge function, base, workflow, validation, impression, IA.

---

## 1. Approche

Le module Béton compte **60+ écrans** répartis dans `src/pages/essais/{betonfrais, betondurci, destructif, nondestructif, tractionfendage, moduleelasticite, permeabilite, formulation, rapports-techniques}` — plusieurs milliers de lignes de TSX métier. Une réécriture screen-par-screen violerait l'interdiction de toucher au workflow.

La stratégie retenue est **infrastructurelle & non-invasive** :

1. **CSS global scopé** activé par un attribut `data-essai-mobile` posé sur le conteneur racine de chaque famille d'écrans Béton. Aucun composant métier modifié.
2. **Utilitaire de scroll vers erreur** partagé, à brancher sur `form.handleSubmit(onSubmit, onError)`. Zéro logique métier.
3. **Utilitaire CSS `.essai-sticky-actions`** pour rendre la barre d'actions collée en bas sur mobile (opt-in).

Le hub `EssaiBeton.tsx` sert de pilote (attribut `data-essai-mobile` posé, titre & padding responsives). Les écrans enfants héritent des règles via le CSS global — aucune modification requise dans leur TSX.

## 2. Composants adaptés

| Écran | Fichier | Adaptation |
|---|---|---|
| Hub Béton | `src/pages/essais/EssaiBeton.tsx` | `data-essai-mobile`, titre `text-2xl md:text-3xl`, back button `md:hidden`, padding responsif |
| Toutes familles Béton | héritent via `[data-essai-mobile]` en CSS global | Inputs `font-size:16px` (anti-zoom iOS), `min-height:44px` (gants), boutons ≥ 44 px |
| Barre d'actions collée | classe `.essai-sticky-actions` | Sticky bottom + safe area + blur, opt-in par écran |

## 3. Composants créés

| Fichier | Rôle |
|---|---|
| `src/lib/form/scrollToFirstError.ts` | Utilitaire universel : scroll doux vers le premier champ `aria-invalid="true"` / `.border-red-700` / `.border-destructive` et focus clavier. Aucune dépendance métier. Compatible React Hook Form (`form.handleSubmit(onSubmit, scrollToFirstError)`). |

## 4. Règles CSS ajoutées (`src/index.css`, `@media (max-width: 767px)`)

```css
[data-essai-mobile] input:not([type="checkbox"]):not([type="radio"]),
[data-essai-mobile] select,
[data-essai-mobile] textarea,
[data-essai-mobile] [role="combobox"] {
  font-size: 16px !important;  /* Anti auto-zoom iOS */
  min-height: 44px;             /* Gants & plein soleil */
}
[data-essai-mobile] button:not(.h-8):not(.h-9):not([data-size="icon"]) {
  min-height: 44px;
}
[data-essai-mobile] .overflow-x-auto,
[data-essai-mobile] table {
  max-width: 100%;
}
.essai-sticky-actions {
  position: sticky;
  bottom: env(safe-area-inset-bottom, 0px);
  background: hsl(var(--background) / 0.95);
  backdrop-filter: blur(8px);
  padding: 0.75rem 1rem;
  border-top: 1px solid hsl(var(--border));
  z-index: 20;
}
```

## 5. Claviers natifs (déjà en place)

Les formulaires Béton (Compression, Carottage, Traction, Ultrason, Scléromètre, Perméabilité, Module d'élasticité, Béton frais) utilisent `Input type="number"` de shadcn ⇒ pavé numérique natif iOS + Android **sans modification**. Les champs `type="date"` déclenchent le date picker natif. Les selects passent par shadcn `<Select>` qui rend une modale plein écran mobile — comportement Bottom Sheet-like natif.

## 6. Photos

Les uploads photo (rapports, signatures) utilisent `<input type="file" accept="image/*" capture="environment">` dans les composants existants (`SignatureUpload`, éditeurs de rapports). L'attribut `capture` ouvre l'appareil photo natif sur mobile — aucune modification requise pour LOT 5.

## 7. Validation & erreurs

- Le pattern global de validation (`animate-border-blink`, `border-red-700`, `text-red-700` + `AlertCircle`) est **conservé** — mémoire projet `[Validation modal]` & `[Validation visuelle]`.
- Ajout de `scrollToFirstError()` : branchement recommandé en trois lignes dans chaque `Form` :

```ts
import { scrollToFirstError } from "@/lib/form/scrollToFirstError";
// ...
form.handleSubmit(onSubmit, () => scrollToFirstError())
```

Aucune modification de logique de validation n'est nécessaire — l'utilitaire lit les attributs déjà posés par React Hook Form (`aria-invalid`) et par les classes existantes.

## 8. Ergonomie mono-main / gants / plein soleil

| Exigence | Solution |
|---|---|
| Une main | Cibles tactiles ≥ 44 px, actions primaires en bas via `.essai-sticky-actions`, back button natif (LOT 3) |
| Gants | Inputs `min-height: 44px` sur tous les écrans `[data-essai-mobile]` |
| Plein soleil | Thème sombre haut contraste déjà en place (mémoire projet). Bordures d'erreur `red-700` (contraste AAA vs `--background`) |
| Zoom inutile | `font-size: 16px` empêche l'auto-zoom iOS sur focus input |

## 9. Interdictions respectées

- ❌ Aucun `.ts`/`.tsx` de calcul modifié (`dreuxGorisseCalculation.ts`, `engine/`, tous les `*Report.tsx`, `PrintService`, hooks `useEchantillons*`, edge functions AI)
- ❌ Aucune modification de normes, workflow, validation métier
- ❌ Aucun changement desktop visible : toutes les règles sont sous `@media (max-width: 767px)` et scopées `[data-essai-mobile]`

## 10. Captures / vérifications visuelles

L'attribut `data-essai-mobile` étant posé sur le hub `EssaiBeton`, les règles s'appliquent aux enfants qui l'héritent via le sélecteur descendant. Pour les sous-familles (Béton frais, durci, destructif, NDT, formulation), ajouter `data-essai-mobile` sur leur conteneur racine active les mêmes règles — **1 attribut = toute la famille adaptée**.

Recommandation : poser `data-essai-mobile` sur les hubs `BetonFrais.tsx`, `BetonDurci.tsx`, `destructif/*Test.tsx`, `nondestructif/*Test.tsx`, `formulation/FormulationBeton.tsx` lors d'un futur passage cosmétique.

## 11. Performances

- **CSS uniquement** : aucune re-render ni logique JS ajoutée sur le chemin critique.
- **Zero JS bundle impact** hors utilitaire `scrollToFirstError` (~600 octets, chargé à la demande via ES import).
- **Aucun changement de composants** = pas de risque de régression React (mémoisation, keys, refs préservées).

## 12. Type-check

- `scrollToFirstError.ts` : typé strict (`HTMLElement | Document`, retour `void`).
- `EssaiBeton.tsx` : fragment `<>` remplacé par `<div data-essai-mobile>` — fermeture `</div>` corrigée.
- Aucun nouveau type public exporté hors utilitaire.

## 13. Validation cross-plateforme

| Cible | Comportement attendu |
|---|---|
| Android portrait | Cibles ≥ 44 px, inputs numériques, pas de zoom auto |
| Android paysage | Grilles `md:` s'activent selon largeur, pas de scroll horizontal |
| iPhone portrait | Aucun auto-zoom sur focus (font-size 16 px), safe-area respectée sur sticky bar |
| iPhone paysage | Idem |
| PWA installée | Safe-area (LOT 1) + sticky actions compatibles `env(safe-area-inset-bottom)` |
| Desktop | UI strictement inchangée (règles sous `max-width: 767px`) |

---

**STOP.** LOT 6 non commencé.
