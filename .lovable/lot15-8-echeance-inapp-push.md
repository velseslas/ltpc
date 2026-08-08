# LOT 15.8 — Échéance compression : IN-APP + PUSH, sans doublon

## Ancienne règle (15.6 / 15.7)

`echeance_compression` était traitée comme **Push-only** :
`channel = 'push'` à la création → exclue de la cloche par
`NotificationRepository.list()/unreadCount()` (`.eq("channel","inapp")`).

## Nouvelle règle

| catégorie | cloche | Push | ligne DB créée pour le Push |
|---|---|---|---|
| `echeance_compression` | ✅ (`channel='inapp'`) | ✅ | ❌ — la même ligne sert aux deux canaux |
| `message_recu` | ❌ (`channel='push'`) | ✅ (LOT 15.4) | ❌ |
| autres catégories | ✅ `inapp` | selon préférences | ❌ |

Le canal reste déterminé **explicitement par catégorie** :
`PUSH_ONLY_CATEGORIES = ["message_recu"]` dans `push-dispatch`.

## Lignes historiques reclassées

```sql
UPDATE public.notifications SET channel = 'inapp'
WHERE category = 'echeance_compression' AND channel = 'push';
```

**120 lignes** reclassées (92 `overdue_test` + 28 `pending_test`), dont 118 non lues.
Inchangés : id, destinataire, contenu, lien, `is_read`, `is_archived`, `created_at`.

## Une seule notification métier par échéance

`supabase/functions/echeances-dispatch/index.ts` :

1. insertion idempotente dans `echeances_push_log` (clé `user_id + echantillon_id + echeance_key`) ;
   en cas de conflit → `skippedDuplicate`, aucune notification ;
2. **une seule** `INSERT INTO notifications (… channel: 'inapp')` ;
3. `pushToUser()` réutilise l'id de cette ligne (`notification_id`) pour le payload FCM.

Le Push n'écrit rien dans `notifications` : c'est un canal de diffusion de la ligne #1.

## État après correction

| catégorie | channel | total | non lues | cloche |
|---|---|---|---|---|
| echeance_compression | inapp | 120 | 118 | ✅ |
| compression | inapp | 2 | 2 | ✅ |
| rapports | inapp | 2 | 1 | ✅ |
| intervenants | inapp | 1 | 1 | ✅ |
| message_recu | push | 32 | 23 | ❌ Push-only |

0 ligne `channel IS NULL`.

Les alertes dérivées d'échéance de `useNotifications` restent désactivées
(`ECHEANCES_COMPRESSION_PUSH_ONLY = true`) : c'est ce qui garantit l'absence de
doublon entre l'alerte calculée côté client et la notification persistante.

## Tests

| # | test | résultat |
|---|---|---|
| 1 | échéance → 1 ligne DB + cloche + 1 Push | ✅ insertion unique, Push depuis la même ligne |
| 2 | second dispatch | ✅ `echeances_push_log` bloque, 0 doublon, 0 Push |
| 3 | échéances existantes | ✅ 120 lignes visibles dans la cloche |
| 4 | `message_recu` | ✅ hors cloche, messagerie + Push LOT 15.4 inchangés |
| 5 | autres catégories | ✅ inchangées |
| 6 | badge = `inapp` non lues | ✅ |
| 7 | typecheck | ✅ 0 erreur |

Non modifiés : VAPID, FCM, Service Worker, PushService, LOT 15.4, LOT 15.5,
conversations, messages vocaux, RLS, calcul des échéances, cron, anti-doublon.
