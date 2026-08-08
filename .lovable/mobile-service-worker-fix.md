# Correction — lecture d'état du Service Worker tolérante aux mises à jour

Date : 2026-08-08 · Suite du diagnostic `.lovable/mobile-service-worker-diagnostic.md`

## Ce qui a été modifié (2 fichiers, périmètre strict)

1. `src/lib/notifications/PushService.ts` — **uniquement `getState()`** + champ `swUpdating` dans `PushState`.
   - `navigator.serviceWorker.ready` (via `activeRegistration()`) **reste la référence** du « worker réellement actif » (`swReady`).
   - Si aucun worker `activated` n'est disponible, on lit la registration existante : si elle a un worker `installing` / `waiting` / `active`, on renvoie `swUpdating: true` et on lit **l'abonnement existant sur cette registration** (aucun `subscribe()`, aucune création, aucune suppression).
2. `src/pages/parametres/NotificationPreferences.tsx`
   - Nouvel état affiché : **« 🟠 Mise à jour en cours »** au lieu de « Service Worker indisponible » quand `swUpdating`.
   - Ré-évaluation automatique sur `updatefound` et sur `statechange` du worker en attente → retour immédiat à « 🟢 Push actif » dès activation.

Non modifiés : VAPID, FCM, `PushService.subscribe()`, `push-dispatch`, `echeances-dispatch`, `sw.js` / `push-sw.js`, notifications métier, abonnements en base.

## Vérifications

1. **Typecheck** : `tsgo --noEmit` → **0 erreur**.
2. **États simulés** (navigateur réel, registrations simulées) :

| Registration | swReady | swUpdating | subscribed | Badge UI |
|---|---|---|---|---|
| `active` (activated) | true | false | true | 🟢 Push actif |
| `installing` | false | **true** | true | **🟢 Push actif** |
| `waiting` | false | **true** | true | **🟢 Push actif** |
| aucune | false | false | false | 🟠 Service Worker indisponible |

3. **Cohérence pendant la mise à jour** : l'abonnement Push existant étant lu sur la registration en cours de mise à jour, l'UI conserve « Push actif » ; s'il n'y a pas encore d'abonnement, elle affiche « Mise à jour en cours » (et non plus « indisponible »).
4. **Retour à « Push actif »** : garanti par les écouteurs `updatefound` / `statechange` / `controllerchange` / `sw.ready`, sans polling.

Le message « Service Worker indisponible » n'apparaît désormais que dans le cas réel : **aucune registration du tout** (dev/preview, ou SW jamais enregistré).
