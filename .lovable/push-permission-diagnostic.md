# Diagnostic Push PWA — « Permission nécessaire » alors que le navigateur autorise

Audit **strictement read-only**. Aucun code, secret, abonnement, SW, RLS ou notification modifié.

## 0 — Limite méthodologique (importante)

`Notification.permission`, `navigator.serviceWorker.controller`, `registration.active` et
`pushManager.getSubscription()` sont **des états locaux du navigateur du téléphone**. Ils ne sont
lisibles ni depuis le serveur, ni depuis un navigateur d'audit distinct : chaque contexte
(Chrome onglet vs PWA installée) possède ses propres registrations et son propre store Push.
Le diagnostic ci-dessous croise donc : (1) le code exact exécuté sur l'appareil,
(2) l'état serveur/DB réel, (3) les artefacts publiés.

## 1 — Origine / contexte sécurisé

- Publié sur `https://ltpc.lovable.app` → HTTPS, `window.isSecureContext === true`.
- `/sw.js` publié et servi : `HTTP 200`, `content-type: text/javascript`, `cache-control: no-cache`.
  Le SW est généré par `vite-plugin-pwa` (`filename: "sw.js"`) et importe `/push-sw.js`
  (handlers `push` / `notificationclick`). Rien d'anormal côté artefacts.
- Enregistrement via `src/lib/pwa/serviceWorkerRegistration.ts` : refusé en dev, en iframe et sur
  hôtes preview → **le Push ne peut fonctionner que sur `ltpc.lovable.app`**, jamais dans l'aperçu Lovable.

## 2 — Condition exacte utilisée par LTPC

`src/pages/parametres/NotificationPreferences.tsx` (lignes 57-64) :

```
permission === "unsupported" || !PushService.isSupported() → ⚪ Non disponible
permission === "denied"                                    → 🔴 Refusée
isSubscribed && permission === "granted"                   → 🟢 Push actif
sinon                                                      → 🟠 Permission nécessaire
```

👉 **Le badge « Permission nécessaire » est la branche par défaut (`else`).** Il s'affiche donc
aussi bien quand `permission === "default"` que quand `permission === "granted"` **mais
`isSubscribed === false`**. Le libellé ment sur la cause réelle : il ne prouve **pas** que la
permission manque.

`isSubscribed` vient de :

```ts
// src/lib/notifications/PushService.ts
async getSubscription() {
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}   // catch → null (erreur silencieuse)
```

Deux failles de lecture, **sans rapport avec la permission** :
1. `getRegistration()` (et non `navigator.serviceWorker.ready`) : au démarrage à froid de la PWA,
   la registration peut n'être pas encore résolue → `undefined` → `isSubscribed = false`.
2. Le `catch` renvoie `null` : toute erreur transitoire est interprétée comme « pas d'abonnement ».

`refreshPushState()` n'est appelé qu'au montage (effet dépendant de `prefs`) et après un clic —
aucun re-check sur `serviceWorker.ready` / `controllerchange`. L'état affiché peut donc rester figé.

## 3 — Le toast « Activation impossible »

`handleEnablePush` → `PushService.subscribe()`. Ce toast correspond **exclusivement** à
`reason === "error"`, c.-à-d. une **exception levée par `pushManager.subscribe()`**
(les cas permission/vapid/no-sw/unsupported ont leurs propres messages).
Donc : la permission n'est **pas** en cause ici non plus.

Cause classique de cette exception quand un abonnement existe déjà :
`InvalidStateError / DOMException: Registration failed` lorsqu'un `PushSubscription` existant
a été créé avec un `applicationServerKey` **différent** de la clé actuelle. Le code fait
`existing ?? subscribe(...)` : si `existing` est nul côté lecture mais présent côté navigateur,
`subscribe()` avec une autre clé échoue.

## 4 — VAPID

- Clé publique frontend : `src/lib/notifications/vapid.ts` — fallback en dur
  `BBW4917bp_r44Wq7JFeGlfmP2tc98OD7509vTqaxmmSbNmDAfCwf0KkJ0Jzala7lljYldGlNQoS4A0fqdPogEMQ`,
  surchargeable par `VITE_VAPID_PUBLIC_KEY` (non défini dans `.env` → c'est bien le fallback qui est bundlé).
- Clé privée : secret serveur `VAPID_PRIVATE_KEY`, utilisée par `push-dispatch`. Non lue, non modifiée.
- Les push ont déjà été reçus réellement → la paire est cohérente **pour les abonnements créés avec
  cette clé**. Aucun indice de mismatch actuel, mais un abonnement antérieur à un changement de clé
  produirait exactement le symptôme du §3.

## 5 — Base de données (`push_subscriptions`, utilisateur `66114a91…`)

| Plateforme | Actifs | Inactifs |
|---|---|---|
| android | **2** | 3 |
| windows | **2** | 0 |
| **Total** | **4** | **3** |

Détail Android actif : endpoints `…f3lCb2pDy` (16:39) et `…c7OafOnSj` (16:30) — **deux abonnements
actifs pour un seul appareil**, créés à 9 min d'intervalle, plus 3 anciens désactivés le même jour.
Ce cycle création/remplacement rapide indique que le navigateur a **régénéré plusieurs fois**
l'abonnement (SW réinstallé / abonnement invalidé), ce que le code ne réconcilie pas :
`registerSubscription` fait un `upsert` sur `(user_id, endpoint)` — un nouvel endpoint crée
une nouvelle ligne sans désactiver l'ancienne.

Rien n'a été supprimé.

## 6 — PWA vs Chrome

Contextes séparés uniquement si l'origine diffère ; ici l'origine est identique
(`https://ltpc.lovable.app`) donc **PWA installée et onglet Chrome partagent** permission,
registration `/sw.js` (scope `/`) et abonnement Push. La divergence possible est temporelle :
au lancement à froid de la PWA, la page s'affiche **avant** que la registration soit prête →
lecture `getRegistration()` nulle → badge 🟠. En onglet Chrome déjà contrôlé, la lecture réussit.
Symptôme donc attendu surtout en **B (PWA installée), au premier rendu**.

## 7 — État réel vs état interprété

| Élément | État réel (serveur / code) | État interprété par LTPC |
|---|---|---|
| Permission navigateur | `granted` (déclaré, cohérent : pushs reçus) | branche `else` → « Permission nécessaire » |
| Service Worker | `/sw.js` publié, 200, scope `/` | lu via `getRegistration()`, sans attente de `ready` |
| PushSubscription | 2 endpoints Android actifs en base | `null` si lecture prématurée ou exception silencieuse |
| VAPID | clé publique présente et bundlée | OK |

## 8 — Cause racine

**C — 🟠 le navigateur est `granted`, mais LTPC lit mal l'état** (avec composante **H**, état
d'interface non rafraîchi).

Le badge « Permission nécessaire » est la branche par défaut d'une condition qui exige
`isSubscribed && granted`. `isSubscribed` est calculé via `getRegistration()` sans attendre
`serviceWorker.ready`, avec `catch → null`. Un `granted` + abonnement existant peut donc afficher
🟠. Le toast « Activation impossible » est, lui, une **exception de `pushManager.subscribe()`**
(typiquement abonnement existant lié à une autre clé VAPID), et non un refus de permission.

## 9 — Correction recommandée (non appliquée)

1. `PushService.getSubscription()` : attendre `navigator.serviceWorker.ready` (avec timeout) au lieu de
   `getRegistration()` seul, et distinguer « erreur » de « pas d'abonnement ».
2. Séparer les états dans le badge : `granted && !subscribed` → « 🟠 Non activé sur cet appareil »
   (et non « Permission nécessaire »), réservé `default` au libellé permission.
3. Rafraîchir `refreshPushState()` sur `serviceWorker.ready` et sur `controllerchange`.
4. Dans `subscribe()` : sur exception, si un `existing` est présent avec une clé différente,
   remonter une raison explicite (`key-mismatch`) au lieu du générique « Activation impossible ».
5. Hygiène DB : à l'upsert d'un nouvel endpoint, désactiver les anciens endpoints du même
   `user_id` + même `user_agent` (évite les doublons Android constatés).
