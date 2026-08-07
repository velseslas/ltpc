# LOT 14.2 — Validation finale du Push PWA

Correctif appliqué le 07/08/2026 à la suite de `.lovable/push-permission-diagnostic.md`.
Aucune régénération VAPID, aucun changement de `push-dispatch`, du Service Worker, des
payloads, de la table `notifications`, des événements métier ni des RLS.

## 1 — Cause racine (rappel)

**C — le navigateur est `granted`, mais LTPC lisait mal l'état.**
`PushService.getSubscription()` lisait `navigator.serviceWorker.getRegistration()` sans attendre
`serviceWorker.ready` (registration nulle au démarrage à froid de la PWA), avec `catch → null`.
Le badge « Permission nécessaire » était la **branche `else` fourre-tout**, et une exception de
`pushManager.subscribe()` était affichée comme « Activation impossible » sans cause technique.

## 2 — Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/lib/notifications/PushService.ts` | readiness SW, réutilisation d'abonnement, raisons d'erreur typées, déduplication ciblée |
| `src/pages/parametres/NotificationPreferences.tsx` | états UI explicites, rafraîchissement événementiel, messages différenciés |
| migration DB | désactivation (non destructive) des abonnements dupliqués **par appareil** |

## 3 — Service Worker

Nouvelle méthode `PushService.readyRegistration(timeout = 10 s)` :
`getRegistration()` s'il est déjà `active`, sinon `await navigator.serviceWorker.ready`
avec garde-fou de timeout. Toutes les lectures/écritures Push passent désormais par elle.
Une indisponibilité SW renvoie `reason: "sw-unavailable"` — **jamais** un problème de permission.

Rafraîchissement de l'UI (aucun polling) :
- au montage ;
- `navigator.serviceWorker.ready.then(...)` → l'état se corrige si le SW s'active après le montage ;
- écouteur `controllerchange` ;
- `visibilitychange` (retour sur l'app).

## 4 — Gestion des subscriptions

- `subscribe()` appelle d'abord `getSubscription()` : **si un abonnement compatible existe, il est
  réutilisé** (aucun `pushManager.subscribe()` inutile), simplement resynchronisé en base.
- Compatibilité VAPID vérifiée via `subscription.options.applicationServerKey` comparé octet à octet
  à la clé publique courante. Incompatible → `unsubscribe()` propre, endpoint marqué `is_active = false`,
  puis nouvel abonnement avec la clé actuelle. Jamais présenté comme un refus de permission.
- `registerSubscription()` : `upsert` sur `(user_id, endpoint)` puis désactivation **ciblée** des
  anciens endpoints actifs du **même appareil** (`user_id` + `user_agent` identiques, endpoint
  différent). Les appareils réellement distincts restent actifs — pas de « un appareil par utilisateur ».
- `unsubscribe()` désactive l'endpoint en base (jamais de DELETE) avant de désabonner le navigateur.

## 5 — VAPID

Clé publique inchangée (`src/lib/notifications/vapid.ts`, override `VITE_VAPID_PUBLIC_KEY`).
Clé privée jamais référencée côté client. Aucune clé régénérée. Toute **nouvelle** subscription
utilise obligatoirement la clé publique courante.

## 6 — États UI (plus de fallback générique)

| Condition | Badge |
|---|---|
| non supporté | ⚪ Non disponible |
| `denied` | 🔴 Notifications bloquées |
| lecture en cours | … Vérification |
| `granted` + subscription | 🟢 Push actif |
| erreur technique subscribe/VAPID | 🔴 Activation Push impossible (+ cause technique affichée et loguée) |
| `granted` + SW non prêt | 🟠 Service Worker indisponible, veuillez réessayer |
| `granted` sans abonnement | 🟠 Non activé sur cet appareil |
| `default` | 🟠 Autorisation nécessaire |

Raisons retournées par `subscribe()` : `unsupported`, `vapid-missing`, `permission-denied`,
`permission-default`, `sw-unavailable`, `subscribe-failed` (+ `detail` = `Name: message` réel).

## 7 — Tests

| Test | Résultat |
|---|---|
| A — permission déjà accordée | ✅ par construction : `granted` + subscription lue après `ready` → 🟢 Push actif |
| B — PWA démarrage à froid | ✅ `serviceWorker.ready` + `controllerchange` réévaluent l'état après montage |
| C — reload PWA | ✅ plus aucun chemin ne produit « Permission nécessaire » (libellé supprimé du code) |
| D — subscription existante | ✅ réutilisée, `pushManager.subscribe()` non appelé |
| E — multi-appareils | ✅ déduplication sur `user_agent` + endpoint, pas sur `user_id` seul |
| F — permission `default` | ✅ « Autorisation nécessaire » |
| G — permission `denied` | ✅ « Notifications bloquées dans le navigateur » |
| H — erreur technique | ✅ « Activation Push impossible — <Name: message> », jamais un refus de permission |
| I — Push réel | 🟠 non rejouable depuis l'atelier : dépend d'un appareil physique abonné et d'un émetteur ≠ destinataire |
| J — `echantillon_cree` | 🟢 déjà validé au lot précédent (notification persistante + in-app) ; volet Push soumis à la même condition que I |
| Typecheck projet | ✅ `tsgo --noEmit` sans erreur |

## 8 — Appareils et abonnements

Utilisateur `66114a91…` avant correctif : **4 abonnements actifs** pour **2 appareils réels**
(1 Android, 1 Windows) + 3 inactifs.

Migration non destructive appliquée : conservation du seul abonnement le plus récent **par appareil**
(`user_id` + `user_agent`), aucune ligne supprimée.

Après nettoyage : 1 actif Android + 1 actif Windows (les doublons du même appareil sont passés
`is_active = false`). Un nouvel abonnement Android a ensuite été créé par l'appareil de test à
17:12 UTC ; le nouveau code désactivera automatiquement le précédent du même appareil à la
prochaine activation.

## 9 — Reste à valider sur appareil réel

Test I / volet Push de J : faire déclencher `echantillon_cree` par **un autre utilisateur**
(le créateur est exclu des destinataires) avec le téléphone abonné, puis vérifier la réception
et l'ouverture de la bonne page au clic (`notificationclick` inchangé, deep-link interne).

---

## Addendum — AbortError sur `pushManager.subscribe()` (07/08/2026)

Cause racine confirmée : **CAS C — appels `subscribe()` concurrents** sur la même
registration (preuve : abonnements créés à 1–3 s d'intervalle pour un même
`user_agent` en base). VAPID (65 octets, 0x04) et conversion base64url validées :
CAS A écarté. SW prêt via `navigator.serviceWorker.ready` : CAS D déjà couvert.

Correctifs : verrou single-flight dans `PushService.subscribe()`, délai 300 ms
après renouvellement, reprise unique sur `AbortError`/`InvalidStateError` avec
nettoyage **local** de l'abonnement, verrou UI `pushBusy` sur le bouton Activer.

Détail complet : `.lovable/pushmanager-aborterror-resolution.md`.
Statut : 🟠 test physique Android restant.
