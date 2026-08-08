# Diagnostic mobile — « Service Worker indisponible »

Date : 2026-08-08 · Mode **lecture seule** · **aucun fichier applicatif modifié**
Cible : https://ltpc.lovable.app (app publiée) · Appareil : Android 10, Chrome (UA relevé en base)

---

## Réponse directe

> **Pourquoi mon téléphone affiche-t-il « Service Worker indisponible » alors que le Push a déjà fonctionné ?**

Parce que l'écran Paramètres → Notifications Push lit l'état via `PushService.getState()` → `activeRegistration()`, qui exige un worker **déjà `activated`** dans une fenêtre de **10 s**. Au **démarrage à froid de la PWA**, et surtout **juste après un nouveau déploiement** (un nouveau `/sw.js` doit être téléchargé, installé et précacher **536 entrées**), cette condition n'est pas remplie au moment exact où l'écran s'affiche → l'UI conclut `sw-unavailable`.
Le Service Worker n'est **ni absent, ni cassé** : la preuve factuelle est ci-dessous (un abonnement Push **actif** a été créé depuis ce même téléphone à **17:38:46 UTC aujourd'hui**, donc avec un SW bien actif).

**Conclusion : 🟠 Service Worker présent mais pas encore `ready` au moment de la lecture (état transitoire, aggravé par une mise à jour récente du SW).**

---

## 1 — Contexte réel (production)

| Ressource | Résultat mesuré |
|---|---|
| `HEAD /sw.js` | **200**, `text/javascript`, `cache-control: no-cache`, etag `7b9571a1f40ceae05c9e06b542098a18` |
| `GET /sw.js` | **200**, 32 941 octets, Workbox valide (`define(["./workbox-07777d17"…`) |
| `GET /workbox-07777d17.js` | **200** |
| `HEAD /push-sw.js` | **200**, `text/javascript` |
| `HEAD /manifest.webmanifest` | **200**, `application/manifest+json` |
| Déploiement servi | `x-deployment-id: 17fd59b0-f284-40a3-b9f5-7fc3037df50e` |

Tous les fichiers sont servis en **HTTPS**, origine `https://ltpc.lovable.app`, scope `/`.

## 2 — Service Worker

- **Fichier enregistré** : `/sw.js` (constante `SW_URL` du wrapper), scope forcé `{ scope: "/" }` → **couvre bien `/`**.
- **Chargement** : OK (200, MIME correct, pas de CSP restrictive).
- **Erreur d'installation** : **aucune détectable**. Contrôle exhaustif du manifeste de précache : **536 URLs extraites, 0 URL en échec** (le seul « 404 » observé, `/.js`, est un artefact de mon extraction regex sur le shim Workbox, pas une entrée réelle du précache). Une entrée 404 aurait fait échouer `install` — ce n'est pas le cas.
- **Erreur d'activation** : aucune ; `skipWaiting: true` + `clientsClaim: true` sont configurés.

## 3 — PWA / origine

- Origine utilisée par le téléphone : **A — `https://ltpc.lovable.app`** (déduit du fait que l'enregistrement du SW puis l'abonnement Push FCM ont réussi depuis cet appareil ; sur `id-preview--*.lovable.app` ou dans l'iframe éditeur, `canRegisterServiceWorker()` refuse **et désenregistre**, aucun abonnement n'aurait pu naître).
- Manifest : `scope: "/"`, `start_url: "/?v=2"`, `display: standalone` → cohérent, ne restreint pas le scope du SW.
- HTTPS : oui, contexte sécurisé.

## 4 — Cache / ancien Service Worker

- `/sw.js` est servi en `no-cache` → pas de SW périmé figé par le CDN.
- `cleanupOutdatedCaches: true` → les anciens caches Workbox sont purgés à l'activation.
- **Mise à jour récente du SW confirmée** : l'etag de `/sw.js` est passé de `6240a4d6fc540b4875f7c1c0bfa66687` (audit du 2026-07-18) à `7b9571a1f40ceae05c9e06b542098a18` aujourd'hui. Chaque publication remplace le SW ; pendant la fenêtre install→activate, l'ancienne registration devient `redundant` et `controllerchange` déclenche un `window.location.reload()` (wrapper, l. 148-154). **C'est exactement la fenêtre où `activeRegistration()` peut rendre `null`.**
- Pas de second fichier SW concurrent : un seul `/sw.js`, `/push-sw.js` n'est pas enregistré séparément (il est `importScripts`é).

## 5 — push-sw.js

- Fichier présent en prod (200), chargé par `importScripts("/push-sw.js")` — présence confirmée dans le `/sw.js` déployé.
- Contenu syntaxiquement ES5, aucun `import`/`export`, aucun accès à des API absentes → ne peut pas faire échouer le démarrage du SW.
- **Note secondaire (non bloquante)** : `/push-sw.js` est servi **sans `cache-control: no-cache`** (contrairement à `/sw.js`). Un `push-sw.js` mis en cache reste ancien tant que l'etag n'est pas revalidé, mais cela n'empêche ni l'install ni l'activation.

## 6 — Preuve terrain (base de données, lecture seule)

`push_subscriptions`, appareil Android (même `user_agent`), utilisateur `66114a91-…4338b` :

| created_at (UTC) | is_active | plateforme |
|---|---|---|
| **2026-08-08 17:38:46** | **true** | android |
| 2026-08-08 16:40:49 | false | android |
| 2026-08-07 19:06:01 | false | android |
| … 8 autres lignes du 2026-08-07 | false | android |

→ Un abonnement Push **actif a été créé depuis ce téléphone aujourd'hui à 17:38:46 UTC**, soit après l'affichage du message d'erreur. Un abonnement ne peut naître **que** sur une registration dont le worker est `activated`. Le Service Worker est donc bien **présent et actif** sur l'appareil.
→ La série de créations/désactivations rapprochées du 07/08 correspond aux cycles de re-souscription (dédoublonnage par `user_agent`), pas à une panne du SW.

## 7 — Cause exacte

**🟠 Service Worker présent mais pas encore `ready` au moment de la lecture d'état.**

Chaîne précise :
1. Nouvelle publication → nouveau `/sw.js` (etag changé) ;
2. ouverture de la PWA → l'ancien worker est remplacé ; pendant l'install du nouveau (536 entrées à précacher, réseau mobile) la registration n'a pas de worker `activated` ;
3. l'utilisateur ouvre Paramètres → Notifications Push dans cette fenêtre ;
4. `getState()` → `activeRegistration()` → `readyRegistration()` : `getRegistration()` ne rend pas d'`active.state === "activated"`, la course avec le timeout de **10 s** expire, ou le garde-fou `fetch("/sw.js", { method: "HEAD" })` échoue sur un réseau mobile instable ;
5. l'UI affiche **« Service Worker indisponible »** ;
6. quelques instants plus tard le worker est activé — d'où l'abonnement réussi à 17:38:46.

Causes écartées formellement : SW réellement absent (❌), erreur d'installation (❌ : 0 URL de précache en échec), `/push-sw.js` manquant ou fautif (❌ : 200 + ES5 valide), mauvaise origine/preview (❌ : sinon aucun abonnement FCM possible), VAPID/permissions (hors périmètre et non impliqués).

---

**Aucune correction appliquée.** Aucun fichier applicatif modifié ; les seules opérations ont été des requêtes HTTP en lecture sur le domaine publié et des `SELECT` en base.
