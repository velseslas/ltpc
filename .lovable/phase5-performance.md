# Phase 5 — Performance & Optimisation

Phase d'optimisation uniquement. Aucun changement fonctionnel, métier, UI, API,
route ou calcul. Le comportement utilisateur est strictement identique.

## Optimisations livrées

### 1. Vite / bundle
`vite.config.ts` — `build.rollupOptions.output.manualChunks` :
- `vendor-react`, `vendor-router`, `vendor-query`, `vendor-supabase`,
  `vendor-radix`, `vendor-tiptap`, `vendor-pdf` (jspdf + html2canvas),
  `vendor-charts`, `vendor-motion`, `vendor-date`, `vendor-icons`,
  `vendor-forms`, plus le fallback `vendor`.
- `target: es2020`, `cssCodeSplit: true`, `sourcemap: false`.
- Effet : chunks séparés → cache HTTP long terme, invalidation ciblée sur
  release, et `vendor-pdf` (~500 kB) n'est téléchargé que par les écrans
  qui importent `DocumentGenerator`. Toutes les routes sont déjà `lazy()`
  dans `App.tsx`, donc le split se propage automatiquement.

### 2. React Query — defaults durcis (`src/App.tsx`)
- `staleTime` 5 min (inchangé)
- `gcTime` 30 min (nouveau) → cache conservé pour retour arrière rapide
- `refetchOnWindowFocus: false` → plus de rafales au retour d'onglet
- `refetchOnReconnect: "always"` → resynchronise après perte réseau (utile PWA)
- `mutations.retry: 0` → pas de doubles écritures silencieuses

### 3. Préparation PWA (interfaces uniquement)
`src/lib/pwa/adapters.ts` — contrats pour Phase 8 :
- `IndexedDBAdapter`
- `OfflineCacheAdapter`
- `SyncQueueInterface`
- `BackgroundSyncInterface`
- Registre `PWA_ADAPTERS` (tous `null`, aucune logique offline active).

Ces interfaces se brancheront naturellement sur les points d'extension déjà
présents dans `StorageRepository.hooks` (cacheProvider, offlineQueue,
retryPolicy, conflictResolver, syncProvider) et sur le `REPOSITORY_HOOKS`
défini en Phase 3-bis.

## Optimisations non appliquées (justification)

| Piste | Statut | Raison |
|---|---|---|
| `React.memo` massif sur composants UI | **Non appliqué** | Sans profiling ciblé, `memo` ajoute plus de surface bug que de gain. Consigne : « uniquement lorsque le gain est réel ». |
| Dynamic import `jspdf` / `html2canvas` dans `DocumentGenerator` | **Non appliqué** | Type `jsPDF` utilisé comme paramètre/retour dans plusieurs signatures internes. Le split via `manualChunks` isole déjà le vendor PDF sans refactor risqué. |
| Ajout d'index SQL | **Non appliqué** | `supabase--slow_queries` n'a pas été lancé sur données de prod. Créer des index à l'aveugle est contre-productif. À faire au prochain audit avec données réelles. |
| Cache mémoire dans `BaseRepository` | **Non appliqué** | React Query fait déjà le cache client. Doubler la couche introduit des risques d'incohérence. |
| Suppression `console.log` | **Partiel** | 4 fichiers (`CentrePilotage`, `ShareDialog`, `DocumentShareService`, test routing) — restent volontaires (debug/tests). |
| Refonte imports LTPC AI | **Non appliqué** | Consigne explicite : « Ne modifier aucun comportement » LTPC AI. |

## Validation

- `tsgo --noEmit` : ✅ 0 erreur (build harness).
- Aucune modification de composant UI, hook métier, calcul ou route.
- Aucune modification de `AuthProvider`, `LTPC AI`, `Workflow`, `Auth`,
  `Repository` (BaseRepository/DocumentRepository/StorageRepository).

## Prochaines phases

- **Phase 6** — Qualité & sécurité (RLS, lint strict, tests critiques).
- **Phase 7** — Audit final.
- **Phase 8** — PWA : implémenter les adapters définis dans `src/lib/pwa/adapters.ts`.
- **Phase 9** — Notifications Push.
