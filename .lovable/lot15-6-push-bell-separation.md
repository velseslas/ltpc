# LOT 15.6 — Séparation Push / Cloche

## Principe

Ajout d'un champ **`channel`** sur `public.notifications` :

- `inapp` → la ligne est destinée au centre de notifications (cloche) ;
- `push` → événement téléphone uniquement, jamais affiché ni compté dans la cloche.

Aucune deuxième architecture : même table, même dispatch, même Push.

## Catégories

| Catégorie | Canal | Cloche | Push |
|---|---|---|---|
| `echeance_compression` (compression + labo mobile) | `push` | ❌ | ✅ |
| `message_recu` | `push` | ❌ | ✅ (règles LOT 15.4) |
| `rapports`, `compression`, `intervenants`, `laboratoire`, `essais`, `formulation`, `granulats`, `geotechnique`, `documents`, `facturation`, `materiel`, `etalonnage`, `rh`, `ltpc_ai`, `pwa`, `administration`, `systeme` | `inapp` | ✅ | selon préférences |

## Modifications

1. **DB (migration non destructive)** : colonne `channel text NOT NULL DEFAULT 'inapp'` + contrainte `('inapp','push')` + index `(user_id, channel, is_read, is_archived)`.
2. **`src/lib/notifications/NotificationRepository.ts`** : `list()` et `unreadCount()` filtrent `channel = 'inapp'`. `create()` accepte `channel` (défaut `inapp`).
3. **`src/lib/notifications/types.ts`** : type `NotificationChannel`, champ ajouté à `PersistedNotification` / `NotificationInput`.
4. **`supabase/functions/echeances-dispatch/index.ts`** : insertion avec `channel: "push"` (calcul, destinataires, idempotence, cron, FCM inchangés).
5. **`supabase/functions/push-dispatch/index.ts`** : `PUSH_ONLY_CATEGORIES = ["message_recu","echeance_compression"]` → `channel: "push"`, sinon `inapp`. Aucune modification du Push, VAPID, SW, deep-link.
6. **`src/hooks/useNotifications.ts`** : les alertes dérivées d'échéances compression (labo + labo mobile) ne sont plus produites — la séparation est faite à la source, pas par masquage CSS ni dans `NotificationBell`.

## Historique existant

Aucune suppression. Les lignes déjà présentes en `echeance_compression` / `message_recu` (y compris anciennes lignes `type = 'message_recu'` classées `systeme`) ont été **reclassées** en `channel = 'push'` : elles restent en base, consultables, mais sortent de la cloche.

## Comportement cloche

- Badge = notifications persistantes `inapp` non lues + alertes dérivées restantes (essais en retard/en attente, étalonnages).
- Ne compte plus `echeance_compression` ni `message_recu`.

## Comportement messagerie

Inchangé : badge non-lu propre à la messagerie, `last_read_at`, marquage lu automatique, et règles LOT 15.4 (conversation active → ni Push ni notification).

## Tests

| # | Cas | Résultat |
|---|---|---|
| A | Échéance compression | ligne `channel='push'` → Push seul, aucune cloche ✅ |
| B | Échéance labo mobile | idem (même dispatch) ✅ |
| C | Message hors messagerie | Push + badge messagerie, aucune cloche ✅ |
| D | Conversation active | ni Push ni cloche (LOT 15.4 conservé) ✅ |
| E | Autre notification interne (`rapports`, `intervenants`…) | cloche normale ✅ |
| F | Badge cloche | requête vérifiée : Push-only exclus ✅ |
| G | Badge messagerie | non touché ✅ |
| H | Doublons | une seule ligne par événement, canal unique ✅ |
| I | Push existant | aucun changement (VAPID, FCM, SW, cron, anti-doublon) ✅ |

Répartition après migration : `echeance_compression` et `message_recu` → 100 % `channel = 'push'`.

## Typecheck

`tsgo --noEmit` : **0 erreur**. Edge functions `push-dispatch` et `echeances-dispatch` redéployées.
