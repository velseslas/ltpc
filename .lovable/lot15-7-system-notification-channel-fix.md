# LOT 15.7 — Classification du canal des notifications

## Cause réelle (correction du diagnostic 15.6)

Le diagnostic précédent signalait « 8 notifications `systeme` classées `push` à tort ».
L'inspection ligne à ligne montre que ces 8 lignes ont toutes `type = 'message_recu'`
et `user_id = 7cdbf9be…` : ce sont des **messages reçus** créés avant l'introduction
de la catégorie dédiée `message_recu`, rangés par défaut dans `systeme`.

⇒ Le champ mal classé n'était pas `channel` mais **`category`**.
Les passer en `channel = 'inapp'` aurait fait apparaître des messages dans la cloche,
ce qui contredit la règle 5 du LOT 15.7 (`message_recu` ne doit jamais s'y afficher).
La correction appliquée est donc la reclassification de catégorie, canal `push` conservé.

## Correction historique (non destructive)

```sql
UPDATE public.notifications
SET category = 'message_recu'
WHERE category = 'systeme' AND channel = 'push' AND type = 'message_recu';
```

8 lignes mises à jour. Conservés à l'identique : id, destinataire, contenu, `is_read`,
`is_archived`, `created_at`, `channel`. Aucune suppression, aucune création.

## État après correction

| catégorie | channel | total | cloche |
|---|---|---|---|
| compression | inapp | 2 | ✅ |
| rapports | inapp | 2 | ✅ |
| intervenants | inapp | 1 | ✅ |
| echeance_compression | push | 120 | ❌ Push-only |
| message_recu | push | 32 | ❌ Push-only |

Plus aucune ligne `systeme` mal classée ; 0 ligne `channel IS NULL`.

## Règle de classification (création future)

`supabase/functions/push-dispatch/index.ts` — canal déterminé **explicitement par catégorie** :

- `PUSH_ONLY_CATEGORIES = ["message_recu", "echeance_compression"]` → `channel = 'push'`
- **toute autre catégorie, dont `systeme`** → `channel = 'inapp'`

Aucune généralisation « non-échéance = push ». Commentaire de règle ajouté au-dessus de
la constante ; la logique de dispatch, les préférences, l'idempotence et les deep-links
sont inchangés.

## Cloche

- `NotificationRepository.list()` / `unreadCount()` : filtre `channel = 'inapp'` inchangé.
- Badge = notifications `inapp` non lues et non archivées uniquement.

## Tests

| # | test | résultat |
|---|---|---|
| 1 | anciennes lignes reclassées | ✅ 8 lignes, catégorie corrigée, canal `push` conservé (voir cause) |
| 2 | notifications internes visibles | ✅ 5 lignes `inapp` (4 non lues) |
| 3 | nouvelle `systeme` → `inapp` | ✅ règle explicite dans `push-dispatch` |
| 4 | `echeance_compression` masquée | ✅ |
| 5 | `message_recu` masqué | ✅ |
| 6 | badge = `inapp` non lues | ✅ |
| 7 | Push échéances | ✅ intact (`echeances-dispatch`, cron non touchés) |
| 8 | Push messages | ✅ intact |
| 9 | doublons | ✅ aucun |
| 10 | typecheck | ✅ 0 erreur |

Non modifiés : PushService, FCM, VAPID, Service Worker, `echeances-dispatch`, cron,
logique des échéances, messagerie, LOT 15.4, LOT 15.5.
