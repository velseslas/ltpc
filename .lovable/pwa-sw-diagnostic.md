# Diagnostic PWA — Service Worker LTPC ERP

Date : 2026-07-18
URL cible : https://ltpc.lovable.app
Aucun code modifié — audit lecture seule.

---

## Résumé exécutif

**Le Service Worker `/sw.js` EST correctement généré, publié et accessible en production.**
**Le wrapper d'enregistrement N'EST PAS bloqué sur le domaine `ltpc.lovable.app`.**
**Cause la plus probable de "aucun SW visible dans DevTools" : la page a été inspectée depuis l'URL de *preview* (`id-preview--*.lovable.app`) ou depuis l'éditeur Lovable (iframe), pas depuis l'URL publiée directement en onglet natif.**

---

## Vérifications point par point

### 1. `public/sw.js` existe-t-il dans le build de prod ?
✅ OUI — indirectement. `public/sw.js` n'existe PAS en source (normal, il est **généré** par `vite-plugin-pwa` en `generateSW`). Configuration : `vite.config.ts` → `VitePWA({ strategies: "generateSW", filename: "sw.js", ... })`.
Le fichier est produit dans `dist/sw.js` au build et servi à la racine du site.

### 2. Le navigateur peut-il télécharger `/sw.js` en prod ?
✅ OUI. `GET https://ltpc.lovable.app/sw.js` → **HTTP 200**, `content-type: text/javascript`, `cache-control: no-cache`, taille cohérente (précache Workbox de ~500 entrées listées : `precacheAndRoute([{url:"index.html"...}, ...])`).
Le contenu commence par le shim Workbox (`self.define = ...`) puis `self.skipWaiting()`, `clientsClaim()`, `precacheAndRoute(...)` — c'est un SW Workbox valide.

### 3. `serviceWorkerRegistration.ts` est-il importé ?
✅ OUI. `src/main.tsx` (fonction `bootstrap`, dernière étape) :
```ts
const { registerServiceWorker } = await import("./lib/pwa/serviceWorkerRegistration");
void registerServiceWorker();
```
Import dynamique après `createRoot(...).render(<App />)`. On retrouve d'ailleurs le chunk émis dans le précache Workbox : `assets/serviceWorkerRegistration-YuasI2LU.js`.

### 4. `registerServiceWorker()` est-il réellement appelé ?
✅ OUI, appelé inconditionnellement dans `bootstrap()` de `src/main.tsx`, entouré d'un `try/catch` silencieux.
Le `void` ignore la promesse mais l'appel a bien lieu.

### 5. Une condition du wrapper peut-elle bloquer l'enregistrement ?
Le wrapper `canRegisterServiceWorker()` refuse dans TOUS ces cas :

| Condition | État sur `https://ltpc.lovable.app` en onglet direct | État en preview / éditeur |
|---|---|---|
| `!import.meta.env.PROD` | ❌ PROD = true → OK | ❌ (build de prod publié → PROD=true) |
| `isInIframe()` (`window.self !== window.top`) | ❌ pas d'iframe → OK | ✅ **BLOQUE** (éditeur Lovable = iframe) |
| `isPreviewHost()` (voir ci-dessous) | ❌ n'est pas un host preview → OK | ✅ **BLOQUE** sur `id-preview--…lovable.app` |
| `!isSecureContextOrLocalhost()` | HTTPS → OK | HTTPS → OK |
| `hasKillSwitch()` (`?sw=off`) | absent → OK | absent → OK |

Détail de `isPreviewHost()` (fichier `src/lib/pwa/serviceWorkerRegistration.ts`) — retourne `true` si le hostname :
- commence par `id-preview--`
- commence par `preview--`
- est `lovableproject.com` ou finit par `.lovableproject.com`
- est `lovableproject-dev.com` ou finit par `.lovableproject-dev.com`
- est `beta.lovable.dev` ou finit par `.beta.lovable.dev`

**⚠️ Le domaine `ltpc.lovable.app` n'est PAS dans cette liste.** Aucune règle du wrapper ne le bloque.

### 6. `main.tsx` appelle-t-il bien l'enregistrement ?
✅ OUI. Voir §3. Import dynamique en fin de `bootstrap()`.

### 7. `HEAD /sw.js` retourne-t-il 200 ?
✅ OUI. Test réel :
```
HEAD https://ltpc.lovable.app/sw.js → HTTP/2 200
content-type: text/javascript; charset=utf-8
cache-control: no-cache
etag: "6240a4d6fc540b4875f7c1c0bfa66687"
```
Le garde-fou `fetch(SW_URL, { method: "HEAD" })` du wrapper est donc satisfait.

### 8. Le SW est-il désenregistré immédiatement ?
❌ NON — pas dans le contexte prod. `unregisterAll()` n'est appelée que si :
- kill-switch `?sw=off` présent,
- ou host preview,
- ou iframe,
- ou dev.
Aucune de ces conditions n'est vraie sur `ltpc.lovable.app` en onglet direct.

### 9. Exception JS empêchant `register()` ?
Aucune trace visible côté serveur, et le `try/catch` du wrapper capture toute erreur `register`/`fetch` sans re-lancer.
À vérifier côté client : ouvrir la console DevTools sur `https://ltpc.lovable.app` (onglet direct) et regarder :
- Erreurs dans `serviceWorkerRegistration-*.js`
- Erreurs de MIME/type sur `/sw.js` (ici OK, `text/javascript`)
- Erreurs CSP (aucune CSP restrictive détectée dans les headers Cloudflare renvoyés)
Les logs réseau capturés à `t=2026-07-18T00:35:59Z` proviennent de l'URL **preview** `id-preview--8e6b097b-….lovable.app` — donc SW volontairement désactivé (voir §5).

### 10. Le domaine `https://ltpc.lovable.app` est-il bloqué par le wrapper ?
❌ NON. Aucune règle de `isPreviewHost()` ni de `canRegisterServiceWorker()` ne cible `.lovable.app`. Le wrapper laisse passer.

---

## Diagnostic final

Sur l'URL publiée réelle `https://ltpc.lovable.app`, **le Service Worker DOIT s'enregistrer**. Toutes les conditions sont réunies :
- SW généré et servi (200 GET/HEAD)
- wrapper autorise l'enregistrement (pas iframe, pas host preview, PROD=true, HTTPS, pas de kill-switch)
- `bootstrap()` invoque bien `registerServiceWorker()`

Les motifs pour lesquels vous ne voyez **rien** dans `DevTools → Application → Service Workers` sont, par ordre de probabilité :

1. **Vous inspectez l'URL de preview** (`id-preview--…lovable.app`) au lieu de l'URL publiée. Sur la preview, `isPreviewHost()` retourne `true` → enregistrement volontairement refusé. C'est le comportement observé dans les requêtes réseau capturées.
2. **Vous inspectez l'éditeur Lovable** qui affiche la preview dans une iframe → `isInIframe()` retourne `true` → refus.
3. **DevTools filtre par "This origin"** : si vous avez ouvert `ltpc.lovable.app` mais que DevTools écoute encore l'origine preview, la liste apparaît vide. Cliquer "worker sources" ou changer d'onglet DevTools puis revenir.
4. **Navigation privée / mode incognito** avec "Bloquer les cookies tiers stricte" désactivant les SW.
5. **Extension navigateur** (uBlock, Privacy Badger stricte, Ghostery) qui bloque `navigator.serviceWorker.register`.
6. **Cache navigateur** : ancienne visite sans SW mise en cache. Faire Ctrl+Shift+R et revérifier après le premier rendu (l'enregistrement se fait après `render(<App />)`).

### Étapes de vérification recommandées (sans modif de code)

1. Ouvrir un onglet **normal** (non incognito, sans extensions) sur `https://ltpc.lovable.app` — **pas la preview**.
2. F12 → onglet **Application** → vérifier **Manifest** (doit afficher `LTPC — Gestion de laboratoire`).
3. Onglet **Application → Service Workers** → l'origine listée doit être `https://ltpc.lovable.app`.
4. Onglet **Console** : filtrer sur "workbox" ou "sw" ; taper `navigator.serviceWorker.getRegistrations().then(console.log)` — doit renvoyer un tableau non vide après ~1–2 s.
5. Onglet **Network** : recharger, vérifier qu'une requête `sw.js` de type `serviceworker` apparaît (colonne "Type").

Si les 5 étapes ci-dessus échouent sur l'URL de production en onglet propre, alors — et seulement alors — il y a un vrai bug à investiguer (probablement une exception JS dans le chunk `serviceWorkerRegistration-*.js` visible en console).

---

## Fichiers audités (aucun modifié)

- `src/main.tsx` (bootstrap + import dynamique)
- `src/lib/pwa/serviceWorkerRegistration.ts` (wrapper + gardes)
- `src/lib/pwa/registry.ts` (init adapters PWA)
- `vite.config.ts` (config `vite-plugin-pwa` generateSW)
- `public/manifest.webmanifest` (manifest existant)
- `index.html` (head : manifest, theme-color, apple-touch-icon — pas d'auto-registration)

Tests réseau effectués :
- `HEAD https://ltpc.lovable.app/sw.js` → 200
- `GET https://ltpc.lovable.app/sw.js` → 200 (contenu Workbox valide, `skipWaiting` + `clientsClaim` + précache complet)
- `HEAD https://ltpc.lovable.app/manifest.webmanifest` → 200
