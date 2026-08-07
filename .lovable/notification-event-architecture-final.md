# LOT 14.2 — Architecture événementielle des notifications (final)
Date : 07/08/2026

### 1. Cause racine initiale
Aucun événement métier « création d'échantillon » n'existait : pas d'appel à `dispatchNotificationEvent`, `echantillon_cree` absent de `NotificationEvent` / `ALLOWED_EVENTS`, aucun trigger PG. Aucune ligne n'était donc écrite dans `notifications`, donc aucun Push possible. (cf. `.lovable/notification-complete-audit.md`)

### 2. Architecture avant correction
Deux systèmes parallèles : alertes dérivées client (`useNotifications`, non persistées) + notifications persistantes (`notifications` ← `push-dispatch`, 3 lignes, 3 événements).

### 3. Architecture après correction
Inchangée dans sa structure — un seul système persistant étendu :
Événement métier → `dispatchNotificationEvent` → `push-dispatch` (service_role) → `notifications` (source de vérité) → in-app + Push → SW → clic → route LTPC.
Les alertes dynamiques restent en place, en parallèle, non poussables.

### 4. Nouvel événement `echantillon_cree`
Ajouté au type `NotificationEvent` (`src/lib/notifications/dispatch.ts`) et à `ALLOWED_EVENTS` + `buildNotification()` de `push-dispatch`. Aucun nouveau service, table, SW, ni VAPID.

### 5. Déclencheur
`onSuccess` (uniquement après insertion réussie, avec l'`id` retourné) de :
- `useCreateChantierEchantillon` (labo mobile)
- `useCreateEchantillonCompression` (compression)
Appel non bloquant (`void`, erreurs avalées volontairement côté client — le flux métier n'échoue jamais).

### 6. Destinataire
Calculé **côté serveur** à partir des relations métier existantes :
- intervenants affectés au chantier (`affectations` → `utilisateurs.statut = 'actif'`), via le même mécanisme que `affectation_creee` ;
- encadrement `super_admin / admin / manager / ingenieur` (même mécanisme que `rapport_a_valider`) ;
- **le créateur est exclu** (`callerId` issu du JWT).
Le client ne fournit jamais de destinataire.

### 7. Notification persistante — ligne réellement créée
`id 3f610a47…` · user `7cdbf9be…` (manager) · type `echantillon_cree` · catégorie `compression` · priorité `info` · titre « Nouvel échantillon » · message « EC-001 — nouvel échantillon créé pour le chantier 156 LOGEMENTS LSP… (SARL OZHAS INSAAT) — "BLOC 9 » · `data = {resource_id, event}` · `link = /laboratoires-mobiles/chantier/{chantier}/echantillon/{id}` · `is_read = false` · `source = workflow`.

### 8. In-app
Lue par `NotificationRepository.list` / `useNotificationCenter` (realtime + refetch). Invalidation ajoutée sur `notif-center` et `notif-center-unread` après création d'échantillon.

### 9. Push
Canal existant réutilisé sans modification. Test réel : `push_sent = 0` car le destinataire (manager) n'a **aucun abonnement actif** → conforme à l'étape 15 (la notification persistante est bien créée sans Push).

### 10. Service Worker
`public/push-sw.js` **non modifié**.

### 11. NotificationBell
`badgeCount` passait de `errorCount` à `totalCount` = notifications persistantes non lues + alertes dynamiques affichées dans la liste → badge cohérent avec le contenu réel de la cloche. Le code couleur reste rouge (urgent) / jaune (avertissement) / primaire (info). `aria-label` ajusté.

### 12. Alertes dynamiques
`useNotifications` intact : échéances proches, retards, étalonnages. Elles ne déclenchent aucun Push. Distinction visuelle conservée (bloc persistant à icône cloche/Sparkles + badge de catégorie ; alertes dynamiques colorées par sévérité). Pas de doublon : une alerte « Échéance proche » et l'événement « Nouvel échantillon » sont deux faits distincts.

### 13. Sécurité / RLS
Aucune policy modifiée. SELECT `auth.uid() = user_id OR is_admin_only()`, INSERT réservé aux admins (l'écriture métier passe en `service_role`). Contenu, destinataires et lien reconstruits serveur. Tests : appel sans JWT → **401**, ressource inconnue → **404**, événement hors catalogue → 400 (inchangé). Aucun secret exposé.

### 14. Tests réalisés (réels, en production)
| # | Test | Résultat |
|---|---|---|
| 1 | `echantillon_cree` sur l'échantillon existant `71bb2acb…` | `{ok:true, created:1}` ✅ |
| 2 | Ligne en base, destinataire, lien, non lue | ✅ vérifié |
| 3 | Créateur exclu des destinataires | ✅ (admin appelant absent) |
| 4 | Destinataire sans abonnement Push | ✅ notification créée, `push_sent:0` |
| 5 | Ressource inexistante | 404 ✅ |
| 6 | Sans JWT | 401 ✅ |
| 7 | Typecheck projet | ✅ |

Non testés faute d'appareil : réception Push Android pour `echantillon_cree`, clic → navigation (le canal a été validé au préalable sur `rapport_a_valider`). **Aucun nouvel échantillon créé.**

### 15. Régression
Événements existants inchangés (mêmes branches, seule la signature de `buildNotification` reçoit `callerId`, utilisé uniquement par la nouvelle branche).

| Événement | Persistant | In-app | Push |
|---|---|---|---|
| affectation_creee | ✅ inchangé | ✅ | ✅ |
| rapport_valide | ✅ inchangé | ✅ | ✅ |
| rapport_a_valider | ✅ inchangé | ✅ | ✅ (FCM testé) |
| echantillon_cree | ✅ nouveau, testé | ✅ | ⚪ non reçu (destinataire non abonné) |

### 16. Fichiers modifiés
- `src/lib/notifications/dispatch.ts`
- `supabase/functions/push-dispatch/index.ts`
- `src/hooks/useChantierEchantillons.ts`
- `src/hooks/useEchantillonsCompression.ts`
- `src/components/layout/NotificationBell.tsx`

### 17. Migrations
**Aucune.**

### 18. Résultat final
🟠 **CORRECTION PARTIELLE** — la chaîne « création d'échantillon → événement → notification persistante → in-app » est câblée et **vérifiée en réel**. Reste à confirmer sur appareil : réception Push + clic pour `echantillon_cree`, impossible ici car le seul destinataire calculé n'a aucun abonnement actif (l'unique compte abonné est le créateur, volontairement exclu). Faites créer un échantillon par un autre utilisateur pendant que votre téléphone est abonné : le Lot passera 🟢.
