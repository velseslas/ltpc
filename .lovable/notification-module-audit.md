# AUDIT COMPLET — MODULE NOTIFICATIONS LTPC
_Audit en lecture seule. Aucun fichier de code, aucune migration, aucune policy, aucune clé, aucun Service Worker modifié._

---

## A. Architecture actuelle

Le module repose sur **deux sous-systèmes coexistants** :

**1) Système DÉRIVÉ (calculé côté client, sans table)** — le seul réellement alimenté aujourd'hui.
- `src/hooks/useNotifications.ts` (256 l.) — recalcule les alertes à chaque requête à partir des données métier.
- `src/hooks/useProactiveAlerts.ts` — alertes IA (`ai_alerts`, `ai_daily_summaries`), système à part.
- `src/pages/Notifications.tsx` (397 l.) — page complète basée **uniquement** sur `useNotifications`.

**2) Système PERSISTANT « Phase 9 » (tables + services)** — infrastructure construite, mais **non branchée au métier**.
- `src/lib/notifications/types.ts` — `NotificationPriority`, `NotificationCategory` (17), `NotificationFrequency`, `PRIORITY_META`, `CATEGORY_META`.
- `NotificationRepository.ts` — CRUD, filtres, `unreadCount`.
- `PreferenceService.ts` — préférences + `isCategoryEnabled`.
- `NotificationService.ts` — `emit()` + helpers `notify.{info,success,warning,urgent,critical,ai}`.
- `PushService.ts` — permission / subscribe / unsubscribe / `registerSubscription`.
- `purgeDerived.ts` — purge cache + base après suppression d'un enregistrement.
- `index.ts` — façade.
- `src/hooks/useNotificationCenter.ts` — `usePersistedNotifications`, `useUnreadNotificationCount`, `useNotificationActions`, `useNotificationPreferences` + Realtime.

**UI**
- `src/components/layout/NotificationBell.tsx` — **seul point de fusion** des deux systèmes.
- `src/pages/Notifications.tsx` — ⚠️ **n'affiche PAS les notifications persistantes**.
- `src/pages/parametres/NotificationPreferences.tsx` — canaux, fréquence, catégories, activation Push.
- `src/pages/parametres/NotificationsSettings.tsx` — paramètres legacy (`parametres_notifications`).
- `src/pages/pwa/DebugNotifications.tsx` — console de diagnostic (`/debug/notifications`).

**PWA**
- `vite.config.ts` → `VitePWA` (`generateSW`, `filename: sw.js`, `injectRegister: false`, `devOptions.enabled: false`).
- `src/lib/pwa/serviceWorkerRegistration.ts` — wrapper d'enregistrement gardé (prod, hors iframe, hors host preview, HTTPS, kill-switch `?sw=off`).
- `src/lib/pwa/pushManager.ts` — **stub Phase 8** : `subscribe()` retourne `null` volontairement.
- `public/manifest.webmanifest` + icônes 48→512 + maskable.

---

## B. Tables et données

### `public.notifications` (20 colonnes) — **0 ligne en base**
`id`, `user_id`, `type` (text), `category` (enum `notification_category`), `priority` (enum `notification_priority`), `title`, `message`, `icon`, `color`, `link`, `data` (jsonb), `source` (text), `role` (text), `is_read`, `is_archived`, `read_at`, `created_at`, `updated_at`.
- ❌ Pas de `chantier_id`, pas de `resource_id` typé → la cible est portée par `link` (texte) et `data` (jsonb non contraint).
- Index Phase 9 : (user+created_at), partiel unread, category, priority.

### `public.notification_preferences` (12 colonnes) — **1 ligne**
`user_id` (unique), `push_enabled`, `inapp_enabled`, `email_enabled`, `sms_enabled`, `frequency`, `disabled_categories[]`, `quiet_hours_start/end`.
- ⚠️ `quiet_hours_*` **jamais évalués** dans `NotificationService.emit()`.
- ⚠️ `frequency` autre que `immediat` = notification persistée mais **jamais affichée** (aucun batcher/cron).

### `public.push_subscriptions` (11 colonnes) — **0 ligne**
`user_id`, `endpoint`, `p256dh`, `auth`, `user_agent`, `platform`, `is_active`, `last_used_at`.
- Contrainte d'unicité `(user_id, endpoint)` utilisée par l'`upsert`.

### Realtime
⚠️ **`notifications` n'est PAS dans la publication `supabase_realtime`** → le canal Realtime souscrit dans `useNotificationCenter.ts` ne reçoit jamais d'événement. Le rafraîchissement repose en pratique sur le polling 60 s.

---

## C. Notifications métier

### Création
- ❌ **Aucune mutation métier n'appelle `notify.*()` ni `NotificationService.emit()`.** Le seul appelant du projet est `src/pages/pwa/DebugNotifications.tsx` (bouton de test).
- ❌ Aucun trigger PostgreSQL n'insère dans `notifications`.
- ❌ Aucune Edge Function ne produit de notification (19 fonctions déployées : IA, PDF, users, archives — aucune notification/push).
- ✅ En pratique, **100 % des notifications visibles sont dérivées** et recalculées côté client.

### Événements réellement couverts (via `useNotifications`)
1. Essais en retard > 14 j depuis réception (`error`).
2. Essais en attente > 7 j (`warning`).
3. Échéances de compression dépassées (par `jours_essai` vs `date_coulage`), ignorant celles déjà saisies.
4. Échéances de compression proches.
5. Étalonnage matériel dû / en retard (`calibration_due` / `calibration_overdue`).

Séparément : `useProactiveAlerts` (alertes IA, table `ai_alerts`) — **non fusionné** avec la cloche.

### Destinataire / rôles
- Dérivé : pas de destinataire. Chaque utilisateur recalcule ce que ses droits lui laissent lire ; le scoping technicien est appliqué **dans le hook** (voir D/§3).
- Persistant : `user_id` obligatoire (par défaut `auth.uid()`), colonne `role` présente mais **jamais exploitée** (pas de diffusion « à tous les managers »).
- ⚠️ Manque : **pas de fan-out multi-destinataires**. Une notification métier destinée à N utilisateurs nécessiterait N insertions — non implémenté.

### Lu / non-lu / badge
- Dérivé : **aucune notion de « lu »** — une alerte disparaît seulement quand la donnée métier change.
- Persistant : `is_read` + `read_at`, `markRead`, `markAllRead` (scope `user_id`), `archive`, `remove`.
- Badge (`NotificationBell`) : `badgeCount = errorCount` = alertes dérivées `severity==="error"` **+** persistantes non lues `urgent|critical`. Les `warning` et `info` **ne comptent pas** (règle voulue : « seulement les retards »).
- Compteur du popover : `notifications.length + persistedUnread`.
- ⚠️ Incohérence : « Tout marquer comme lu » n'agit que sur les persistantes ; les dérivées restent affichées.

### Ouverture de la ressource
- Dérivé : `link` → `navigate()`. Lien contextuel labo mobile vs compression standard (`/laboratoires-mobiles/chantier/:id/echantillon/:id`).
- Persistant : `link` → `navigate()` + `markRead`.

---

## D. `useNotifications` — état actuel (non modifié)

- **Requêtes Supabase (3–4 par exécution)** :
  1. `laboratoires_mobiles` (`chantier_id not null`) → set anti-fantômes.
  2. `essais` `.in("statut", ["pending","in-progress"])` — **court-circuitée pour techniciens** (`{data: [], error: null}`, aucun scoping chantier disponible).
  3. `echantillons_compression` `.in("statut",["a-faire","en-cours"])` avec jointures `clients:client_id(nom)`, `chantiers:chantier_id(nom)` ; pour technicien/opérateur : `.in("chantier_id", allowedChantierIds)`, ou `.eq("chantier_id","0000…0000")` sentinelle si liste vide.
  4. Matériel / étalonnage.
- **Dépendances** : `useCurrentUserRole`, `useCurrentUserChantiers` ; `enabled: !isTechnicien || !!userChantiers` (évite la fuite pendant le chargement).
- **queryKey** : `["notifications", role, allowedChantierIds.join(",")]` — correcte, sans risque de cache croisé.
- **RLS** : la sécurité réelle est portée par les policies des tables sources ; le filtrage du hook est un affinage UX, pas la barrière.
- **Performance** : pas de pagination ni de `limit` sur `echantillons_compression` (`a-faire`/`en-cours`) — le volume croît linéairement avec l'activité ; tout le calcul (dates, échéances) est fait en mémoire client. Pas de N+1 (jointures embarquées).
- **Problèmes connus** : aucun état « lu », aucune persistance, dépend d'une sentinelle UUID zéro, `essais` totalement masqués aux techniciens (choix conservateur), duplication de logique avec `useNotificationCenter`.
- ➡️ **Aucune migration n'a été faite** vers le système persistant. `useNotifications` reste **le moteur métier de fait**.

---

## E. Notifications in-app

| Élément | État |
|---|---|
| Cloche `NotificationBell` | 🟢 fusionne dérivé + persistant |
| Badge (retards uniquement) | 🟢 |
| Compteur total popover | 🟢 |
| Liste popover (max 20 persistantes) | 🟢 |
| Marquage lu / tout lu / archiver | 🟢 (persistantes uniquement) |
| Navigation vers la cible | 🟢 |
| Rafraîchissement (polling 60 s + focus) | 🟢 |
| Temps réel Supabase | ⚠️ code présent mais **table non publiée en Realtime** → inopérant |
| Page `/notifications` | 🟠 **n'affiche que les dérivées** — les persistantes y sont invisibles |
| Préférences `/parametres/notifications-preferences` | 🟢 UI complète, mais `quiet_hours` et `frequency≠immediat` non honorés |
| Mobile / desktop | 🟢 (popover responsive, `max-h-[50vh]`) |
| PWA installée | 🟢 identique au web (pas de notification système) |

**Conclusion :** l'in-app est **fonctionnel mais hybride** ; plusieurs morceaux persistants ne sont pas branchés (page dédiée, Realtime, quiet hours, fréquence, colonne `role`).

---

## F. Push PWA existant

Ce qui **existe déjà** (à ne pas refaire) :
- ✅ Détection de support : `serviceWorker` + `PushManager` + `Notification` (`PushService.isSupported`).
- ✅ Demande de permission : `Notification.requestPermission()`.
- ✅ Lecture de l'abonnement : `reg.pushManager.getSubscription()`.
- ✅ Souscription : `pushManager.subscribe({ userVisibleOnly, applicationServerKey })` avec conversion base64url→Uint8Array correcte.
- ✅ Persistance de l'abonnement : `upsert` dans `push_subscriptions` avec `onConflict: "user_id,endpoint"`, plateforme détectée (android/ios/windows/macos/web).
- ✅ Désinscription : suppression en base + `sub.unsubscribe()`.
- ✅ UI d'activation (préférences) + console de diagnostic (`/debug/notifications`).

Ce qui **manque** :
- 🔴 `VITE_VAPID_PUBLIC_KEY` — **absente** de `.env` (0 occurrence).
- 🔴 Clé privée VAPID — **absente** des secrets backend.
- 🔴 Edge Function d'envoi (`push-dispatch`) — inexistante.
- 🔴 Handler `push` dans le Service Worker.
- 🔴 Handler `notificationclick` (ouverture de l'URL cible / focus onglet).
- 🔴 Nettoyage des abonnements expirés (404/410 → `is_active=false`).
- 🔴 Aucun lien entre `NotificationService.emit()` et le canal Push (le Push n'est jamais déclenché).

**Cause exacte du message « Clé VAPID absente — Push non activé » :**
`PushService.subscribe()` renvoie `{ ok:false, reason:"vapid-missing" }` dès que `import.meta.env.VITE_VAPID_PUBLIC_KEY` est `undefined` ; `NotificationPreferences.tsx:70` traduit ce motif en ce toast. La variable n'est déclarée nulle part dans le projet — c'est donc un garde-fou volontaire, pas un bug.

---

## G. VAPID

| Emplacement recherché | Résultat |
|---|---|
| `.env` (`VITE_VAPID_PUBLIC_KEY`) | **absente** |
| Secrets backend | **absente** (secrets présents : Gotenberg ×2, clé IA managée) |
| Variables d'environnement Edge Functions | **absente** |
| Code serveur | **absent** (aucune fonction push) |
| Documentation `.lovable/phase9-notifications.md` | mentionnée comme « reste à faire » |

➡️ **Aucune paire VAPID n'existe.** Aucune clé n'a été générée pendant cet audit.

---

## H. Service Worker

- **Emplacement** : généré par `vite-plugin-pwa` (`generateSW`) → `/sw.js` **en build de production uniquement** (`devOptions.enabled: false`) ; aucun fichier `public/sw.js` versionné.
- **Enregistrement** : wrapper maison (`injectRegister: false`), gardes prod/iframe/host preview/HTTPS/`?sw=off`, MAJ non silencieuse via `PWAUpdatePrompt`.
- **Scope** : `/` ; `navigateFallback: /index.html` avec denylist (`/api/`, `/functions/`, `/~oauth`, `/auth/v1/`, `/rest/v1/`, `/storage/v1/`, `/realtime/v1/`, `/sw.js`).
- **Cache** : HTML `NetworkFirst` (3 s), JS/CSS same-origin `CacheFirst`, `cleanupOutdatedCaches`, `clientsClaim`, `skipWaiting`.
- **Événement `push`** : 🔴 absent.
- **Événement `notificationclick`** : 🔴 absent.
- **Compatibilité LTPC** : ✅ le SW est sain et compatible ; il lui manque uniquement les deux handlers, ajoutables via `importScripts` ou `injectManifest`.

➡️ **Le Service Worker actuel n'est PAS prêt à recevoir les Push**, mais aucune refonte n'est nécessaire.

---

## I. Flux complet

```
Événement métier                 🔴 aucun appel notify.* dans les mutations
        ↓                            (tout est recalculé a posteriori)
Création notification            🟠 emit() existe, appelé uniquement en debug
        ↓
Table notifications              🟠 schéma + RLS + index OK, 0 ligne
        ↓
Notification in-app              🟢 cloche OK (dérivé + persistant)
                                 ⚠️ page /notifications ignore les persistantes
                                 ⚠️ Realtime souscrit mais table non publiée
        ↓
[Push PWA]                       🟠 client complet, clé VAPID absente
        ↓
Service Worker                   🟠 SW opérationnel, handler `push` absent
        ↓
Notification système             🔴 absente
        ↓
Clic                             🔴 `notificationclick` absent
        ↓
URL cible LTPC                   🟠 `link` disponible en base, jamais consommé par le SW
```

---

## J. Séparation des deux systèmes

| Critère | Verdict |
|---|---|
| Push = canal supplémentaire, pas un 2ᵉ système métier | ✅ oui — `PushService` ne crée aucune notification |
| Point d'entrée unique côté émission | ✅ `NotificationService.emit()` |
| Tables séparées (notifications / abonnements / préférences) | ✅ |
| Deux systèmes MÉTIER coexistants | ⚠️ **oui** : dérivé (`useNotifications`) et persistant (Phase 9) vivent en parallèle et ne se parlent que dans `NotificationBell` |

➡️ La séparation **A/B (métier vs Push) est correcte**. Le vrai défaut est ailleurs : **duplication du système métier** (dérivé vs persistant). Le Push, branché sur `emit()`, ne verrait donc **aucune** des alertes actuellement affichées (retards d'essais, échéances de compression, étalonnage) — celles-ci ne passent jamais par `emit()`.

---

## K. Sécurité

| Point | État |
|---|---|
| RLS `notifications` | ✅ activée — SELECT `user_id = auth.uid() OR is_admin_only()`, UPDATE/DELETE strictement `user_id = auth.uid()`, INSERT réservé `is_admin_only()` |
| RLS `notification_preferences` | ✅ ALL `auth.uid() = user_id` |
| RLS `push_subscriptions` | ✅ ALL `auth.uid() = user_id` — un utilisateur ne voit jamais les endpoints d'autrui |
| Rôle `anon` | ✅ aucune policy anon sur les trois tables |
| Association abonnement ↔ utilisateur | ✅ `(user_id, endpoint)` unique, `user_agent` + `platform` tracés |
| Secrets VAPID | ✅ aucune clé en clair dans le code ; la clé publique passera par `VITE_*` (attendu), la privée devra rester côté Edge Function uniquement |
| Edge Functions | 🔴 aucune fonction push → surface d'attaque nulle aujourd'hui |
| Risque de notification au mauvais utilisateur | 🟢 faible : `user_id` obligatoire ; ⚠️ à surveiller lors du fan-out multi-destinataires et de l'insertion serveur (service_role contourne la RLS) |
| ⚠️ Point d'attention | La policy INSERT `is_admin_only()` **empêche un utilisateur non-admin de créer sa propre notification** depuis le client. `NotificationRepository.create()` échouera silencieusement (`console.warn`) pour les techniciens/managers → **toute création devra passer par le serveur (Edge Function service_role)**. C'est aussi pourquoi le bouton de test `/debug/notifications` ne fonctionne que pour un admin. |

---

## L. Performance

| Point | Constat |
|---|---|
| Polling | `useNotifications` (React Query défaut) + `usePersistedNotifications` (60 s) + `useUnreadNotificationCount` (60 s) → **3 sources de refetch** |
| Requêtes par cycle | ~3–4 (dérivé) + 2 (persistant) = **5–6 requêtes/min par onglet ouvert** |
| Realtime | Canal `notif-<uid>` ouvert par **chaque** composant montant `usePersistedNotifications` (cloche + tout futur écran) ; ⚠️ inopérant car table non publiée → coût réseau sans bénéfice |
| N+1 | ❌ aucun — jointures embarquées |
| Volumétrie | `echantillons_compression` sans `limit` ; `NotificationRepository.list({limit:1000})` sur la page de debug |
| Chargement centre de notifications | rapide (0 ligne aujourd'hui) ; à repagineriser au-delà de quelques milliers de lignes |
| Doublon `unreadCount` | recalculable depuis `list()` — une requête `head:true` supplémentaire à chaque cycle |

---

## VERDICT

## 🟠 MODULE NOTIFICATIONS PARTIELLEMENT COMPLET — CORRECTIONS NÉCESSAIRES

**Ce qui est solide :** schéma de données, RLS, services (`Repository`/`Preference`/`Push`/`Service`), hooks React Query, UI cloche et préférences, Service Worker PWA.

**Ce qui bloque le Push :**
1. 🔴 Aucun événement métier n'alimente la table `notifications` (le Push n'aurait rien à envoyer).
2. 🔴 Paire VAPID inexistante.
3. 🔴 Aucune Edge Function d'envoi.
4. 🔴 Handlers `push` / `notificationclick` absents du Service Worker.
5. ⚠️ Policy INSERT admin-only → création à faire côté serveur.
6. ⚠️ Table `notifications` hors publication Realtime.
7. ⚠️ Page `/notifications` ignore les notifications persistantes.

---

## Implémentation minimale proposée (réutilisation maximale)

**Étape 0 — Décision d'architecture (préalable).** Choisir : le persistant devient l'unique canal métier, `useNotifications` restant une **source dérivée en lecture seule** affichée en parallèle. Ne pas réécrire `useNotifications`.

**Étape 1 — Alimenter la table (sans toucher au métier).**
Une Edge Function planifiée `notifications-scan` (service_role) qui rejoue **la même logique de détection** que `useNotifications` côté serveur et insère les notifications manquantes (déduplication par `type + data.record_id`), avec `user_id` résolu depuis `laboratoires_mobiles` / `affectations` / rôles. Aucune mutation métier existante n'est modifiée.
_Alternative plus légère :_ triggers PG sur les tables déjà surveillées.

**Étape 2 — VAPID.** Générer une paire ; clé publique → `VITE_VAPID_PUBLIC_KEY`, clé privée → secret backend `VAPID_PRIVATE_KEY`. Aucun code client à changer : `PushService` s'active automatiquement.

**Étape 3 — Edge Function `push-dispatch`.** Lit `notifications` (nouvelles), croise `notification_preferences` (`push_enabled`, `disabled_categories`, `quiet_hours`), récupère les `push_subscriptions` actives et envoie via `web-push` (VAPID). Sur 404/410 → `is_active=false`.

**Étape 4 — Service Worker : ajouter uniquement 2 handlers** via `strategies: "injectManifest"` ou un `importScripts` d'un fichier `push-sw.js`, sans changer la stratégie de cache :
- `push` → `showNotification(title, { body, icon, data: { link } })`
- `notificationclick` → focus d'un client existant ou `clients.openWindow(link)`

**Étape 5 — Branchement.** Trigger PG `AFTER INSERT ON notifications` → appel de `push-dispatch` (ou dispatch en fin d'`Étape 1`). `NotificationService.emit()` reste le point d'entrée unique côté client.

**Étape 6 — Corrections d'hygiène (petites, à faire en même temps).**
- Publier `notifications` en Realtime (rend le canal existant utile et permet de baisser le polling).
- Afficher les notifications persistantes dans `/notifications` (réutiliser `usePersistedNotifications`).
- Honorer `quiet_hours` et `frequency` dans `emit()` / `push-dispatch`.

_Aucune de ces étapes n'a été exécutée : cet audit est strictement en lecture seule._
