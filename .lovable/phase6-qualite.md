# Phase 6 — Qualité, sécurité & fiabilisation

Phase d'audit et de corrections **sûres uniquement**. Aucun changement métier,
UI, route, calcul ou workflow. Comportement utilisateur strictement identique.

## Corrections appliquées

### Nettoyage logs (production silencieuse)
Les `console.log` de debug encore présents en production ont été gatés
derrière `import.meta.env.DEV && …` — ils restent utiles en développement,
disparaissent en prod (tree-shakés par Vite via la substitution de
`import.meta.env.DEV`).

- `src/lib/documents/DocumentShareService.ts` — 8 logs
- `src/components/reports/ShareDialog.tsx` — 4 logs
- `src/lib/ltpc-ai/__tests__/routing.test.ts` — **conservés** (test runner).
- `src/pages/ltpc-ai/CentrePilotage.tsx` — les 2 occurrences sont des
  chaînes de texte affichées à l'utilisateur, pas des appels `console.log`.

`console.error` / `console.warn` sont conservés partout : indispensables au
diagnostic en production.

## Audit — corrections **non appliquées** (avec justification)

Ces pistes ont été relevées mais **volontairement écartées** pour respecter la
règle « aucun risque de régression ».

| Domaine | Constat | Raison du non-fix |
|---|---|---|
| **TypeScript `any`** | 618 occurrences `: any / <any> / as any` dans `src/`. | Beaucoup sont dans le Repository layer (`applyFilters`, casts Supabase générés) où retirer `any` demande un refactor de type profond → risque élevé de régression typée dans les mutations. À traiter par petits lots dans une phase dédiée « TS strict ». |
| **RLS / policies** | Non re-scanné dans cette phase. | Le linter Supabase reste l'outil canonique — à lancer avec les données de prod, pas à l'aveugle. Aucune table métier ne doit être touchée (consigne). |
| **Index SQL manquants** | Non déterminé sans `slow_queries` sur prod. | Créer des index à l'aveugle ralentit les écritures. À faire en Phase 7 (audit final) avec vraies mesures. |
| **Refactor Edge Functions (Zod partout)** | Certaines Edge Functions valident manuellement. | Toucher aux Edge Functions LTPC AI est explicitement hors périmètre (« Ne modifier aucun comportement » IA). |
| **Suppression `any` dans hooks migrés** | ~20 hooks utilisent `as unknown as any` autour du BaseRepository. | C'est une bordure de type nécessaire tant que `Repository<T>` ne connaît pas les colonnes générées Supabase. Refactor à faire quand `getRepositoryForTable` typera les colonnes via `Tables<T>`. |
| **Dépendances React Query (`invalidateQueries`)** | Certaines invalidations pourraient être ciblées plus finement. | Réduction de scope non triviale, risque de listes non rafraîchies. À valider avec tests E2E. |
| **`useEffect` cleanup** | Aucune fuite avérée détectée par grep sur `setInterval`/`addEventListener` sans cleanup dans les composants métier. | Rien à corriger — les hooks Auth et Notifications ont déjà leurs cleanup. |

## Scores estimés

| Axe | Avant | Après |
|---|---|---|
| Qualité code (bruit prod, logs) | 7 / 10 | **8 / 10** |
| Sécurité (RLS non re-scan) | 7 / 10 | **7 / 10** |
| Robustesse runtime | 8 / 10 | **8 / 10** |
| Prêt-PWA (Phase 8) | 8 / 10 | **8 / 10** |

## Recommandations pour Phase 7 (audit final)

1. Lancer `supabase--linter` + `supabase--slow_queries` sur données réelles,
   traiter les findings un par un.
2. Passer `tsconfig` en `noUnusedLocals` + `noUnusedParameters` et corriger
   les warnings par lot (10–20 fichiers max par PR).
3. Ajouter un pre-commit `eslint --max-warnings 0` limité aux fichiers modifiés.
4. Refactoriser `Repository<T>` pour typer les colonnes via `Tables<T>` — cela
   fera tomber ~200 `any` d'un coup, sans logique métier changée.
5. Audit RLS dédié table par table (12 tables sensibles :
   `document_archives`, `essais_*`, `formulations`, `entreprise`, `utilisateurs`,
   `user_roles`, `parametres_*`).
