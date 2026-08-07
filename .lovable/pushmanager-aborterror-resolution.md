# PushManager.subscribe() — AbortError : diagnostic et résolution

## 1 — Appel exact

- Fichier : `src/lib/notifications/PushService.ts`
- Fonction : `PushService.subscribe()` → `subscribeInternal()`
- Paramètres : `{ userVisibleOnly: true, applicationServerKey: applicationServerKeyBuffer() }`
- `userVisibleOnly: true` ✅ (obligatoire Chrome)

## 2 — Vérification VAPID (CAS A écarté)

Clé frontend (`src/lib/notifications/vapid.ts`, override `VITE_VAPID_PUBLIC_KEY`) :
`BBW4917bp_r44Wq7JFeGlfmP2tc98OD7509vTqaxmmSbNmDAfCwf0KkJ0Jzala7lljYldGlNQoS4A0fqdPogEMQ`

Décodage réel effectué (base64url → octets) :
- longueur = **65 octets** ✅
- premier octet = **0x04** (point EC P-256 non compressé) ✅
- conversion `urlBase64ToUint8Array` : padding `=` correct, `-`→`+`, `_`→`/`, `ArrayBuffer` correctement tranché via `byteOffset/byteLength` ✅

Même clé côté serveur (push-dispatch) — pushs déjà reçus avec succès sur cette clé.
**Conversion et clé conformes : CAS A écarté.**

## 3/4 — Abonnement existant et ancienne VAPID

`subscribeInternal()` appelle `getSubscription()` AVANT tout `subscribe()`.
- si l'abonnement existe et correspond à la VAPID courante (`matchesCurrentVapidKey`, comparaison octet à octet de `sub.options.applicationServerKey`) → **réutilisation**, aucun `subscribe()` ;
- sinon → `unsubscribe()` **local uniquement** + `deactivateEndpoint()` (mise à `is_active=false` de la seule ligne de cet endpoint), puis `subscribe()` avec la clé actuelle.
Aucune suppression, aucun impact sur les autres appareils.

## 5 — Service Worker

`readyRegistration()` attend réellement `navigator.serviceWorker.ready` (timeout 10 s), avec repli sur `getRegistration()` si déjà actif. SW `/sw.js` (vite-plugin-pwa, scope `/`, `importScripts: ["/push-sw.js"]`). CAS D déjà couvert.

## 6 — CAUSE RACINE CONFIRMÉE : CAS C — appels concurrents

Preuve en base (`push_subscriptions`, même `user_agent` Android) :

| created_at (UTC) | endpoint (préfixe) |
|---|---|
| 16:03:30 / 16:03:31 | cPxW1Fndc / etSxMkSUy (Windows, 1 s d'écart) |
| 16:16:13 / 16:16:16 | ctmDvZsXC / fv66abP_B (Android, 3 s d'écart) |
| 17:11:25 / 17:12:27 | dOtlc1PGD / f0KogzCnN (Android) |

Des abonnements créés à 1–3 secondes d'intervalle sur le **même appareil** prouvent
plusieurs flux d'activation simultanés. Chrome/Android rejette avec
`AbortError: Failed to execute 'subscribe' on 'PushManager'` tout `subscribe()`
émis pendant qu'une opération pushManager (subscribe ou unsubscribe précédent)
est encore en cours sur la même registration. Le cas est aggravé par la séquence
`unsubscribe()` → `subscribe()` immédiate du renouvellement VAPID.

## 7 — Correction appliquée (uniquement la cause démontrée)

`src/lib/notifications/PushService.ts`
- **verrou single-flight** (`inFlight`) : un seul flux d'activation à la fois ; tout appel concurrent réutilise la même promesse ;
- **délai de 300 ms** après un `unsubscribe()` de renouvellement avant le `subscribe()` ;
- **une reprise unique** sur `AbortError` / `InvalidStateError` : nettoyage de l'abonnement **local** puis nouvelle tentative après 1 s ;
- journalisation `error.name` + `error.message` (aucune clé, aucun token).

`src/pages/parametres/NotificationPreferences.tsx`
- verrou UI `pushBusy` : bouton désactivé et libellé « Activation… » pendant l'opération ;
- messages inchangés par ailleurs : un `AbortError` reste affiché en 🔴 « Activation Push impossible — AbortError: … », jamais « Permission nécessaire ».

Non modifiés : clés VAPID, secrets, FCM, `push-dispatch`, `push-sw.js`, notifications métier, `echantillon_cree`. Aucune migration.

## 8 — Contexte de test

Uniquement `https://ltpc.lovable.app` (`isSecureContext === true`). L'iframe de prévisualisation n'enregistre volontairement aucun SW.

## 9 — Base

Aucune suppression. Abonnements actifs après la déduplication précédente : 1 Android (`f0Kog…`, 17:12) + 1 Windows (`etSxM…`). Les anciens restent `is_active=false` (historique conservé).

## 10 — Verdict

🟠 **Push corrigé — test physique restant.** La cause (CAS C, concurrence) est
démontrée par les données et neutralisée par le verrou + reprise. Le succès réel
de `pushManager.subscribe()` doit être confirmé sur l'appareil Android après
publication.
